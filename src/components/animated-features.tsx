
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Code, Rocket, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


const features = [
  {
    icon: Key,
    title: "Instant API Key",
    description: "Sign up and immediately receive your unique API key to get started. No waiting, no lengthy approval process."
  },
  {
    icon: Code,
    title: "Customized Guides",
    description: "Our AI analyzes your website content to generate a personalized integration snippet for HTML, React, & Next.js."
  },
  {
    icon: Rocket,
    title: "Simple and Scalable",
    description: "A simple API endpoint and clear documentation ensure that you can get your chatbot up and running quickly."
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

export default function AnimatedFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} id="features" className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden z-30">
        {/* Animated notes from the side */}
        <motion.div 
            className="absolute top-1/4 -left-12 w-32 h-24 bg-accent/30 rounded-lg shadow-lg -rotate-12"
            animate={isInView ? { x: 0, opacity: 1, rotate: -15 } : { x: -200, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        />
        <motion.div 
            className="absolute top-1/2 -right-16 w-40 h-28 bg-primary/20 rounded-lg shadow-xl rotate-12"
            animate={isInView ? { x: 0, opacity: 1, rotate: 15 } : { x: 200, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        />
         <motion.div 
            className="absolute bottom-1/4 -left-8 w-24 h-20 bg-secondary rounded-lg shadow-md rotate-6"
            animate={isInView ? { x: 0, opacity: 1, rotate: 10 } : { x: -200, opacity: 0, rotate: -20 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
        />
        <motion.div 
            className="absolute bottom-1/3 -right-10 w-28 h-24 bg-accent/20 rounded-lg shadow-lg -rotate-6"
            animate={isInView ? { x: 0, opacity: 1, rotate: -8 } : { x: 200, opacity: 0, rotate: 25 }}
            transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
        />
        <motion.div 
            className="absolute top-1/3 -left-10 w-20 h-20 bg-primary/10 rounded-full shadow-lg rotate-12"
            animate={isInView ? { x: 0, opacity: 1, rotate: 12 } : { x: -200, opacity: 0, rotate: -15 }}
            transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
        />


        <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
            >
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        Key Features
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="cursor-pointer">
                                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>What are the flying notes?</DialogTitle>
                                <DialogDescription>
                                    The animated notes that fly in from the sides represent the power of AI to generate ideas, content, and solutions. They symbolize the creativity and efficiency that ChatForge AI brings to your website.
                                </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Effortless Integration, Powerful Results</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From instant API key generation to customized integration guides, we make adding a chatbot to your site a breeze.
                </p>
            </motion.div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 pt-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
            {features.map((feature, i) => (
                <motion.div
                    key={feature.title}
                    custom={i}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    variants={cardVariants}
                >
                    <Card className="h-full relative overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-primary/20">
                    <div className="absolute -top-1 -right-1 h-16 w-16 bg-primary/10 blur-3xl"></div>
                    <CardHeader className="flex flex-col items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/20">
                            <feature.icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                        {feature.description}
                    </CardContent>
                    </Card>
                </motion.div>
            ))}
            </div>
        </div>
    </section>
  );
}
