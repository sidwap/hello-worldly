
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  Download,
  Share2,
  History,
  Keyboard,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Leaderboard } from './Leaderboard';
import TestResultDetailDialog from './TestResultDetailDialog';
import { getAvailableExams, getExamShortName, type ExamType } from '@/config/examConfig';

interface TestResults {
  wpm: number;
  grossWpm: number;
  accuracy: number;
  totalWords: number;
  typedWords: number;
  correctWords: number;
  incorrectWords: number;
  totalKeystrokes: number;
  typedKeystrokes: number;
  correctKeystrokes: number;
  keystrokeAccuracy?: number;
  errors: number;
  timeTaken: number;
  totalTime: number;
  testTitle: string;
  language: string;
  testId?: string;
  originalText?: string;
  typedText?: string;
  typedWordsArray?: string[];
  wrongWordIndices?: number[];
}

interface ResultsProps {
  results: TestResults | null;
}

const ITEMS_PER_PAGE = 10;

const Results = ({ results }: ResultsProps) => {
  const [showLatestResult, setShowLatestResult] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedResultForDetails, setSelectedResultForDetails] = React.useState<any>(null);
  const [historySearch, setHistorySearch] = React.useState('');
  const [examTypeFilter, setExamTypeFilter] = React.useState<string>('all');

  const availableExams = getAvailableExams();
  
  const { data: { user } = {} } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data;
    },
  });

  // Fetch ALL user's test history with pagination support
  const { data: testHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['test-history-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch all tests by paginating through all pages
      let allResults: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('test_results')
          .select(`
            *,
            typing_tests(title, language, category, difficulty, time_limit)
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error('Error fetching test history:', error);
          break;
        }
        
        if (data && data.length > 0) {
          allResults = [...allResults, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      return allResults;
    }
  });

  // Filter history based on search and exam type
  const filteredHistory = React.useMemo(() => {
    let filtered = testHistory;
    
    // Filter by exam type
    if (examTypeFilter !== 'all') {
      filtered = filtered.filter((test: any) => test.exam_type === examTypeFilter);
    }
    
    // Filter by search query
    if (historySearch.trim()) {
      const searchLower = historySearch.toLowerCase();
      filtered = filtered.filter((test: any) => 
        test.typing_tests?.title?.toLowerCase().includes(searchLower) ||
        test.typing_tests?.category?.toLowerCase().includes(searchLower) ||
        test.typing_tests?.language?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [testHistory, historySearch, examTypeFilter]);

  // Pagination calculations based on filtered history
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [historySearch, examTypeFilter]);

  const handleShowLatestResult = () => {
    if (results) {
      setShowLatestResult(true);
    }
  };

  // Show history by default now (showLatestResult = false means show history)
  if (!showLatestResult) {
  return (
    <Tabs defaultValue="history" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="history">
          <History className="w-4 h-4 mr-2" />
          My History
        </TabsTrigger>
        <TabsTrigger value="leaderboard">
          <Trophy className="w-4 h-4 mr-2" />
          Leaderboard
        </TabsTrigger>
      </TabsList>

      <TabsContent value="history" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Test History
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tests..." 
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 w-full sm:w-48"
                />
              </div>
              
              {/* Exam Type Filter */}
              <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {availableExams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {results && (
                <Button 
                  variant="outline" 
                  onClick={handleShowLatestResult}
                >
                  View Latest Results
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading test history...</div>
              </div>
            ) : testHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                <h3 className="text-lg font-semibold mb-2">No Test History</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Complete some tests to see your history here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4 text-center">
                      <Trophy className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {testHistory.length > 0 ? Math.max(...testHistory.map((t: any) => t.wpm)) : 0}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">Best WPM</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {testHistory.length > 0 ? (testHistory.reduce((sum: number, t: any) => sum + t.accuracy, 0) / testHistory.length).toFixed(1) : 0}%
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">Avg Accuracy</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {testHistory.length}
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">Total Tests</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                      <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {testHistory.length > 0 ? Math.round(testHistory.reduce((sum: number, t: any) => sum + t.time_taken, 0) / 60) : 0}m
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">Practice Time</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pagination Info */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredHistory.length > 0 ? (
                      <>Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length} tests</>
                    ) : (
                      <>No tests found {historySearch && `matching "${historySearch}"`}</>
                    )}
                  </p>
                </div>

                {/* Test History Cards */}
                <div className="space-y-3">
                  {paginatedHistory.map((test: any, index: number) => {
                    const globalIndex = ((currentPage - 1) * ITEMS_PER_PAGE) + index;
                    const isTopPerformer = test.wpm >= Math.max(...testHistory.map((t: any) => t.wpm)) * 0.9;
                    const isQualified = test.is_qualified ?? (test.accuracy >= 85 && (test.time_taken >= 600 || (test.total_words || 0) >= 400));
                    const totalKeystrokes = test.total_keystrokes || (test.correct_keystrokes || 0) + (test.wrong_keystrokes || 0);
                    const isStandardExam = test.exam_type === 'all_exam' || !test.exam_type;
                    
                    return (
                      <Card key={test.id} className={`transition-all hover:shadow-lg ${isTopPerformer ? 'border-yellow-400 dark:border-yellow-600' : ''}`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm">
                                  #{globalIndex + 1}
                                </div>
                                <h4 className="font-semibold text-lg">{test.typing_tests?.title || 'Unknown Test'}</h4>
                                {isTopPerformer && <Trophy className="h-4 w-4 text-yellow-500" />}
                                {/* Only show qualification badge for non-standard exams */}
                                {!isStandardExam && (
                                  <Badge 
                                    className={`text-xs ${
                                      isQualified 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}
                                  >
                                    {isQualified ? (
                                      <><CheckCircle className="h-3 w-3 mr-1" /> Qualified</>
                                    ) : (
                                      <><AlertCircle className="h-3 w-3 mr-1" /> Not Qualified</>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex gap-2 mb-3 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {test.typing_tests?.language === 'hindi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {test.typing_tests?.difficulty}
                                </Badge>
                                {test.typing_tests?.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {test.typing_tests?.category}
                                  </Badge>
                                )}
                                {/* Exam Type Badge */}
                                {test.exam_type && test.exam_type !== 'all_exam' && (
                                  <Badge className="text-xs bg-primary/10 text-primary">
                                    {getExamShortName(test.exam_type)}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <div className="font-bold text-lg">{Math.round(test.wpm)}</div>
                                    <div className="text-xs text-gray-500">Net WPM</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-purple-500" />
                                  <div>
                                    <div className="font-bold text-lg">{Math.round(test.gross_wpm || 0)}</div>
                                    <div className="text-xs text-gray-500">Gross WPM</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-green-500" />
                                  <div>
                                    <div className="font-bold text-lg">{test.accuracy.toFixed(1)}%</div>
                                    <div className="text-xs text-gray-500">Accuracy</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-orange-500" />
                                  <div>
                                    <div className="font-bold">
                                      {test.time_taken >= 60 
                                        ? `${Math.floor(test.time_taken / 60)}:${(test.time_taken % 60).toString().padStart(2, '0')}`
                                        : `${test.time_taken}s`
                                      }
                                    </div>
                                    <div className="text-xs text-gray-500">Time</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  <div>
                                    <div className="font-bold">{test.correct_words_count || 0}</div>
                                    <div className="text-xs text-gray-500">Correct</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <div>
                                    <div className="font-bold">{test.incorrect_words || 0}</div>
                                    <div className="text-xs text-gray-500">Wrong</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Keyboard className="h-4 w-4 text-indigo-500" />
                                  <div>
                                    <div className="font-bold">{totalKeystrokes}</div>
                                    <div className="text-xs text-gray-500">Keystrokes</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right text-sm text-gray-500">
                                <div className="font-medium">
                                  {new Date(test.completed_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs">
                                  {new Date(test.completed_at).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedResultForDetails(test)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                            </div>
                          </div>
                          
                          {/* Progress bars */}
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-20">Accuracy</span>
                              <Progress value={test.accuracy} className="h-2 flex-1" />
                              <span className="text-xs font-medium w-12 text-right">{test.accuracy.toFixed(1)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Result Detail Dialog */}
        <TestResultDetailDialog
          isOpen={!!selectedResultForDetails}
          onClose={() => setSelectedResultForDetails(null)}
          result={selectedResultForDetails}
        />
      </TabsContent>

      <TabsContent value="leaderboard">
        <Leaderboard currentUserId={user?.id} />
      </TabsContent>
    </Tabs>
  );
  }

  if (!results) {
    return null;
  }

  const getPerformanceLevel = (wpm: number) => {
    if (wpm >= 80) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' };
    if (wpm >= 60) return { level: 'Advanced', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (wpm >= 40) return { level: 'Intermediate', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (wpm >= 20) return { level: 'Beginner', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { level: 'Novice', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const performance = getPerformanceLevel(results.wpm);

  // Render paragraph with colored words
  const renderColoredParagraph = () => {
    if (!results.originalText) return null;
    
    const originalWords = results.originalText.split(' ');
    const typedWords = results.typedWordsArray || results.typedText?.split(' ') || [];
    const wrongIndices = new Set(results.wrongWordIndices || []);
    
    return (
      <div className="flex flex-wrap gap-1 text-base leading-relaxed">
        {originalWords.map((word, index) => {
          const typedWord = typedWords[index] || '';
          const isWrong = wrongIndices.has(index);
          const isTyped = index < typedWords.length;
          
          return (
            <span
              key={index}
              className={
                !isTyped
                  ? 'text-gray-400'
                  : isWrong
                  ? 'text-red-500 font-medium'
                  : 'text-green-500 font-medium'
              }
            >
              {word}
              {isWrong && isTyped && typedWord !== '' && (
                <span className="text-red-500 text-sm">({typedWord})</span>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const errorRate = results.typedKeystrokes > 0 ? 
    Math.round((results.errors / results.typedKeystrokes) * 100) : 0;
  
  const keystrokeAccuracy = results.keystrokeAccuracy || 
    (results.typedKeystrokes > 0 ? Math.round((results.correctKeystrokes / results.typedKeystrokes) * 100) : 0);

  const shareResults = () => {
    const text = `I just completed a typing test!\n🚀 Speed: ${results.wpm} WPM\n🎯 Accuracy: ${results.accuracy}%\n⏱️ Time: ${formatTime(results.timeTaken)}\n\nTry it yourself!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Typing Test Results',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Results copied to clipboard!",
        description: "Share your results with friends."
      });
    }
  };

  const downloadResults = () => {
    const data = {
      testTitle: results.testTitle,
      language: results.language,
      wpm: results.wpm,
      grossWpm: results.grossWpm,
      accuracy: results.accuracy,
      keystrokeAccuracy: keystrokeAccuracy,
      timeTaken: formatTime(results.timeTaken),
      errors: results.errors,
      date: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typing-test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Current Test Results Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Test Results
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={shareResults}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={downloadResults}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Badge */}
          <div className="flex justify-center">
            <Badge className={`${performance.bg} ${performance.color} px-6 py-2 text-lg font-bold border-2`}>
              {performance.level} Typist
            </Badge>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{results.wpm}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Net WPM</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{results.grossWpm}</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Gross WPM</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">{results.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-green-600 dark:text-green-400">Accuracy</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{formatTime(results.timeTaken)}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Time Taken</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800">
              <CardContent className="p-4 text-center">
                <Keyboard className="h-8 w-8 mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
                <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                  {((results.typedKeystrokes / 5) / (results.timeTaken / 60)).toFixed(1)}
                </div>
                <div className="text-sm text-cyan-600 dark:text-cyan-400">Gross Speed (5 keys)</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {Math.max(0, ((results.typedKeystrokes / 5) - results.errors) / (results.timeTaken / 60)).toFixed(1)}
                </div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">Net Speed (5 keys)</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <div className="text-xl font-bold">{results.correctWords}</div>
              <div className="text-xs text-muted-foreground">Correct Words</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <div className="text-xl font-bold">{results.incorrectWords}</div>
              <div className="text-xs text-muted-foreground">Incorrect Words</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <Keyboard className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div className="text-xl font-bold">{keystrokeAccuracy}%</div>
              <div className="text-xs text-muted-foreground">Keystroke Accuracy</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <FileText className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <div className="text-xl font-bold">{results.typedWords}/{results.totalWords}</div>
              <div className="text-xs text-muted-foreground">Words Typed</div>
            </div>
          </div>

          {/* Colored Paragraph Display */}
          {results.originalText && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Test Text Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40 w-full rounded-md border p-4">
                  {renderColoredParagraph()}
                </ScrollArea>
                <div className="flex gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-green-500"></span>
                    <span className="text-muted-foreground">Correct words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-500"></span>
                    <span className="text-muted-foreground">Wrong words</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* View History Button */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setShowLatestResult(false)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              View Test History & Leaderboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.testId && results.testId !== 'custom-text' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Top Performers for this Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard testId={results.testId} currentUserId={user?.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Results;
