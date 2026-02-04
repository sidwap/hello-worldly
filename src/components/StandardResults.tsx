import React from 'react';
import { ComparisonResult } from '@/utils/wordComparison';
import { Button } from '@/components/ui/button';
import { 
  Keyboard, 
  XCircle, 
  Percent, 
  Gauge, 
  Target, 
  Delete, 
  CheckCircle, 
  XOctagon, 
  FileText, 
  Hash,
  Trophy
} from 'lucide-react';

interface StandardResult {
  testName: string;
  language: string;
  grossSpeed: number;
  netSpeed: number;
  accuracy: number;
  timeTaken: string;
  totalWords: number;
  wordsTyped: number;
  correctWords: number;
  wrongWords: number;
  totalKeystrokes: number;
  typedKeystrokes: number;
  backspaceCount: number;
}

interface Props {
  result: StandardResult;
  comparison: ComparisonResult;
  originalText: string;
  testDuration: number; // in seconds
  onStartNewTest: () => void;
}

const StandardResults = ({ result, comparison, originalText, testDuration, onStartNewTest }: Props) => {
  // Parse actual time taken from result.timeTaken (format: "MM:SS")
  const parseTimeTaken = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return testDuration;
  };
  const actualTimeTakenSeconds = parseTimeTaken(result.timeTaken);
  const actualTimeTakenMinutes = actualTimeTakenSeconds / 60;

  // Calculate actual typed words (excluding skipped markers)
  const actualTypedWords = comparison.typedComparison.filter(
    item => item.status !== 'skipped'
  ).length;

  // Keystroke-based speeds
  const keystrokeGrossSpeed = actualTimeTakenMinutes > 0 ? ((result.typedKeystrokes / 5) / actualTimeTakenMinutes) : 0;
  const keystrokeNetSpeed = actualTimeTakenMinutes > 0 ? Math.max(0, ((result.typedKeystrokes / 5) - comparison.stats.totalErrors) / actualTimeTakenMinutes) : 0;

  // Render typed text with error highlighting
  const renderTypedText = () => {
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

  const StatCard = ({ label, value, icon: Icon, valueColor }: { label: string; value: string | number; icon: React.ElementType; valueColor?: string }) => (
    <div className="bg-secondary/50 border border-border rounded-xl p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold ${valueColor || 'text-foreground'}`}>{value}</p>
      </div>
      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
    </div>
  );

  const testDurationMinutes = Math.floor(testDuration / 60);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Info */}
        <div className="bg-primary text-primary-foreground rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Test Completed!</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-primary-foreground/70">Exam Title</p>
              <p className="font-bold">Standard Typing Test - {result.language}</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">Total Words Given</p>
              <p className="font-bold">{comparison.stats.totalWords}</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">Typing Date</p>
              <p className="font-bold">{new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary-foreground/20">
            <div>
              <p className="text-xs text-primary-foreground/70">Passage Title</p>
              <p className="font-semibold">{result.testName}</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">Time Duration</p>
              <p className="font-semibold">{testDurationMinutes}:00 min.</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">Time Taken</p>
              <p className="font-semibold">{result.timeTaken} min.</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Words Typed" value={actualTypedWords} icon={Keyboard} />
          <StatCard label="Total Errors" value={comparison.stats.totalErrors} icon={XCircle} valueColor="text-destructive" />
          <StatCard label="Wrong Words" value={comparison.stats.wrongWords} icon={XOctagon} valueColor="text-red-500" />
          <StatCard label="Accuracy %" value={`${comparison.stats.accuracy}`} icon={Percent} valueColor="text-primary" />
          <StatCard label="Gross Speed (WPM)" value={Number(result.grossSpeed).toFixed(2)} icon={Gauge} />
          <StatCard label="Net Speed (WPM)" value={Number(result.netSpeed).toFixed(2)} icon={Gauge} />
          <StatCard label="Backspace Count" value={result.backspaceCount} icon={Delete} />
          <StatCard label="Correct Words" value={comparison.stats.correctWords} icon={CheckCircle} valueColor="text-green-600" />
        </div>

        {/* Keystroke-based Speed Row */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
          <StatCard 
            label="Gross Typing Speed (5 keys = 1 word)" 
            value={keystrokeGrossSpeed.toFixed(2)} 
            icon={Gauge} 
            valueColor="text-blue-600"
          />
          <StatCard 
            label="Net Typing Speed (5 keys = 1 word)" 
            value={keystrokeNetSpeed.toFixed(2)} 
            icon={Gauge} 
            valueColor="text-emerald-600"
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <StatCard label="Correct Words" value={comparison.stats.correctWords} icon={CheckCircle} valueColor="text-green-600" />
          <StatCard label="Skipped Words" value={comparison.stats.skippedWords} icon={Hash} valueColor="text-violet-500" />
          <StatCard label="Extra Words" value={comparison.stats.extraWords} icon={Hash} valueColor="text-orange-500" />
          <StatCard label="Total Keystrokes" value={result.totalKeystrokes} icon={FileText} />
          <StatCard label="Typed Keystrokes" value={result.typedKeystrokes} icon={Keyboard} valueColor="text-primary" />
        </div>

        {/* Comparison Section */}
        <div className="bg-secondary/50 border border-border rounded-xl overflow-hidden">
          <h4 className="font-bold text-primary-foreground p-4 text-center text-lg bg-primary">
            Paragraph Comparison
          </h4>
          {/* Headers */}
          <div className="grid grid-cols-2 bg-secondary border-b border-border">
            <div className="p-3 text-center font-bold text-foreground border-r border-border text-sm sm:text-base italic">
              Question Paragraph
            </div>
            <div className="p-3 text-center font-bold text-foreground text-sm sm:text-base italic">
              Result Paragraph
            </div>
          </div>
          
          {/* Content */}
          <div className="grid grid-cols-2">
            {/* Original Paragraph */}
            <div className="p-4 border-r border-border bg-background max-h-96 overflow-y-auto">
              <div className="text-sm sm:text-base leading-loose text-justify">
                {originalText}
              </div>
            </div>

            {/* Typed Paragraph */}
            <div className="p-4 bg-background max-h-96 overflow-y-auto">
              <div className="text-sm sm:text-base leading-loose text-justify">
                {renderTypedText()}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-secondary/50 border border-border rounded-xl overflow-hidden">
          <h4 className="font-bold text-primary-foreground p-4 text-center bg-primary">Color Legend</h4>
          <div className="flex flex-wrap gap-4 justify-center text-xs sm:text-sm p-4">
            <span><span className="text-red-500 font-semibold">Red</span> = Wrong word</span>
            <span><span className="text-green-500 font-semibold">{'{Green}'}</span> = Correct word</span>
            <span><span className="text-violet-500 font-semibold">Violet</span> = Skipped word</span>
            <span><span className="text-orange-500 line-through">Orange Strikethrough</span> = Extra word</span>
          </div>
        </div>

        <div className="text-center mt-4 sm:mt-6">
          <Button onClick={onStartNewTest} className="text-sm sm:text-base">
            Start New Test
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StandardResults;
