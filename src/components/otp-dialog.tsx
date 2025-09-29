// src/components/otp-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { verifyOtp, resendOtp } from '../app/actions';

const formSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 characters.' }),
});

interface OtpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, email: string) => void;
  userId: string;
}

export default function OtpDialog({ isOpen, onClose, onSuccess, userId }: OtpDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, resendTimer]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const result = await verifyOtp({ ...values, userId });
        if (result.error) {
            form.setError('otp', { message: result.error.otp?.[0] || 'Verification failed.' });
        } else if (result.token && result.email) {
            onSuccess(result.token, result.email);
        }
    } catch (error) {
        toast({ title: 'Verification Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
        const result = await resendOtp(userId);
        if(result.error) {
            toast({ title: 'Failed to resend OTP', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'OTP Resent', description: 'A new OTP has been sent to your email.' });
            const newCooldown = resendCooldown + 10;
            setResendCooldown(newCooldown);
            setResendTimer(newCooldown);
        }
    } catch (error) {
        toast({ title: 'Failed to resend OTP', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify Your Account</DialogTitle>
          <DialogDescription>
            We've sent a 6-digit code to your email. Please enter it below to continue.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>One-Time Password (OTP)</FormLabel>
                  <FormControl>
                    <Input placeholder="123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
                <Button type="button" variant="ghost" onClick={handleResendOtp} disabled={resendTimer > 0}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Log In
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
