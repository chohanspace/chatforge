// src/app/actions.ts
'use server';
import 'dotenv/config';
import { z } from 'zod';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { randomBytes, createHmac } from 'crypto';
import { sendOtpEmail, sendSubmissionStatusEmail, sendBulkEmail, sendDirectUserEmail } from '@/lib/nodemailer';
import jwt from 'jsonwebtoken';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { generateChatResponse, generateNewsletterEmail } from '@/ai/flows/generate-chat-response';
import { generateDirectEmail as generateDirectEmailFlow } from '@/ai/flows/generate-direct-email';
import { generateScriptsFromTemplate } from '@/lib/templates';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';


const submissionSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  company: z.string().optional(),
  plan: z.enum(['Pro', 'Enterprise']),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

export async function createSubmission(values: z.infer<typeof submissionSchema>) {
    const validation = submissionSchema.safeParse(values);
    if(!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    try {
        const db = await getDb();
        const newSubmission = {
            ...validation.data,
            status: 'pending', // 'pending', 'accepted', 'rejected'
            createdAt: new Date(),
        };
        await db.collection('submissions').insertOne(newSubmission);

        return { success: true };
    } catch (error) {
        console.error('Submission error:', error);
        return { error: { _errors: ['Could not submit your request.'] } };
    }
}

export async function listSubmissions(): Promise<{submissions?: any[], error?: string}> {
    try {
        const db = await getDb();
        const submissions = await db.collection('submissions').find().sort({ createdAt: -1 }).toArray();
        return { submissions: submissions.map(s => ({...s, _id: s._id.toString()})) };
    } catch (error) {
        console.error('Error listing submissions:', error);
        return { error: 'Could not list submissions.' };
    }
}

const updateSubmissionStatusSchema = z.object({
    id: z.string(),
    status: z.enum(['accepted', 'rejected']),
});
  
export async function updateSubmissionStatus(values: z.infer<typeof updateSubmissionStatusSchema>) {
    const validation = updateSubmissionStatusSchema.safeParse(values);
    if (!validation.success) {
        return { error: 'Invalid input.' };
    }
    const { id, status } = validation.data;

    try {
        const db = await getDb();
        if (!ObjectId.isValid(id)) return { error: 'Invalid submission ID.' };
        
        const result = await db.collection('submissions').findOneAndUpdate(
            { _id: new ObjectId(id), status: 'pending' },
            { $set: { status: status } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return { error: 'Submission not found or already processed.' };
        }
        
        let recipientEmail = result.email;

        // Send email notification
        await sendSubmissionStatusEmail({
            to: recipientEmail,
            name: result.name,
            plan: result.plan,
            status: status,
        });

        return { success: true, updatedSubmission: {...result, _id: result._id.toString()} };

    } catch (error) {
        console.error(`Error updating submission ${id} to ${status}:`, error);
        return { error: 'Could not update submission status.' };
    }
}

export async function deleteSubmission(id: string): Promise<{success: boolean, error?: string}> {
    if (!ObjectId.isValid(id)) {
      return { success: false, error: 'Invalid submission ID.' };
    }
  
    try {
      const db = await getDb();
      const result = await db.collection('submissions').deleteOne({ _id: new ObjectId(id) });
  
      if (result.deletedCount === 0) {
        return { success: false, error: 'Submission not found.' };
      }
  
      return { success: true };
    } catch (error) {
      console.error('Error deleting submission:', error);
      return { success: false, error: 'Could not delete the submission.' };
    }
  }


// --- Authentication Actions ---
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

function generateApiKey() {
    return `cfai_${randomBytes(16).toString('hex')}`;
}

async function createDefaultChatbot(db: any, userId: ObjectId) {
    const defaultBot = {
        userId,
        name: 'My First Bot',
        instructions: 'You are a helpful assistant.',
        qa: [],
        welcomeMessage: 'Hello! How can I help you today?',
        color: '#007BFF',
        apiKey: generateApiKey(),
        createdAt: new Date(),
        authorizedDomains: [],
    };
    await db.collection('chatbots').insertOne(defaultBot);
}

const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
});


