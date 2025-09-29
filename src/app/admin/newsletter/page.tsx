
// src/app/admin/newsletter/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { listSubscribers, sendNewsletter, generateNewsletter as generateNewsletterAction } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Newspaper, Send, User, Calendar, Trash2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';

type Subscriber = {
    _id: string;
    email: string;
    subscribedAt: string;
};

export default function NewsletterPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, startSendingTransition] = useTransition();
    const [isGenerating, startGeneratingTransition] = useTransition();
    const { toast } = useToast();

    const [subject, setSubject] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');

    const fetchSubscribers = async () => {
        setIsLoading(true);
        try {
            const { subscribers: fetched, error } = await listSubscribers();
            if (error) {
                toast({ title: 'Error fetching subscribers', description: error, variant: 'destructive' });
            } else {
                setSubscribers(fetched || []);
            }
        } catch (e) {
            toast({ title: 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSendNewsletter = () => {
        if(!subject || !htmlContent) {
            toast({ title: 'Missing fields', description: 'Please provide a subject and email content.', variant: 'destructive'});
            return;
        }
        startSendingTransition(async () => {
            const result = await sendNewsletter({ subject, htmlContent });
            if (result.success) {
                toast({ title: 'Newsletter Sent!', description: `Email has been sent to ${subscribers.length} subscribers.` });
                setSubject('');
                setHtmlContent('');
                setAiPrompt('');
            } else {
                toast({ title: 'Failed to Send', description: result.error, variant: 'destructive' });
            }
        });
    }

    const handleGenerateEmail = () => {
        if (!aiPrompt) {
            toast({ title: 'Prompt is empty', description: 'Please describe the email you want to generate.', variant: 'destructive'});
            return;
        }
        startGeneratingTransition(async () => {
            const result = await generateNewsletterAction(aiPrompt);
             if (result.success && result.html) {
                toast({ title: 'Email Generated!', description: 'The AI-generated content has been added below.' });
                setHtmlContent(result.html);
            } else {
                toast({ title: 'Generation Failed', description: result.error, variant: 'destructive' });
            }
        });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Newsletter</h1>
                <p className="text-muted-foreground">Compose and send emails to all your subscribers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wand2 className="text-primary"/> AI Email Generator</CardTitle>
                            <CardDescription>Describe the content of the email, and the AI will generate a professional HTML email for you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ai-prompt">Email Prompt</Label>
                                <Textarea 
                                    id="ai-prompt"
                                    placeholder="e.g., An announcement for our new analytics feature, highlighting its benefits..."
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    disabled={isGenerating}
                                    className="min-h-[80px]"
                                />
                            </div>
                             <Button onClick={handleGenerateEmail} disabled={isGenerating}>
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                                ) : (
                                    'Generate with AI'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Compose Email</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input 
                                    id="subject"
                                    placeholder="Your Awesome Newsletter"
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
                            <Button onClick={handleSendNewsletter} disabled={isSending || subscribers.length === 0}>
                                {isSending ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" /> Send to {subscribers.length} Subscribers</>
                                )}
                            </Button>
                            {subscribers.length === 0 && <p className="text-xs text-muted-foreground">You have no subscribers to send to.</p>}
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-1 shadow-lg h-fit">
                    <CardHeader>
                        <CardTitle>Subscribers ({subscribers.length})</CardTitle>
                        <CardDescription>List of all newsletter subscribers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscribers.length > 0 ? subscribers.map(sub => (
                                            <TableRow key={sub._id}>
                                                <TableCell className="font-medium text-xs">{sub.email}</TableCell>
                                                <TableCell className="text-xs">{new Date(sub.subscribedAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground">No subscribers yet.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
