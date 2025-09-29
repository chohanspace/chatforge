

'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, PlusCircle, Trash2, ArrowRight, Bot, Palette, MessageSquare, MessagesSquare, FlaskConical, Edit, MoreVertical, Settings, Sparkles, Shield, Calendar, Star } from 'lucide-react';
import { updateChatbotSettings, listUserChatbots, createChatbot, deleteChatbot, getUserDetails } from '../../actions';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { addDays, formatDistanceToNow } from 'date-fns';

type QA = { question: string; answer: string };
type Chatbot = {
  _id: string;
  name: string;
  color: string;
  welcomeMessage: string;
  instructions: string;
  qa: QA[];
  apiKey: string;
  authorizedDomains: string[];
};

type UserDetails = {
    messagesSent: number;
    messageLimit: number;
    chatbotLimit: number;
    plan: string;
    planCycleStartDate?: string;
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [isLoadingBots, setIsLoadingBots] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  
  const [isApiKeyCopied, setIsApiKeyCopied] = useState(false);
  const [isConfigSaving, startConfigSaveTransition] = useTransition();

  // New bot creation state
  const [newBotName, setNewBotName] = useState('');
  const [isCreatingBot, startCreateBotTransition] = useTransition();
  const [isDeletingBot, startDeleteBotTransition] = useTransition();

  // Chatbot config state (for the selected bot)
  const [instructions, setInstructions] = useState('');
  const [qaList, setQaList] = useState<QA[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [botName, setBotName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [themeColor, setThemeColor] = useState('#007BFF');
  const [authorizedDomains, setAuthorizedDomains] = useState('');

  const fetchUserDetails = async () => {
    if (!user) return;
    try {
        const { user: details, error } = await getUserDetails(user.id);
        if (error) {
            toast({ title: 'Error', description: 'Could not fetch user details.', variant: 'destructive'});
        } else {
            setUserDetails(details);
        }
    } catch {
        toast({ title: 'Error', description: 'Could not fetch user details.', variant: 'destructive'});
    }
  };
  
  useEffect(() => {
    async function fetchData() {
        if (user) {
            setIsLoadingBots(true);
            await fetchUserDetails(); // Fetch user details for limits
            const { chatbots, error } = await listUserChatbots(user.id);
            if (error) {
                toast({ title: 'Error', description: 'Could not fetch your chatbots.', variant: 'destructive'});
            } else if (chatbots) {
                setChatbots(chatbots);
                if(chatbots.length > 0) {
                    setSelectedBot(chatbots[0]);
                }
            }
            setIsLoadingBots(false);
        }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (selectedBot) {
        setInstructions(selectedBot.instructions || 'You are a helpful assistant.');
        setQaList(selectedBot.qa || []);
        setBotName(selectedBot.name || 'Support Bot');
        setWelcomeMessage(selectedBot.welcomeMessage || 'Hello! How can I help you today?');
        setThemeColor(selectedBot.color || '#007BFF');
        setAuthorizedDomains((selectedBot.authorizedDomains || []).join(', '));
    }
  }, [selectedBot]);

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setIsApiKeyCopied(true);
    setTimeout(() => setIsApiKeyCopied(false), 2000);
    toast({ title: 'API Key copied to clipboard!' });
  };

  const handleAddQA = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      setQaList([...qaList, { question: newQuestion, answer: newAnswer }]);
      setNewQuestion('');
      setNewAnswer('');
    } else {
      toast({ title: 'Please fill in both question and answer.', variant: 'destructive' });
    }
  };

  const handleRemoveQA = (index: number) => {
    setQaList(qaList.filter((_, i) => i !== index));
  };

  const handleSaveConfig = async () => {
    startConfigSaveTransition(async () => {
        const token = localStorage.getItem('chatforge_jwt');
        if (!token || !user || !selectedBot) {
            toast({ title: 'Error', description: 'You are not logged in or no bot is selected.', variant: 'destructive' });
            return;
        }
        try {
            const domainArray = authorizedDomains.split(',').map(d => d.trim()).filter(d => d);
            const values = { instructions, qa: qaList, name: botName, welcomeMessage, color: themeColor, authorizedDomains: domainArray };
            const result = await updateChatbotSettings({ token, chatbotId: selectedBot._id, values });

            if (result.error) {
                toast({ title: 'Failed to save configuration.', description: result.error._errors?.join(', '), variant: 'destructive' });
            } else {
                toast({ title: 'Configuration Saved!', description: 'Your chatbot has been updated.' });
                // Update the chatbots list with the new settings
                const updatedBot = { ...selectedBot, ...result.updatedChatbot };
                setChatbots(prev => prev.map(bot => bot._id === selectedBot._id ? updatedBot : bot));
                setSelectedBot(updatedBot);
            }
        } catch (e) {
            toast({ title: 'Failed to save configuration.', description: 'An unexpected error occurred.', variant: 'destructive' });
        }
    });
  };

  const handleCreateBot = () => {
    startCreateBotTransition(async () => {
        const token = localStorage.getItem('chatforge_jwt');
        if (!token) {
            toast({ title: 'Error', description: 'You are not logged in.', variant: 'destructive' });
            return;
        }
        const result = await createChatbot({ token, name: newBotName });
        if (result.error) {
            toast({ title: 'Failed to create chatbot.', description: result.error, variant: 'destructive' });
        } else if (result.newChatbot) {
            toast({ title: 'Chatbot Created!', description: `Your new bot "${result.newChatbot.name}" is ready.` });
            setChatbots(prev => [...prev, result.newChatbot]);
            setSelectedBot(result.newChatbot);
            setNewBotName('');
            await fetchUserDetails(); // Re-fetch user details to update bot count
        }
    });
  };

  const handleDeleteBot = () => {
    if (!selectedBot) return;
    startDeleteBotTransition(async () => {
        const token = localStorage.getItem('chatforge_jwt');
        if (!token) return;

        const result = await deleteChatbot({ token, chatbotId: selectedBot._id });
        if (result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Chatbot Deleted' });
            const updatedBots = chatbots.filter(b => b._id !== selectedBot._id);
            setChatbots(updatedBots);
            setSelectedBot(updatedBots.length > 0 ? updatedBots[0] : null);
            await fetchUserDetails();
        }
    });
  }

  const messagesUsed = userDetails?.messagesSent || 0;
  const messageLimit = userDetails?.messageLimit || 1000;
  const botLimit = userDetails?.chatbotLimit || 1;
  const messagePercentage = (messagesUsed / messageLimit) * 100;
  const canCreateBot = chatbots.length < botLimit;

  const getPlanName = (plan: string | undefined) => {
    if (!plan) return 'Free';
    if (plan.toLowerCase() !== 'free') return `${plan} Plan`;
    return plan;
  }

  const getResetDate = () => {
      if (!userDetails?.planCycleStartDate) return null;
      const startDate = new Date(userDetails.planCycleStartDate);
      const resetDate = addDays(startDate, 30);
      return `resets in ${formatDistanceToNow(resetDate)}`;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Welcome{user?.name ? `, ${user.name}` : ''}!</h1>
      <p className="text-muted-foreground mb-8">Here's your personal dashboard.</p>

      <div className="grid gap-8">
        
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot /> My Chatbots ({chatbots.length} / {botLimit})</CardTitle>
                <CardDescription>Select a chatbot to configure, or create a new one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="bot-selector">Select a Bot</Label>
                        <Select onValueChange={(id) => setSelectedBot(chatbots.find(b => b._id === id) || null)} value={selectedBot?._id}>
                            <SelectTrigger id="bot-selector" disabled={isLoadingBots}>
                                <SelectValue placeholder={isLoadingBots ? "Loading bots..." : "Select a chatbot"} />
                            </SelectTrigger>
                            <SelectContent>
                                {chatbots.map(bot => <SelectItem key={bot._id} value={bot._id}>{bot.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={!canCreateBot || isCreatingBot}>
                                <PlusCircle className="mr-2"/> Create New Chatbot
                            </Button>
                        </AlertDialogTrigger>
                        {!canCreateBot && <p className="text-xs text-muted-foreground md:col-start-2">You've reached your bot limit for the {getPlanName(userDetails?.plan)}.</p>}
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Create a New Chatbot</AlertDialogTitle>
                                <AlertDialogDescription>Give your new chatbot a name to get started.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                                <Label htmlFor="new-bot-name">Chatbot Name</Label>
                                <Input id="new-bot-name" value={newBotName} onChange={e => setNewBotName(e.target.value)} placeholder="e.g., Sales Assistant" />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCreateBot} disabled={!newBotName.trim() || isCreatingBot}>
                                    {isCreatingBot && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Create
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
        
        {isLoadingBots ? <DashboardSkeleton/> : !selectedBot ? (
            <Card className="shadow-lg text-center p-12">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Create Your First Chatbot</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Click the button above to create a new chatbot and start configuring it.</p>
            </Card>
        ) : (
            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Settings/> Configure "{selectedBot.name}"</CardTitle>
                            <CardDescription>
                            Provide custom instructions and Q&A to tailor your chatbot's responses.
                            </CardDescription>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={isDeletingBot}><Trash2/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete "{selectedBot.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete this chatbot and its configuration.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteBot} disabled={isDeletingBot}>
                                        {isDeletingBot && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bot-name">Chatbot Name</Label>
                            <Input id="bot-name" value={botName} onChange={(e) => setBotName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="theme-color">Theme Color</Label>
                            <div className="relative">
                                <Input id="theme-color" type="text" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="pl-8" />
                                <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer appearance-none bg-transparent border-none"/>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="welcome-message">Welcome Message</Label>
                        <Input id="welcome-message" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="authorized-domains">Authorized Domains</Label>
                        <Input id="authorized-domains" value={authorizedDomains} onChange={(e) => setAuthorizedDomains(e.target.value)} placeholder="e.g. yoursite.com, staging.yoursite.com" />
                         <p className="text-xs text-muted-foreground">
                            Comma-separated list of domains where this chatbot can be embedded.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="instructions">Custom Instructions (Personality)</Label>
                        <Textarea
                        id="instructions"
                        placeholder="e.g., You are a helpful assistant for a SaaS company..."
                        className="min-h-[100px]"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>
                    <div className="space-y-4">
                        <Label>Custom Q&A</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {qaList.map((qa, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-secondary">
                            <div className="flex-1">
                                <p className="text-sm font-medium">{qa.question}</p>
                                <p className="text-xs text-muted-foreground">{qa.answer}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveQA(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        ))}
                        </div>
                        <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="new-question" className="text-xs">Question</Label>
                            <Input id="new-question" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="User asks..." />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="new-answer" className="text-xs">Answer</Label>
                            <Input id="new-answer" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} placeholder="Bot replies..." />
                        </div>
                        <Button variant="outline" size="icon" onClick={handleAddQA}><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button onClick={handleSaveConfig} disabled={isConfigSaving}>
                        {isConfigSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Configuration'}
                    </Button>
                    </CardFooter>
                </Card>

                <div className="space-y-8">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessagesSquare className="w-5 h-5"/>
                                Global Monthly Usage
                            </CardTitle>
                            <CardDescription>
                                Your message usage across all chatbots for the current billing cycle.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {userDetails ? (
                                <>
                                <Progress value={messagePercentage} />
                                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                                    <span>{messagesUsed.toLocaleString()} / {messageLimit.toLocaleString()}</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {getResetDate()}</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                                    <span>Plan: <strong>{getPlanName(userDetails.plan)}</strong></span>
                                </div>
                                </>
                            ) : (
                                <Skeleton className="h-10 w-full" />
                            )}
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader>
                        <CardTitle>API Key for "{selectedBot.name}"</CardTitle>
                        <CardDescription>Use this key to integrate this specific chatbot.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                            <Input readOnly value={selectedBot.apiKey} className="pr-12 text-sm font-mono" />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => handleCopy(selectedBot.apiKey)}
                            >
                                {isApiKeyCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Test "{selectedBot.name}"</CardTitle>
                            <CardDescription>
                                Preview your chatbot and test its responses in a live environment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                            <Link href={{ pathname: '/test', query: { apiKey: selectedBot.apiKey } }}>
                                    Go to Test Page
                                    <FlaskConical className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Install "{selectedBot.name}"</CardTitle>
                            <CardDescription>
                                Click the button below to get the simple copy-paste embed code.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                            <Link href={`/install?apiKey=${selectedBot.apiKey}`}>
                                    Go to Installation
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}


const DashboardSkeleton = () => (
    <div className="grid gap-8 lg:grid-cols-2">
        <Card className="shadow-lg">
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </CardContent>
            <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
        </Card>
        <div className="space-y-8">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
        </div>
    </div>
);

    