export async function customSignUp(values: z.infer<typeof signUpSchema>) {
    const validation = signUpSchema.safeParse(values);
    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    const { email, password } = validation.data;
    const db = await getDb();

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
        return { error: { email: ['A user with this email already exists.'] } };
    }
    
    const otp = randomBytes(3).toString('hex').toUpperCase();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    const salt = randomBytes(16).toString('hex');
    const hash = createHmac('sha256', salt).update(password).digest('hex');
    
    const newUser = {
        email,
        passwordHash: `${salt}:${hash}`,
        isVerified: false,
        isBanned: false,
        authMethod: 'email',
        otp,
        otpExpires,
        createdAt: new Date(),
        messagesSent: 0,
        messageLimit: 1000,
        chatbotLimit: 1,
        plan: 'Free',
        planCycleStartDate: new Date(),
    };

    try {
        const result = await db.collection('users').insertOne(newUser);
        
        await createDefaultChatbot(db, result.insertedId);

        try {
          await sendOtpEmail(email, otp);
        } catch (emailError) {
          console.error("Failed to send OTP email, but user was created:", emailError);
          // Don't block user creation if email fails. They can resend OTP later.
        }

        return { success: true, userId: result.insertedId.toString() };

    } catch (error) {
        console.error('Sign up error:', error);
        return { error: { _errors: ['Could not create your account.'] } };
    }
}

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

function generateToken(user: any) {
    const payload = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function customLogin(values: z.infer<typeof loginSchema>) {
    const validation = loginSchema.safeParse(values);
    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }
    
    const { email, password } = validation.data;
    const db = await getDb();
    
    const user = await db.collection('users').findOne({ email });

    if (!user) {
        return { error: { _errors: ['Invalid email or password.'] } };
    }

    if (user.authMethod === 'google') {
        return { error: { _errors: ['This account was created with Google. Please use Google Sign-In.'] } };
    }

    if (!user.passwordHash) {
        return { error: { _errors: ['Invalid account configuration. Please contact support.'] } };
    }
    
    const [salt, storedHash] = user.passwordHash.split(':');
    const hash = createHmac('sha256', salt).update(password).digest('hex');

    if (hash !== storedHash) {
        return { error: { _errors: ['Invalid email or password.'] } };
    }
    
    if (!user.isVerified) {
        // User exists and password is correct, but not verified.
        // Send a new OTP and prompt for verification.
        const otp = randomBytes(3).toString('hex').toUpperCase();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        
        await db.collection('users').updateOne({ _id: user._id }, { $set: { otp, otpExpires }});
        try {
            await sendOtpEmail(email, otp);
        } catch (emailError) {
            console.error("Failed to send OTP email on login:", emailError);
        }
        
        return { success: false, requiresOtp: true, userId: user._id.toString() };
    }
    
    const token = generateToken(user);
    return { success: true, token };
}

const otpSchema = z.object({
    userId: z.string(),
    otp: z.string().length(6, 'OTP must be 6 characters.'),
});

export async function verifyOtp(values: z.infer<typeof otpSchema>) {
    const validation = otpSchema.safeParse(values);
    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }
    const { userId, otp } = validation.data;
    const db = await getDb();
    
    if (!ObjectId.isValid(userId)) {
        return { error: { otp: ['Invalid user ID.'] } };
    }
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user || user.otp !== otp.toUpperCase()) {
        return { error: { otp: ['Invalid OTP.'] } };
    }

    if (user.otpExpires < new Date()) {
        return { error: { otp: ['OTP has expired.'] } };
    }
    
    await db.collection('users').updateOne({ _id: user._id }, { $set: { isVerified: true, otp: null, otpExpires: null }});

    const foundUser = await db.collection('users').findOne({ _id: user._id });

    const token = generateToken(foundUser);
    return { success: true, token, email: foundUser?.email };
}

export async function resendOtp(userId: string) {
    if (!userId || !ObjectId.isValid(userId)) return { error: 'User ID is required.' };
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) return { error: 'User not found.' };

    const otp = randomBytes(3).toString('hex').toUpperCase();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await db.collection('users').updateOne({ _id: user._id }, { $set: { otp, otpExpires }});
    await sendOtpEmail(user.email, otp);

    return { success: true };
}

// --- Chatbot Management Actions ---

const serializeChatbot = (chatbot: any) => {
    if (!chatbot) return null;
    return {
        ...chatbot,
        _id: chatbot._id.toString(),
        userId: chatbot.userId.toString(),
    };
};

export async function listUserChatbots(userId: string): Promise<{chatbots?: any[], error?: string}> {
    if (!userId || !ObjectId.isValid(userId)) return { error: 'User not authenticated' };
    try {
        const db = await getDb();
        const chatbots = await db.collection('chatbots').find({ userId: new ObjectId(userId) }).sort({ createdAt: 1 }).toArray();
        return { chatbots: chatbots.map(serializeChatbot) };
    } catch (error) {
        console.error('Error listing chatbots:', error);
        return { error: 'Could not list chatbots.' };
    }
}

