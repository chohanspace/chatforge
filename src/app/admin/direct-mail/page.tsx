// src/app/admin/direct-mail/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { listUsers, generateDirectEmail, sendDirectEmail } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Users, Search, Wand2, Send, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type User = {
    _id: string;
    name?: string;
    email: string;
}

const emailTemplates = {
    welcome: {
        subject: "Welcome to ChatForge AI!",
        prompt: "A friendly welcome email congratulating the user on signing up and encouraging them to build their first chatbot.",
    },
    plan_upgraded: {
        subject: "Your Plan Has Been Upgraded!",
        prompt: "An email confirming the user's plan has been successfully upgraded. Mention some of the new benefits they've unlocked.",
    },
    payment_received: {
        subject: "We've Received Your Payment",
        prompt: "A simple confirmation email informing the user that their recent payment was successful. Include a 'thank you' for their business.",
    },
    payment_failed: {
        subject: "Action Required: Your Payment Failed",
        prompt: "A professional but urgent email notifying the user that their payment has failed. Instruct them to update their payment information.",
    },
    account_banned: {
        subject: "Important: Your Account Access Has Been Restricted",
        prompt: "A formal email stating that the user's account has been banned due to a violation of the terms of service. Do not go into specifics, but state the decision is final.",
    },
    custom: {
        subject: "",
        prompt: "",
    }
};

export default function DirectMailPage() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isGenerating, startGeneratingTransition] = useTransition();
    const [isSending, startSendingTransition] = useTransition();

    const [subject, setSubject] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [template, setTemplate] = useState('custom');

    const { toast } = useToast();

    useState(() => {
        listUsers().then(({ users }) => {
            if(users) setAllUsers(users);
        })
    });

    const filteredUsers = searchQuery ? allUsers.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : allUsers;

    const handleTemplateChange = (templateKey: string) => {
        setTemplate(templateKey);
        if (templateKey !== 'custom') {
            const selectedTemplate = emailTemplates[templateKey as keyof typeof emailTemplates];
            setSubject(selectedTemplate.subject);
            setAiPrompt(selectedTemplate.prompt);
            setHtmlContent(''); // Clear content when template changes
        } else {
            setSubject('');
            setAiPrompt('');
            setHtmlContent('');
        }
    }

    const handleGenerateEmail = () => {
        if (!aiPrompt) {
            toast({ title: 'Prompt is empty', description: 'Please describe the email you want to generate.', variant: 'destructive'});
            return;
        }
        if (!selectedUser) {
            toast({ title: 'No user selected', description: 'Please select a user to send the email to.', variant: 'destructive'});
            return;
        }
        startGeneratingTransition(async () => {
            const result = await generateDirectEmail(aiPrompt, selectedUser.name || selectedUser.email);
             if (result.success && result.html) {
                toast({ title: 'Email Generated!', description: 'The AI-generated content has been added below.' });
                setHtmlContent(result.html);
            } else {
                toast({ title: 'Generation Failed', description: result.error, variant: 'destructive' });
            }
        });
    }

    const handleSendEmail = () => {
        if (!selectedUser) {
            toast({ title: 'No user selected', variant: 'destructive' });
            return;
        }
         if (!subject || !htmlContent) {
            toast({ title: 'Missing content', description: 'Subject and HTML content are required.', variant: 'destructive' });
            return;
        }
        startSendingTransition(async () => {
            const result = await sendDirectEmail({
                to: selectedUser.email,
                subject,
                message: htmlContent,
            });
            if (result.success) {
                toast({ title: 'Email Sent!', description: `Message sent to ${selectedUser.email}.`, variant: 'success' });
            } else {
                toast({ title: 'Send Failed', description: result.error, variant: 'destructive' });
            }
        });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Direct Mail</h1>
                <p className="text-muted-foreground">Send targeted emails to individual users with AI assistance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <Card className="lg:col-span-1 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> Select User</CardTitle>
                        <CardDescription>Search for and select a user to contact.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                    {selectedUser ? <>{selectedUser.email}</> : <>+ Select User</>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" side="bottom" align="start">
                                <Command>
                                    <CommandInput placeholder="Search users..." />
                                    <CommandList>
                                        <CommandEmpty>No users found.</CommandEmpty>
                                        <CommandGroup>
                                            {allUsers.map((user) => (
                                                <CommandItem key={user._id} onSelect={() => setSelectedUser(user)}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.name || 'N/A'}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-8">
                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText /> Email Templates</CardTitle>
                            <CardDescription>Choose a template or use the AI generator below for a custom email.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select onValueChange={handleTemplateChange} value={template}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custom">Custom Email</SelectItem>
                                    <SelectItem value="welcome">Welcome Email</SelectItem>
                                    <SelectItem value="plan_upgraded">Plan Upgraded</SelectItem>
                                    <SelectItem value="payment_received">Payment Received</SelectItem>
                                    <SelectItem value="payment_failed">Payment Failed</SelectItem>
                                    <SelectItem value="account_banned">Account Banned</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wand2 className="text-primary"/> AI Email Generator</CardTitle>
                            <CardDescription>Describe the purpose of the email, and the AI will write it for you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ai-prompt">AI Prompt</Label>
                                <Textarea 
                                    id="ai-prompt"
                                    placeholder="e.g., A friendly welcome email..."
                                    value={aiPrompt}
                                    onChange={(e) => { setAiPrompt(e.target.value); setTemplate('custom'); }}
                                    disabled={isGenerating}
                                    className="min-h-[80px]"
                                />
                            </div>
                             <Button onClick={handleGenerateEmail} disabled={isGenerating || !selectedUser}>
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                                ) : (
                                    'Generate with AI'
                                )}
                            </Button>
                            {!selectedUser && <p className="text-xs text-muted-foreground">Please select a user before generating.</p>}
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Compose Email</CardTitle>
                            <CardDescription>Review and send the final email. You can edit the content directly.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input 
                                    id="subject"
                                    placeholder="Your Awesome Subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    disabled={isSending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="html-content">HTML Content</Label>
                                <Textarea 
                                    id="html-content"
                                    placeholder="<html>...</html>"
                                    className="min-h-[300px] font-mono"
                                    value={htmlContent}
                                    onChange={(e) => setHtmlContent(e.target.value)}
                                    disabled={isSending}
                                />
                            </div>
                            <Button onClick={handleSendEmail} disabled={isSending || !selectedUser || !htmlContent}>
                                {isSending ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" /> Send to {selectedUser ? selectedUser.email : '...'} </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
