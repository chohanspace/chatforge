// src/app/install/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, Wand2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { generateScriptsFromTemplate } from '@/lib/templates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import { listUserChatbots } from '../../actions';

function InstallPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [scripts, setScripts] = useState<{ htmlScript: string; reactScript: string, nextjsScript: string } | null>(null);
  const [copiedStates, setCopiedStates] = useState({ html: false, react: false, nextjs: false });

  useEffect(() => {
    async function generateScriptForApiKey() {
      const apiKey = searchParams.get('apiKey');
      if (!apiKey || !user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // We fetch the bot's config to ensure the API key is valid and belongs to the user
        const { chatbots, error } = await listUserChatbots(user.id);
        if (error) throw new Error(error);

        const targetBot = chatbots?.find(b => b.apiKey === apiKey);
        if (!targetBot) throw new Error("Invalid API Key or chatbot not found.");

        const result = generateScriptsFromTemplate({
            apiKey: targetBot.apiKey,
         });
        setScripts(result);
      } catch (error: any) {
        toast({ title: 'Generation Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    
    if (user) {
        generateScriptForApiKey();
    } else {
        setIsLoading(false);
    }

  }, [user, searchParams, toast]);

  const handleCopy = (textToCopy: string, type: 'html' | 'react' | 'nextjs') => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedStates(prev => ({ html: false, react: false, nextjs: false, [type]: true }));
    setTimeout(() => setCopiedStates(prev => ({...prev, [type]: false})), 2000);
    toast({ title: 'Code copied to clipboard!' });
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
       <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Install Your Chatbot</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
            Copy the code snippet for your framework and paste it anywhere in your site's body. That's it!
        </p>
      </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5 text-primary" /> Your Embed Code</CardTitle>
            <CardDescription>
              Your API key is already included. Just copy, paste, and go live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : scripts ? (
                 <Tabs defaultValue="html" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="html">HTML</TabsTrigger>
                        <TabsTrigger value="react">React</TabsTrigger>
                        <TabsTrigger value="nextjs">Next.js</TabsTrigger>
                    </TabsList>
                    <TabsContent value="html">
                        <CodeBlock code={scripts.htmlScript} onCopy={() => handleCopy(scripts.htmlScript, 'html')} isCopied={copiedStates.html} />
                    </TabsContent>
                    <TabsContent value="react">
                        <CodeBlock code={scripts.reactScript} onCopy={() => handleCopy(scripts.reactScript, 'react')} isCopied={copiedStates.react} />
                    </TabsContent>
                    <TabsContent value="nextjs">
                        <CodeBlock code={scripts.nextjsScript} onCopy={() => handleCopy(scripts.nextjsScript, 'nextjs')} isCopied={copiedStates.nextjs} />
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>Could not generate installation script. Please select a chatbot from your dashboard and try again.</p>
                </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}


function CodeBlock({ code, onCopy, isCopied }: { code: string, onCopy: () => void, isCopied: boolean }) {
  return (
    <div className="relative mt-4">
      <pre className="p-4 rounded-md bg-muted/50 overflow-x-auto text-sm max-h-[400px]">
        <code>{code}</code>
      </pre>
      <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={onCopy}
      >
          {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}


export default function InstallPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <InstallPageContent />
        </Suspense>
    )
}