const createChatbotSchema = z.object({
    token: z.string(),
    name: z.string().min(2, 'Bot name must be at least 2 characters.'),
});

export async function createChatbot(values: z.infer<typeof createChatbotSchema>) {
    const validation = createChatbotSchema.safeParse(values);
    if (!validation.success) return { error: 'Invalid input' };

    try {
        const decoded = jwt.verify(values.token, JWT_SECRET) as { id: string };
        const userId = decoded.id;

        const db = await getDb();

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return { error: 'User not found' };

        const existingBotsCount = await db.collection('chatbots').countDocuments({ userId: new ObjectId(userId) });
        
        if (existingBotsCount >= (user.chatbotLimit ?? 1)) {
            return { error: 'You have reached your chatbot limit for this plan.' };
        }

        const newBot = {
            userId: new ObjectId(userId),
            name: values.name,
            instructions: `You are a helpful assistant named ${values.name}.`,
            qa: [],
            welcomeMessage: 'Hello! How can I help you today?',
            color: '#007BFF',
            apiKey: generateApiKey(),
            createdAt: new Date(),
            authorizedDomains: [],
        };

        const result = await db.collection('chatbots').insertOne(newBot);
        const createdBot = await db.collection('chatbots').findOne({ _id: result.insertedId });
        
        return { success: true, newChatbot: serializeChatbot(createdBot) };
    } catch (error: any) {
        console.error('Create chatbot error:', error);
        return { error: error.message || 'Could not create chatbot.' };
    }
}


const chatbotSettingsSchema = z.object({
    chatbotId: z.string(),
    token: z.string(),
    values: z.object({
        instructions: z.string().optional(),
        qa: z.array(z.object({
          question: z.string(),
          answer: z.string()
        })).optional(),
        name: z.string().optional(),
        welcomeMessage: z.string().optional(),
        color: z.string().optional(),
        authorizedDomains: z.array(z.string()).optional(),
    })
});

