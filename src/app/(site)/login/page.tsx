
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
import { customLogin } from '../../actions';
import { useRouter } from 'next/navigation';
import OtpDialog from '@/components/otp-dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/providers/auth-provider';


const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});


export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [userIdForOtp, setUserIdForOtp] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleRedirect = () => {
    router.push('/dashboard');
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    form.clearErrors('root');
    try {
        const result = await customLogin(values);
        if (result.error) {
            form.setError('root', { message: result.error._errors?.join(', ') || 'Login failed.' });
        } else if (result.requiresOtp && result.userId) {
            toast({
                title: 'Verification Required',
                description: "Your account isn't verified. We've sent a new OTP to your email.",
                variant: 'default'
            });
            setUserIdForOtp(result.userId);
            setShowOtpDialog(true);
        } else if (result.token) {
            toast({ title: 'Login Successful', description: 'Welcome back!' });
            login(result.token);
            handleRedirect();
        }
    } catch (error) {
        toast({ title: 'Login Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }
  
  const onOtpSuccess = (token: string) => {
    toast({ title: 'Verification Successful!', description: 'Welcome to your dashboard.' });
    setShowOtpDialog(false);
    login(token);
    handleRedirect();
  };


  return (
    <>
      <div className="container py-12">
        <Card className="shadow-lg max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>Log in to access your dashboard.</CardDescription>
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
                {form.formState.errors.root && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In
                </Button>
              </form>
            </Form>
            <p className="px-8 text-center text-xs text-muted-foreground mt-4">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                </Link>
                .
            </p>
            <Separator className="my-6" />
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign Up
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
