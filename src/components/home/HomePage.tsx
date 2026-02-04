import React from 'react';
import HeroSection from './HeroSection';
import ExamCards from './ExamCards';
import FeaturesSection from './FeaturesSection';
import TestimonialsSection from './TestimonialsSection';

interface HomePageProps {
  onExamSelect: (examSlug: string) => void;
  onExploreAll: () => void;
  isLoggedIn: boolean;
}

const HomePage = ({ onExamSelect, onExploreAll, isLoggedIn }: HomePageProps) => {
  return (
    <div className="min-h-screen">
      <HeroSection 
        onExploreExams={onExploreAll} 
        isLoggedIn={isLoggedIn}
      />
      <ExamCards 
        onExamSelect={onExamSelect}
        onExploreAll={onExploreAll}
      />
      <FeaturesSection />
      <TestimonialsSection />
    </div>
  );
};

export default HomePage;
