// Exam Configuration System
// This file defines all exam types, their rules, qualification criteria,
// and result calculation methods. Each exam is fully independent.

export type ExamType = 'all_exam' | 'up_police' | 'ssc_cgl' | 'rrb_ntpc' | 'custom';

export interface ExamQualificationCriteria {
  minAccuracy: number;
  minSpeedEnglish: number; // WPM
  minSpeedHindi: number;   // WPM
  minTimeRequired?: number; // seconds
  minWordsRequired?: number;
  useKeystrokeSpeed?: boolean; // 5 keystrokes = 1 word
}

export interface ExamConfig {
  id: ExamType;
  name: string;
  displayName: string;
  shortName: string;
  description: string;
  defaultTimeLimit: number; // seconds
  qualificationCriteria: ExamQualificationCriteria;
  
  // Interface customization
  hasCustomInterface: boolean;
  interfaceTheme?: 'default' | 'nta_style' | 'ssc_style';
  showBackspaceCount: boolean;
  showGrossNetSpeed: boolean;
  showKeystrokeSpeed: boolean;
  
  // Feature flags
  enableSound: boolean;
  enableFontSizeControl: boolean;
  enableWordLimit: boolean;
  defaultWordLimit: { english: number; hindi: number };
  
  // Results display configuration
  showSkippedWords: boolean;
  showExtraWords: boolean;
  showQualificationStatus: boolean;
  showComparisonParagraph: boolean;
  showErrorRules: boolean;
  showAccuracyFormula: boolean;
}

// Default exam configuration (Standard typing test)
export const ALL_EXAM_CONFIG: ExamConfig = {
  id: 'all_exam',
  name: 'all_exam',
  displayName: 'Standard Typing Test',
  shortName: 'Standard',
  description: 'General typing practice with basic metrics',
  defaultTimeLimit: 900, // 15 minutes
  qualificationCriteria: {
    minAccuracy: 85,
    minSpeedEnglish: 30,
    minSpeedHindi: 25,
    minTimeRequired: 600, // 10 minutes
    minWordsRequired: 400,
    useKeystrokeSpeed: false,
  },
  hasCustomInterface: false,
  showBackspaceCount: false,
  showGrossNetSpeed: true,
  showKeystrokeSpeed: true,
  enableSound: false,
  enableFontSizeControl: false,
  enableWordLimit: true,
  defaultWordLimit: { english: 500, hindi: 400 },
  showSkippedWords: false,
  showExtraWords: false,
  showQualificationStatus: true,
  showComparisonParagraph: true,
  showErrorRules: false,
  showAccuracyFormula: false,
};

// UP Police Exam Configuration
export const UP_POLICE_CONFIG: ExamConfig = {
  id: 'up_police',
  name: 'up_police',
  displayName: 'UP Police SI/ASI Typing Test',
  shortName: 'UP Police',
  description: 'Official UP Police Computer Operator typing test format',
  defaultTimeLimit: 900, // 15 minutes
  qualificationCriteria: {
    minAccuracy: 85,
    minSpeedEnglish: 30,
    minSpeedHindi: 25,
    useKeystrokeSpeed: false, // Uses word-based speed
  },
  hasCustomInterface: true,
  interfaceTheme: 'nta_style',
  showBackspaceCount: true,
  showGrossNetSpeed: true,
  showKeystrokeSpeed: true,
  enableSound: true,
  enableFontSizeControl: true,
  enableWordLimit: false,
  defaultWordLimit: { english: 500, hindi: 400 },
  showSkippedWords: true,
  showExtraWords: true,
  showQualificationStatus: true,
  showComparisonParagraph: true,
  showErrorRules: true,
  showAccuracyFormula: true,
};

// SSC CGL Exam Configuration (Future use)
export const SSC_CGL_CONFIG: ExamConfig = {
  id: 'ssc_cgl',
  name: 'ssc_cgl',
  displayName: 'SSC CGL Typing Test',
  shortName: 'SSC CGL',
  description: 'Staff Selection Commission Combined Graduate Level typing test',
  defaultTimeLimit: 900, // 15 minutes
  qualificationCriteria: {
    minAccuracy: 85,
    minSpeedEnglish: 35, // SSC requires 35 WPM for English
    minSpeedHindi: 30,   // SSC requires 30 WPM for Hindi (Mangal font)
    useKeystrokeSpeed: true, // SSC uses 5 keystrokes = 1 word
  },
  hasCustomInterface: true,
  interfaceTheme: 'ssc_style',
  showBackspaceCount: true,
  showGrossNetSpeed: true,
  showKeystrokeSpeed: true,
  enableSound: true,
  enableFontSizeControl: true,
  enableWordLimit: false,
  defaultWordLimit: { english: 2000, hindi: 1500 }, // Higher word count for SSC
  showSkippedWords: true,
  showExtraWords: true,
  showQualificationStatus: true,
  showComparisonParagraph: true,
  showErrorRules: true,
  showAccuracyFormula: true,
};

