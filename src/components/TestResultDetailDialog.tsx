import React, { useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  Keyboard,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Printer,
  GraduationCap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { compareWords, ComparisonResult } from '@/utils/wordComparison';
import { getExamConfig, getExamShortName, isQualified as checkQualification, type ExamType } from '@/config/examConfig';
import UPPoliceResultDialog from './UPPoliceResultDialog';
import StandardResultDialog from './StandardResultDialog';

interface TestResultDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
}

const TestResultDetailDialog = ({ isOpen, onClose, result }: TestResultDetailDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Determine exam type
  const examType = (result?.exam_type || 'all_exam') as ExamType;
  const isUPPoliceExam = examType === 'up_police';
  const isStandardExam = examType === 'all_exam';
  
  // Fetch exam config from database to check show_qualification_status
  const { data: dbExamConfig } = useQuery({
    queryKey: ['exam-config-db', examType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('show_qualification_status')
        .eq('slug', examType)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: isOpen && !!result
  });
  
  // Fetch the test content for paragraph comparison
  // IMPORTANT: All hooks must be called before any conditional returns
  const { data: testData } = useQuery({
    queryKey: ['test-detail', result?.test_id],
    queryFn: async () => {
      if (!result?.test_id) return null;
      const { data, error } = await supabase
        .from('typing_tests')
        .select('content, title, language, time_limit')
        .eq('id', result.test_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!result?.test_id && isOpen && !isUPPoliceExam && !isStandardExam
  });

  // Compute word comparison using LCS algorithm - must be after useQuery but before early return
  const comparison: ComparisonResult | null = useMemo(() => {
    if (!testData?.content || !result?.typed_text) return null;
    return compareWords(testData.content, result.typed_text);
  }, [testData?.content, result?.typed_text]);

  // For UP Police exam, render the specialized dialog
  if (isUPPoliceExam && result) {
    return (
      <UPPoliceResultDialog
        isOpen={isOpen}
        onClose={onClose}
        result={result}
      />
    );
  }

  // For Standard exam (all_exam), render StandardResultDialog
  if (isStandardExam && result) {
    // Determine if qualification status should be shown
    // Default to false for standard exams unless explicitly set
    const showQualification = dbExamConfig?.show_qualification_status ?? false;
    
    return (
      <StandardResultDialog
        isOpen={isOpen}
        onClose={onClose}
        result={result}
        showQualificationStatus={showQualification}
      />
    );
  }

  // Early return AFTER all hooks have been called
  if (!result) return null;

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const getPerformanceLevel = (wpm: number) => {
    if (wpm >= 80) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' };
    if (wpm >= 60) return { level: 'Advanced', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (wpm >= 40) return { level: 'Intermediate', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (wpm >= 20) return { level: 'Beginner', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { level: 'Novice', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const performance = getPerformanceLevel(result.wpm);

  // Calculate keystroke-based speeds using typed keystrokes (correct - not total)
  const typedKeystrokes = result.correct_keystrokes || 0;
  const totalKeystrokes = result.total_keystrokes || (result.correct_keystrokes + result.wrong_keystrokes) || 0;
  const timeTakenMinutes = result.time_taken / 60;
  const totalErrors = result.errors || result.incorrect_words || 0;
  
  // Gross Speed = (Typed Keystrokes / 5) / Time in minutes
  const grossSpeed = typedKeystrokes > 0 && timeTakenMinutes > 0 
    ? (typedKeystrokes / 5) / timeTakenMinutes 
    : 0;
  
  // Net Speed = ((Typed Keystrokes / 5) - Errors) / Time in minutes
  const netSpeed = typedKeystrokes > 0 && timeTakenMinutes > 0 
    ? Math.max(0, ((typedKeystrokes / 5) - totalErrors) / timeTakenMinutes) 
    : 0;

  // Get exam configuration for this result (reuse examType from above)
  const examConfig = getExamConfig(examType);
  
  // Determine qualification status based on exam-specific rules
  const language = (result.typing_tests?.language || 'english') as 'english' | 'hindi';
  const isQualified = result.is_qualified ?? checkQualification(
    examType,
    language,
    result.accuracy,
    result.gross_wpm || grossSpeed,
    result.time_taken,
    result.total_words || 0
  );

  // Render the result paragraph with color-coded comparison
  const renderResultParagraph = () => {
    if (!comparison) {
      // Fallback to simple word display if no comparison data
      const typedText = result.typed_text || '';
      return <p className="text-sm leading-relaxed">{typedText || 'No typed text available'}</p>;
    }

    return comparison.typedComparison.map((item, index) => {
      switch (item.status) {
        case 'correct':
          return (
            <span key={index} className="text-foreground">
              {item.word}{' '}
            </span>
          );
        case 'wrong':
          return (
            <span key={index}>
              <span className="text-red-500 font-semibold">{item.word}</span>
              <span className="text-green-500 font-semibold">{`{${item.expectedWord}}`}</span>{' '}
            </span>
          );
        case 'skipped':
          return (
            <span key={index} className="text-violet-500 font-semibold">
              {item.word}{' '}
            </span>
          );
        case 'extra':
          return (
            <span key={index} className="text-orange-500 line-through font-semibold">
              {item.word}{' '}
            </span>
          );
        default:
          return (
            <span key={index}>{item.word} </span>
          );
      }
    });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the result');
      return;
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #4F46E5; }
        .header h1 { color: #4F46E5; font-size: 24px; }
        .test-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .test-info h2 { font-size: 18px; margin-bottom: 8px; }
        .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; background: #e5e7eb; }
        .badge.qualified { background: #dcfce7; color: #16a34a; }
        .badge.not-qualified { background: #fee2e2; color: #dc2626; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
        .stat-card .value { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .stat-card .label { font-size: 12px; color: #6b7280; }
        .detailed-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px; }
        .detailed-stat { text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px; }
        .detailed-stat .value { font-size: 18px; font-weight: 600; }
        .detailed-stat .label { font-size: 10px; color: #6b7280; }
        .paragraph-section { margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .paragraph-header { background: #4F46E5; color: white; padding: 10px; text-align: center; font-weight: bold; }
        .paragraph-columns { display: grid; grid-template-columns: 1fr 1fr; }
        .column-header { background: #f3f4f6; padding: 8px; text-align: center; font-weight: 600; font-style: italic; border-bottom: 1px solid #e5e7eb; }
        .column-content { padding: 15px; font-size: 13px; line-height: 1.8; text-align: justify; }
        .column-left { border-right: 1px solid #e5e7eb; }
        .word-correct { color: inherit; }
        .word-wrong { color: #dc2626; font-weight: 600; }
        .word-expected { color: #16a34a; font-weight: 600; }
        .word-skipped { color: #8b5cf6; font-weight: 600; }
        .word-extra { color: #f97316; text-decoration: line-through; font-weight: 600; }
        .legend { display: flex; gap: 16px; justify-content: center; padding: 12px; background: #f3f4f6; font-size: 11px; border-top: 1px solid #e5e7eb; flex-wrap: wrap; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
        @media print { body { padding: 10px; } .paragraph-columns { page-break-inside: avoid; } }
      </style>
    `;

    // Generate result paragraph HTML using comparison data
    let resultParagraphHtml = '';
    if (comparison) {
      comparison.typedComparison.forEach((item) => {
        switch (item.status) {
          case 'correct':
            resultParagraphHtml += `<span class="word-correct">${item.word}</span> `;
            break;
          case 'wrong':
            resultParagraphHtml += `<span class="word-wrong">${item.word}</span><span class="word-expected">{${item.expectedWord}}</span> `;
            break;
          case 'skipped':
            resultParagraphHtml += `<span class="word-skipped">${item.word}</span> `;
            break;
          case 'extra':
            resultParagraphHtml += `<span class="word-extra">${item.word}</span> `;
            break;
          default:
            resultParagraphHtml += `${item.word} `;
        }
      });
    } else {
      resultParagraphHtml = result.typed_text || 'No typed text available';
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Result - ${result.typing_tests?.title || 'Unknown Test'}</title>
          ${styles}
        </head>
        <body>
          <div class="header">
            <h1>TypeScribe Zen - Test Result</h1>
            <p>typescribe.vercel.app</p>
          </div>
          
          <div class="test-info">
            <h2>${result.typing_tests?.title || 'Unknown Test'}</h2>
            <div class="badges">
              <span class="badge">${result.typing_tests?.language === 'hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</span>
              <span class="badge">${result.typing_tests?.category || 'General'}</span>
              <span class="badge ${isQualified ? 'qualified' : 'not-qualified'}">${isQualified ? '✓ Qualified' : '✗ Not Qualified'}</span>
            </div>
            <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">
              Completed on ${new Date(result.completed_at).toLocaleString()}
            </p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${Number(result.wpm).toFixed(1)}</div>
              <div class="label">Net WPM</div>
            </div>
            <div class="stat-card">
              <div class="value">${Number(result.gross_wpm || 0).toFixed(1)}</div>
              <div class="label">Gross WPM</div>
            </div>
            <div class="stat-card">
              <div class="value">${Number(result.accuracy).toFixed(1)}%</div>
              <div class="label">Accuracy</div>
            </div>
            <div class="stat-card">
              <div class="value">${formatTime(result.time_taken)}</div>
              <div class="label">Time Taken</div>
            </div>
          </div>

          <div class="detailed-stats">
            <div class="detailed-stat">
              <div class="value">${result.correct_words_count || 0}</div>
              <div class="label">Correct Words</div>
            </div>
            <div class="detailed-stat">
              <div class="value">${result.incorrect_words || 0}</div>
              <div class="label">Wrong Words</div>
            </div>
            <div class="detailed-stat">
              <div class="value">${typedKeystrokes}</div>
              <div class="label">Typed Keystrokes</div>
            </div>
            <div class="detailed-stat">
              <div class="value">${grossSpeed.toFixed(2)}</div>
              <div class="label">Gross Speed (5 keys)</div>
            </div>
            <div class="detailed-stat">
              <div class="value">${netSpeed.toFixed(2)}</div>
              <div class="label">Net Speed (5 keys)</div>
            </div>
          </div>

          ${testData?.content ? `
            <div class="paragraph-section">
              <div class="paragraph-header">📝 Paragraph Comparison</div>
              <div class="paragraph-columns">
                <div class="column-header column-left">Question Paragraph</div>
                <div class="column-header">Result Paragraph</div>
              </div>
              <div class="paragraph-columns">
                <div class="column-content column-left">${testData.content}</div>
                <div class="column-content">${resultParagraphHtml}</div>
              </div>
              <div class="legend">
                <span><span class="word-wrong">Red</span> = Wrong word</span>
                <span><span class="word-expected">{Green}</span> = Correct word</span>
                <span><span class="word-skipped">Violet</span> = Skipped word</span>
                <span><span class="word-extra">Orange Strikethrough</span> = Extra word</span>
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated from TypeScribe Zen | ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Test Result Details
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-100px)] pr-4">
          <div ref={printRef} className="space-y-6">
            {/* Test Info Header */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{result.typing_tests?.title || 'Unknown Test'}</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline">
                        {result.typing_tests?.language === 'hindi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {result.typing_tests?.difficulty || 'Medium'}
                      </Badge>
                      {result.typing_tests?.category && (
                        <Badge variant="secondary">{result.typing_tests.category}</Badge>
                      )}
                      {/* Exam Type Badge */}
                      {examType !== 'all_exam' && (
                        <Badge className="bg-primary/10 text-primary">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {getExamShortName(examType)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Completed on</p>
                    <p className="font-medium">{new Date(result.completed_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">{new Date(result.completed_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Badge */}
            <div className="flex justify-center gap-4">
              <Badge className={`${performance.bg} ${performance.color} px-6 py-2 text-lg font-bold border-2`}>
                {performance.level} Typist
              </Badge>
              <Badge 
                className={`px-6 py-2 text-lg font-bold border-2 ${
                  isQualified 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-300' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-300'
                }`}
              >
                {isQualified ? (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Qualified</>
                ) : (
                  <><AlertCircle className="h-4 w-4 mr-1" /> Not Qualified</>
                )}
              </Badge>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{Number(result.wpm).toFixed(1)}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Net WPM</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{Number(result.gross_wpm || 0).toFixed(1)}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Gross WPM</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">{Number(result.accuracy).toFixed(1)}%</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Accuracy</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                  <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{formatTime(result.time_taken)}</div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Time Taken</div>
                </CardContent>
              </Card>

              {/* Keystroke-based speeds */}
              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800">
                <CardContent className="p-4 text-center">
                  <Keyboard className="h-8 w-8 mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
                  <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{grossSpeed.toFixed(1)}</div>
                  <div className="text-sm text-cyan-600 dark:text-cyan-400">Gross Speed (5 keys)</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{netSpeed.toFixed(1)}</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">Net Speed (5 keys)</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-xl font-bold">{result.correct_words_count || 0}</div>
                <div className="text-xs text-muted-foreground">Correct Words</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <div className="text-xl font-bold">{result.incorrect_words || 0}</div>
                <div className="text-xs text-muted-foreground">Incorrect Words</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Keyboard className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="text-xl font-bold">{totalKeystrokes}</div>
                <div className="text-xs text-muted-foreground">Total Keystrokes</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <div className="text-xl font-bold">{result.typed_words || 0}/{result.total_words || 0}</div>
                <div className="text-xs text-muted-foreground">Words Typed</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <BarChart3 className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <div className="text-xl font-bold">{result.backspace_count || 0}</div>
                <div className="text-xs text-muted-foreground">Backspace Count</div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-xl font-bold">{result.correct_keystrokes || 0}</div>
                <div className="text-xs text-muted-foreground">Correct Keystrokes</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <div className="text-xl font-bold">{result.wrong_keystrokes || 0}</div>
                <div className="text-xs text-muted-foreground">Wrong Keystrokes</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Target className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <div className="text-xl font-bold">{result.skipped_words || 0}</div>
                <div className="text-xs text-muted-foreground">Skipped Words</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 mx-auto mb-1 text-cyan-500" />
                <div className="text-xl font-bold">{result.extra_words || 0}</div>
                <div className="text-xs text-muted-foreground">Extra Words</div>
              </div>
            </div>

            {/* Keystroke speeds if available from DB */}
            {(result.gross_speed || result.net_speed) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <Keyboard className="h-5 w-5 mx-auto mb-1 text-indigo-500" />
                  <div className="text-xl font-bold">{Number(result.gross_speed || 0).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Gross Typing Speed (DB)</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <Zap className="h-5 w-5 mx-auto mb-1 text-teal-500" />
                  <div className="text-xl font-bold">{Number(result.net_speed || 0).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Net Typing Speed (DB)</div>
                </div>
              </div>
            )}

            {/* Paragraph Comparison Section - Two Column Layout */}
            {testData?.content && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground py-3">
                  <CardTitle className="text-base text-center flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paragraph Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Column Headers */}
                  <div className="grid grid-cols-2 bg-secondary border-b border-border">
                    <div className="p-3 text-center font-bold text-foreground border-r border-border text-sm italic">
                      Question Paragraph
                    </div>
                    <div className="p-3 text-center font-bold text-foreground text-sm italic">
                      Result Paragraph
                    </div>
                  </div>
                  
                  {/* Content Columns */}
                  <div className="grid grid-cols-2 max-h-[400px]">
                    {/* Original Paragraph */}
                    <div className="p-4 border-r border-border bg-background overflow-y-auto max-h-[400px]">
                      <div className="text-sm leading-loose text-justify">
                        {testData.content}
                      </div>
                    </div>

                    {/* Typed Paragraph with Color Coding */}
                    <div className="p-4 bg-background overflow-y-auto max-h-[400px]">
                      <div className="text-sm leading-loose text-justify">
                        {renderResultParagraph()}
                      </div>
                    </div>
                  </div>

                  {/* Color Legend */}
                  <div className="flex flex-wrap gap-4 justify-center text-xs p-4 bg-secondary border-t border-border">
                    <span><span className="text-red-500 font-semibold">Red</span> = Wrong word</span>
                    <span><span className="text-green-500 font-semibold">{'{Green}'}</span> = Correct word</span>
                    <span><span className="text-violet-500 font-semibold">Violet</span> = Skipped word</span>
                    <span><span className="text-orange-500 line-through">Orange Strikethrough</span> = Extra word</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Qualification Criteria - Exam Specific */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Qualification Criteria ({examConfig.shortName})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2">
                  {/* Accuracy Requirement */}
                  <li className="flex items-center gap-2">
                    {result.accuracy >= examConfig.qualificationCriteria.minAccuracy ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    Accuracy ≥ {examConfig.qualificationCriteria.minAccuracy}% (Your: {Number(result.accuracy).toFixed(1)}%)
                  </li>
                  
                  {/* Speed Requirement */}
                  <li className="flex items-center gap-2">
                    {(() => {
                      const minSpeed = language === 'hindi' 
                        ? examConfig.qualificationCriteria.minSpeedHindi 
                        : examConfig.qualificationCriteria.minSpeedEnglish;
                      const userSpeed = result.gross_wpm || grossSpeed;
                      return userSpeed >= minSpeed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      );
                    })()}
                    Speed ≥ {language === 'hindi' 
                      ? examConfig.qualificationCriteria.minSpeedHindi 
                      : examConfig.qualificationCriteria.minSpeedEnglish} WPM for {language === 'hindi' ? 'Hindi' : 'English'} (Your: {Number(result.gross_wpm || grossSpeed).toFixed(1)})
                  </li>
                  
                  {/* Time/Words Requirement - Only for standard exam */}
                  {examConfig.qualificationCriteria.minTimeRequired && (
                    <li className="flex items-center gap-2">
                      {result.time_taken >= examConfig.qualificationCriteria.minTimeRequired ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      Time ≥ {Math.floor(examConfig.qualificationCriteria.minTimeRequired / 60)} minutes (Your: {formatTime(result.time_taken)})
                    </li>
                  )}
                  
                  {examConfig.qualificationCriteria.minWordsRequired && (
                    <li className="flex items-center gap-2">
                      {(result.total_words || 0) >= examConfig.qualificationCriteria.minWordsRequired ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      OR Total Words ≥ {examConfig.qualificationCriteria.minWordsRequired} (Your: {result.total_words || 0})
                    </li>
                  )}
                </ul>
                
                {/* Final Status */}
                <div className={`mt-4 p-3 rounded-lg text-center font-bold ${
                  isQualified 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                }`}>
                  {isQualified 
                    ? `✓ You have QUALIFIED the ${examConfig.shortName} typing test!` 
                    : `✗ You have NOT QUALIFIED the ${examConfig.shortName} typing test.`}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TestResultDetailDialog;
