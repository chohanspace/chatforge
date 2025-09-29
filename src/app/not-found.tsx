import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
      <div className="p-8 max-w-lg w-full">
        <SearchX className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          404 - Page Not Found
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Oops! The page you're looking for doesn't seem to exist.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/">Go back to Homepage</Link>
          </Button>
        </div>
        <div className="mt-10 pt-6 border-t border-border w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">Here are some useful links:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm font-medium">
                <Link href="/about" className="text-primary hover:underline">About Us</Link>
                <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>
                <Link href="/contact" className="text-primary hover:underline">Contact</Link>
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                <Link href="/login" className="text-primary hover:underline">Log In</Link>
            </div>
        </div>
      </div>
    </div>
  )
}
