import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'UP Police SI Aspirant',
    avatar: '',
    rating: 5,
    content: 'This platform helped me improve my typing speed from 25 WPM to 38 WPM in just 2 months. The UP Police interface is exactly like the real exam!'
  },
  {
    name: 'Priya Verma',
    role: 'SSC CGL Candidate',
    avatar: '',
    rating: 5,
    content: 'The keystroke-based speed calculation is very accurate. I cleared my SSC typing test with 98% accuracy thanks to regular practice here.'
  },
  {
    name: 'Amit Kumar',
    role: 'RRB NTPC Selected',
    avatar: '',
    rating: 5,
    content: 'The detailed result analysis helped me identify my weak areas. The paragraph comparison feature is amazing for learning from mistakes.'
  },
  {
    name: 'Neha Singh',
    role: 'Hindi Typing Student',
    avatar: '',
    rating: 5,
    content: 'Finally a platform that supports proper Hindi typing with Kruti Dev font! The practice passages are very helpful for exam preparation.'
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Students Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful candidates who improved their typing 
            skills with TypeScribe Zen.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="absolute top-4 right-4 text-primary/10">
                <Quote className="h-12 w-12" />
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
