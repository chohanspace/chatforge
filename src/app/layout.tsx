
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const logoDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMkMyIDE3LjUyIDYuNDggMjIgMTIgMjJDMTkuODggNC45MSAxMiAyWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzEzOF8xOCkiLz4KICA8cGF0aCBvcGFjaXR5PSIwLjciIGQ9Ik04IDE0SDE2QzE2LjU1IDExLjA4IDEzLjM3IDggMTAgOEM4LjQ4IDEwLjI0IDggMTIgOCAxNFoiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl8xMzhfMTgpIi8+CiAgPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxMy44NCAyMiAxNS41OCAyMS41MyAxNy4wNyAyMC43NUwxMiAxNS42OFYxNC4yNkwxOS4zNiAyMS42MkMyMC41IDIwLjMgMjEuMzYgMTguNzMgMjEuODIgMTdIMTkuNzRMMTIgOS4yNlY3Ljg0TDIxLjYyIDE3LjQ2QzIxLjg2IDE2LjM1IDIyIDE1LjE5IDIyIDE0QzIyIDcuMzcgMTcuNTIgMi44OSAxMiAyWiIgZmlsbD0idXJsKCNwYWludDJfbGluZWFyXzEzOF8xOCkiLz4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8xMzhfMTgiIHgxPSIyIiB5MT0iMiIgeDI9IjIyIiB5Mj0iMjIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzYwQTlGQiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0QzdDRkYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfMTM4XzE4IiB4MT0iOCIgeTE9IjgiIHgyPSIxNiIgeTI9IjE0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IndoaXRlIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiIHN0b3Atb3BhY2l0eT0iMC43Ij48L3N0b3A+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDJfbGluZWFyXzEzOF8xOCIgeDE9IjIiIHkxPSIyIiB4Mj0iMjIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN dedim="" stop-color="#1B99E9"/>
                    <stop offset="1" stop-color="#17CAFF"/>
                </linearGradient>
            </defs>
            </svg>
            `;

            const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');

            export const metadata: Metadata = {
            metadataBase: appUrl,
            title: 'ChatForge AI',
            description: 'Integrate a powerful chatbot into your website with a single API key.',
            icons: {
                icon: logoDataUri,
            },
            openGraph: {
                title: 'ChatForge AI',
                description: 'Build and Deploy Your Own Chatbot in Minutes',
                images: [
                {
                    url: logoDataUri,
                    width: 200,
                    height: 200,
                    alt: 'ChatForge AI Logo',
                },
                ],
                siteName: 'ChatForge AI',
                type: 'website',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary',
                title: 'ChatForge AI',
                description: 'Build and Deploy Your Own Chatbot in Minutes',
                images: [logoDataUri],
            },
            };

            export default function RootLayout({
            children,
            }: Readonly<{
            children: React.ReactNode;
            }>) {
            return (
                <html lang="en" suppressHydrationWarning>
                <head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                    <link rel="icon" href={logoDataUri} type="image/svg+xml" sizes="any" />
                </head>
                <body className={cn('font-body antialiased')}>
                    <AuthProvider>
                    {children}
                    <Toaster />
                    </AuthProvider>
                </body>
                </html>
            );
            }