export async function updateChatbotSettings(input: z.infer<typeof chatbotSettingsSchema>) {
    const validation = chatbotSettingsSchema.safeParse(input);
    if (!validation.success) {
        return { error: { _errors: ['Invalid input shape.'] } };
    }
    const { token, chatbotId, values } = validation.data;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        const userId = decoded.id;
        
        if (!ObjectId.isValid(chatbotId) || !ObjectId.isValid(userId)) {
            return { error: { _errors: ['Invalid ID format.']}};
        }

        const updateData: any = {};
        if (values.instructions !== undefined) updateData.instructions = values.instructions;
        if (values.qa !== undefined) updateData.qa = values.qa;
        if (values.name !== undefined) updateData.name = values.name;
        if (values.welcomeMessage !== undefined) updateData.welcomeMessage = values.welcomeMessage;
        if (values.color !== undefined) updateData.color = values.color;
        if (values.authorizedDomains !== undefined) updateData.authorizedDomains = values.authorizedDomains;

        const db = await getDb();
        if (Object.keys(updateData).length === 0) {
            // Find the bot to return its current state
            const currentBot = await db.collection('chatbots').findOne({ _id: new ObjectId(chatbotId), userId: new ObjectId(userId) });
            if (!currentBot) {
                return { error: { _errors: ['Chatbot not found or you do not have permission to view it.'] }};
            }
            return { success: true, updatedChatbot: serializeChatbot(currentBot) };
        }

        const result = await db.collection('chatbots').findOneAndUpdate(
            { _id: new ObjectId(chatbotId), userId: new ObjectId(userId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return { error: { _errors: ['Chatbot not found or you do not have permission to edit it.'] }};
        }

        return { success: true, updatedChatbot: serializeChatbot(result) };
    } catch (error) {
        console.error('Update chatbot settings error:', error);
        return { error: { _errors: ['Could not update settings. Your session might be invalid.'] } };
    }
}

const deleteChatbotSchema = z.object({
    chatbotId: z.string(),
    token: z.string(),
});

export async function deleteChatbot(values: z.infer<typeof deleteChatbotSchema>) {
    const validation = deleteChatbotSchema.safeParse(values);
    if (!validation.success) return { error: 'Invalid input' };

    try {
        const decoded = jwt.verify(values.token, JWT_SECRET) as { id: string };
        const userId = decoded.id;
        
        if (!ObjectId.isValid(values.chatbotId) || !ObjectId.isValid(userId)) {
            return { error: 'Invalid ID format.'};
        }

        const db = await getDb();
        const result = await db.collection('chatbots').deleteOne({
            _id: new ObjectId(values.chatbotId),
            userId: new ObjectId(userId)
        });

        if (result.deletedCount === 0) {
            return { error: 'Chatbot not found or you do not have permission to delete it.' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Delete chatbot error:', error);
        return { error: error.message || 'Could not delete chatbot.' };
    }
}


// --- Admin User Management Actions ---

const serializeUser = (user: any) => {
    if (!user) return null;
    const { passwordHash, otp, otpExpires, ...rest } = user;
    
    const serialized = {
        ...rest,
        _id: user._id.toString(),
    };

    if (serialized.chatbots) {
        serialized.chatbots = serialized.chatbots.map(serializeChatbot);
    }
    
    return serialized;
};

export async function listUsers(query?: string): Promise<{users?: any[], error?: string}> {
    try {
        const db = await getDb();
        const filter = query ? { email: { $regex: query, $options: 'i' } } : {};
        const users = await db.collection('users').find(filter).sort({ createdAt: -1 }).project({ passwordHash: 0, otp: 0, otpExpires: 0 }).toArray();
        return { users: users.map(serializeUser) };
    } catch (error) {
        console.error('Error listing users:', error);
        return { error: 'Could not list users.' };
    }
}

export async function getUserDetails(userId: string): Promise<{user?: any, error?: string}> {
    try {
        const db = await getDb();
        if (!ObjectId.isValid(userId)) return { error: 'Invalid user ID.' };
        
        const userPipeline = [
            { $match: { _id: new ObjectId(userId) } },
            {
                $lookup: {
                    from: 'chatbots',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'chatbots'
                }
            }
        ];

        const results = await db.collection('users').aggregate(userPipeline).toArray();
        const user = results[0];

        if (!user) return { error: 'User not found.' };
        
        return { user: serializeUser(user) };
    } catch (error) {
        console.error('Error getting user details:', error);
        return { error: 'Could not retrieve user details.' };
    }
}


export async function updateUserStatus(userId: string, isBanned: boolean): Promise<{success?: boolean, error?: string}> {
    try {
        const db = await getDb();
        if (!ObjectId.isValid(userId)) return { error: 'Invalid user ID.' };
        const result = await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { isBanned } });
        if (result.matchedCount === 0) return { error: 'User not found.' };
        return { success: true };
    } catch (error) {
        console.error('Error updating user status:', error);
        return { error: 'Could not update user status.' };
    }
}

const updateUserPlanSchema = z.object({
    userId: z.string(),
    plan: z.enum(['Free', 'Pro', 'Enterprise']),
    messageLimit: z.number().int().min(0),
    chatbotLimit: z.number().int().min(0),
});

export async function updateUserPlanAndLimit(values: z.infer<typeof updateUserPlanSchema>): Promise<{success?: boolean, error?: string}> {
    const validation = updateUserPlanSchema.safeParse(values);
    if (!validation.success) {
        return { error: 'Invalid input.' };
    }
    const { userId, plan, messageLimit, chatbotLimit } = validation.data;
    try {
        const db = await getDb();
        if (!ObjectId.isValid(userId)) return { error: 'Invalid user ID.' };
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { plan, messageLimit, chatbotLimit } }
        );
        if (result.matchedCount === 0) return { error: 'User not found.' };
        return { success: true };
    } catch (error) {
        console.error('Error updating user plan:', error);
        return { error: 'Could not update user plan.' };
    }
}

export async function regenerateUserApiKey(chatbotId: string): Promise<{success?: boolean, newApiKey?: string, error?: string}> {
    try {
        const db = await getDb();
        if (!ObjectId.isValid(chatbotId)) return { error: 'Invalid chatbot ID.' };
        const newApiKey = generateApiKey();
        const result = await db.collection('chatbots').updateOne({ _id: new ObjectId(chatbotId) }, { $set: { apiKey: newApiKey } });
        if (result.matchedCount === 0) return { error: 'Chatbot not found.' };
        return { success: true, newApiKey };
    } catch (error) {
        console.error('Error regenerating API key:', error);
        return { error: 'Could not regenerate API key.' };
    }
}

