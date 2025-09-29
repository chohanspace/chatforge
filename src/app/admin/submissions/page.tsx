// src/app/admin/submissions/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { listSubmissions, updateSubmissionStatus, deleteSubmission } from '../../actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Inbox, CheckCircle, XCircle, MoreVertical, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

type Submission = {
    _id: string;
    name: string;
    email: string;
    company?: string;
    plan: 'Pro' | 'Enterprise';
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);


  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
        const { submissions: fetchedSubmissions, error } = await listSubmissions();
        if (error) {
          toast({ title: 'Error fetching submissions', description: error, variant: 'destructive' });
        } else if (fetchedSubmissions) {
          setSubmissions(fetchedSubmissions.map(s => ({...s, id: s._id})));
        }
      } catch (e) {
        toast({ title: 'An unexpected error occurred.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }

  useEffect(() => {
    fetchSubmissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = (id: string, status: 'accepted' | 'rejected') => {
    startTransition(async () => {
        const result = await updateSubmissionStatus({ id, status });
        if(result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else if (result.success && result.updatedSubmission) {
            toast({ title: 'Success', description: `Submission has been ${status}.`, variant: 'success' });
            setSubmissions(prev => prev.map(s => s._id === id ? { ...s, status } : s));
        }
    })
  }
  
  const handleDelete = (id: string) => {
    setSubmissionToDelete(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (!submissionToDelete) return;
    startTransition(async () => {
      const result = await deleteSubmission(submissionToDelete);
      if (result.success) {
        toast({ title: 'Success', description: 'Submission has been deleted.', variant: 'success' });
        setSubmissions(prev => prev.filter(s => s._id !== submissionToDelete));
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
      setIsAlertOpen(false);
      setSubmissionToDelete(null);
    });
  };

  const getPlanBadgeVariant = (plan: Submission['plan']) => {
    switch (plan) {
        case 'Pro': return 'secondary';
        case 'Enterprise': return 'default';
        default: return 'outline';
    }
  }

  const getStatusBadgeVariant = (status: Submission['status']) => {
      switch (status) {
          case 'pending': return 'outline';
          case 'accepted': return 'secondary';
          case 'rejected': return 'destructive';
          default: return 'outline';
      }
  }

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold">Plan Submissions</h1>
            <p className="text-muted-foreground">Review and respond to inquiries from potential customers.</p>
        </div>
      
      {isLoading ? (
        <TableSkeleton />
      ) : submissions.length === 0 ? (
        <Card className="shadow-lg">
            <CardContent className="pt-6">
                <div className="flex flex-col justify-center items-center h-64 text-center">
                    <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Submissions Yet</h3>
                    <p className="text-muted-foreground">When users inquire about premium plans, they'll appear here.</p>
                </div>
            </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
            <CardContent className="pt-6">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden sm:table-cell">Plan</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {submissions.map((sub) => (
                        <TableRow key={sub._id}>
                            <TableCell>
                                <div>{sub.name}</div>
                                <div className="text-xs text-muted-foreground">{sub.email}</div>
                                <div className="sm:hidden mt-2 space-x-2">
                                    <Badge variant={getPlanBadgeVariant(sub.plan)}>{sub.plan}</Badge>
                                    <Badge variant={getStatusBadgeVariant(sub.status)}>{sub.status}</Badge>
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge variant={getPlanBadgeVariant(sub.plan)}>{sub.plan}</Badge>
                            </TableCell>
                            <TableCell>
                                <p className="max-w-xs truncate">{sub.message}</p>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                                <Badge variant={getStatusBadgeVariant(sub.status)}>
                                    {sub.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                    {sub.status === 'pending' ? (
                                        <div className="hidden sm:flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(sub._id, 'rejected')} disabled={isPending}>
                                                <XCircle className="mr-2 h-4 w-4"/> Reject
                                            </Button>
                                            <Button size="sm" onClick={() => handleUpdateStatus(sub._id, 'accepted')} disabled={isPending}>
                                                <CheckCircle className="mr-2 h-4 w-4"/> Accept
                                            </Button>
                                        </div>
                                    ) : (
                                         <div className="w-0 sm:w-[178px]"></div> // Placeholder to keep alignment
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {sub.status === 'pending' && (
                                                <div className="sm:hidden">
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(sub._id, 'accepted')} disabled={isPending}>
                                                        <CheckCircle className="mr-2 h-4 w-4"/> Accept
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem onClick={() => handleUpdateStatus(sub._id, 'rejected')} disabled={isPending}>
                                                        <XCircle className="mr-2 h-4 w-4"/> Reject
                                                    </DropdownMenuItem>
                                                </div>
                                            )}
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(sub._id)} disabled={isPending}>
                                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the submission.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSubmissionToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmDelete}
                        disabled={isPending}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}


const TableSkeleton = () => (
    <Card className="shadow-lg">
        <CardContent className="pt-6">
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </CardContent>
    </Card>
);