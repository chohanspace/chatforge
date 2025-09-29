
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, LogOut, User as UserIcon, Download, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').filter(e => e);


export default function Header() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim() !== '') {
        const nameParts = name.split(' ').filter(n => n);
        if (nameParts.length > 1) {
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C13.84 22 15.58 21.53 17.07 20.75L12 15.68V14.26L19.36 21.62C20.5 20.3 21.36 18.73 21.82 17H19.74L12 9.26V7.84L21.62 17.46C21.86 16.35 22 15.19 22 14C22 7.37 17.52 2.89 12 2Z"
                className="fill-primary"
              />
              <path
                d="M17.13 4.87C15.74 3.49 13.91 2.5 12 2.5C9.4 2.5 7.07 3.58 5.45 5.45C3.58 7.07 2.5 9.4 2.5 12C2.5 13.91 3.49 15.74 4.87 17.13L17.13 4.87Z"
                className="fill-primary/50"
              />
            </svg>
            <span className="font-bold sm:inline-block">
              ChatForge AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/about" className="text-muted-foreground/70 transition-colors hover:text-muted-foreground">About</Link>
            <Link href="/pricing" className="text-muted-foreground/70 transition-colors hover:text-muted-foreground">Pricing</Link>
            {user && (
                 <Link href="/install" className="text-primary transition-colors hover:text-primary/80 font-semibold">Install Now</Link>
            )}
            <Link href="/contact" className="text-muted-foreground/70 transition-colors hover:text-muted-foreground">Contact</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || ''} alt={user.name || user.email} />
                    <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4"/>Dashboard</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/install"><Download className="mr-2 h-4 w-4"/>Installation</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
