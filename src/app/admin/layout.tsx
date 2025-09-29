
// src/app/admin/layout.tsx
'use client';

import {
  Home,
  MailQuestion,
  Newspaper,
  PanelLeft,
  Shield,
  Users,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ReactNode, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { checkAdminAuthStatus, verifyAdminAccess } from '../actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


function AdminAccessGate({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const { toast } = useToast();

    // Rate limiting state
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

    useEffect(() => {
        const checkAuth = async () => {
            const { isAuthenticated: authStatus } = await checkAdminAuthStatus();
            if (authStatus) {
                setIsAuthenticated(true);
            }
            setIsVerifying(false);
        };
        checkAuth();

        // Load rate limit state from localStorage
        const storedAttempts = localStorage.getItem('admin_attempts');
        const storedLockout = localStorage.getItem('admin_lockout');
        if (storedAttempts) setFailedAttempts(Number(storedAttempts));
        if (storedLockout) {
            const lockoutEnd = Number(storedLockout);
            if (lockoutEnd > Date.now()) {
                setLockoutTime(lockoutEnd);
            } else {
                localStorage.removeItem('admin_lockout');
                localStorage.removeItem('admin_attempts');
            }
        }
    }, []);
    
    // Timer to update lockout display
    useEffect(() => {
        if (lockoutTime) {
            const interval = setInterval(() => {
                if (Date.now() > lockoutTime) {
                    setLockoutTime(null);
                    setFailedAttempts(0);
                    localStorage.removeItem('admin_lockout');
                    localStorage.removeItem('admin_attempts');
                } else {
                    // Force re-render to update timer
                    setLockoutTime(lockoutTime => lockoutTime);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lockoutTime]);

    const handleVerifyKey = async () => {
        if (lockoutTime && Date.now() < lockoutTime) {
             toast({ title: 'Access Locked', description: `Too many failed attempts. Please try again in ${Math.ceil((lockoutTime - Date.now()) / 60000)} minutes.`, variant: 'destructive' });
             return;
        }

        setIsLoading(true);
        const result = await verifyAdminAccess({ key: inputValue });
        if (result.success) {
            setIsAuthenticated(true);
            setFailedAttempts(0);
            localStorage.removeItem('admin_attempts');
            localStorage.removeItem('admin_lockout');
            toast({ title: 'Access Granted', description: 'Welcome, Admin!', variant: 'success' });
        } else {
            const newAttemptCount = failedAttempts + 1;
            setFailedAttempts(newAttemptCount);
            localStorage.setItem('admin_attempts', String(newAttemptCount));

            if (newAttemptCount >= MAX_ATTEMPTS) {
                const newLockoutTime = Date.now() + LOCKOUT_DURATION;
                setLockoutTime(newLockoutTime);
                localStorage.setItem('admin_lockout', String(newLockoutTime));
                toast({ title: 'Access Locked', description: `Too many failed attempts. Please try again in 5 minutes.`, variant: 'destructive' });
            } else {
                toast({ title: 'Invalid Access Key', description: `${result.error || 'The key you entered is incorrect.'} You have ${MAX_ATTEMPTS - newAttemptCount} attempts remaining.`, variant: 'destructive' });
            }
        }
        setIsLoading(false);
    };

    const isLockedOut = useMemo(() => {
        return lockoutTime ? Date.now() < lockoutTime : false;
    }, [lockoutTime]);

    const lockoutMessage = useMemo(() => {
        if (!isLockedOut || !lockoutTime) return null;
        const minutes = Math.floor((lockoutTime - Date.now()) / 60000);
        const seconds = Math.floor(((lockoutTime - Date.now()) % 60000) / 1000);
        return `Try again in ${minutes}m ${seconds}s`;
    }, [isLockedOut, lockoutTime]);


    if (isVerifying) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <Dialog open={true}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Admin Verification Required</DialogTitle>
                        <DialogDescription>
                            {isLockedOut
                                ? `Too many failed attempts. Access is temporarily locked.`
                                : `Please enter the administrator access key to proceed.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder='Enter Access Key'
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerifyKey()}
                            disabled={isLoading || isLockedOut}
                        />
                         {isLockedOut && <p className="text-sm text-destructive text-center pt-2">{lockoutMessage}</p>}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleVerifyKey} disabled={isLoading || isLockedOut}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return <>{children}</>;
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/admin/submissions', label: 'Submissions', icon: MailQuestion },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/direct-mail', label: 'Direct Mail', icon: Mail },
    { href: '/admin/newsletter', label: 'Newsletter', icon: Newspaper },
  ];

  return (
    <AdminAccessGate>
        <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
            <h2 className="flex items-center gap-2 text-lg font-semibold group-data-[collapsible=icon]:hidden">
                <Shield /> Admin Panel
            </h2>
            <div className="w-full border-t border-sidebar-border mt-2 group-data-[collapsible=icon]:hidden"></div>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                    <Link href={item.href}>
                    <SidebarMenuButton isActive={pathname.startsWith(item.href)}>
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                ))}
            </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <span className="text-xs text-sidebar-foreground/70">
                Powered by ChatForge
                </span>
            </div>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger size="icon" variant="outline">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </SidebarTrigger>
            </header>
            <main className="p-4 sm:px-6 sm:py-0">{children}</main>
        </SidebarInset>
        </SidebarProvider>
    </AdminAccessGate>
  );
}
