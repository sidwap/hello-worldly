import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Keyboard, 
  Target, 
  Clock, 
  BarChart3, 
  Shield, 
  Smartphone,
  Zap,
  FileText
} from 'lucide-react';

const features = [
  {
    icon: Keyboard,
    title: 'Exam-Specific Interface',
    description: 'Practice with interfaces that mirror actual government exam typing tests.',
    color: 'text-blue-500'
  },
  {
    icon: Target,
    title: 'Accurate Calculations',
    description: 'Precise speed and accuracy calculations following official exam guidelines.',
    color: 'text-green-500'
  },
  {
    icon: Clock,
    title: 'Timed Practice',
    description: 'Real-time countdown timers with exact duration matching exam standards.',
    color: 'text-orange-500'
  },
  {
    icon: BarChart3,
    title: 'Detailed Analytics',
    description: 'Track your progress with comprehensive performance metrics and history.',
    color: 'text-purple-500'
  },
  {
    icon: Zap,
    title: 'Keystroke Analysis',
    description: 'Gross and net speed calculations using official 5-keystroke formula.',
    color: 'text-yellow-500'
  },
  {
    icon: FileText,
    title: 'Result Comparison',
    description: 'Side-by-side paragraph comparison with color-coded error highlighting.',
    color: 'text-red-500'
  },
  {
    icon: Shield,
    title: 'Qualification Status',
    description: 'Instant feedback on whether you qualify based on exam criteria.',
    color: 'text-emerald-500'
  },
  {
    icon: Smartphone,
    title: 'Multi-Language',
    description: 'Support for both English and Hindi typing with proper font handling.',
    color: 'text-indigo-500'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose TypeScribe Zen?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built specifically for government exam aspirants with features that 
            help you practice efficiently and track your improvement.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30"
            >
              <CardContent className="p-6 text-center">
                <div className={`inline-flex p-3 rounded-xl bg-muted mb-4 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
