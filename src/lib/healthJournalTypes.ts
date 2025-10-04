// Health Journal Types and Models

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type AttachmentType = 'image' | 'document' | 'lab_result' | 'prescription';

export interface Attachment {
  id: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number; // bytes
  dataUrl: string; // base64 data URL for local storage
  caption?: string;
  uploadedAt: number;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  mood: MoodLevel;
  moodNote?: string;
  symptoms: string[];
  diet: string[];
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  activities: string[];
  stressLevel: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  attachments?: Attachment[];
  createdAt: number;
}

export interface Pattern {
  id: string;
  type: 'symptom' | 'mood' | 'sleep' | 'diet';
  pattern: string;
  confidence: number;
  occurrences: number;
  lastDetected: string;
  relatedFactors: string[];
  recommendation: string;
}

export interface HealthInsights {
  patterns: Pattern[];
  trends: {
    moodTrend: 'improving' | 'stable' | 'declining';
    sleepTrend: 'improving' | 'stable' | 'declining';
    symptomsFrequency: Record<string, number>;
  };
  correlations: {
    factor1: string;
    factor2: string;
    correlation: number;
    description: string;
  }[];
  summary: string;
}

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Very Bad',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent'
};

export const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😄'
};

export const COMMON_SYMPTOMS = [
  'Headache',
  'Fatigue',
  'Nausea',
  'Dizziness',
  'Anxiety',
  'Stomach pain',
  'Back pain',
  'Insomnia',
  'Congestion',
  'Cough',
  'Muscle aches',
  'Joint pain'
];

export const COMMON_FOODS = [
  'Dairy',
  'Gluten',
  'Caffeine',
  'Alcohol',
  'Sugar',
  'Spicy food',
  'Processed food',
  'Fast food',
  'Vegetables',
  'Fruits',
  'Water',
  'Protein'
];

export const COMMON_ACTIVITIES = [
  'Exercise',
  'Work',
  'Meditation',
  'Reading',
  'Social time',
  'Screen time',
  'Outdoor time',
  'Travel'
];
