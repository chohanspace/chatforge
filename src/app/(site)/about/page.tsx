import { Building, Users, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            About ChatForge AI
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
            We're on a mission to make powerful AI accessible to everyone.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground mx-auto">
                <Building className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg leading-6 font-medium text-foreground">Our Company</h3>
                <p className="mt-2 text-base text-muted-foreground">
                  ChatForge AI was founded with the simple idea of simplifying chatbot integration. We believe in the power of conversational AI to transform user engagement.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground mx-auto">
                <Target className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg leading-6 font-medium text-foreground">Our Mission</h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Our mission is to provide developers and businesses with the simplest, most intuitive platform for creating and deploying custom AI chatbots.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg leading-6 font-medium text-foreground">Our Team</h3>
                <p className="mt-2 text-base text-muted-foreground">
                  We are a passionate team of engineers, designers, and AI enthusiasts dedicated to building the future of communication technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
