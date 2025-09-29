// src/components/google-signin-button.tsx
'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { findOrCreateUserFromGoogle } from '@/app/actions';
import { useAuth } from './providers/auth-provider';

export default function GoogleSignInButton({ onLoginSuccess }: { onLoginSuccess?: (email: string) => void }) {
  const { toast } = useToast();
  const { login } = useAuth();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error("Google Client ID is not configured in .env");
    return <p className="text-center text-sm text-destructive">Google Sign-In is not configured.</p>;
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
        const res = await fetch('/api/auth/google/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: credentialResponse.credential }),
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Google Sign-In failed.');
        }

        const result = await findOrCreateUserFromGoogle(data.profile);

        if(result.token && data.profile.email) {
            toast({
                title: 'Signed in with Google!',
                description: 'Welcome to your dashboard.',
            });
            login(result.token);
            if (onLoginSuccess) {
                onLoginSuccess(data.profile.email);
            }
        } else {
            throw new Error('Failed to create or find user session.');
        }
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Google Sign-In Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
        <div className="flex justify-center">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                    toast({
                    title: 'Google Sign-In Failed',
                    description: 'Could not sign in with Google. Please try again.',
                    variant: 'destructive',
                    });
                }}
                theme="outline"
                size="large"
                shape='rectangular'
                width="320px"
            />
        </div>
    </GoogleOAuthProvider>
  );
}