// RRB NTPC Exam Configuration (Future use)
export const RRB_NTPC_CONFIG: ExamConfig = {
  id: 'rrb_ntpc',
  name: 'rrb_ntpc',
  displayName: 'RRB NTPC Typing Test',
  shortName: 'RRB NTPC',
  description: 'Railway Recruitment Board Non-Technical Popular Category typing test',
  defaultTimeLimit: 600, // 10 minutes
  qualificationCriteria: {
    minAccuracy: 90,
    minSpeedEnglish: 30,
    minSpeedHindi: 25,
    useKeystrokeSpeed: true,
  },
  hasCustomInterface: true,
  interfaceTheme: 'default',
  showBackspaceCount: true,
  showGrossNetSpeed: true,
  showKeystrokeSpeed: true,
  enableSound: false,
  enableFontSizeControl: true,
  enableWordLimit: false,
  defaultWordLimit: { english: 500, hindi: 400 },
  showSkippedWords: true,
  showExtraWords: true,
  showQualificationStatus: true,
  showComparisonParagraph: true,
  showErrorRules: true,
  showAccuracyFormula: true,
};

// Map of all exam configs
export const EXAM_CONFIGS: Record<ExamType, ExamConfig> = {
  all_exam: ALL_EXAM_CONFIG,
  up_police: UP_POLICE_CONFIG,
  ssc_cgl: SSC_CGL_CONFIG,
  rrb_ntpc: RRB_NTPC_CONFIG,
  custom: ALL_EXAM_CONFIG, // Custom uses same config as all_exam
};

// Get exam config by type
export const getExamConfig = (examType: ExamType | string): ExamConfig => {
  return EXAM_CONFIGS[examType as ExamType] || ALL_EXAM_CONFIG;
};

// Get all available exam types for selection
export const getAvailableExams = (): ExamConfig[] => {
  return [
    ALL_EXAM_CONFIG,
    UP_POLICE_CONFIG,
    // SSC_CGL_CONFIG, // Uncomment when ready
    // RRB_NTPC_CONFIG, // Uncomment when ready
  ];
};

// Calculate qualification status based on exam config
export const isQualified = (
  examType: ExamType | string,
  language: 'english' | 'hindi',
  accuracy: number,
  grossSpeed: number,
  timeTaken: number,
  totalWords: number
): boolean => {
  const config = getExamConfig(examType);
  const criteria = config.qualificationCriteria;
  
  const minSpeed = language === 'hindi' ? criteria.minSpeedHindi : criteria.minSpeedEnglish;
  
  // Basic criteria: accuracy and speed
  let isQualified = accuracy >= criteria.minAccuracy && grossSpeed >= minSpeed;
  
  // Additional criteria for standard exam
  if (criteria.minTimeRequired || criteria.minWordsRequired) {
    const meetsTimeOrWords = 
      (criteria.minTimeRequired && timeTaken >= criteria.minTimeRequired) ||
      (criteria.minWordsRequired && totalWords >= criteria.minWordsRequired);
    isQualified = isQualified && meetsTimeOrWords;
  }
  
  return isQualified;
};

// Get exam display name for UI
export const getExamDisplayName = (examType: ExamType | string): string => {
  const config = getExamConfig(examType);
  return config.displayName;
};

// Get exam short name for badges/chips
export const getExamShortName = (examType: ExamType | string): string => {
  const config = getExamConfig(examType);
  return config.shortName;
};

// Speed calculation helpers
export const calculateGrossSpeed = (
  typedWords: number,
  timeInMinutes: number
): number => {
  if (timeInMinutes <= 0) return 0;
  return typedWords / timeInMinutes;
};

export const calculateNetSpeed = (
  correctWords: number,
  timeInMinutes: number
): number => {
  if (timeInMinutes <= 0) return 0;
  return correctWords / timeInMinutes;
};

export const calculateKeystrokeGrossSpeed = (
  totalKeystrokes: number,
  timeInMinutes: number
): number => {
  if (timeInMinutes <= 0) return 0;
  return (totalKeystrokes / 5) / timeInMinutes;
};

export const calculateKeystrokeNetSpeed = (
  totalKeystrokes: number,
  errors: number,
  timeInMinutes: number
): number => {
  if (timeInMinutes <= 0) return 0;
  return Math.max(0, ((totalKeystrokes / 5) - errors) / timeInMinutes);
};
