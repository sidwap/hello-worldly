import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Keyboard, Target, Zap, Award } from 'lucide-react';
import heroImage from '@/assets/hero-typing.jpg';

interface HeroSectionProps {
  onExploreExams: () => void;
  isLoggedIn: boolean;
}

const HeroSection = ({ onExploreExams, isLoggedIn }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Keyboard className="h-4 w-4" />
              <span>India's #1 Government Exam Typing Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Master Your
              <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Typing Skills
              </span>
              with Precision
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              Prepare for government exams like UP Police, SSC CGL, RRB NTPC with our 
              exam-specific typing practice platform. Real exam interfaces, accurate 
              speed calculations, and detailed performance analysis.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 py-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Exams Covered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Practice Passages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">1L+</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={onExploreExams}
                className="group"
              >
                Explore All Exams
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>
          </div>
          
          {/* Right side - Hero image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt="Typing practice illustration" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-card border shadow-lg rounded-xl p-4 animate-bounce">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-bold">35+ WPM</div>
                    <div className="text-xs text-muted-foreground">Avg Speed</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-card border shadow-lg rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-bold">95%+</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-6 bg-card border shadow-lg rounded-xl p-4 hidden lg:block">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-bold">Certified</div>
                    <div className="text-xs text-muted-foreground">Results</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl transform rotate-3 scale-105 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
