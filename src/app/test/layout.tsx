
// src/app/test/layout.tsx
import { ReactNode } from 'react';

// This layout ensures the test page is blank and doesn't have the main site's header/footer.
export default function TestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full bg-background">
      {children}
    </div>
  );
}
