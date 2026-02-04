import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { processText } from '@/utils/textNormalization';

interface CustomTextTestProps {
  onStartTest: (testId: string) => void;
}

const CustomTextTest = ({ onStartTest }: CustomTextTestProps) => {
  const [customText, setCustomText] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartTest = async () => {
    if (!customText.trim()) {
      toast({
        title: "Empty text",
        description: "Please enter some text to practice with.",
        variant: "destructive"
      });
      return;
    }

    const wordCount = customText.trim().split(/\s+/).length;
    if (wordCount < 10) {
      toast({
        title: "Text too short",
        description: "Please enter at least 10 words to practice with.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create custom tests.",
          variant: "destructive"
        });
        return;
      }

      // Normalize the text to remove extra spaces and paragraphs
      const normalizedText = processText(customText);

      // Create a title from first few words
      const titleWords = normalizedText.split(/\s+/).slice(0, 5).join(' ');
      const title = titleWords.length > 50 ? titleWords.substring(0, 47) + '...' : titleWords;

      // Insert custom test into database
      const { data: newTest, error } = await supabase
        .from('typing_tests')
        .insert({
          title: title,
          content: normalizedText,
          language: selectedLanguage,
          category: 'Custom Text',
          time_limit: timeLimit,
          difficulty: 'medium',
          is_active: true // Active by default for immediate use
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Starting practice!",
        description: "Your custom typing test is loading...",
      });

      // Start the test with the newly created test ID
      onStartTest(newTest.id);

    } catch (error: any) {
      console.error('Error creating custom test:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create custom test. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = customText.trim() ? customText.trim().split(/\s+/).length : 0;
  const charCount = customText.length;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
          <FileText className="h-8 w-8" />
          Custom Text Practice
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Type your own text and practice at your own pace
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="language" className="text-base font-semibold">
            Select Language
          </Label>
          <Select
            value={selectedLanguage}
            onValueChange={(value: 'english' | 'hindi') => setSelectedLanguage(value)}
          >
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="custom-text" className="text-base font-semibold">
            Enter Your Text
          </Label>
          <Textarea
            id="custom-text"
            placeholder="Paste or type the text you want to practice with... (minimum 10 words)"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="min-h-[250px] text-base leading-relaxed"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="font-medium">{wordCount}</span> words
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">{charCount}</span> characters
              </span>
            </div>
            {wordCount > 0 && wordCount < 10 && (
              <span className="text-red-500 font-medium">
                Need {10 - wordCount} more words
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="time-limit" className="text-base font-semibold">
            Time Limit: {timeLimit} seconds
          </Label>
          <Slider
            id="time-limit"
            min={30}
            max={300}
            step={15}
            value={[timeLimit]}
            onValueChange={(value) => setTimeLimit(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30s</span>
            <span>60s</span>
            <span>120s</span>
            <span>300s</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleStartTest}
            disabled={wordCount < 10 || isSubmitting}
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating Test...' : 'Start Practice'}
          </Button>
        </div>

        <Card className="bg-muted">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tips for Custom Text Practice
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Choose your language (English or Hindi)</li>
              <li>Paste or type any text you want to practice (minimum 10 words)</li>
              <li>Set your preferred time limit (30-300 seconds)</li>
              <li>Your test will be saved and started immediately</li>
              <li>Results will be tracked in your test history</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default CustomTextTest;