export async function deleteUserChatbot(chatbotId: string): Promise<{success?: boolean, error?: string}> {
    try {
        const db = await getDb();
        if (!ObjectId.isValid(chatbotId)) return { error: 'Invalid chatbot ID.' };
        const result = await db.collection('chatbots').deleteOne({ _id: new ObjectId(chatbotId) });
        if (result.deletedCount === 0) return { error: 'Chatbot not found.' };
        return { success: true };
    } catch (error) {
        console.error('Error deleting chatbot:', error);
        return { error: 'Could not delete chatbot.' };
    }
}

export async function deleteUser(userId: string): Promise<{success?: boolean, error?: string}> {
    try {
        const db = await getDb();
        if (!ObjectId.isValid(userId)) return { error: 'Invalid user ID.' };
        
        // Also delete their chatbots
        await db.collection('chatbots').deleteMany({ userId: new ObjectId(userId) });
        
        const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
        if (result.deletedCount === 0) return { error: 'User not found.' };

        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { error: 'Could not delete user.' };
    }
}

const directEmailSchema = z.object({
    to: z.string().email(),
    subject: z.string().min(1, 'Subject is required.'),
    message: z.string().min(1, 'Message is required.'),
});

export async function sendDirectEmail(values: z.infer<typeof directEmailSchema>): Promise<{success: boolean, error?: string}> {
    const validation = directEmailSchema.safeParse(values);
    if (!validation.success) {
        return { success: false, error: 'Invalid input.' };
    }

    try {
        await sendDirectUserEmail(values);
        return { success: true };
    } catch (error) {
        console.error('Error sending direct email:', error);
        return { success: false, error: 'Could not send the email.' };
    }
}

const bulkEmailSchema = z.object({
    subject: z.string().min(1, 'Subject is required.'),
    message: z.string().min(1, 'Message is required.'),
});
  
export async function sendEmailToAllUsers(values: z.infer<typeof bulkEmailSchema>): Promise<{success: boolean, error?: string, userCount?: number}> {
    const validation = bulkEmailSchema.safeParse(values);
    if (!validation.success) {
        return { success: false, error: 'Subject and message are required.' };
    }

    try {
        const { users, error } = await listUsers();
        if (error || !users) {
            return { success: false, error: 'Could not retrieve user list.' };
        }
        if (users.length === 0) {
            return { success: false, error: 'There are no registered users to send to.' };
        }

        const recipients = users.map(u => u.email).join(',');

        await sendBulkEmail({
            to: recipients,
            subject: values.subject,
            html: values.message, // Assuming message is HTML content
        });

        return { success: true, userCount: users.length };
    } catch (error) {
        console.error('Error sending bulk email to users:', error);
        return { success: false, error: 'Could not send bulk email.' };
    }
}


// --- Admin Dashboard Actions ---
export async function getDashboardStats(): Promise<any> {
    try {
      const db = await getDb();
  
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
      const totalUsers = await db.collection('users').countDocuments();
      const newUsers = await db.collection('users').countDocuments({ createdAt: { $gte: sevenDaysAgo } });
      const totalSubmissions = await db.collection('submissions').countDocuments();
      const recentSubmissions = await db.collection('submissions').find().sort({ createdAt: -1 }).limit(5).toArray();
      
      const userSignupsByDay = await db.collection('users').aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray();
  
      // Format chart data
      const signupChartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const dayData = userSignupsByDay.find(day => day._id === dateString);
        signupChartData.push({
          date: dateString,
          signups: dayData ? dayData.count : 0,
        });
      }
  
      return {
        stats: {
          totalUsers,
          newUsers,
          totalSubmissions,
        },
        recentSubmissions: recentSubmissions.map(s => ({ ...s, _id: s._id.toString() })),
        signupChartData,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { error: 'Could not retrieve dashboard statistics.' };
    }
  }

export async function generateDirectEmail(prompt: string, userName: string): Promise<{success: boolean, html?: string, error?: string}> {
    if (!prompt) {
        return { success: false, error: 'Prompt cannot be empty.' };
    }
    try {
        const html = await generateDirectEmailFlow({ prompt, userName });
        return { success: true, html };
    } catch (error: any) {
        console.error('Error generating direct email:', error);
        return { success: false, error: `Could not generate email content: ${error.message}` };
    }
}


// --- Newsletter Actions ---
const subscribeSchema = z.string().email({ message: 'Invalid email address.' });

