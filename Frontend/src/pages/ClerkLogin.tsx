import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import Navigation from '@/components/Navigation';
import AmbientBackground from '@/components/AmbientBackground';

const ClerkLogin: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <AmbientBackground />
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome Back! 👋
              </h1>
              <p className="text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>
            
            {/* Clerk SignIn Component */}
            <div className="neu-card p-8">
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "neu-card border-0 shadow-none bg-transparent",
                    headerTitle: "text-2xl font-bold text-foreground",
                    headerSubtitle: "text-muted-foreground",
                    socialButtonsBlockButton: "neu-button hover:neu-inset",
                    formButtonPrimary: "neu-button bg-primary text-primary-foreground hover:neu-inset",
                    formFieldInput: "neu-inset bg-background text-foreground border-0",
                    formFieldLabel: "text-foreground font-medium",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground",
                    footerActionLink: "text-primary hover:text-primary/80",
                    identityPreviewText: "text-foreground",
                    formResendCodeLink: "text-primary hover:text-primary/80",
                  },
                  layout: {
                    showOptionalFields: true,
                  },
                }}
                redirectUrl="/dashboard"
                signUpUrl="/signup"
              />
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <a href="/signup" className="text-primary hover:text-primary/80 font-medium">
                  Sign up here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkLogin;
