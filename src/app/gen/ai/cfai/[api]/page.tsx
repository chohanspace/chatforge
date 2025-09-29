
'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, User, CornerDownLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';


// Helper to convert hex to HSL for theme colors
const hexToHsl = (hex: string): [number, number, number] => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

type Message = {
    role: 'bot' | 'user';
    text: string;
};

type GenkitHistory = {
    role: 'user' | 'model';
    content: { text: string }[];
}

type Config = {
    name: string;
    welcome: string;
    color: string;
    plan: 'Free' | 'Pro' | 'Epic' | 'Enterprise';
}

export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [config, setConfig] = useState<Config>({ name: 'Assistant', welcome: 'Hello!', color: '#2563EB', plan: 'Free' });
    const [isLoaded, setIsLoaded] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const params = useParams();
    const apiKey = params.api as string;

    const [baseUrl, setBaseUrl] = useState('');
    useEffect(() => {
        setBaseUrl(window.location.origin);
        // Preload audio
        audioRef.current = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABodHRwOi8vd3d3Lm11c2Vzb2Z0LmNvbS9mcmVlLWF1ZGlvLWNsaXBzL2J1dHRvbi1jbGljay1zb3VuZC1lZmZlY3RzLmh0bWwAAAAAAExhdmc1OC40NS4xMDBVTkJDAAAAPkVkdGl0ZWQgYnkgQnJpYW4gUGV0ZXIgZm9yIGh0dHA6Ly93d3cubXVzZXNvZnQuY29tIC0gaHR0cDovL3d3dy5zdG9ja211c2ljLmNvbQAAAAAA//tAwEAAABA6QZ3AAAAAAAAAAAAAAB94Y5ZgAcoDJwAGQzOAAAAAABhjbWIAFwEAAAFcQioaWk334U+n//sNw+D/8SoAAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX//tA4BM0B4A0AIKwBmgGfoA4AAAAABBuZXQgYWxsIG5ldCBhbGwgbmV0IGFsbCBuZXQgYWxsIG5ldCBhbGwgISBjbGljayBzb3VuZCBtdXNpYyB0byBkb3dubG9hZCBodHRwOi8vd3d3Lm11c2Vzb2Z0LmNvbS8gDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KDQoNCg0KLy8gaHR0cHM6Ly93d3cubXVzZXNvZnQuY29tL3NvdW5kLWVmZmVjdHMvZG93bmxvYWQucGhwP2lkPTY3MiAm//tA4BQCBAIhASQCGZg//u4ADSAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVle.g");
    }, []);

     // Load messages from localStorage on initial render
     useEffect(() => {
        if (!apiKey || !isLoaded) return;
        try {
            const storedMessages = localStorage.getItem(`chatforge_history_${apiKey}`);
            if (storedMessages) {
                setMessages(JSON.parse(storedMessages));
            } else {
                // If no history, set the welcome message
                setMessages([{ role: 'bot', text: config.welcome }]);
            }
        } catch (error) {
            console.error("Could not load messages from localStorage", error);
            localStorage.removeItem(`chatforge_history_${apiKey}`);
            setMessages([{ role: 'bot', text: config.welcome }]);
        }
    }, [apiKey, isLoaded, config.welcome]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (!apiKey || !isLoaded) return;
        // Don't save if it's just the initial welcome message and nothing else
        if (messages.length <= 1 && messages[0]?.text === config.welcome) return;
        try {
            localStorage.setItem(`chatforge_history_${apiKey}`, JSON.stringify(messages));
        } catch (error) {
            console.error("Could not save messages to localStorage", error);
        }
    }, [messages, apiKey, isLoaded, config.welcome]);

    useEffect(() => {
        if (apiKey && baseUrl) {
            fetch(`${baseUrl}/api/chat/config/${apiKey}`)
                .then(res => res.json())
                .then(configData => {
                    if (configData && !configData.error) {
                        const newConfig: Config = {
                            name: configData.name || 'Assistant',
                            welcome: configData.welcome || 'Hello! How can I help you today?',
                            color: configData.color || '#007BFF',
                            plan: configData.plan || 'Free',
                        };
                        setConfig(newConfig);

                        // Apply theme colors
                        const [h, s, l] = hexToHsl(newConfig.color);
                        document.documentElement.style.setProperty('--theme-primary-h', `${h}`);
                        document.documentElement.style.setProperty('--theme-primary-s', `${s}%`);
                        document.documentElement.style.setProperty('--theme-primary-l', `${l}%`);
                    } else {
                        setMessages([{ role: 'bot', text: 'Error: Could not load chatbot configuration.' }]);
                    }
                }).catch(() => {
                     setMessages([{ role: 'bot', text: 'Error: Could not load chatbot configuration.' }]);
                }).finally(() => {
                    setIsLoaded(true);
                });
        }
    // Only run this once on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, baseUrl]);


    useEffect(() => {
        setTimeout(() => {
            chatContainerRef.current?.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }, [messages, isSending]);

    const handleSendMessage = async () => {
        const msg = inputValue.trim();
        if (msg === '' || isSending || !apiKey || !baseUrl) return;

        const userMessage: Message = { role: 'user', text: msg };
        
        // If the only message is the welcome message, replace it
        const newMessages = messages.length === 1 && messages[0].text === config.welcome 
            ? [userMessage] 
            : [...messages, userMessage];

        setMessages(newMessages);
        setInputValue('');
        setIsSending(true);
        
        const historyForApi: GenkitHistory[] = newMessages
            .slice(0, -1) // Exclude the user message we just added
            .filter(m => m.text !== config.welcome) // Don't send the welcome message in history
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                content: [{ text: m.text }]
            }));

        try {
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, apiKey: apiKey, history: historyForApi }),
            });

            const data = await response.json();

            if (!response.ok && data.error) {
                 const errorMessage: Message = { role: 'bot', text: `Sorry, an error occurred: ${data.error}` };
                 setMessages(prev => [...prev, errorMessage]);
                 return;
            }

            const unauthorizedMessage = 'This chatbot is not authorized to be used on this domain.';
            if (data.reply && data.reply.includes(unauthorizedMessage)) {
                const errorMessage: Message = { role: 'bot', text: data.reply };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }
            
            if (!data.reply) throw new Error('Received an empty response from the server.');
            
            const botMessage: Message = { role: 'bot', text: data.reply };
            setMessages(prev => [...prev, botMessage]);
            audioRef.current?.play().catch(e => console.log("Audio play failed:", e));

        } catch (err: any) {
            const errorMessage: Message = { role: 'bot', text: `Sorry, an error occurred: ${err.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };
    
    const isPremium = config.plan !== 'Free';

    return (
        <div 
            className="flex flex-col h-dvh w-full bg-slate-50 min-h-0"
            style={{
                // @ts-ignore
                '--theme-primary': `hsl(var(--theme-primary-h), var(--theme-primary-s), var(--theme-primary-l))`,
                '--theme-primary-foreground': `hsl(var(--theme-primary-h), var(--theme-primary-s), ${'calc(var(--theme-primary-l) + 40%)'})`,
                '--theme-primary-light': `hsl(var(--theme-primary-h), var(--theme-primary-s), 95%)`,
            }}
        >
            <header className="flex items-center shrink-0 gap-4 p-4 bg-[--theme-primary] text-white shadow-md z-10">
                <Avatar className="h-10 w-10 border-2 border-white/50">
                    <div className="flex h-full w-full items-center justify-center bg-white/20">
                        <Bot className="h-6 w-6"/>
                    </div>
                </Avatar>
                <div className="flex-1">
                    <h1 className="text-lg font-bold flex items-center gap-1.5">
                        {config.name}
                        {isPremium && (
                            <div className="grid place-items-center w-4 h-4 bg-white/20 text-white rounded-full" title={`${config.plan} Plan`}>
                                <Star className="w-2.5 h-2.5" fill="currentColor"/>
                            </div>
                        )}
                    </h1>
                    <div className="flex items-center gap-1.5">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} 
                            className="h-2 w-2 rounded-full bg-green-300"
                        />
                        <p className="text-xs text-white/80">Online</p>
                    </div>
                </div>
            </header>
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto min-h-0">
                {!isLoaded && messages.length === 0 ? (
                     <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className={cn('flex items-end gap-2 my-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                            >
                                {msg.role === 'bot' && (
                                    <Avatar className="h-8 w-8 bg-[--theme-primary] text-white">
                                        <div className="flex h-full w-full items-center justify-center">
                                        <Bot className="h-5 w-5"/>
                                        </div>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                                    msg.role === 'user' ? 'bg-white text-slate-800 rounded-br-none' : 'bg-[--theme-primary] text-white rounded-bl-none'
                                )}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.role === 'user' && (
                                    <Avatar className="h-8 w-8 bg-slate-200 text-slate-600">
                                    <div className="flex h-full w-full items-center justify-center">
                                        <User className="h-5 w-5"/>
                                        </div>
                                    </Avatar>
                                )}
                            </motion.div>
                        ))}
                        {isSending && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-end gap-2 my-3 justify-start"
                            >
                                <Avatar className="h-8 w-8 bg-[--theme-primary] text-white">
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Bot className="h-5 w-5"/>
                                    </div>
                                </Avatar>
                                <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm bg-[--theme-primary] text-white rounded-bl-none">
                                    <motion.div
                                        className="flex gap-1"
                                        initial="hidden"
                                        animate="visible"
                                        variants={{
                                            hidden: { },
                                            visible: { transition: { staggerChildren: 0.2 } },
                                        }}
                                    >
                                        <motion.span variants={{ visible: { y: [0, -3, 0] }, hidden: { y: 0 }}} transition={{ repeat: Infinity, duration: 1}} className="w-1.5 h-1.5 rounded-full bg-white/70" />
                                        <motion.span variants={{ visible: { y: [0, -3, 0] }, hidden: { y: 0 }}} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-white/70" />
                                        <motion.span variants={{ visible: { y: [0, -3, 0] }, hidden: { y: 0 }}} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-white/70" />
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
            <div className="bg-white p-2 shrink-0 border-t">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="w-full rounded-full border bg-slate-100 py-3 pl-4 pr-12 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-[--theme-primary]"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isSending}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isSending || !inputValue}
                        className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-[--theme-primary] text-white shadow-md transition-all hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <footer className="text-center text-xs text-slate-400 p-2 bg-slate-50 border-t shrink-0">
                Powered by{' '}
                <a href="https://chatforge.thechohan.space/" target="_blank" rel="noopener noreferrer" className="text-[--theme-primary] hover:underline">
                ChatForge AI
                </a>
            </footer>
        </div>
    );
}
