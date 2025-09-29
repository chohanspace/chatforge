import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Check, Star } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    frequency: '/month',
    description: 'For individuals and small projects to get started.',
    features: [
      '1 Chatbot',
      '1,000 Messages/Month',
      'Basic Customization',
      'Community Support',
    ],
    cta: 'Get Started',
    href: '/dashboard',
    featured: false,
  },
  {
    name: 'Pro Plan',
    price: '$15.99',
    frequency: '/month',
    description: 'For growing businesses that need more power and support.',
    features: [
      '10 Chatbots',
      '50,000 Messages/Month',
      'Advanced Customization',
      'Email & Chat Support',
      'Analytics Dashboard'
    ],
    cta: 'Get Started with Pro',
    href: '/contact',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    frequency: '',
    description: 'For large-scale applications with specific needs.',
    features: [
      'Unlimited Chatbots',
      'Custom Message Quotas',
      'Dedicated Infrastructure',
      '24/7 Priority Support',
      'Custom Integrations',
    ],
    cta: 'Contact Us',
    href: '/contact',
    featured: false,
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <div className="bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Flexible pricing for teams of all sizes
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
            Choose a plan that works for you. Start for free, and scale up as you grow.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col ${tier.featured ? 'border-2 border-primary shadow-2xl' : 'shadow-lg'} ${tier.highlight ? 'relative overflow-hidden' : ''}`}>
               {tier.highlight && (
                <div className="absolute top-0 right-0 p-2 bg-accent rounded-bl-lg">
                    <Star className="w-5 h-5 text-accent-foreground" />
                </div>
               )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div className="text-center mb-6">
                  <span className="text-5xl font-extrabold text-foreground">{tier.price}</span>
                  {tier.frequency && <span className="text-lg font-medium text-muted-foreground">{tier.frequency}</span>}
                </div>
                <ul className="space-y-4 text-muted-foreground">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-6 w-6 text-green-500 mr-2 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 <Button asChild className="w-full" variant={tier.featured ? 'default' : 'outline'}>
                   <Link href={tier.href}>{tier.cta}</Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
