// This layout ensures the chatbot page takes up the full height of the iframe.
import { ReactNode } from 'react';

export default function BotLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full bg-background">
      {children}
    </div>
  );
}