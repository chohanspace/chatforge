
import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string) {
  const mailOptions = {
    from: `"ChatForge AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your ChatForge AI Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">ChatForge AI Verification</h2>
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Thank you for signing up. Please use the following One-Time Password (OTP) to complete your registration:</p>
        <p style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; padding: 10px; background-color: #f4f4f4; border-radius: 5px;">${otp}</p>
        <p style="font-size: 16px;">This code will expire in 10 minutes.</p>
        <p style="font-size: 14px; color: #777;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} ChatForge AI. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${to}:`, error);
    throw new Error('Could not send verification email.');
  }
}


const getEmailTemplates = (name: string, plan: string, status: 'accepted' | 'rejected') => {
    const accepted = {
        subject: `Your Inquiry for the ${plan} Plan has been Accepted!`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9fdf9;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd;">
            <h2 style="color: #28a745;">Congratulations, ${name}!</h2>
            <p style="font-size: 18px; color: #333;">Your inquiry for the <strong>${plan} Plan</strong> has been accepted.</p>
          </div>
          <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #555;">We are thrilled to begin the process of getting you set up. A member of our team will be reaching out to you within the next 24 hours to discuss the next steps, including payment and onboarding.</p>
            <p style="font-size: 16px; color: #555;">We're excited to have you on board!</p>
          </div>
          <div style="font-size: 14px; color: #777; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>If you have any immediate questions, feel free to reply to this email.</p>
            <p>&mdash; The ChatForge AI Team</p>
          </div>
        </div>
      `,
    };

    const rejected = {
        subject: `Update on your ChatForge AI ${plan} Plan Inquiry`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #fdf9f9;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd;">
            <h2 style="color: #dc3545;">Update on Your ChatForge AI Inquiry</h2>
            <p style="font-size: 18px; color: #333;">Hello ${name},</p>
          </div>
          <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #555;">Thank you for your interest in the <strong>${plan} Plan</strong>. We sincerely appreciate you taking the time to consider us.</p>
            <p style="font-size: 16px; color: #555;">After careful review, we have determined that we are unable to move forward with your inquiry at this time. We receive a high volume of requests and unfortunately cannot accommodate all of them.</p>
            <p style="font-size: 16px; color: #555;">We encourage you to explore our other plans and features, and we wish you the best in finding a solution that fits your needs.</p>
          </div>
          <div style="font-size: 14px; color: #777; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Thank you again for your interest in ChatForge AI.</p>
            <p>&mdash; The ChatForge AI Team</p>
          </div>
        </div>
      `,
    };

    return status === 'accepted' ? accepted : rejected;
}

export async function sendSubmissionStatusEmail(
    { to, name, plan, status }: { to: string; name: string; plan: string; status: 'accepted' | 'rejected' }
) {
  const { subject, html } = getEmailTemplates(name, plan, status);
  const mailOptions = {
    from: `"ChatForge AI" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Submission ${status} email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send submission status email to ${to}:`, error);
  }
}

export async function sendBulkEmail({ to, subject, html }: { to: string; subject: string; html: string; }) {
    const mailOptions = {
      from: `"ChatForge AI" <${process.env.EMAIL_USER}>`,
      to, // nodemailer can handle comma-separated list of emails
      subject,
      html,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Bulk email with subject "${subject}" sent successfully.`);
    } catch (error) {
      console.error(`Failed to send bulk email:`, error);
      throw new Error('Could not send the bulk email.');
    }
}

export async function sendDirectUserEmail({ to, subject, message }: { to: string; subject: string; message: string; }) {
    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333;">A Message from ChatForge AI</h2>
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">You have received the following message from an administrator:</p>
            <div style="background-color: #f4f4f4; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="font-size: 14px; color: #777;">Please note: This is a direct message and not a standard notification. If you have questions, you can reply directly to this email.</p>
        </div>
    `;

    const mailOptions = {
        from: `"ChatForge AI Admin" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Direct email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send direct email to ${to}:`, error);
        throw new Error('Could not send the email.');
    }
}
