'use client';
import Link from 'next/link';
import { Instagram, Send, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { subscribeToNewsletter } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';

const newsletterSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function Footer() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });

  const socialLinks = [
    { icon: Instagram, href: 'https://www.instagram.com/chohanspace', 'aria-label': 'Instagram' },
  ];

  const footerLinks = {
    'Our Projects': [
        { text: 'Company Website', href: 'https://thechohan.space' },
        { text: 'ChatForge AI', href: '/' },
    ],
    'Company': [
        { text: 'About', href: '/about' },
        { text: 'Pricing', href: '/pricing' },
        { text: 'Contact', href: '/contact' },
    ],
    'Legal': [
        { text: 'Terms & conditions', href: '/terms' },
        { text: 'Privacy Policy', href: '/privacy' },
    ]
  };

  const handleSubscribe = async (values: z.infer<typeof newsletterSchema>) => {
    setIsLoading(true);
    form.clearErrors();
    const result = await subscribeToNewsletter(values.email);
    if (result.success) {
      toast({
        title: 'Subscribed!',
        description: "Thanks for joining our newsletter. Look out for updates from us.",
        variant: 'success'
      });
      form.reset();
    } else {
      form.setError('email', { type: 'custom', message: result.error || 'An unexpected error occurred.'});
    }
    setIsLoading(false);
  };


  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="bg-gray-800 rounded-lg p-8 mb-12 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Stay Ahead of the Curve</h3>
                    <p className="text-gray-400">Subscribe to our newsletter for the latest on AI, product updates, and exclusive offers.</p>
                </div>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubscribe)} className="space-y-2">
                        <div className="flex w-full">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                    <FormControl>
                                        <Input 
                                            {...field}
                                            type="email"
                                            placeholder="your@email.com" 
                                            className="bg-gray-900 border-gray-700 rounded-r-none h-12 text-white flex-1 focus:ring-primary focus:border-primary"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" size="lg" className="rounded-l-none h-12" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                                <span className="sr-only sm:not-sr-only sm:ml-2">{isLoading ? 'Subscribing...' : 'Subscribe'}</span>
                            </Button>
                        </div>
                        <FormMessage className="text-red-400 text-xs">
                            {form.formState.errors.email?.message}
                        </FormMessage>
                    </form>
                 </Form>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4">
             <Link href="/" className="mr-6 flex items-center space-x-2">
                <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                >
                <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C19.88 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 14H16C16.55 11.08 13.37 8 10 8C8.48 10.24 8 12 8 14Z"
                    fill="url(#footer_paint0_linear)"
                ></path>
                <defs>
                    <linearGradient
                    id="footer_paint0_linear"
                    x1="2"
                    y1="2"
                    x2="22"
                    y2="22"
                    gradientUnits="userSpaceOnUse"
                    >
                    <stop stopColor="hsl(var(--primary))"></stop>
                    <stop
                        offset="1"
                        stopColor="hsl(var(--primary))"
                        stopOpacity="0.7"
                    ></stop>
                    </linearGradient>
                </defs>
                </svg>
                <span className="font-bold text-xl text-white">
                ChatForge AI
                </span>
            </Link>
            <p className="mt-4 max-w-xs">
              Empower your website with intelligent, customizable AI chatbots.
            </p>
             <div className="flex space-x-4 mt-6">
                {socialLinks.map(link => (
                    <Link key={link['aria-label']} href={link.href} aria-label={link['aria-label']} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                        <link.icon className="h-6 w-6" />
                    </Link>
                ))}
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-white font-semibold mb-4">{title}</h3>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link.text}>
                      <Link href={link.href} className="hover:text-white transition-colors" target={link.href.startsWith('http') ? '_blank' : '_self'}>
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p>
            © {new Date().getFullYear()} ChatForge AI by{' '}
            <a 
              href="https://thechohan.space" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-semibold text-primary hover:underline"
            >
              Chohan Space
            </a>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
