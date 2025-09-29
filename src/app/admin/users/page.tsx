// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { listUsers, getUserDetails, updateUserStatus, regenerateUserApiKey, deleteUser, updateUserPlanAndLimit, sendDirectEmail, sendEmailToAllUsers, deleteUserChatbot } from '../../actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Search, MoreHorizontal, Eye, ShieldOff, ShieldCheck, KeyRound, Trash2, Copy, Check, Star, Edit, Calendar, AtSign, CircleUserRound, Mail, Send, Bot, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
  } from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDebounce } from '@/hooks/use-debounce';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

type PlanName = 'Free' | 'Pro' | 'Enterprise';
type User = {
    _id: string;
    name?: string;
    email: string;
    isVerified: boolean;
    isBanned?: boolean;
    authMethod: 'email' | 'google';
    createdAt: string;
    plan: PlanName;
}

type UserDetails = User & {
    chatbots: {
        _id: string;
        name: string;
        apiKey: string;
        instructions: string;
        qa: { question: string; answer: string }[];
    }[];
    messagesSent: number;
    messageLimit: number;
    chatbotLimit: number;
}

const planBenefits: Record<PlanName, { messageLimit: number; chatbotLimit: number }> = {
    Free: { messageLimit: 1000, chatbotLimit: 1 },
    Pro: { messageLimit: 50000, chatbotLimit: 10 },
    Enterprise: { messageLimit: 1000000, chatbotLimit: 100 }, // Default for custom
};


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<(() => Promise<void>) | null>(null);
  const [alertContent, setAlertContent] = useState({ title: '', description: '', confirmText: '' });

  const [isApiKeyCopied, setIsApiKeyCopied] = useState(false);
  
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [plan, setPlan] = useState<PlanName>('Free');
  const [messageLimit, setMessageLimit] = useState(0);
  const [chatbotLimit, setChatbotLimit] = useState(0);
  const [isPlanUpdatePending, startPlanUpdateTransition] = useTransition();

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isEmailSending, startEmailSendingTransition] = useTransition();

  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkEmailMessage, setBulkEmailMessage] = useState('');
  const [isBulkEmailSending, startBulkEmailSendingTransition] = useTransition();


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { users: fetchedUsers, error } = await listUsers(debouncedSearchQuery);
      if (error) {
        toast({ title: 'Error fetching users', description: error, variant: 'destructive' });
      } else {
        setUsers(fetchedUsers || []);
      }
    } catch (e) {
      toast({ title: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);
  
  useEffect(() => {
    if (isEditingPlan) {
        if (plan === 'Enterprise') return;
        const benefits = planBenefits[plan];
        setMessageLimit(benefits.messageLimit);
        setChatbotLimit(benefits.chatbotLimit);
    }
  }, [plan, isEditingPlan]);

  const handleViewDetails = async (userId: string) => {
    const { user, error } = await getUserDetails(userId);
    if(error || !user) {
        toast({ title: 'Error', description: error || "Could not fetch user details.", variant: 'destructive' });
    } else {
        setSelectedUser(user);
        setPlan(user.plan);
        setMessageLimit(user.messageLimit ?? 0);
        setChatbotLimit(user.chatbotLimit ?? 0);
        setIsSheetOpen(true);
    }
  }

  const confirmAction = (title: string, description: string, confirmText: string, action: () => Promise<void>) => {
    setAlertContent({ title, description, confirmText });
    setAlertAction(() => action);
    setIsAlertOpen(true);
  };
  

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    const { success, error } = await updateUserStatus(userId, !isBanned);
    if (error || !success) {
      toast({ title: 'Error', description: error || "Could not update user status.", variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `User has been ${!isBanned ? 'banned' : 'unbanned'}.`, variant: 'success' });
      fetchUsers();
    }
  };

  const handleRegenerateKey = async (chatbotId: string) => {
    const { success, error, newApiKey } = await regenerateUserApiKey(chatbotId);
    if (error || !success) {
      toast({ title: 'Error', description: error || "Could not regenerate API key.", variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `API key has been regenerated.`, variant: 'success' });
      // Refresh user details to show new key
      if (selectedUser) {
        handleViewDetails(selectedUser._id);
      }
    }
  };

  const handleDeleteChatbot = async (chatbotId: string) => {
    const { success, error } = await deleteUserChatbot(chatbotId);
     if (error || !success) {
      toast({ title: 'Error', description: error || "Could not delete chatbot.", variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Chatbot has been deleted.', variant: 'success' });
      if (selectedUser) {
        handleViewDetails(selectedUser._id);
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const { success, error } = await deleteUser(userId);
    if (error || !success) {
      toast({ title: 'Error', description: error || "Could not delete user.", variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'User has been deleted.', variant: 'success' });
      setIsSheetOpen(false);
      fetchUsers();
    }
  };

  const handlePlanUpdate = () => {
    if (!selectedUser) return;
    startPlanUpdateTransition(async () => {
        const { success, error } = await updateUserPlanAndLimit({ 
            userId: selectedUser._id, 
            plan, 
            messageLimit: Number(messageLimit),
            chatbotLimit: Number(chatbotLimit),
        });
        if (error) {
            toast({ title: 'Error', description: error, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'User plan has been updated.', variant: 'success' });
            setSelectedUser({ 
                ...selectedUser, 
                plan, 
                messageLimit: Number(messageLimit),
                chatbotLimit: Number(chatbotLimit),
            });
            setIsEditingPlan(false);
            fetchUsers();
        }
    });
  }

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setIsApiKeyCopied(true);
    setTimeout(() => setIsApiKeyCopied(false), 2000);
  }

  const handleSendEmail = () => {
    if (!selectedUser) return;
    startEmailSendingTransition(async () => {
        const result = await sendDirectEmail({
            to: selectedUser.email,
            subject: emailSubject,
            message: emailMessage,
        });

        if (result.success) {
            toast({ title: 'Email Sent!', description: `Your message has been sent to ${selectedUser.email}.`, variant: 'success' });
            setIsEmailDialogOpen(false);
            setEmailSubject('');
            setEmailMessage('');
        } else {
            toast({ title: 'Failed to Send', description: result.error, variant: 'destructive' });
        }
    });
  }

  const handleSendBulkEmail = () => {
    startBulkEmailSendingTransition(async () => {
        const result = await sendEmailToAllUsers({ subject: bulkEmailSubject, message: bulkEmailMessage });
        if (result.success) {
            toast({ title: 'Bulk Email Sent!', description: `Email is being sent to ${result.userCount} users.`, variant: 'success' });
            setIsBulkEmailOpen(false);
            setBulkEmailSubject('');
            setBulkEmailMessage('');
        } else {
            toast({ title: 'Bulk Email Failed', description: result.error, variant: 'destructive' });
        }
    });
  }


  const getPlanBadgeVariant = (plan: User['plan']) => {
    switch (plan) {
        case 'Pro': return 'default';
        case 'Enterprise': return 'secondary';
        default: return 'outline';
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Search, view, and manage all registered users.</p>
        </div>
        <Dialog open={isBulkEmailOpen} onOpenChange={setIsBulkEmailOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Send className="mr-2 h-4 w-4"/>
                    Bulk Email Users
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Email to All Users</DialogTitle>
                    <DialogDescription>
                        This message will be sent to all {users.length} registered users. Use with caution.
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="bulk-email-subject">Subject</Label>
                        <Input id="bulk-email-subject" value={bulkEmailSubject} onChange={e => setBulkEmailSubject(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bulk-email-message">Message (HTML is supported)</Label>
                        <Textarea id="bulk-email-message" value={bulkEmailMessage} onChange={e => setBulkEmailMessage(e.target.value)} className="min-h-[200px]" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBulkEmailOpen(false)}>Cancel</Button>
                    <Button onClick={handleSendBulkEmail} disabled={isBulkEmailSending}>
                        {isBulkEmailSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send to All Users
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
            <CardDescription>A list of all users in the system.</CardDescription>
            <div className="relative pt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by email..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
              <TableSkeleton />
            ) : users.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold">No Users Found</h3>
                  <p className="text-muted-foreground">There are no users matching your search.</p>
              </div>
            ) : (
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden sm:table-cell">Auth Method</TableHead>
                      <TableHead className="hidden md:table-cell">Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Joined</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {users.map((user) => (
                      <TableRow key={user._id}>
                          <TableCell>
                            <div className="font-medium">{user.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{user.authMethod}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant={getPlanBadgeVariant(user.plan)}>{user.plan}</Badge>
                          </TableCell>
                          <TableCell>
                              {user.isVerified ? 
                                <Badge variant="secondary">Verified</Badge> : 
                                <Badge variant="destructive">Unverified</Badge>
                              }
                              {user.isBanned && <Badge variant="destructive" className="ml-2">Banned</Badge>}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewDetails(user._id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => confirmAction('Are you sure?', `This will ${user.isBanned ? 'unban' : 'ban'} the user and affect their access.`, 'Confirm', () => handleBanToggle(user._id, user.isBanned ?? false))}>
                                      {user.isBanned ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                                      {user.isBanned ? 'Unban User' : 'Ban User'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => confirmAction('Are you absolutely sure?', 'This action cannot be undone. This will permanently delete the user.', 'Delete User', () => handleDeleteUser(user._id))}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                      </TableRow>
                  ))}
                  </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
      
      <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); setIsEditingPlan(false); }}>
         <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Full details for {selectedUser?.email}.
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-4">
                <div className="font-mono text-xs text-muted-foreground">ID: {selectedUser._id}</div>
                
                <h3 className="font-semibold text-lg flex items-center justify-between">
                    Plan & Usage
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingPlan(!isEditingPlan)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </h3>
                {isEditingPlan ? (
                    <Card className="bg-muted p-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select value={plan} onValueChange={(v) => setPlan(v as any)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Free">Free</SelectItem>
                                    <SelectItem value="Pro">Pro</SelectItem>
                                    <SelectItem value="Enterprise">Enterprise (Custom)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Message Limit</Label>
                                <Input type="number" value={messageLimit} onChange={(e) => setMessageLimit(Number(e.target.value))} disabled={plan !== 'Enterprise'} />
                            </div>
                            <div className="space-y-2">
                                <Label>Bot Limit</Label>
                                <Input type="number" value={chatbotLimit} onChange={(e) => setChatbotLimit(Number(e.target.value))} disabled={plan !== 'Enterprise'} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditingPlan(false)}>Cancel</Button>
                            <Button onClick={handlePlanUpdate} disabled={isPlanUpdatePending}>
                                {isPlanUpdatePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <Card className="bg-muted">
                        <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5"><Star className="w-3.5 h-3.5"/> Plan</p>
                                <p className="font-bold text-lg">{selectedUser.plan}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/> Usage</p>
                                <p className="font-bold text-lg">{(selectedUser.messagesSent ?? 0).toLocaleString()} / {(selectedUser.messageLimit ?? 0).toLocaleString()}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5"><Bot className="w-3.5 h-3.5"/> Bot Limit</p>
                                <p className="font-bold text-lg">{selectedUser.chatbots.length} / {(selectedUser.chatbotLimit ?? 0).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}


                <h3 className="font-semibold text-lg pt-2">Chatbots</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedUser.chatbots.length > 0 ? selectedUser.chatbots.map(bot => (
                        <Card key={bot._id} className="bg-muted">
                            <CardHeader className="p-3">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <span>{bot.name}</span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => confirmAction('Are you sure?', 'This will generate a new API key, invalidating the old one.', 'Regenerate', () => handleRegenerateKey(bot._id))}>
                                                <KeyRound className="mr-2 h-4 w-4" /> Regenerate Key
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => confirmAction('Delete this chatbot?', 'This action cannot be undone and will permanently delete this chatbot.', 'Delete Chatbot', () => handleDeleteChatbot(bot._id))}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Chatbot
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="relative">
                                    <Input readOnly value={bot.apiKey} className="pr-12 text-xs font-mono bg-background" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                        onClick={() => handleCopyApiKey(bot.apiKey)}
                                    >
                                        {isApiKeyCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">This user has not created any chatbots.</p>
                    )}
                </div>
            </div>
          )}
          <SheetFooter className="mt-auto pt-4 border-t">
            <SheetClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </SheetClose>
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogTrigger asChild>
                     <Button type="button">
                        <Mail className="mr-2 h-4 w-4" />
                        Email User
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Email to {selectedUser?.email}</DialogTitle>
                        <DialogDescription>Compose and send a direct message to this user.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email-subject">Subject</Label>
                            <Input id="email-subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email-message">Message</Label>
                            <Textarea id="email-message" value={emailMessage} onChange={e => setEmailMessage(e.target.value)} className="min-h-[150px]" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendEmail} disabled={isEmailSending}>
                            {isEmailSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Message
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={async () => {
                if (alertAction) {
                    await alertAction();
                }
                setIsAlertOpen(false);
                }}
                className={alertContent.confirmText.includes('Delete') ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
                {alertContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}


const TableSkeleton = () => (
    <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
             <div key={i} className="flex items-center space-x-4 p-2">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        ))}
    </div>
);
