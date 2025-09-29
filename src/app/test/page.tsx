// src/app/test/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const ChatbotEmbed = ({ apiKey }: { apiKey: string }) => {
  if (typeof window === 'undefined') return null;

  const appUrl = window.location.origin;
  const scriptContent = `
    (function() {
        // Clean up previous instances
        const oldTrigger = document.getElementById('chatforge-trigger');
        if (oldTrigger) oldTrigger.remove();
        const oldContainer = document.getElementById('chatforge-iframe-container');
        if (oldContainer) oldContainer.remove();
        const oldStyle = document.getElementById('chatforge-style');
        if(oldStyle) oldStyle.remove();

        const API_KEY = '${apiKey}';
        const APP_URL = '${appUrl}';
        
        const style = document.createElement('style');
        style.id = 'chatforge-style';
        style.innerHTML = \`
            #chatforge-trigger, #chatforge-iframe-container { transition: all 0.3s ease-in-out; font-family: sans-serif; }
            #chatforge-trigger { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999998; transform: scale(1); }
            #chatforge-trigger:hover { transform: scale(1.1); }
            #chatforge-trigger svg { width: 28px; height: 28px; position: absolute; transition: opacity 0.2s, transform 0.2s; }
            #chatforge-trigger .icon-close { opacity: 0; transform: rotate(-90deg); }
            #chatforge-iframe-container { position: fixed; bottom: 90px; right: 20px; width: min(calc(100vw - 40px), 380px); height: min(80vh, 700px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); border-radius: 16px; overflow: hidden; z-index: 9999999; transform-origin: bottom right; opacity: 0; transform: scale(0.9); pointer-events: none; border: 1px solid #e5e7eb; background: #fff; }
            #chatforge-iframe-container.open { opacity: 1; transform: scale(1); pointer-events: all; }
            #chatforge-iframe { width: 100%; height: 100%; border: none; opacity: 0; transition: opacity 0.3s ease-in-out; }
            #chatforge-iframe.loaded { opacity: 1; }
            #chatforge-trigger.open .icon-open { opacity: 0; transform: rotate(90deg); }
            #chatforge-trigger.open .icon-close { opacity: 1; transform: rotate(0deg); }
            .chatforge-loader { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 14px; transition: opacity 0.3s ease-in-out; }
        \`;
        document.head.appendChild(style);

        const trigger = document.createElement('button');
        trigger.id = 'chatforge-trigger';
        trigger.setAttribute('aria-label', 'Open chat');
        trigger.innerHTML = \`<svg class="icon-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><svg class="icon-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\`;
        
        const container = document.createElement('div');
        container.id = 'chatforge-iframe-container';
        
        const loader = document.createElement('div');
        loader.className = 'chatforge-loader';
        loader.textContent = 'Loading Support Bot...';
        container.appendChild(loader);
        
        document.body.appendChild(trigger);
        document.body.appendChild(container);
        
        let botName = 'Support Bot';
        fetch(\`\${APP_URL}/api/chat/config/\${API_KEY}\`).then(res => res.json()).then(config => { if (config.color) { trigger.style.backgroundColor = config.color; } if(config.name) { botName = config.name; loader.textContent = \`Loading \${botName}...\`; } });
        
        let isOpen = false, iframeLoaded = false;
        function createIframe() { if (iframeLoaded) return; iframeLoaded = true; const iframe = document.createElement('iframe'); iframe.id = 'chatforge-iframe'; iframe.src = \`\${APP_URL}/gen/ai/cfai/\${API_KEY}\`; iframe.setAttribute('allow', 'clipboard-write'); iframe.onload = () => { iframe.classList.add('loaded'); loader.style.opacity = '0'; }; container.appendChild(iframe); }
        function toggleChat() { isOpen = !isOpen; trigger.classList.toggle('open'); if (isOpen) createIframe(); container.classList.toggle('open'); }
        trigger.addEventListener('click', toggleChat);
    })();
  `;
  return <Script id="chatforge-test-embed" dangerouslySetInnerHTML={{ __html: scriptContent }} />;
};


function TestPageContent() {
  const searchParams = useSearchParams();
  const [apiKey, setApiKey] = useState('');
  const [loadedApiKey, setLoadedApiKey] = useState<string | null>(null);

  useEffect(() => {
    const keyFromQuery = searchParams.get('apiKey');
    if (keyFromQuery) {
        setApiKey(keyFromQuery);
        setLoadedApiKey(keyFromQuery);
    }
  }, [searchParams]);

  const handleLoad = () => {
    if (apiKey.trim()) {
      setLoadedApiKey(apiKey.trim());
    }
  };

  return (
    <div className="container mx-auto py-12 flex flex-col items-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Chatbot Test Page</CardTitle>
          <CardDescription>
            Enter an API key to load and preview a chatbot. Your key from the dashboard is loaded automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key-input">ChatForge API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key-input"
                type="text"
                placeholder="cfai_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button onClick={handleLoad}>Load Chatbot</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadedApiKey && <ChatbotEmbed apiKey={loadedApiKey} />}
    </div>
  );
}


export default function TestPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <TestPageContent />
        </Suspense>
    );
}