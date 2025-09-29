
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { customSignUp } from '../../actions';
import OtpDialog from '@/components/otp-dialog';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/providers/auth-provider';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions.',
  }),
});


export default function SignupPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [userIdForOtp, setUserIdForOtp] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', terms: false },
  });

  const handleRedirect = () => {
    router.push('/dashboard');
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await customSignUp(values);
      if (result.error) {
        if(result.error.email) {
            form.setError('email', { message: result.error.email[0] });
        } else {
            toast({ title: 'Sign Up Failed', description: result.error._errors?.join(', ') || 'Could not create account.', variant: 'destructive' });
        }
      } else if (result.success && result.userId) {
        toast({ title: 'Account Created!', description: 'Please check your email for a verification code.' });
        setUserIdForOtp(result.userId);
        setShowOtpDialog(true);
      } else {
        toast({ title: 'Sign Up Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Sign Up Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  const onOtpSuccess = (token: string) => {
    toast({ title: 'Account Created!', description: 'Welcome to your dashboard.' });
    setShowOtpDialog(false);
    login(token);
    handleRedirect();
  };

  return (
    <>
      <div className="container py-12">
        <Card className="shadow-lg max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Join ChatForge AI to get your API key.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="name@yourcompany.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                       <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the{' '}
                          <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
                            Terms & Conditions
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
                            Privacy Policy
                          </Link>
                          .
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </Form>
            <Separator className="my-6" />
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      {userIdForOtp && (
        <OtpDialog
            isOpen={showOtpDialog}
            onClose={() => setShowOtpDialog(false)}
            onSuccess={onOtpSuccess}
            userId={userIdForOtp}
        />
      )}
    </>
  );
}
