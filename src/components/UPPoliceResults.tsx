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
  Clock, 
  Hash 
} from 'lucide-react';

interface UPPoliceResult {
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
  result: UPPoliceResult;
  comparison: ComparisonResult;
  originalText: string;
  testDuration: number; // in seconds
  onStartNewTest: () => void;
}

const UPPoliceResults = ({ result, comparison, originalText, testDuration, onStartNewTest }: Props) => {
  // Minimum speed: 25 WPM for Hindi, 30 WPM for English
  const isHindi = result.language?.toLowerCase() === 'hindi';
  const minSpeed = isHindi ? 25 : 30;

  // Check if user passed: 85% accuracy AND minimum gross speed
  const isPassed = comparison.stats.accuracy >= 85 && result.grossSpeed >= minSpeed;

  // Calculate actual typed words (excluding skipped markers)
  const actualTypedWords = comparison.typedComparison.filter(
    item => item.status !== 'skipped'
  ).length;

  // Parse actual time taken from result.timeTaken (format: "MM:SS")
  const parseTimeTaken = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return testDuration; // fallback to testDuration
  };
  const actualTimeTakenSeconds = parseTimeTaken(result.timeTaken);
  const actualTimeTakenMinutes = actualTimeTakenSeconds / 60;

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-primary-foreground/70">Exam Title</p>
              <p className="font-bold">UP Police SI/ASI/Computer Operator {result.language} Typing</p>
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
          <StatCard label="Full Mistake" value={comparison.stats.totalErrors} icon={XCircle} valueColor="text-destructive" />
          <StatCard label="Wrong Words" value={comparison.stats.wrongWords} icon={XOctagon} valueColor="text-red-500" />
          <StatCard label="Accuracy %" value={`${comparison.stats.accuracy}`} icon={Percent} valueColor="text-primary" />
          <StatCard label={`Gross Speed (min. ${minSpeed})`} value={Number(result.grossSpeed).toFixed(2)} icon={Gauge} />
          <StatCard label="Net Speed (wpm)" value={Number(result.netSpeed).toFixed(2)} icon={Gauge} />
          <StatCard label="Backspace Count" value={result.backspaceCount} icon={Delete} />
          <div className={`border rounded-xl p-4 flex items-center justify-between gap-3 ${isPassed ? 'bg-green-500/10 border-green-500' : 'bg-destructive/10 border-destructive'}`}>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
              <p className={`text-xl sm:text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-destructive'}`}>
                {isPassed ? 'Qualified' : 'Not Qualified'}
              </p>
            </div>
            {isPassed ? <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" /> : <Target className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />}
          </div>
        </div>

        {/* Keystroke-based Speed Row */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
          <StatCard 
            label="Gross Typing Speed (5 keys = 1 word)" 
            value={actualTimeTakenMinutes > 0 ? ((result.typedKeystrokes / 5) / actualTimeTakenMinutes).toFixed(2) : '0.00'} 
            icon={Gauge} 
            valueColor="text-blue-600"
          />
          <StatCard 
            label="Net Typing Speed (5 keys = 1 word)" 
            value={actualTimeTakenMinutes > 0 ? Math.max(0, ((result.typedKeystrokes / 5) - comparison.stats.totalErrors) / actualTimeTakenMinutes).toFixed(2) : '0.00'} 
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
            <div className="p-4 border-r border-border bg-background">
              <div className="text-sm sm:text-base leading-loose text-justify">
                {originalText}
              </div>
            </div>

            {/* Typed Paragraph */}
            <div className="p-4 bg-background">
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

        {/* Accuracy Formula */}
        <div className="bg-secondary/50 border border-border rounded-xl overflow-hidden">
          <h4 className="font-bold text-primary-foreground p-4 text-center bg-primary">
            Accuracy Calculation (शुद्धता का निर्धारण)
          </h4>
          <div className="text-center text-sm sm:text-base p-4">
            <p className="font-semibold">
              शुद्धता = (अभ्यर्थी द्वारा टंकित शुद्ध शब्दों की संख्या × 100) ÷ दिए गए गद्यांश के कुल शब्दों की संख्या
            </p>
            <p className="mt-2">
              Accuracy = (Correct Words Typed × 100) ÷ Total Words in Passage
            </p>
            <p className="mt-2 text-primary font-bold">
              = ({comparison.stats.correctWords} × 100) ÷ {comparison.stats.totalWords} = {comparison.stats.accuracy}%
            </p>
          </div>
        </div>

        {/* Qualification Criteria */}
        <div className="bg-secondary/50 border border-border rounded-xl overflow-hidden">
          <h4 className="font-bold text-primary-foreground p-4 text-center bg-primary">
            Qualification Criteria (उत्तीर्ण मानदंड)
          </h4>
          <div className="text-sm sm:text-base space-y-2 p-4">
            <p>To qualify the typing test, candidate must achieve:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Minimum 85% Accuracy</strong> (न्यूनतम 85% शुद्धता)</li>
              <li><strong>For English: Minimum 30 WPM Gross Speed</strong> (अंग्रेजी के लिए न्यूनतम 30 शब्द प्रति मिनट गति)</li>
              <li><strong>For Hindi: Minimum 25 WPM Gross Speed</strong> (हिंदी के लिए न्यूनतम 25 शब्द प्रति मिनट गति)</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Current Test: <strong>{result.language}</strong> - Required Speed: <strong>{minSpeed} WPM</strong>
            </p>
            <div className={`mt-3 p-3 rounded-lg ${isPassed ? 'bg-green-500/10 border border-green-500' : 'bg-destructive/10 border border-destructive'}`}>
              <p className="font-bold text-center">
                Your Result: Accuracy = {comparison.stats.accuracy}% | Gross Speed = {Number(result.grossSpeed).toFixed(2)} WPM
              </p>
              <p className={`text-center font-bold mt-1 ${isPassed ? 'text-green-600' : 'text-destructive'}`}>
                {isPassed ? '✓ You have QUALIFIED the typing test!' : '✗ You have NOT QUALIFIED the typing test.'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Rules */}
        <div className="bg-secondary/50 border border-border rounded-xl overflow-hidden">
          <h4 className="font-bold text-primary-foreground p-4 text-center bg-primary">
            अशुद्धियों का चिन्हांकन तथा शुद्धता का निर्धारण (Nature of Mistakes)
          </h4>
          <div className="text-xs sm:text-sm space-y-2 p-4">
            <p className="font-semibold text-destructive">Full Mistakes - निम्नलिखित त्रुटियों को पूर्ण गलती माना जाता है:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>
                <span className="text-violet-500 font-semibold">Omission (छोड़ना)</span> - For every omission of a word/figure.
                <br/><span className="text-muted-foreground ml-6">प्रत्येक शब्द/अंक के छूटने पर।</span>
              </li>
              <li>
                <span className="text-red-500 font-semibold">Substitution (प्रतिस्थापन)</span> - For every substitution of a wrong word/figure, except transposition of words.
                <br/><span className="text-muted-foreground ml-6">शब्दों के क्रम में बदलाव को छोड़कर, प्रत्येक गलत शब्द/अंक के प्रतिस्थापन पर।</span>
              </li>
              <li>
                <span className="text-orange-500 font-semibold">Addition (जोड़ना)</span> - For every addition of a word/figure not found in the passage.
                <br/><span className="text-muted-foreground ml-6">गद्यांश में न पाए जाने वाले प्रत्येक शब्द/अंक के जोड़ने पर।</span>
              </li>
              <li>
                <span className="text-red-500 font-semibold">Spelling Error (वर्तनी त्रुटि)</span> - For every spelling error committed by way of repetition, addition, omission, or substitution of letter/letters.
                <br/><span className="text-muted-foreground ml-6">अक्षर/अक्षरों की पुनरावृत्ति, जोड़, छूट, या प्रतिस्थापन द्वारा की गई प्रत्येक वर्तनी त्रुटि पर।</span>
              </li>
              <li>
                <span className="text-red-500 font-semibold">Repetition (दोहराव)</span> - For repetition of word/figure.
                <br/><span className="text-muted-foreground ml-6">शब्द/अंक के दोहराव पर।</span>
              </li>
              <li>
                <span className="text-red-500 font-semibold">Incomplete Words (अधूरे शब्द)</span> - Half typed words will be treated as mistake.
                <br/><span className="text-muted-foreground ml-6">आधे टाइप किए गए शब्दों को गलती माना जाएगा।</span>
              </li>
            </ol>
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

export default UPPoliceResults;
