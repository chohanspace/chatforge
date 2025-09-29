// src/lib/templates.ts
/**
 * @fileoverview This file contains the templates and logic for generating the chatbot embed code.
 * This has been updated to a simpler, self-contained script injection method.
 */

interface ScriptGenerationParams {
    apiKey: string;
}

export function generateScriptsFromTemplate(params: ScriptGenerationParams) {
    const { apiKey } = params;

    const selfContainedScript = `
<!-- ChatForge AI Embed Start -->
<script>
(function() {
    // Ensure script runs only once
    if (document.getElementById('chatforge-trigger')) {
        return;
    }

    const API_KEY = '${apiKey}';
    const APP_URL = 'https://chatforge.thechohan.space';

    // --- 1. Inject CSS for the trigger and iframe container ---
    const style = document.createElement('style');
    style.id = 'chatforge-style';
    style.innerHTML = \`
        #chatforge-trigger, #chatforge-iframe-container {
            transition: all 0.3s ease-in-out;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #chatforge-trigger {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: none;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999998;
            transform: scale(1);
        }
        #chatforge-trigger:hover {
            transform: scale(1.1);
        }
        #chatforge-trigger svg {
            width: 28px;
            height: 28px;
            position: absolute;
            transition: opacity 0.2s, transform 0.2s;
        }
        #chatforge-trigger .icon-close {
            opacity: 0;
            transform: rotate(-90deg);
        }
        #chatforge-iframe-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: min(calc(100vw - 40px), 380px);
            height: min(80vh, 700px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            border-radius: 16px;
            overflow: hidden;
            z-index: 9999999;
            transform-origin: bottom right;
            opacity: 0;
            transform: scale(0.9);
            pointer-events: none;
            border: 1px solid #e5e7eb;
            background: #fff;
        }
        #chatforge-iframe-container.open {
            opacity: 1;
            transform: scale(1);
            pointer-events: all;
        }
        #chatforge-iframe {
            width: 100%;
            height: 100%;
            border: none;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }
         #chatforge-iframe.loaded {
            opacity: 1;
        }
        #chatforge-trigger.open .icon-open {
            opacity: 0;
            transform: rotate(90deg);
        }
        #chatforge-trigger.open .icon-close {
            opacity: 1;
            transform: rotate(0deg);
        }
        .chatforge-loader {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-size: 14px;
            transition: opacity 0.3s ease-in-out;
        }
    \`;
    document.head.appendChild(style);

    // --- 2. Create HTML Elements ---
    const trigger = document.createElement('button');
    trigger.id = 'chatforge-trigger';
    trigger.setAttribute('aria-label', 'Open chat');
    trigger.innerHTML = \`
        <svg class="icon-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <svg class="icon-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    \`;

    const container = document.createElement('div');
    container.id = 'chatforge-iframe-container';

    const loader = document.createElement('div');
    loader.className = 'chatforge-loader';
    loader.textContent = 'Loading Support Bot...';
    container.appendChild(loader);

    document.body.appendChild(trigger);
    document.body.appendChild(container);

    // --- 3. Fetch Config & Set Theme ---
    let botName = 'Support Bot';
    fetch(\`\${APP_URL}/api/chat/config/\${API_KEY}\`)
      .then(res => res.json())
      .then(config => {
        if (config.color) {
            trigger.style.backgroundColor = config.color;
        }
        if(config.name) {
            botName = config.name;
            loader.textContent = \`Loading \${botName}...\`;
        }
      })
      .catch(console.error);

    // --- 4. Logic to Toggle Chat ---
    let isOpen = false;
    let iframeLoaded = false;

    function createIframe() {
        if (iframeLoaded) return;
        iframeLoaded = true;
        const iframe = document.createElement('iframe');
        iframe.id = 'chatforge-iframe';
        iframe.src = \`\${APP_URL}/gen/ai/cfai/\${API_KEY}\`;
        iframe.setAttribute('allow', 'clipboard-write');
        iframe.onload = () => {
            iframe.classList.add('loaded');
            loader.style.opacity = '0';
        };
        container.appendChild(iframe);
    }

    function toggleChat() {
      isOpen = !isOpen;
      trigger.classList.toggle('open');
      trigger.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');
      if (isOpen) {
        createIframe();
      }
      container.classList.toggle('open');
    }

    trigger.addEventListener('click', toggleChat);
})();
</script>
<!-- ChatForge AI Embed End -->
`;

    const reactScript = `
import React, { useEffect } from 'react';

// You can find your API key on your ChatForge dashboard.
const CHATFORGE_API_KEY = "${apiKey}";
const APP_URL = "https://chatforge.thechohan.space";

const Chatbot = () => {
  useEffect(() => {
    const scriptId = 'chatforge-embed-script';
    // Prevent script from running multiple times, e.g. in React strict mode
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.innerHTML = \`
    (function() {
        if (document.getElementById('chatforge-trigger')) return;
        const API_KEY = '\${CHATFORGE_API_KEY}';
        const APP_URL = '\${APP_URL}';
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
    \`;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) document.body.removeChild(existingScript);
      const trigger = document.getElementById('chatforge-trigger');
      if (trigger) trigger.remove();
      const container = document.getElementById('chatforge-iframe-container');
      if (container) container.remove();
      const style = document.getElementById('chatforge-style');
      if(style) style.remove();
    };
  }, []);

  return null;
};

export default Chatbot;
`;

    const nextjsScript = `
'use client';
import Script from 'next/script';

// You can find your API key on your ChatForge dashboard.
const CHATFORGE_API_KEY = "${apiKey}";
const APP_URL = "https://chatforge.thechohan.space";

const Chatbot = () => {
  return (
    <Script id="chatforge-embed-script" strategy="afterInteractive">
      {\`
        (function() {
            if (document.getElementById('chatforge-trigger')) return;
            const API_KEY = '\${CHATFORGE_API_KEY}';
            const APP_URL = '\${APP_URL}';
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
      \`}
    </Script>
  );
};

export default Chatbot;
`;

    return {
        htmlScript: selfContainedScript,
        reactScript,
        nextjsScript,
    };
}
