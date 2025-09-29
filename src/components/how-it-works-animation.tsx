// src/components/how-it-works-animation.tsx
'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clipboard, Code, Key, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    title: "1. Sign Up & Get Key",
    description: "Create your account to instantly receive your unique API key on the dashboard.",
    stage: 'key'
  },
  {
    title: "2. Generate & Copy Script",
    description: "Use the 'Install' page to customize your chatbot and get the code snippet.",
    stage: 'code'
  },
  {
    title: "3. Go Live!",
    description: "Add the script to your site and start engaging your visitors instantly.",
    stage: 'live'
  },
];

const STAGE_DURATION = 3000; // 3 seconds per stage

export default function HowItWorksAnimation() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prevStage) => (prevStage + 1) % steps.length);
    }, STAGE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const currentStep = steps[stage];

  return (
    <section id="how-it-works" className="w-full bg-secondary/20 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm font-medium">How It Works</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get Up and Running in 3 Easy Steps</h2>
            </div>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    {steps.map((step, index) => (
                         <div key={step.stage} className={cn("flex items-start gap-4 transition-opacity duration-300", stage === index ? 'opacity-100' : 'opacity-40')}>
                             <div className={cn(
                                "flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 ring-2 ring-primary/20 shrink-0 transition-all duration-300",
                                stage === index && "scale-110 ring-4 bg-primary text-primary-foreground"
                             )}>
                                <span className="font-bold text-lg">{index + 1}</span>
                             </div>
                             <div>
                                <h3 className="text-xl font-bold">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                             </div>
                         </div>
                    ))}
                </div>
                <div className="relative h-80 w-full max-w-md mx-auto bg-card p-4 rounded-xl shadow-2xl ring-1 ring-border/20 overflow-hidden">
                    <AnimatePresence mode="wait">
                       {currentStep.stage === 'key' && <KeyStage key="key" />}
                       {currentStep.stage === 'code' && <CodeStage key="code" />}
                       {currentStep.stage === 'live' && <LiveStage key="live" />}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    </section>
  )
}

const StageWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="absolute inset-0 p-6 flex flex-col items-center justify-center"
    >
        {children}
    </motion.div>
);

function KeyStage() {
    return (
        <StageWrapper>
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full ring-4 ring-primary/20">
                    <Key className="h-12 w-12 text-primary" />
                </div>
                <h4 className="text-lg font-bold">Your API Key</h4>
                <div className="font-mono text-sm bg-muted text-muted-foreground px-4 py-2 rounded-md">
                    cfai_********************<span className="animate-pulse">...</span>
                </div>
            </div>
        </StageWrapper>
    )
}

function CodeStage() {
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setCopied(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <StageWrapper>
            <div className="w-full bg-secondary/30 rounded-lg p-4 font-mono text-xs text-left relative">
                <button className="absolute top-2 right-2 p-1.5 rounded-md bg-background hover:bg-muted">
                     {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                </button>
                <p><span className="text-purple-400">{'<'}script</span> <span className="text-green-400">src</span>=<span className="text-yellow-400">"..."</span></p>
                <p className="pl-2"><span className="text-green-400">data-api-key</span>="<motion.span className={cn(copied ? 'text-green-300' : 'text-yellow-400')} animate={{opacity: [0.5, 1, 0.5]}} transition={{duration: 1, repeat: Infinity}}>cfai_... </motion.span>"</p>
                <p><span className="text-purple-400">{'/>'}</span></p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Copy the script to your website</p>
        </StageWrapper>
    )
}

function LiveStage() {
    return (
        <StageWrapper>
            <div className="w-full h-full border-2 border-dashed rounded-lg bg-background flex items-center justify-center relative">
                <p className="text-sm text-muted-foreground">Your Website</p>
                
                <motion.div 
                    className="absolute bottom-4 right-4"
                    initial={{scale: 0, y: 20}}
                    animate={{scale: 1, y: 0}}
                    transition={{duration: 0.5, delay: 0.5, type: 'spring', stiffness: 200}}
                >
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Bot className="w-8 h-8 text-primary-foreground" />
                    </div>
                </motion.div>
            </div>
        </StageWrapper>
    )
}
