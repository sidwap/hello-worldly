import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, Target, Zap, XCircle, RotateCcw, Settings, Keyboard, FileText, Calendar as CalendarIcon, GraduationCap, Plus, Minus, Volume2, VolumeX, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import CustomTextTest from './CustomTextTest';
import { format } from 'date-fns';
import { processText } from '@/utils/textNormalization';
import { compareWords, ComparisonResult } from '@/utils/wordComparison';
import UPPoliceResults from './UPPoliceResults';
import StandardResults from './StandardResults';
import ntaLogo from '@/assets/NTA_logo_1.png';

interface TypingTest {
  id: string;
  title: string;
  content: string;
  language: 'english' | 'hindi';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  time_limit: number;
}

interface TestSettings {
  highlightText: boolean;
  showErrors: boolean;
  backspaceMode: 'full' | 'word' | 'disabled';
  timeLimit: number;
  language: 'english' | 'hindi';
}

interface TypingTestProps {
  settings: TestSettings;
  onComplete: (results: any) => void;
  currentTest: TypingTest | null;
  selectedExamSlug?: string | null;
}

const TypingTest = ({ settings, onComplete, currentTest, selectedExamSlug }: TypingTestProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [userInput, setUserInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [wrongWords, setWrongWords] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [typedKeystrokes, setTypedKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [typedWordsArray, setTypedWordsArray] = useState<string[]>([]);
  const [currentTypingWord, setCurrentTypingWord] = useState('');
  const [selectedTest, setSelectedTest] = useState<TypingTest | null>(currentTest);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categorizedTests, setCategorizedTests] = useState<Record<string, TypingTest[]>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi' | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [testSettings, setTestSettings] = useState(settings);
  const [showCustomTextOption, setShowCustomTextOption] = useState(false);
  const [customTextMode, setCustomTextMode] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoadingDailyTests, setIsLoadingDailyTests] = useState(false);
  const [isLoadingTestContent, setIsLoadingTestContent] = useState(false);
  const [dailyTests, setDailyTests] = useState<any[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<string>(selectedExamSlug || 'all_exam');
  const [upPoliceResult, setUpPoliceResult] = useState<any>(null);
  const [upPoliceComparison, setUpPoliceComparison] = useState<ComparisonResult | null>(null);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [upPoliceFontSize, setUpPoliceFontSize] = useState(16);
  const [upPoliceSoundEnabled, setUpPoliceSoundEnabled] = useState(true);
  const [upPoliceTypedText, setUpPoliceTypedText] = useState('');
  const [upPoliceTestStarted, setUpPoliceTestStarted] = useState(false);
  const [wordLimitEnabled, setWordLimitEnabled] = useState(true);
  const [wordLimit, setWordLimit] = useState(500);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [standardResult, setStandardResult] = useState<any>(null);
  const [standardComparison, setStandardComparison] = useState<ComparisonResult | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const typingHallAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and manage typing hall sound
  useEffect(() => {
    // Create audio element for typing hall sound
    typingHallAudioRef.current = new Audio('/audio/typing-hall-sound.m4a');
    typingHallAudioRef.current.loop = true;
    typingHallAudioRef.current.volume = 0.5;

    return () => {
      // Cleanup audio on unmount
      if (typingHallAudioRef.current) {
        typingHallAudioRef.current.pause();
        typingHallAudioRef.current = null;
      }
    };
  }, []);

  // Control typing hall sound based on test state and sound setting
  useEffect(() => {
    const audio = typingHallAudioRef.current;
    if (!audio) return;

    const shouldPlay = isActive && !isFinished && upPoliceSoundEnabled;

    if (shouldPlay) {
      audio.play().catch(err => {
        console.log('Audio autoplay prevented:', err);
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isActive, isFinished, upPoliceSoundEnabled]);

  // Text processing functions
  const convertToStraightQuotes = (str: string) => {
    return str
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
  };

  const fixNukta = (str: string) => {
    return str
      .replace(/\u095C/g, "\u0921\u093C")
      .replace(/\u095D/g, "\u0922\u093C");
  };

  const processText = (text: string) => {
    return fixNukta(convertToStraightQuotes(text));
  };

  // Fetch available tests and organize by category - optimized to not fetch content initially
  const { data: availableTests = [], isLoading: isLoadingTests } = useQuery({
    queryKey: ['typing-tests', selectedLanguage],
    queryFn: async () => {
      if (!selectedLanguage) return [];
      
      // Fetch all tests by paginating to overcome the 1000 row limit
      let allTests: TypingTest[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('typing_tests')
          .select('id, title, language, difficulty, category, time_limit, created_at')
          .eq('language', selectedLanguage)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allTests = [...allTests, ...data.map(test => ({
            ...test,
            content: '', // Content will be loaded separately when test is selected
            language: selectedLanguage
          })) as TypingTest[]];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      return allTests;
    },
    enabled: !!selectedLanguage,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Organize tests by category
  useEffect(() => {
    if (availableTests.length > 0) {
      const grouped = availableTests.reduce((acc, test) => {
        if (!acc[test.category]) {
          acc[test.category] = [];
        }
        acc[test.category].push(test);
        return acc;
      }, {} as Record<string, TypingTest[]>);
      
      setCategorizedTests(grouped);
    }
  }, [availableTests]);

  useEffect(() => {
    if (currentTest) {
      setSelectedTest(currentTest);
    }
  }, [currentTest]);

  // Sync exam type with prop
  useEffect(() => {
    if (selectedExamSlug) {
      setSelectedExamType(selectedExamSlug);
    }
  }, [selectedExamSlug]);

  // Update word limit default based on language
  useEffect(() => {
    if (selectedTest?.language === 'hindi') {
      setWordLimit(400);
    } else if (selectedTest?.language === 'english') {
      setWordLimit(500);
    }
  }, [selectedTest?.language]);

  // Helper function to get limited words
  const getLimitedWords = (content: string) => {
    let testWords = content.split(' ').filter(word => word.trim() !== '');
    if (wordLimitEnabled && testWords.length > wordLimit) {
      testWords = testWords.slice(0, wordLimit);
    }
    return testWords;
  };

  useEffect(() => {
    if (selectedTest) {
      const testWords = getLimitedWords(selectedTest.content);
      setWords(testWords);
      setTimeLeft(selectedTest.time_limit);
      const totalChars = testWords.join(' ').length;
      setTotalKeystrokes(totalChars);
      resetTest();
    }
  }, [selectedTest, wordLimitEnabled, wordLimit]);

  // Standard (non-UP Police) timer effect
  useEffect(() => {
    if (!isActive || isFinished) return;
    if (upPoliceTestStarted) return; // UP Police has its own timer effect below

    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isActive, isFinished, upPoliceTestStarted]);

  // Non-UP Police auto-complete when timer hits 0
  useEffect(() => {
    if (!upPoliceTestStarted && isActive && timeLeft === 0) {
      handleTestComplete();
    }
  }, [timeLeft, upPoliceTestStarted, isActive]);

  // Auto-scroll to current word
  useEffect(() => {
    if (currentWordRef.current && displayRef.current && isActive) {
      const wordElement = currentWordRef.current;
      const containerElement = displayRef.current;
      
      const wordRect = wordElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      
      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentWordIndex, isActive]);

  const fetchDailyTests = async () => {
    if (!selectedDate) return;
    
    setIsLoadingDailyTests(true);
    try {
      const languageCode = selectedLanguage === 'english' ? 1 : 3;
      const dateString = format(selectedDate, 'yyyy-M-d');
      
      const response = await fetch(
        `https://typingdata.testingsd9.workers.dev?language=${languageCode}&created_at=${dateString}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch daily tests');
      
      const data = await response.json();
      
      // Process the text for each test
      const processedTests = data.map((test: any) => ({
        id: test.id.toString(),
        title: test.title,
        content: processText(test.passage_text),
        language: selectedLanguage,
        difficulty: test.difficulty,
        category: 'Daily New Tests',
        time_limit: 900
      }));
      
      setDailyTests(processedTests);
      
      if (processedTests.length === 0) {
        toast({
          title: "No tests found",
          description: "No tests available for the selected date",
        });
      }
    } catch (error) {
      console.error('Error fetching daily tests:', error);
      toast({
        title: "Error",
        description: "Failed to load daily tests",
        variant: "destructive"
      });
      setDailyTests([]);
    } finally {
      setIsLoadingDailyTests(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'H':
        return 'text-red-500';
      case 'M':
        return 'text-blue-500';
      case 'E':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'H':
        return 'Hard';
      case 'M':
        return 'Medium';
      case 'E':
        return 'Easy';
      default:
        return difficulty;
    }
  };

  const selectTest = async (test: any) => {
    let testToSet = test;
    setIsLoadingTestContent(true);
    
    // Check if this test already has content (from API) or needs to be fetched (from database)
    const hasContent = test.content && test.content.trim() !== '';
    
    if (hasContent) {
      // Test already has content (e.g., from Daily New Tests API)
      // Save it to database for leaderboard tracking
      try {
        // Check if test already exists in database by title (faster than matching content)
        const { data: existingTest } = await supabase
          .from('typing_tests')
          .select('id')
          .eq('title', test.title)
          .eq('language', selectedLanguage)
          .maybeSingle();
        
        if (existingTest) {
          testToSet = { ...test, id: existingTest.id, content: processText(test.content) };
        } else {
          // Insert the API test into database
          const { data: newTest, error } = await supabase
            .from('typing_tests')
            .insert({
              title: test.title,
              content: test.content,
              language: selectedLanguage,
              difficulty: test.difficulty === 'H' ? 'hard' : test.difficulty === 'M' ? 'medium' : 'easy',
              time_limit: 900,
              category: 'Daily New Tests',
              is_active: true
            })
            .select('id')
            .single();
          
          if (error) {
            console.error('Error saving API test to database:', error);
            // Still allow test to proceed even if saving fails
            testToSet = { ...test, content: processText(test.content) };
          } else {
            testToSet = { ...test, id: newTest.id, content: processText(test.content) };
          }
        }
      } catch (error) {
        console.error('Error handling API test:', error);
        // Still allow test to proceed even if database operation fails
        testToSet = { ...test, content: processText(test.content) };
      }
    } else {
      // For database tests, fetch the full content
      try {
        const { data: fullTest, error } = await supabase
          .from('typing_tests')
          .select('content')
          .eq('id', test.id)
          .maybeSingle();
        
        if (error || !fullTest) {
          console.error('Error fetching test content:', error);
          toast({
            title: "Error",
            description: "Failed to load test content. Please try again.",
            variant: "destructive"
          });
          setIsLoadingTestContent(false);
          return;
        }
        
        // Process the content for proper display
        testToSet = { 
          ...test, 
          content: processText(fullTest.content)
        };
      } catch (error) {
        console.error('Error loading test:', error);
        toast({
          title: "Error",
          description: "Failed to load test. Please try again.",
          variant: "destructive"
        });
        setIsLoadingTestContent(false);
        return;
      }
    }
    
    setIsLoadingTestContent(false);
    setSelectedTest(testToSet);
  };

  const resetTest = () => {
    setIsActive(false);
    setIsFinished(false);
    setUserInput('');
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setWrongWords(new Set());
    setTypedWordsArray([]);
    setCurrentTypingWord('');
    setStartTime(null);
    setTypedKeystrokes(0);
    setCorrectKeystrokes(0);
    setShowSettings(true);
    setBackspaceCount(0);
    setUpPoliceResult(null);
    setUpPoliceComparison(null);
    setUpPoliceTypedText('');
    setUpPoliceTestStarted(false);
    setStandardResult(null);
    setStandardComparison(null);
    if (selectedTest) {
      setTimeLeft(selectedTest.time_limit);
      // Use word-limited content for total keystrokes
      const testWords = getLimitedWords(selectedTest.content);
      const totalChars = testWords.join(' ').length;
      setTotalKeystrokes(totalChars);
    }
  };

  const startTest = () => {
    if (!isActive && !isFinished) {
      setShowSettings(false);
    }
  };

  const startTimer = () => {
    if (!isActive && !isFinished && !startTime) {
      setIsActive(true);
      setStartTime(new Date());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isActive && !isFinished && e.key !== 'Tab') {
      if (!(e.ctrlKey || e.metaKey)) {
        startTimer();
      }
    }
    
    if (isActive || isFinished) {
      if ((e.ctrlKey || e.metaKey) && (
        e.key === 'c' || e.key === 'v' || e.key === 'x' || 
        e.key === 'a' || e.key === 'u' || e.key === 'r' || 
        e.key === 'f' || e.key === 's' || e.key === 'p' ||
        e.key === 'z' || e.key === 'y'
      )) {
        e.preventDefault();
        return;
      }
      
      if (e.key === 'F5') {
        e.preventDefault();
        return;
      }
    }
    
    if (isActive) {
      setTypedKeystrokes(prev => prev + 1);
      
      // Track backspace for UP Police exam
      if (e.key === 'Backspace') {
        setBackspaceCount(prev => prev + 1);
      }
    }

    if (e.key === ' ') {
      e.preventDefault();
      
      const expectedWord = words[currentWordIndex];
      const typedWord = currentTypingWord;
      
      setTypedWordsArray(prev => [...prev, typedWord]);
      
      if (typedWord !== expectedWord) {
        setWrongWords(prev => new Set([...prev, currentWordIndex]));
      } else {
        setCorrectKeystrokes(prev => prev + typedWord.length + 1);
      }
      
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setCurrentTypingWord('');
        setUserInput(prev => prev + ' ');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (selectedTest?.language === 'hindi' && e.nativeEvent instanceof InputEvent) {
      // Allow all input methods for Hindi
    }
    
    if (value.includes(' ') && !userInput.includes(' ')) {
      return;
    }

    if (value.length < userInput.length) {
      if (testSettings.backspaceMode === 'disabled') {
        return;
      } else if (testSettings.backspaceMode === 'word') {
        const currentWordStart = userInput.lastIndexOf(' ') + 1;
        if (value.length < currentWordStart) {
          return;
        }
      }
    }

    setUserInput(value);
    
    const lastSpaceIndex = value.lastIndexOf(' ');
    const currentWord = lastSpaceIndex >= 0 ? value.substring(lastSpaceIndex + 1) : value;
    setCurrentTypingWord(currentWord);
    
    const expectedWord = words[currentWordIndex] || '';
    
    let correctCount = 0;
    const newWrongWords = new Set<number>();
    
    for (let i = 0; i < typedWordsArray.length; i++) {
      const typedWord = typedWordsArray[i];
      const expectedWordAtIndex = words[i] || '';
      
      if (typedWord === expectedWordAtIndex) {
        correctCount += typedWord.length + 1;
      } else {
        newWrongWords.add(i);
      }
    }
    
    for (let i = 0; i < Math.min(currentWord.length, expectedWord.length); i++) {
      if (currentWord[i] === expectedWord[i]) {
        correctCount++;
      }
    }
    
    if (currentWord.length > 0 && currentWord !== expectedWord.substring(0, currentWord.length)) {
      newWrongWords.add(currentWordIndex);
    }
    
    setCorrectKeystrokes(correctCount);
    setWrongWords(newWrongWords);
    
    if (currentWordIndex >= words.length - 1 && currentWord === expectedWord) {
      handleTestComplete();
    }
  };

  const handleTestComplete = useCallback(async () => {
    if (isFinished) return;
    
    setIsActive(false);
    setIsFinished(true);
    
    const endTime = new Date();
    const timeTaken = startTime ? (endTime.getTime() - startTime.getTime()) / 1000 : selectedTest?.time_limit || 60;
    
    let finalTypedWords = [...typedWordsArray];
    if (currentTypingWord && finalTypedWords.length <= currentWordIndex) {
      finalTypedWords.push(currentTypingWord);
    }
    
    const originalText = words.join(' ');
    const typedText = userInput + (currentTypingWord ? ' ' + currentTypingWord : '');
    
    // Handle UP Police exam mode
    if (selectedExamType === 'up_police') {
      const comparisonResult = compareWords(originalText, typedText.trim());
      const { stats } = comparisonResult;
      
      const timeInMinutes = timeTaken / 60;
      const actualTypedWords = comparisonResult.typedComparison.filter(item => item.status !== 'skipped').length;
      const grossSpeed = timeInMinutes > 0 ? actualTypedWords / timeInMinutes : 0;
      const netSpeed = timeInMinutes > 0 ? stats.correctWords / timeInMinutes : 0;
      
      const mm = Math.floor(timeTaken / 60);
      const ss = Math.floor(timeTaken % 60);
      
      const isHindi = selectedTest?.language?.toLowerCase() === 'hindi';
      const minSpeed = isHindi ? 25 : 30;
      const isQualified = stats.accuracy >= 85 && grossSpeed >= minSpeed;
      
      const upPoliceResultData = {
        testName: selectedTest?.title || 'Unknown Test',
        language: selectedTest?.language === 'hindi' ? 'Hindi' : 'English',
        grossSpeed,
        netSpeed,
        accuracy: stats.accuracy,
        timeTaken: `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`,
        totalWords: stats.totalWords,
        wordsTyped: actualTypedWords,
        correctWords: stats.correctWords,
        wrongWords: stats.totalErrors,
        totalKeystrokes: originalText.length,
        typedKeystrokes: typedText.length,
        backspaceCount
      };
      
      setUpPoliceResult(upPoliceResultData);
      setUpPoliceComparison(comparisonResult);
      
      // Save results to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && selectedTest && selectedTest.id !== 'custom-text') {
          const { error: insertError } = await supabase.from('test_results').insert([{
            user_id: user.id,
            test_id: selectedTest.id,
            wpm: Math.round(netSpeed),
            gross_wpm: Math.round(grossSpeed),
            accuracy: stats.accuracy,
            total_words: stats.totalWords,
            typed_words: actualTypedWords,
            correct_words_count: stats.correctWords,
            incorrect_words: stats.wrongWords,
            total_keystrokes: originalText.length,
            correct_keystrokes: typedText.length,
            wrong_keystrokes: 0,
            errors: stats.totalErrors,
            time_taken: Math.round(timeTaken),
            exam_type: 'up_police',
            skipped_words: stats.skippedWords,
            extra_words: stats.extraWords,
            gross_speed: grossSpeed,
            net_speed: netSpeed,
            backspace_count: backspaceCount,
            is_qualified: isQualified,
            typed_text: typedText,
            word_limit_used: wordLimitEnabled ? wordLimit : null
          }]);
          
        if (insertError) {
          console.error('Error saving UP Police results:', insertError);
          toast({
            title: "Error saving results",
            description: "Your results couldn't be saved. Please try again.",
            variant: "destructive"
          });
        } else {
          // Show congratulations or better luck toast
          if (isQualified) {
            toast({
              title: "🎉 Congratulations! You PASSED! 🏆",
              description: `Outstanding performance! Net Speed: ${netSpeed.toFixed(1)} WPM | Accuracy: ${stats.accuracy.toFixed(1)}% - You've qualified for UP Police typing test!`,
              className: "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white border-none shadow-2xl animate-in slide-in-from-top-5 duration-500",
            });
          } else {
            toast({
              title: "💪 Better Luck Next Time!",
              description: `Keep practicing! Net Speed: ${netSpeed.toFixed(1)} WPM | Accuracy: ${stats.accuracy.toFixed(1)}% - You need ${minSpeed} WPM & 85% accuracy to qualify.`,
              className: "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white border-none shadow-2xl animate-in slide-in-from-top-5 duration-500",
            });
          }
        }
        }
      } catch (error) {
        console.error('Error saving UP Police results:', error);
      }
      
      return;
    }
    
    // Standard exam mode
    // Use LCS-based comparison for standard exam too
    // Note: originalText and typedText are already defined earlier in this function
    const comparisonResult = compareWords(originalText, typedText);
    const stats = comparisonResult.stats;
    
    const timeInMinutes = timeTaken / 60;
    const actualTypedWords = comparisonResult.typedComparison.filter(item => item.status !== 'skipped').length;
    const grossSpeed = timeInMinutes > 0 ? actualTypedWords / timeInMinutes : 0;
    const netSpeed = timeInMinutes > 0 ? stats.correctWords / timeInMinutes : 0;
    
    const mm = Math.floor(timeTaken / 60);
    const ss = Math.floor(timeTaken % 60);
    
    const keystrokeAccuracy = typedKeystrokes > 0 ? (correctKeystrokes / typedKeystrokes) * 100 : 0;
    const wrongKeystrokes = typedKeystrokes - correctKeystrokes;

    const results = {
      wpm: Math.round(netSpeed),
      grossWpm: Math.round(grossSpeed),
      accuracy: stats.accuracy,
      totalWords: stats.totalWords,
      typedWords: actualTypedWords,
      correctWords: stats.correctWords,
      incorrectWords: stats.wrongWords,
      totalKeystrokes: originalText.length,
      typedKeystrokes: typedText.length,
      correctKeystrokes,
      keystrokeAccuracy: Math.round(keystrokeAccuracy * 100) / 100,
      errors: stats.totalErrors,
      timeTaken: Math.round(timeTaken),
      totalTime: selectedTest?.time_limit || 60,
      testTitle: selectedTest?.title || 'Unknown Test',
      language: selectedTest?.language || 'english',
      testId: selectedTest?.id,
      originalText,
      typedText,
      typedWordsArray: finalTypedWords,
      wrongWordIndices: Array.from(wrongWords)
    };
    
    // Set result for inline display
    const standardResultData = {
      testName: selectedTest?.title || 'Unknown Test',
      language: selectedTest?.language === 'hindi' ? 'Hindi' : 'English',
      grossSpeed,
      netSpeed,
      accuracy: stats.accuracy,
      timeTaken: `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`,
      totalWords: stats.totalWords,
      wordsTyped: actualTypedWords,
      correctWords: stats.correctWords,
      wrongWords: stats.totalErrors,
      totalKeystrokes: originalText.length,
      typedKeystrokes: typedText.length,
      backspaceCount
    };
    
    setStandardResult(standardResultData);
    setStandardComparison(comparisonResult);
    
    const qualifiesForLeaderboard = keystrokeAccuracy >= 85 && (timeTaken >= 600 || actualTypedWords >= 400);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && selectedTest && selectedTest.id !== 'custom-text') {
        const { error: insertError } = await supabase.from('test_results').insert([{
          user_id: user.id,
          test_id: selectedTest.id,
          wpm: results.wpm,
          gross_wpm: results.grossWpm,
          accuracy: results.accuracy,
          total_words: results.totalWords,
          typed_words: results.typedWords,
          correct_words_count: results.correctWords,
          incorrect_words: results.incorrectWords,
          total_keystrokes: results.totalKeystrokes,
          correct_keystrokes: results.correctKeystrokes,
          wrong_keystrokes: wrongKeystrokes,
          errors: results.errors,
          time_taken: results.timeTaken,
          exam_type: 'all_exam',
          backspace_count: backspaceCount,
          typed_text: userInput,
          word_limit_used: wordLimitEnabled ? wordLimit : null,
          skipped_words: stats.skippedWords,
          extra_words: stats.extraWords
        }]);
        
        if (insertError) {
          console.error('Error saving results:', insertError);
          toast({
            title: "Error saving results",
            description: "Your results couldn't be saved. Please try again.",
            variant: "destructive"
          });
        } else {
          // Show toast notification
          toast({
            title: "🎉 Test Completed!",
            description: `WPM: ${results.wpm} | Accuracy: ${results.accuracy.toFixed(1)}%`,
            className: "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white border-none shadow-2xl animate-in slide-in-from-top-5 duration-500",
          });
          
          if (qualifiesForLeaderboard) {
            setCurrentTestId(selectedTest.id);
            setShowLeaderboard(true);
          }
        }
      } else if (selectedTest?.id === 'custom-text') {
        toast({
          title: "Test completed!",
          description: "Results for custom text are not saved to history.",
        });
      }
    } catch (error) {
      console.error('Error saving results:', error);
    }
    
    onComplete(results);
  }, [isFinished, startTime, userInput, words, totalKeystrokes, typedKeystrokes, correctKeystrokes, selectedTest, onComplete, wrongWords, currentWordIndex, selectedExamType, backspaceCount, currentTypingWord, typedWordsArray]);

  const renderText = () => {
    if (!selectedTest) return null;
    
    return words.map((word, wordIndex) => {
      const typedWords = userInput.split(' ');
      const typedWord = typedWords[wordIndex] || '';
      
      let wordClassName = 'inline-block mr-2 mb-1 px-1 py-0.5 rounded ';
      
      if (wordIndex < currentWordIndex) {
        if (testSettings.showErrors) {
          if (typedWord === word) {
            wordClassName += 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
          } else {
            wordClassName += 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
          }
        } else {
          wordClassName += 'text-gray-900 dark:text-gray-100';
        }
      } else if (wordIndex === currentWordIndex) {
        if (testSettings.highlightText && isActive) {
          wordClassName += 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 border-2 border-blue-400';
        } else {
          wordClassName += 'text-gray-900 dark:text-gray-100';
        }
      } else {
        wordClassName += 'text-gray-500 dark:text-gray-400';
      }
      
      return (
        <span 
          key={wordIndex} 
          className={wordClassName}
          ref={wordIndex === currentWordIndex ? currentWordRef : null}
        >
          {word}
        </span>
      );
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const formatTimeHMS = (seconds: number) => {
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    const ss = seconds % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  // UP Police highlight method (as in provided reference file)
  const getUPPoliceHighlightedText = () => {
    if (!selectedTest || words.length === 0) return '';

    // Use the word-limited 'words' state instead of selectedTest.content
    const wordsArr = words;
    const typedWords = upPoliceTypedText.trim().split(' ').filter(w => w.length > 0);
    const typedLen = typedWords.length;

    let html = '';
    if (typedLen > 0) {
      html = '<span style="color: hsl(var(--up-police-typed-color));">';
    }

    wordsArr.forEach((word, index) => {
      html += word + ' ';
      if (typedLen === index + 1) {
        html += '</span>';
      }
    });

    return html;
  };

  const progress = selectedTest ? ((currentWordIndex + (userInput.split(' ')[currentWordIndex]?.length || 0) / (words[currentWordIndex]?.length || 1)) / words.length) * 100 : 0;
  const wpm = startTime && correctKeystrokes > 0 ?
    Math.round(((correctKeystrokes / 5) / ((Date.now() - startTime.getTime()) / 1000 / 60))) : 0;


  // UP Police text input handler
  const handleUPPoliceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawText = e.target.value;
    const normalizedText = processText(rawText);
    setUpPoliceTypedText(normalizedText);
    
    if (e.target.value !== normalizedText) {
      e.target.value = normalizedText;
    }
  };

  // UP Police key handler
  const handleUPPoliceKeyDown = (e: React.KeyboardEvent) => {
    // Prevent copy/paste
    if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u')) {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Backspace') {
      setBackspaceCount(prev => prev + 1);
    }
  };

  // UP Police test submit handler
  const handleUPPoliceSubmit = useCallback(async () => {
    if (!startTime || !selectedTest) return;
    
    const endTime = Date.now();
    const timeTaken = (endTime - startTime.getTime()) / 1000;
    
    // Use word-limited text for comparison
    const originalText = words.join(' ');
    const comparisonResult = compareWords(originalText, upPoliceTypedText.trim());
    const { stats } = comparisonResult;
    
    const timeInMinutes = timeTaken / 60;
    const actualTypedWords = comparisonResult.typedComparison.filter(item => item.status !== 'skipped').length;
    const grossSpeed = timeInMinutes > 0 ? actualTypedWords / timeInMinutes : 0;
    const netSpeed = timeInMinutes > 0 ? stats.correctWords / timeInMinutes : 0;
    
    const mm = Math.floor(timeTaken / 60);
    const ss = Math.floor(timeTaken % 60);
    
    const isHindi = selectedTest.language?.toLowerCase() === 'hindi';
    const minSpeed = isHindi ? 25 : 30;
    const isQualified = stats.accuracy >= 85 && grossSpeed >= minSpeed;
    
    const upPoliceResultData = {
      testName: selectedTest.title,
      language: selectedTest.language === 'hindi' ? 'Hindi' : 'English',
      grossSpeed,
      netSpeed,
      accuracy: stats.accuracy,
      timeTaken: `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`,
      totalWords: stats.totalWords,
      wordsTyped: actualTypedWords,
      correctWords: stats.correctWords,
      wrongWords: stats.totalErrors,
      totalKeystrokes: originalText.length,
      typedKeystrokes: upPoliceTypedText.length,
      backspaceCount
    };
    
    setUpPoliceResult(upPoliceResultData);
    setUpPoliceComparison(comparisonResult);
    setIsActive(false);
    setUpPoliceTestStarted(false);

    // Exit fullscreen (as in provided reference file)
    try {
      document.exitFullscreen?.();
    } catch (e) {
      console.log('Exit fullscreen not supported');
    }
    
    // Save results to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && selectedTest && selectedTest.id !== 'custom-text') {
        const { error: insertError } = await supabase.from('test_results').insert([{
          user_id: user.id,
          test_id: selectedTest.id,
          wpm: Math.round(netSpeed),
          gross_wpm: Math.round(grossSpeed),
          accuracy: stats.accuracy,
          total_words: stats.totalWords,
          typed_words: actualTypedWords,
          correct_words_count: stats.correctWords,
          incorrect_words: stats.wrongWords,
          total_keystrokes: originalText.length,
          correct_keystrokes: upPoliceTypedText.length,
          wrong_keystrokes: 0,
          errors: stats.totalErrors,
          time_taken: Math.round(timeTaken),
          exam_type: 'up_police',
          skipped_words: stats.skippedWords,
          extra_words: stats.extraWords,
          gross_speed: grossSpeed,
          net_speed: netSpeed,
          backspace_count: backspaceCount,
          is_qualified: isQualified,
          typed_text: upPoliceTypedText
        }]);
        
        if (insertError) {
          console.error('Error saving UP Police results:', insertError);
          toast({
            title: "Error saving results",
            description: "Your results couldn't be saved. Please try again.",
            variant: "destructive"
          });
        } else {
          // Show congratulations or better luck toast
          if (isQualified) {
            toast({
              title: "🎉 Congratulations! You PASSED! 🏆",
              description: `Outstanding performance! Net Speed: ${netSpeed.toFixed(1)} WPM | Accuracy: ${stats.accuracy.toFixed(1)}% - You've qualified for UP Police typing test!`,
              className: "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white border-none shadow-2xl animate-in slide-in-from-top-5 duration-500",
            });
          } else {
            toast({
              title: "💪 Better Luck Next Time!",
              description: `Keep practicing! Net Speed: ${netSpeed.toFixed(1)} WPM | Accuracy: ${stats.accuracy.toFixed(1)}% - You need ${minSpeed} WPM & 85% accuracy to qualify.`,
              className: "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white border-none shadow-2xl animate-in slide-in-from-top-5 duration-500",
            });
          }
        }
      }
    } catch (error) {
      console.error('Error saving UP Police results:', error);
    }
  }, [startTime, selectedTest, upPoliceTypedText, backspaceCount]);

  // UP Police start handler
  const handleUPPoliceStart = () => {
    setUpPoliceTestStarted(true);
    setIsActive(true);
    setStartTime(new Date());
    setUpPoliceTypedText('');
    setBackspaceCount(0);

    if (textareaRef.current) {
      textareaRef.current.disabled = false;
      textareaRef.current.focus();
    }

    // Request fullscreen (as in provided reference file)
    try {
      document.documentElement.requestFullscreen?.();
    } catch (e) {
      console.log('Fullscreen not supported');
    }
  };

  // UP Police timer effect with precise timing and auto-submit
  const upPoliceStartTimeRef = useRef<number | null>(null);
  const upPoliceTimeLimitRef = useRef<number>(900);

  useEffect(() => {
    if (!upPoliceTestStarted || !isActive) {
      upPoliceStartTimeRef.current = null;
      return;
    }

    // Initialize start time when test begins
    if (upPoliceStartTimeRef.current === null) {
      upPoliceStartTimeRef.current = Date.now();
      upPoliceTimeLimitRef.current = selectedTest?.time_limit || 900;
    }

    const intervalId = setInterval(() => {
      if (upPoliceStartTimeRef.current === null) return;
      
      const elapsedSeconds = Math.floor((Date.now() - upPoliceStartTimeRef.current) / 1000);
      const remaining = upPoliceTimeLimitRef.current - elapsedSeconds;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(intervalId);
        // Auto-submit immediately when time reaches 0
        handleUPPoliceSubmit();
      } else {
        setTimeLeft(remaining);
      }
    }, 100); // Check every 100ms for precision

    return () => clearInterval(intervalId);
  }, [upPoliceTestStarted, isActive, selectedTest?.time_limit, handleUPPoliceSubmit]);

  // UP Police Results Display
  if (upPoliceResult && upPoliceComparison && selectedTest) {
    return (
      <UPPoliceResults
        result={upPoliceResult}
        comparison={upPoliceComparison}
        originalText={words.join(' ')}
        testDuration={selectedTest.time_limit}
        onStartNewTest={resetTest}
      />
    );
  }

  // Standard Results Display
  if (standardResult && standardComparison && selectedTest && selectedExamType !== 'up_police') {
    return (
      <StandardResults
        result={standardResult}
        comparison={standardComparison}
        originalText={words.join(' ')}
        testDuration={selectedTest.time_limit}
        onStartNewTest={resetTest}
      />
    );
  }

  // UP Police Typing Test Interface (match provided reference UI + hide site header)
  if (selectedExamType === 'up_police' && !showSettings && selectedTest && !upPoliceResult) {
    return (
      <div className="up-police-fullscreen up-police-theme" onContextMenu={(e) => e.preventDefault()}>
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header - Compact for mobile landscape */}
          <div className="header-bar p-1 sm:p-2 shrink-0">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Logo and title - compact on mobile */}
              <div className="flex items-center gap-1 sm:gap-4">
                <img src={ntaLogo} alt="NTA Logo" className="h-8 sm:h-16 lg:h-24" />
                <div className="hidden sm:block">
                  <h1 className="text-sm sm:text-xl lg:text-3xl font-bold drop-shadow-lg">
                    {selectedTest.language === 'hindi' ? 'Hindi' : 'English'} Typing Test
                  </h1>
                  <span className="text-xs sm:text-sm">Exam Center : UPSI-LUCKNOW</span>
                </div>
                <span className="sm:hidden text-xs font-bold">{selectedTest.language === 'hindi' ? 'Hindi' : 'English'}</span>
              </div>

              {/* Timer - always visible and prominent */}
              <div className="text-sm sm:text-xl lg:text-2xl font-bold drop-shadow-lg text-center bg-background/80 px-2 py-1 rounded">
                {upPoliceTestStarted ? formatTimeHMS(timeLeft) : formatTimeHMS(selectedTest.time_limit)}
              </div>

              {/* User info - hidden on mobile landscape, shown on larger screens */}
              <div className="hidden md:flex items-center gap-2 sm:gap-4">
                <div className="h-10 w-10 lg:h-20 lg:w-20 rounded-xl lg:rounded-2xl border border-border bg-background flex items-center justify-center">
                  <span className="text-2xl lg:text-4xl">👤</span>
                </div>
                <div className="text-xs lg:text-sm drop-shadow-lg">
                  <p>Reg No : 10001</p>
                  <p>Name : Candidate</p>
                  <p className="hidden lg:block">Father's Name : Father</p>
                  <p className="hidden lg:block">Date : {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content - Flexible height for mobile landscape max-w-7xl */}
          <div className="flex-1 flex flex-col p-2 sm:p-4  mx-auto w-full min-h-0 overflow-hidden">
            {/* Font size controls and sound toggle */}
            <div className="flex items-center gap-2 mb-2 shrink-0 flex-wrap">
              <button
                onClick={() => setUpPoliceFontSize(16)}
                className="text-xs sm:text-sm font-medium bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                title="Reset to default font size"
              >
                Default Font
              </button>
              <button
                onClick={() => setUpPoliceFontSize(prev => Math.min(prev + 2, 32))}
                className="bg-primary text-primary-foreground p-1 rounded hover:bg-primary/90"
                title="Increase font size"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setUpPoliceFontSize(prev => Math.max(prev - 2, 12))}
                className="bg-primary text-primary-foreground p-1 rounded hover:bg-primary/90"
                title="Decrease font size"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setUpPoliceSoundEnabled(!upPoliceSoundEnabled)}
                className={`p-1 rounded transition-colors ${upPoliceSoundEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                title={upPoliceSoundEnabled ? 'Turn off sound' : 'Turn on sound'}
              >
                {upPoliceSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>

            {/* Content box - scrollable, takes available space */}
            <div
              className="content-box flex-1 min-h-[80px] sm:min-h-[120px] max-h-[30vh] sm:max-h-[40vh] lg:max-h-[50vh] overflow-y-auto mb-2 sm:mb-4"
              style={{
                fontSize: `${upPoliceFontSize}px`,
                fontFamily: selectedTest.language === 'hindi' ? 'Mangal, "Noto Sans Devanagari", sans-serif' : 'inherit'
              }}
              dangerouslySetInnerHTML={{ __html: getUPPoliceHighlightedText() }}
            />

            {/* Textarea - compact on mobile landscape */}
            <textarea
              ref={textareaRef}
              value={upPoliceTypedText}
              onChange={handleUPPoliceTextChange}
              onKeyDown={handleUPPoliceKeyDown}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              disabled={!upPoliceTestStarted}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              style={{
                fontSize: `${upPoliceFontSize}px`,
                fontFamily: selectedTest.language === 'hindi' ? 'Mangal, "Noto Sans Devanagari", sans-serif' : 'inherit'
              }}
              className="typing-textarea border border-border w-full resize-none flex-shrink-0 h-20 sm:h-28 lg:h-32"
              placeholder={upPoliceTestStarted ? 'Start typing here...' : 'Click Start to begin typing'}
            />

            {/* Button - compact on mobile */}
            <div className="text-center mt-2 sm:mt-4 shrink-0">
              <Button
                size="lg"
                className="text-base sm:text-xl lg:text-2xl px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-6"
                onClick={upPoliceTestStarted ? handleUPPoliceSubmit : handleUPPoliceStart}
              >
                {upPoliceTestStarted ? 'Submit' : 'Start'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Custom Text Mode
  if (customTextMode) {
    return (
      <CustomTextTest
        onStartTest={async (testId) => {
          // Fetch the newly created test from database
          const { data: test, error } = await supabase
            .from('typing_tests')
            .select('*')
            .eq('id', testId)
            .single();

          if (error || !test) {
            toast({
              title: "Error",
              description: "Failed to load custom test. Please try again.",
              variant: "destructive"
            });
            return;
          }

          const customTypingTest: TypingTest = {
            id: test.id,
            title: test.title,
            content: processText(test.content),
            language: test.language as 'english' | 'hindi',
            difficulty: test.difficulty as 'easy' | 'medium' | 'hard',
            category: test.category,
            time_limit: test.time_limit
          };
          
          // Set language and category to properly navigate to test screen
          setSelectedLanguage(customTypingTest.language);
          setSelectedCategory('Custom Text');
          setSelectedTest(customTypingTest);
          setCustomTextMode(false);
        }}
      />
    );
  }

  // Language Selection Step  
  if (!selectedLanguage && !currentTest) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold">Choose Your Language</CardTitle>
          <p className="text-muted-foreground mt-2">Select your preferred typing language or use custom text</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Card 
            className="group cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary mb-4"
            onClick={() => setCustomTextMode(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Custom Text</h3>
                  <p className="text-sm text-muted-foreground">Practice with your own text</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or choose a language</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="group cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary"
              onClick={() => setSelectedLanguage('english')}
            >
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🇬🇧</div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">English</h3>
                <p className="text-muted-foreground">Type in English language</p>
              </CardContent>
            </Card>
            <Card 
              className="group cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary"
              onClick={() => setSelectedLanguage('hindi')}
            >
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🇮🇳</div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">हिंदी</h3>
                <p className="text-muted-foreground">हिंदी में टाइप करें</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get categories with "Daily New Tests" as first and "Stored Tests" as second
  const availableCategories = selectedLanguage ? 
    [
      'Daily New Tests',
      ...(availableTests.some(test => test.category === 'Daily New Tests') ? ['Stored Tests'] : []),
      ...Array.from(new Set(availableTests.map(test => test.category))).filter(cat => cat !== 'Daily New Tests')
    ] : 
    [];

  // Category Selection Step
  if (selectedLanguage && !selectedCategory && !currentTest) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold">
            {selectedLanguage === 'hindi' ? 'श्रेणी चुनें' : 'Choose Category'}
          </CardTitle>
          <p className="text-muted-foreground mt-2">Select a test category</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedLanguage === 'hindi' ? '🇮🇳' : '🇬🇧'}</span>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedLanguage(null);
                setSelectedCategory('');
                setSelectedTest(null);
              }}
            >
              ← Change Language
            </Button>
          </div>
          
          {isLoadingTests ? (
            <div className="text-center py-12 col-span-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">
                {selectedLanguage === 'hindi' ? 'श्रेणियाँ लोड हो रही हैं...' : 'Loading categories...'}
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCategories.map(category => {
              let testsCount;
              if (category === 'Daily New Tests') {
                testsCount = '∞';
              } else if (category === 'Stored Tests') {
                testsCount = availableTests.filter(t => t.category === 'Daily New Tests').length;
              } else {
                testsCount = availableTests.filter(t => t.category === category).length;
              }
              
              return (
                <Card 
                  key={category}
                  className="group cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 hover:border-primary"
                  onClick={() => setSelectedCategory(category)}
                >
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{category}</h3>
                    <Badge variant="outline" className="text-sm">
                      {testsCount} {typeof testsCount === 'number' && testsCount === 1 ? 'test' : 'tests'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Daily New Tests Date Picker
  if (selectedCategory === 'Daily New Tests' && !selectedTest) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold">Select Date</CardTitle>
          <p className="text-muted-foreground mt-2">Choose a date to see available tests</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-2xl">{selectedLanguage === 'hindi' ? '🇮🇳' : '🇬🇧'}</span>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="secondary" className="text-base px-3 py-1">{selectedCategory}</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedCategory('');
                setSelectedTest(null);
                setDailyTests([]);
              }}
            >
              ← Change Category
            </Button>
          </div>

          <div className="flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full max-w-sm justify-start text-left font-normal h-12"
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={fetchDailyTests}
            disabled={!selectedDate || isLoadingDailyTests}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isLoadingDailyTests ? 'Loading Tests...' : 'Load Tests'}
          </Button>

          {isLoadingTestContent ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">
                {selectedLanguage === 'hindi' ? 'पैराग्राफ लोड हो रहा है...' : 'Loading paragraph...'}
              </p>
            </div>
          ) : dailyTests.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-xl text-center">Available Tests</h3>
              <div className="grid grid-cols-1 gap-3">
                {dailyTests.map((test) => (
                  <Card
                    key={test.id}
                    className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-2 hover:border-primary"
                    onClick={() => selectTest(test)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <span className={`font-bold ${getDifficultyColor(test.difficulty)} text-sm`}>
                          [{getDifficultyLabel(test.difficulty)}]
                        </span>
                        <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                          {test.title}
                        </h4>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Test Selection Step for regular categories
  const categoryTests = selectedCategory === 'Stored Tests'
    ? availableTests.filter(test => test.category === 'Daily New Tests')
    : availableTests.filter(test => test.category === selectedCategory);

  // Filter tests based on search query
  // IMPORTANT: Do not use hooks (useMemo, etc.) after any conditional `return` branches above.
  // This component has multiple early-returns (UP Police flow, custom text, language/category screens),
  // and hooks after them can trigger React error #310.
  const filteredCategoryTests = (() => {
    if (!testSearchQuery.trim()) return categoryTests;
    const searchLower = testSearchQuery.toLowerCase();
    return categoryTests.filter((test) => test.title.toLowerCase().includes(searchLower));
  })();

  if (selectedLanguage && selectedCategory && selectedCategory !== 'Daily New Tests' && !selectedTest) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold">
            {selectedLanguage === 'hindi' ? 'टेस्ट चुनें' : 'Choose Your Test'}
          </CardTitle>
          <p className="text-muted-foreground mt-2">Select a typing test to begin</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-2xl">{selectedLanguage === 'hindi' ? '🇮🇳' : '🇬🇧'}</span>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="secondary" className="text-base px-3 py-1">{selectedCategory}</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedCategory('');
                setSelectedTest(null);
                setTestSearchQuery('');
              }}
            >
              ← Change Category
            </Button>
          </div>

          {/* Search box for tests */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={selectedLanguage === 'hindi' ? 'टेस्ट खोजें...' : 'Search tests...'}
              value={testSearchQuery}
              onChange={(e) => setTestSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {isLoadingTests ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">Loading tests...</p>
            </div>
          ) : isLoadingTestContent ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">
                {selectedLanguage === 'hindi' ? 'पैराग्राफ लोड हो रहा है...' : 'Loading paragraph...'}
              </p>
            </div>
          ) : filteredCategoryTests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {testSearchQuery ? `No tests found matching "${testSearchQuery}"` : 'No tests available in this category'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                Showing {filteredCategoryTests.length} of {categoryTests.length} tests
              </p>
              {filteredCategoryTests.map((test) => {
                // For Stored Tests category, get the difficulty from database or convert it
                const displayDifficulty = selectedCategory === 'Stored Tests' 
                  ? (test.difficulty === 'hard' ? 'H' : test.difficulty === 'medium' ? 'M' : 'E')
                  : test.difficulty;
                
                return (
                  <Card 
                    key={test.id} 
                    className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-2 hover:border-primary"
                    onClick={() => selectTest(test)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {selectedCategory === 'Stored Tests' && (
                            <div className="mb-2">
                              <span className={`font-bold ${getDifficultyColor(displayDifficulty)} text-sm`}>
                                [{getDifficultyLabel(displayDifficulty)}]
                              </span>
                            </div>
                          )}
                          <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">{test.title}</h3>
                          <div className="flex gap-2 flex-wrap">
                            {selectedCategory !== 'Stored Tests' && (
                              <Badge variant="secondary" className="capitalize">{test.difficulty}</Badge>
                            )}
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(test.time_limit / 60)}:{(test.time_limit % 60).toString().padStart(2, '0')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Panel - Show before test starts */}
      {showSettings && !isActive && !isFinished && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Configure Your Test</CardTitle>
            <p className="text-muted-foreground mt-2">Customize your typing experience</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedLanguage(null);
                    setSelectedCategory('');
                    setSelectedTest(null);
                  }}
                  className="flex items-center gap-1 h-8"
                >
                  <span className="text-xl">{selectedLanguage === 'hindi' ? '🇮🇳' : '🇬🇧'}</span>
                  <Badge variant="secondary" className="text-sm px-2 py-1">
                    {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
                  </Badge>
                </Button>
                <span className="text-muted-foreground">→</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedTest(null);
                  }}
                  className="h-8"
                >
                  <Badge variant="secondary" className="text-sm px-2 py-1">{selectedCategory}</Badge>
                </Button>
                <span className="text-muted-foreground">→</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTest(null);
                  }}
                  className="h-8"
                >
                  <Badge variant="secondary" className="text-sm px-2 py-1">{selectedTest?.title}</Badge>
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedTest(null);
                }}
              >
                ← Change Test
              </Button>
            </div>

            {/* Display Settings */}
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                  <Settings className="h-5 w-5" />
                  Display Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <Label htmlFor="highlight-text" className="font-medium cursor-pointer">
                        Highlight Current Text
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">Highlight the word you're typing</p>
                    </div>
                    <Switch
                      id="highlight-text"
                      checked={testSettings.highlightText}
                      onCheckedChange={(checked) => 
                        setTestSettings({...testSettings, highlightText: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <Label htmlFor="show-errors" className="font-medium cursor-pointer">
                        Show Typing Errors
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">Display mistakes in real-time</p>
                    </div>
                    <Switch
                      id="show-errors"
                      checked={testSettings.showErrors}
                      onCheckedChange={(checked) => 
                        setTestSettings({...testSettings, showErrors: checked})
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Settings */}
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                  <Keyboard className="h-5 w-5" />
                  Input Settings
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="backspace-mode" className="font-medium">
                    Backspace Behavior
                  </Label>
                  <Select
                    value={testSettings.backspaceMode}
                    onValueChange={(value: 'full' | 'word' | 'disabled') => 
                      setTestSettings({...testSettings, backspaceMode: value})
                    }
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select backspace mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">✓ Full correction allowed</SelectItem>
                      <SelectItem value="word">⚡ Word-level correction</SelectItem>
                      <SelectItem value="disabled">🚫 Backspace disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose how backspace works during the test</p>
                </div>
              </CardContent>
            </Card>

            {/* Exam Type Selection */}
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                  <GraduationCap className="h-5 w-5" />
                  Choose Exam
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="exam-type" className="font-medium">
                    Exam Type
                  </Label>
                  <Select
                    value={selectedExamType}
                    onValueChange={(value: 'all_exam' | 'up_police') => setSelectedExamType(value)}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_exam">📝 All Exam (Standard)</SelectItem>
                      <SelectItem value="up_police">🚔 UP Police SI/ASI, Computer Operator</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedExamType === 'up_police' 
                      ? 'Uses UP Police exam rules: 85% accuracy + min speed (30 WPM English / 25 WPM Hindi) required' 
                      : 'Standard typing test with keystroke-based accuracy'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Word Limit Setting */}
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  Set Word Limit
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wordLimit"
                        checked={wordLimitEnabled}
                        onChange={() => setWordLimitEnabled(true)}
                        className="w-4 h-4 text-primary accent-primary"
                      />
                      <span className="font-medium">Enable</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wordLimit"
                        checked={!wordLimitEnabled}
                        onChange={() => setWordLimitEnabled(false)}
                        className="w-4 h-4 text-primary accent-primary"
                      />
                      <span className="font-medium">Disable</span>
                    </label>
                  </div>
                  {wordLimitEnabled && (
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={wordLimit}
                        onChange={(e) => setWordLimit(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        className="w-full max-w-[120px] px-3 py-2 border-2 rounded-lg text-center font-medium focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: {selectedTest?.language === 'hindi' ? '400' : '500'} words for {selectedTest?.language === 'hindi' ? 'Hindi' : 'English'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={startTest} 
              size="lg" 
              className="w-full text-lg h-14 shadow-lg hover:shadow-xl transition-all"
            >
              🚀 Start Test Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Test Statistics */}
      {(!showSettings && selectedTest) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">remaining</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{wpm}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{wrongWords.size}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Wrong Words</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Test Card */}
      {(!showSettings && selectedTest) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedTest.title}</CardTitle>
              <div>
                  {/* <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" /> */}
              <div className="text-xl font-bold">{formatTime(timeLeft)}</div>
              {/* <div className="text-sm text-gray-600 dark:text-gray-400">remaining</div> */}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetTest}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            
            <div 
              ref={displayRef}
              className={`p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 ${
                testSettings.language === 'hindi' ? 'font-mangal' : ''
              } text-xl leading-relaxed overflow-y-auto max-h-64`}
              style={{ fontFamily: selectedTest.language === 'hindi' ? 'Mangal, sans-serif' : 'inherit' }}
            >
              {renderText()}
            </div>
            
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={`w-full p-4 border-2 rounded-lg ${
                selectedTest.language === 'hindi' ? 'font-mangal' : ''
              } text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
              style={{ fontFamily: selectedTest.language === 'hindi' ? 'Mangal, sans-serif' : 'inherit' }}
              placeholder={isActive ? "Type here..." : "Press any key to start typing..."}
              disabled={isFinished}
              rows={4}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            
            {isActive && (
              <Button 
                onClick={handleTestComplete}
                size="lg"
                className="w-full"
                variant="default"
              >
                Submit Test
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TypingTest;
