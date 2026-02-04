import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Target, Users, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ExamCardsProps {
  onExamSelect: (examSlug: string) => void;
  onExploreAll: () => void;
  maxCards?: number;
}

const ExamCards = ({ onExamSelect, onExploreAll, maxCards = 4 }: ExamCardsProps) => {
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['featured-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(maxCards);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user counts for each exam
  const { data: examStats = {} } = useQuery({
    queryKey: ['exam-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select('exam_type');
      
      if (error) throw error;
      
      const stats: Record<string, number> = {};
      data?.forEach((result: { exam_type: string | null }) => {
        const type = result.exam_type || 'all_exam';
        stats[type] = (stats[type] || 0) + 1;
      });
      return stats;
    }
  });

  const getExamThumbnail = (exam: any) => {
    if (exam.thumbnail_url) return exam.thumbnail_url;
    
    // Default thumbnails based on exam type
    const defaultThumbnails: Record<string, string> = {
      'up_police': 'https://images.unsplash.com/photo-1614107151491-6876eecbff89?w=400&h=300&fit=crop',
      'ssc_cgl': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      'rrb_ntpc': 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop',
      'all_exam': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop'
    };
    
    return defaultThumbnails[exam.slug] || defaultThumbnails['all_exam'];
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore Online Typing Exams
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice with exam-specific interfaces and real-time performance tracking. 
            Choose your exam and start practicing today.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {exams.map((exam: any) => (
            <Card 
              key={exam.id} 
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onExamSelect(exam.slug)}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={getExamThumbnail(exam)} 
                  alt={exam.display_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <Badge className="bg-primary text-primary-foreground">
                    {exam.short_name}
                  </Badge>
                </div>
                {exam.is_featured && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-yellow-500 text-black">
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {exam.display_name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {exam.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.floor(exam.default_time_limit / 60)}min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{exam.min_accuracy}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{examStats[exam.slug] || 0}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                  variant="outline"
                >
                  Take Test
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            size="lg" 
            variant="outline"
            onClick={onExploreAll}
            className="group"
          >
            Explore All Exams
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ExamCards;
