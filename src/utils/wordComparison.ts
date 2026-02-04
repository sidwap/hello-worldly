// Word comparison utility for UP Police typing test rules
// Implements Longest Common Subsequence (LCS) based diff algorithm

export type WordStatus = 'correct' | 'wrong' | 'skipped' | 'extra';

export interface ComparedWord {
  word: string;
  status: WordStatus;
  expectedWord?: string; // For wrong words, shows what was expected
}

export interface ComparisonResult {
  originalWords: string[];
  typedComparison: ComparedWord[];
  originalComparison: { word: string; isSkipped: boolean }[];
  stats: {
    totalWords: number;
    correctWords: number;
    wrongWords: number;
    skippedWords: number;
    extraWords: number;
    totalErrors: number;
    accuracy: number;
  };
}

// Compute LCS length table
function computeLCS(original: string[], typed: string[]): number[][] {
  const m = original.length;
  const n = typed.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (original[i - 1] === typed[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

// Main comparison function
export function compareWords(originalText: string, typedText: string): ComparisonResult {
  const original = originalText.split(' ').filter(w => w.length > 0);
  const typed = typedText.trim().split(' ').filter(w => w.length > 0);

  const dp = computeLCS(original, typed);
  
  // Non-recursive backtrack to avoid stack overflow
  let i = original.length;
  let j = typed.length;
  const tempOps: { type: 'match' | 'skip' | 'extra' | 'wrong'; origIdx?: number; typedIdx?: number }[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === typed[j - 1]) {
      tempOps.unshift({ type: 'match', origIdx: i - 1, typedIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tempOps.unshift({ type: 'extra', typedIdx: j - 1 });
      j--;
    } else if (i > 0) {
      tempOps.unshift({ type: 'skip', origIdx: i - 1 });
      i--;
    }
  }

  // Process operations to create comparison results
  const typedComparison: ComparedWord[] = [];
  const originalComparison: { word: string; isSkipped: boolean }[] = original.map(w => ({ word: w, isSkipped: false }));
  
  let correctWords = 0;
  let wrongWords = 0;
  let skippedWords = 0;
  let extraWords = 0;

  // Build a map of which original indices are matched to which typed indices
  const origToTypedMatch = new Map<number, number>();
  const typedToOrigMatch = new Map<number, number>();

  tempOps.forEach(op => {
    if (op.type === 'match' && op.origIdx !== undefined && op.typedIdx !== undefined) {
      origToTypedMatch.set(op.origIdx, op.typedIdx);
      typedToOrigMatch.set(op.typedIdx, op.origIdx);
    }
  });

  // Process word by word using two pointers
  let origPtr = 0;
  let typedPtr = 0;

  while (typedPtr < typed.length || origPtr < original.length) {
    if (typedPtr >= typed.length) {
      // Remaining original words are skipped - show them in result as skipped
      typedComparison.push({
        word: original[origPtr],
        status: 'skipped'
      });
      originalComparison[origPtr].isSkipped = true;
      skippedWords++;
      origPtr++;
    } else if (origPtr >= original.length) {
      // Remaining typed words are extra
      typedComparison.push({
        word: typed[typedPtr],
        status: 'extra'
      });
      extraWords++;
      typedPtr++;
    } else if (original[origPtr] === typed[typedPtr]) {
      // Exact match at current position
      typedComparison.push({
        word: typed[typedPtr],
        status: 'correct'
      });
      correctWords++;
      origPtr++;
      typedPtr++;
    } else {
      // Check if current original word appears later in typed (user skipped it)
      const origMatchedAtTyped = origToTypedMatch.get(origPtr);
      // Check if current typed word appears later in original (user added extra)
      const typedMatchedAtOrig = typedToOrigMatch.get(typedPtr);

      if (origMatchedAtTyped !== undefined && origMatchedAtTyped > typedPtr) {
        // Original word is matched later in typed - current typed is either wrong or extra
        if (typedMatchedAtOrig !== undefined && typedMatchedAtOrig > origPtr) {
          // Both match later - this is a substitution (wrong word)
          typedComparison.push({
            word: typed[typedPtr],
            status: 'wrong',
            expectedWord: original[origPtr]
          });
          wrongWords++;
          origPtr++;
          typedPtr++;
        } else {
          // Typed word doesn't match anywhere later - it's extra
          typedComparison.push({
            word: typed[typedPtr],
            status: 'extra'
          });
          extraWords++;
          typedPtr++;
        }
      } else if (typedMatchedAtOrig !== undefined && typedMatchedAtOrig > origPtr) {
        // Typed word matches later original - current original was skipped
        typedComparison.push({
          word: original[origPtr],
          status: 'skipped'
        });
        originalComparison[origPtr].isSkipped = true;
        skippedWords++;
        origPtr++;
      } else {
        // Neither matches later - substitution
        typedComparison.push({
          word: typed[typedPtr],
          status: 'wrong',
          expectedWord: original[origPtr]
        });
        wrongWords++;
        origPtr++;
        typedPtr++;
      }
    }
  }

  const totalErrors = wrongWords + skippedWords + extraWords;
  const accuracy = original.length > 0 
    ? Math.round((correctWords / original.length) * 100) 
    : 0;

  return {
    originalWords: original,
    typedComparison,
    originalComparison,
    stats: {
      totalWords: original.length,
      correctWords,
      wrongWords,
      skippedWords,
      extraWords,
      totalErrors,
      accuracy
    }
  };
}
