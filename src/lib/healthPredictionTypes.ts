// Health Prediction Types and Models

export type PredictionType = 'symptom' | 'mood' | 'sleep' | 'stress' | 'general';
export type RiskLevel = 'low' | 'medium' | 'high';
export type TriggerType = 'weather' | 'pattern' | 'seasonal' | 'cyclic';

export interface HealthPrediction {
  id: string;
  type: PredictionType;
  symptom?: string; // Specific symptom being predicted
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  daysAhead: number; // 1-7
  predictedDate: string;
  likelihood: number; // 0-100 percentage
  triggers: PredictionTrigger[];
  recommendations: string[];
  reasoning: string;
  createdAt: number;
}

export interface PredictionTrigger {
  type: TriggerType;
  factor: string;
  impact: number; // 0-1
  description: string;
}

export interface WeatherTrigger {
  pressureChange: boolean;
  temperatureChange: boolean;
  humidityChange: boolean;
  precipitation: boolean;
}

export interface PatternMatch {
  symptom: string;
  dayOfWeek?: number;
  timeOfMonth?: number;
  seasonalPattern?: boolean;
  frequency: number; // How often this pattern occurred
  lastOccurrence: string;
}

export interface PredictionSettings {
  enabled: boolean;
  notificationsEnabled: boolean;
  weatherIntegration: boolean;
  minConfidence: number; // 0-1, minimum confidence to show prediction
  daysToPredict: number; // 1-7
  location?: {
    lat: number;
    lon: number;
    city?: string;
  };
}

export const DEFAULT_PREDICTION_SETTINGS: PredictionSettings = {
  enabled: true,
  notificationsEnabled: true,
  weatherIntegration: true,
  minConfidence: 0.6,
  daysToPredict: 3,
};

// Recommendation templates based on prediction type
export const PREVENTION_RECOMMENDATIONS: Record<string, string[]> = {
  migraine: [
    "Stay well hydrated throughout the day",
    "Avoid bright lights and loud noises",
    "Ensure you get 7-8 hours of sleep tonight",
    "Keep your rescue medication accessible",
    "Avoid known trigger foods (caffeine, alcohol, aged cheese)",
    "Practice stress-reduction techniques",
  ],
  headache: [
    "Stay hydrated with water",
    "Reduce screen time and take regular breaks",
    "Ensure proper sleep schedule",
    "Check your posture if working at a desk",
    "Consider a gentle walk in fresh air",
  ],
  fatigue: [
    "Prioritize sleep tonight - aim for 8+ hours",
    "Eat iron-rich foods and stay hydrated",
    "Plan lighter activities for tomorrow",
    "Take short breaks throughout the day",
    "Consider a brief afternoon nap if possible",
  ],
  anxiety: [
    "Practice deep breathing or meditation",
    "Limit caffeine intake",
    "Engage in light exercise or yoga",
    "Ensure adequate sleep",
    "Consider journaling your thoughts",
    "Reach out to supportive friends or family",
  ],
  insomnia: [
    "Avoid caffeine after 2 PM",
    "Limit screen time 1 hour before bed",
    "Keep bedroom cool and dark",
    "Try relaxation techniques before sleep",
    "Maintain a consistent sleep schedule",
  ],
  "stomach pain": [
    "Eat smaller, more frequent meals",
    "Avoid spicy or fatty foods",
    "Stay hydrated with water or herbal tea",
    "Consider bland foods (rice, bananas, toast)",
    "Avoid lying down immediately after eating",
  ],
  "low mood": [
    "Spend time outdoors in natural light",
    "Connect with friends or loved ones",
    "Engage in enjoyable activities",
    "Exercise - even a short walk helps",
    "Practice gratitude or positive thinking",
    "Ensure adequate sleep",
  ],
  "poor sleep": [
    "Establish a relaxing bedtime routine",
    "Keep consistent sleep/wake times",
    "Avoid heavy meals before bed",
    "Create a cool, dark sleep environment",
    "Limit daytime napping",
  ],
  "high stress": [
    "Schedule breaks and downtime",
    "Practice mindfulness or meditation",
    "Engage in physical activity",
    "Delegate tasks if possible",
    "Ensure you're eating regular meals",
    "Talk to someone you trust",
  ],
};

// Get recommendations for a symptom
export const getRecommendationsForSymptom = (symptom: string): string[] => {
  const normalizedSymptom = symptom.toLowerCase();
  
  // Check for exact match
  if (PREVENTION_RECOMMENDATIONS[normalizedSymptom]) {
    return PREVENTION_RECOMMENDATIONS[normalizedSymptom];
  }
  
  // Check for partial matches
  for (const [key, recommendations] of Object.entries(PREVENTION_RECOMMENDATIONS)) {
    if (normalizedSymptom.includes(key) || key.includes(normalizedSymptom)) {
      return recommendations;
    }
  }
  
  // Default recommendations
  return [
    "Monitor your symptoms closely",
    "Stay well hydrated",
    "Get adequate rest",
    "Avoid known triggers",
    "Contact your healthcare provider if symptoms worsen",
  ];
};