export async function subscribeToNewsletter(email: string): Promise<{success: boolean, error?: string}> {
    const validation = subscribeSchema.safeParse(email);
    if (!validation.success) {
        return { success: false, error: validation.error.errors[0].message };
    }

    try {
        const db = await getDb();
        const existing = await db.collection('subscribers').findOne({ email });
        if (existing) {
            return { success: false, error: 'This email is already subscribed.' };
        }
        await db.collection('subscribers').insertOne({
            email,
            subscribedAt: new Date(),
        });
        return { success: true };
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return { success: false, error: 'Could not subscribe at this time.' };
    }
}

export async function listSubscribers(): Promise<{subscribers?: any[], error?: string}> {
    try {
        const db = await getDb();
        const subscribers = await db.collection('subscribers').find().sort({ subscribedAt: -1 }).toArray();
        return { subscribers: subscribers.map(s => ({...s, _id: s._id.toString()})) };
    } catch (error) {
        console.error('Error listing subscribers:', error);
        return { error: 'Could not list subscribers.' };
    }
}

const sendNewsletterSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  htmlContent: z.string().min(1, 'Email content is required.'),
});

export async function sendNewsletter(values: z.infer<typeof sendNewsletterSchema>): Promise<{success: boolean, error?: string}> {
    const validation = sendNewsletterSchema.safeParse(values);
    if (!validation.success) {
        return { success: false, error: 'Subject and content are required.' };
    }

    try {
        const { subscribers, error } = await listSubscribers();
        if (error || !subscribers) {
            return { success: false, error: 'Could not retrieve subscriber list.' };
        }
        if(subscribers.length === 0) {
            return { success: false, error: 'There are no subscribers to send to.' };
        }

        const recipients = subscribers.map(s => s.email).join(',');

        await sendBulkEmail({
            to: recipients,
            subject: values.subject,
            html: values.htmlContent,
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending newsletter:', error);
        return { success: false, error: 'Could not send newsletter.' };
    }
}

export async function generateNewsletter(prompt: string): Promise<{success: boolean, html?: string, error?: string}> {
    if (!prompt) {
        return { success: false, error: 'Prompt cannot be empty.' };
    }
    try {
        const html = await generateNewsletterEmail({ prompt: prompt });
        return { success: true, html };
    } catch (error: any) {
        console.error('Error generating newsletter:', error);
        return { success: false, error: `Could not generate email content: ${error.message}` };
    }
}

// --- Admin OTP Actions ---
const ADMIN_ACCESS_KEY = "25157576";
const ADMIN_ACCESS_SECRET = process.env.ADMIN_ACCESS_SECRET || 'your-super-secret-admin-key-that-is-long';


export async function verifyAdminAccess(data: { key: string }): Promise<{ success: boolean; error?: string }> {
    if (data.key !== ADMIN_ACCESS_KEY) {
        return { success: false, error: 'Invalid access key.' };
    }
    
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour session
    const sessionToken = await new SignJWT({ admin: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(ADMIN_ACCESS_SECRET));
    
    cookies().set('admin_session', sessionToken, { httpOnly: true, expires, secure: process.env.NODE_ENV === 'production' });

    return { success: true };
}

export async function checkAdminAuthStatus(): Promise<{ isAuthenticated: boolean }> {
    const session = cookies().get('admin_session')?.value;
    if (!session) return {isAuthenticated: false};
    try {
        const { payload } = await jwtVerify(session, new TextEncoder().encode(ADMIN_ACCESS_SECRET));
        return { isAuthenticated: !!payload?.admin };
    } catch (e) {
        return { isAuthenticated: false };
    }
}

// --- Live Demo Chat Action ---
export async function getLiveDemoResponse(message: string, history: any[]): Promise<{reply?: string, error?: string}> {
    if (!message) {
        return { error: "Message cannot be empty." };
    }

    try {
        // Ensure history items are correctly formatted
        const formattedHistory = history
            .filter(item => typeof item.text === 'string' && item.role) // Ensure content is a string and role exists
            .map(item => ({
                role: item.role === 'user' ? 'user' : 'model',
                content: [{ text: item.text as string }]
            }));

        const response = await generateChatResponse({
            message: message,
            instructions: "You are a friendly and helpful assistant for ChatForge AI, a platform that lets users build and deploy chatbots. Briefly answer questions about the product's features, pricing, and ease of use. Keep your answers concise and encouraging. If asked about something unrelated, politely steer the conversation back to ChatForge AI.",
            qa: [], // No custom Q&A for the public demo
            history: formattedHistory,
        });
        return { reply: response.reply };

    } catch (error: any) {
        console.error("Live demo chat error:", error);
        return { error: `Sorry, an error occurred: ${error.message}` };
    }
}
