'use client';

import { Key, Palette, Code, CheckCircle, Bot, Send, Check, User, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { getLiveDemoResponse } from '@/app/actions';


const initialMessages = [
    { id: 1, type: 'bot', icon: Key, text: "Welcome to ChatForge! First, you'll need an API Key." },
    { id: 2, type: 'user', text: 'Okay, how do I get one?' },
    { id: 3, type: 'bot', icon: CheckCircle, text: 'Just sign up! Your key is generated instantly on your dashboard.' },
    { id: 4, type: 'bot', icon: Palette, text: 'Next, customize your chatbot. Pick a color, name, and welcome message.' },
    { id: 5, type: 'user', text: 'Can I match it to my brand?' },
    { id: 6, type: 'bot', icon: Bot, text: 'Absolutely! You have full control over the look and feel.' },
    { id: 7, type: 'bot', icon: Code, text: 'Finally, our AI generates the code snippet for you to paste into your site.' },
    { id: 8, type: 'user', text: "It's easy!"},
    { id: 9, type: 'bot', icon: Bot, text: <>Yes it is! <Link href="/signup" className="text-primary font-bold hover:underline">Click here</Link> to get started or ask me a question below.</> }
];

type Message = {
    id: number | string;
    type: 'user' | 'bot';
    role?: 'user' | 'model'; // for AI history
    icon?: React.FC<any>;
    text: React.ReactNode;
}

type HistoryItem = {
    role: 'user' | 'model';
    text: string;
}

export default function ChatbotAnimation() {
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [typedText, setTypedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);
    const [isLive, setIsLive] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [liveInput, setLiveInput] = useState('');
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

    const restartAnimation = useCallback(() => {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        setVisibleMessages([]);
        setTypedText('');
        setIsTyping(false);
        setIsLive(false);
        setIsSending(false);
        setLiveInput('');
        setCurrentMessageIndex(0);
        setIsAnimating(true);
    }, []);

    // Main animation controller
    useEffect(() => {
        if (!isAnimating) return;

        const currentMessage = initialMessages[currentMessageIndex];
        if (!currentMessage) {
            // Animation finished
            setIsAnimating(false);
            setIsLive(true); // Enable live chat
            return;
        }

        const timeout = setTimeout(() => {
            if (currentMessage.type === 'user') {
                setIsTyping(true);
            } else { // It's a bot message
                setVisibleMessages(prev => [...prev, { ...currentMessage, role: 'model' }]);
                setCurrentMessageIndex(prev => prev + 1);
            }
        }, currentMessage.type === 'bot' ? (currentMessageIndex === 0 ? 500 : 1800) : 1200);

        return () => clearTimeout(timeout);
    }, [currentMessageIndex, isAnimating]);
    
    // Typewriter effect logic
    useEffect(() => {
        if (!isTyping) return;

        const currentMessage = initialMessages[currentMessageIndex];
        const messageText = typeof currentMessage.text === 'string' ? currentMessage.text : '';

        if (typedText.length < messageText.length) {
            const timeout = setTimeout(() => {
                setTypedText(messageText.slice(0, typedText.length + 1));
            }, 60);
            return () => clearTimeout(timeout);
        } else {
            // Typing finished, simulate send
            setIsTyping(false);
            setTimeout(() => {
                setTypedText(''); // Clear input
                setVisibleMessages(prev => [...prev, { ...currentMessage, role: 'user' }]);
                setCurrentMessageIndex(prev => prev + 1); // Move to next message
            }, 500);
        }
    }, [isTyping, typedText, currentMessageIndex]);


    useEffect(() => {
        if (messagesContainerRef.current) {
            setTimeout(() => {
                 if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                 }
            }, 100);
        }
    }, [visibleMessages, isSending]);

    const handleLiveSend = async () => {
        if (!liveInput.trim() || !isLive || isSending) return;

        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        setIsSending(true);
        const userMessageText = liveInput.trim();
        const userMessage: Message = { id: `live_user_${Date.now()}`, type: 'user', role: 'user', text: userMessageText };
        
        const updatedMessages = [...visibleMessages, userMessage];
        setVisibleMessages(updatedMessages);
        setLiveInput('');
    
        // Correctly format history for AI
        const historyForApi: HistoryItem[] = updatedMessages
            .filter(m => typeof m.text === 'string' && m.role) // IMPORTANT: Filter out non-string/role-less messages
            .map(m => ({
                role: m.role as 'user' | 'model',
                text: m.text as string
            }));
        
        const { reply, error } = await getLiveDemoResponse(userMessageText, historyForApi);

        const botResponse: Message = {
            id: `live_bot_${Date.now()}`,
            type: 'bot',
            role: 'model',
            icon: Bot,
            text: error || reply || "Sorry, I couldn't get a response."
        }
        setVisibleMessages(prev => [...prev, botResponse]);

        setIsSending(false);
        setIsLive(false); // Disable after one question
    }

     // Auto-restart logic
     useEffect(() => {
        // Condition: animation is done, live mode is over, and not currently sending.
        if (!isAnimating && !isLive && !isSending && visibleMessages.length > initialMessages.length) {
            restartTimerRef.current = setTimeout(() => {
                restartAnimation();
            }, 20000); // 20 seconds
        }

        return () => {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        };
    }, [isAnimating, isLive, isSending, restartAnimation, visibleMessages.length]);

    return (
        <div className="w-full max-w-md mx-auto rounded-xl shadow-2xl ring-1 ring-border/20 bg-card p-4 h-[450px] flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4 p-2 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">ChatForge Demo</h3>
                        <p className="text-xs text-muted-foreground">Live demo powered by Genkit</p>
                    </div>
                </div>
                <button onClick={restartAnimation} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Restart animation">
                    <RefreshCw className="w-4 h-4"/>
                </button>
            </div>
            <div ref={messagesContainerRef} className="flex-grow space-y-4 overflow-y-auto p-2">
                <AnimatePresence initial={false}>
                    {visibleMessages.map((msg) => (
                        <motion.div
                            layout
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className={cn(
                                'flex items-end gap-2 max-w-[85%]',
                                msg.type === 'user' ? 'flex-row-reverse ml-auto' : 'flex-row'
                            )}
                        >
                            {msg.type === 'bot' && msg.icon ? (
                                <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                                    <msg.icon className="w-4 h-4 text-muted-foreground" />
                                </div>
                             ) : msg.type === 'bot' ? (
                                 <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    'p-3 rounded-lg shadow-sm',
                                    msg.type === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-muted text-muted-foreground rounded-bl-none'
                                )}
                            >
                                <div className="text-sm">{msg.text}</div>
                            </div>
                        </motion.div>
                    ))}
                    {isSending && (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-end gap-2 my-3 justify-start"
                        >
                            <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="p-3 rounded-lg shadow-sm bg-muted text-muted-foreground rounded-bl-none">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="mt-auto pt-4">
                 <div className="relative">
                    <input
                        placeholder={isLive ? 'Ask one question...' : 'Type a message...'}
                        value={isAnimating ? typedText : liveInput}
                        onChange={(e) => setLiveInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLiveSend()}
                        disabled={!isLive || isSending}
                        className={cn(
                            "transition-all h-10 w-full rounded-full bg-muted/80 flex items-center px-4 pr-12 text-sm",
                             isLive ? "text-foreground placeholder:text-muted-foreground/60" : "text-muted-foreground/60",
                             (!isLive || isSending) && "cursor-not-allowed"
                        )}
                    />
                    {isAnimating && isTyping && (
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground flex items-center pointer-events-none">
                            <span>{typedText}</span>
                            <span className="animate-pulse">|</span>
                        </div>
                    )}

                    <button
                        onClick={handleLiveSend}
                        disabled={!isLive || isSending || !liveInput}
                        className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-md transition-all",
                        (!isLive || !liveInput) && "bg-gray-300",
                        isSending && "cursor-wait"
                    )}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
