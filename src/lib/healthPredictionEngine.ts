// Predictive Health Analytics Engine
import { JournalEntry } from './healthJournalTypes';
import { WeatherData, WeatherForecast, getCurrentWeather, getWeatherForecast, getWeatherChanges } from './weatherApi';
import { 
  HealthPrediction, 
  PredictionTrigger, 
  RiskLevel, 
  PatternMatch,
  getRecommendationsForSymptom,
  PredictionSettings,
  DEFAULT_PREDICTION_SETTINGS
} from './healthPredictionTypes';

const PREDICTION_STORAGE_KEY = 'bioguard_predictions';
const PREDICTION_SETTINGS_KEY = 'bioguard_prediction_settings';

// Get prediction settings
export const getPredictionSettings = (): PredictionSettings => {
  const stored = localStorage.getItem(PREDICTION_SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PREDICTION_SETTINGS;
    }
  }
  return DEFAULT_PREDICTION_SETTINGS;
};

// Save prediction settings
export const savePredictionSettings = (settings: PredictionSettings): void => {
  localStorage.setItem(PREDICTION_SETTINGS_KEY, JSON.stringify(settings));
};

// Analyze patterns in journal entries
const analyzePatterns = (entries: JournalEntry[]): PatternMatch[] => {
  if (entries.length < 7) return [];

  const patterns: PatternMatch[] = [];
  const symptomOccurrences: Record<string, { dates: string[]; dayOfWeek: number[] }> = {};

  // Collect symptom occurrences
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const dayOfWeek = date.getDay();

    entry.symptoms.forEach(symptom => {
      if (!symptomOccurrences[symptom]) {
        symptomOccurrences[symptom] = { dates: [], dayOfWeek: [] };
      }
      symptomOccurrences[symptom].dates.push(entry.date);
      symptomOccurrences[symptom].dayOfWeek.push(dayOfWeek);
    });
  });

  // Analyze each symptom for patterns
  Object.entries(symptomOccurrences).forEach(([symptom, data]) => {
    if (data.dates.length < 2) return;

    // Check day of week patterns
    const dayFrequency: Record<number, number> = {};
    data.dayOfWeek.forEach(day => {
      dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    });

    const mostCommonDay = Object.entries(dayFrequency)
      .sort(([, a], [, b]) => b - a)[0];

    if (mostCommonDay && parseInt(mostCommonDay[1] as any) >= data.dates.length * 0.4) {
      patterns.push({
        symptom,
        dayOfWeek: parseInt(mostCommonDay[0]),
        frequency: data.dates.length,
        lastOccurrence: data.dates[data.dates.length - 1],
      });
    }

    // Check monthly patterns (e.g., around same time each month)
    const daysOfMonth = data.dates.map(d => new Date(d).getDate());
    const avgDayOfMonth = daysOfMonth.reduce((a, b) => a + b, 0) / daysOfMonth.length;
    const variance = daysOfMonth.reduce((sum, day) => sum + Math.pow(day - avgDayOfMonth, 2), 0) / daysOfMonth.length;

    if (variance < 25 && data.dates.length >= 3) { // Low variance = consistent timing
      patterns.push({
        symptom,
        timeOfMonth: Math.round(avgDayOfMonth),
        frequency: data.dates.length,
        lastOccurrence: data.dates[data.dates.length - 1],
      });
    }
  });

  return patterns;
};

// Analyze weather correlations
const analyzeWeatherTriggers = async (
  entries: JournalEntry[],
  forecast: WeatherForecast[]
): Promise<{ symptom: string; weatherSensitive: boolean; triggers: string[] }[]> => {
  const results: { symptom: string; weatherSensitive: boolean; triggers: string[] }[] = [];
  
  try {
    const currentWeather = await getCurrentWeather();
    const changes = getWeatherChanges(currentWeather, forecast);

    // Analyze each unique symptom
    const symptoms = new Set<string>();
    entries.forEach(e => e.symptoms.forEach(s => symptoms.add(s)));

    symptoms.forEach(symptom => {
      const triggers: string[] = [];
      
      // Check for pressure sensitivity (common for migraines/headaches)
      if (changes.pressureDrop > 5 && (
        symptom.toLowerCase().includes('headache') ||
        symptom.toLowerCase().includes('migraine')
      )) {
        triggers.push('pressure drop');
      }

      // Check for temperature sensitivity
      if (Math.abs(changes.temperatureChange) > 10) {
        triggers.push('temperature change');
      }

      // Check for humidity sensitivity
      if (Math.abs(changes.humidityChange) > 20) {
        triggers.push('humidity change');
      }

      results.push({
        symptom,
        weatherSensitive: triggers.length > 0,
        triggers,
      });
    });
  } catch (error) {
    console.warn("Weather analysis failed:", error);
  }

  return results;
};

// Calculate prediction confidence
const calculateConfidence = (
  patternFrequency: number,
  totalEntries: number,
  weatherMatch: boolean,
  daysSinceLastOccurrence: number
): number => {
  let confidence = 0;

  // Pattern strength (0-0.4)
  const patternStrength = Math.min(patternFrequency / totalEntries, 0.4);
  confidence += patternStrength;

  // Weather correlation (0-0.3)
  if (weatherMatch) {
    confidence += 0.3;
  }

  // Recency factor (0-0.3)
  const recencyScore = Math.max(0, 0.3 - (daysSinceLastOccurrence * 0.02));
  confidence += recencyScore;

  return Math.min(confidence, 1);
};

// Determine risk level
const getRiskLevel = (confidence: number, likelihood: number): RiskLevel => {
  const score = (confidence + likelihood / 100) / 2;
  
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
};

// Generate predictions based on patterns and weather
export const generateHealthPredictions = async (
  entries: JournalEntry[]
): Promise<HealthPrediction[]> => {
  const settings = getPredictionSettings();
  
  if (!settings.enabled || entries.length < 7) {
    return [];
  }

  const predictions: HealthPrediction[] = [];
  const sortedEntries = entries.sort((a, b) => b.date.localeCompare(a.date));
  
  try {
    // Get patterns
    const patterns = analyzePatterns(sortedEntries);
    
    // Get weather forecast if enabled
    let forecast: WeatherForecast[] = [];
    let weatherTriggers: { symptom: string; weatherSensitive: boolean; triggers: string[] }[] = [];
    
    if (settings.weatherIntegration) {
      try {
        forecast = await getWeatherForecast(
          settings.location?.lat,
          settings.location?.lon
        );
        weatherTriggers = await analyzeWeatherTriggers(sortedEntries, forecast);
      } catch (error) {
        console.warn("Weather forecast unavailable:", error);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate predictions from patterns
    patterns.forEach(pattern => {
      const daysSinceLastOccurrence = Math.floor(
        (today.getTime() - new Date(pattern.lastOccurrence).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Predict based on day of week pattern
      if (pattern.dayOfWeek !== undefined) {
        const currentDay = today.getDay();
        let daysUntilPattern = pattern.dayOfWeek - currentDay;
        if (daysUntilPattern <= 0) daysUntilPattern += 7;

        if (daysUntilPattern <= settings.daysToPredict) {
          const weatherMatch = weatherTriggers.find(
            w => w.symptom === pattern.symptom && w.weatherSensitive
          );

          const confidence = calculateConfidence(
            pattern.frequency,
            sortedEntries.length,
            !!weatherMatch,
            daysSinceLastOccurrence
          );

          if (confidence >= settings.minConfidence) {
            const likelihood = Math.round(confidence * 100);
            const predictedDate = new Date(today);
            predictedDate.setDate(predictedDate.getDate() + daysUntilPattern);

            const triggers: PredictionTrigger[] = [
              {
                type: 'pattern',
                factor: 'Weekly pattern',
                impact: 0.6,
                description: `${pattern.symptom} often occurs on this day of the week`,
              },
            ];

            if (weatherMatch && weatherMatch.triggers.length > 0) {
              triggers.push({
                type: 'weather',
                factor: weatherMatch.triggers.join(', '),
                impact: 0.4,
                description: `Weather conditions may trigger symptoms`,
              });
            }

            predictions.push({
              id: `pred-${Date.now()}-${Math.random()}`,
              type: 'symptom',
              symptom: pattern.symptom,
              riskLevel: getRiskLevel(confidence, likelihood),
              confidence,
              daysAhead: daysUntilPattern,
              predictedDate: predictedDate.toISOString().split('T')[0],
              likelihood,
              triggers,
              recommendations: getRecommendationsForSymptom(pattern.symptom).slice(0, 4),
              reasoning: `Based on ${pattern.frequency} previous occurrences and pattern analysis`,
              createdAt: Date.now(),
            });
          }
        }
      }

      // Predict based on monthly pattern
      if (pattern.timeOfMonth !== undefined && !pattern.dayOfWeek) {
        const currentDate = today.getDate();
        const targetDate = pattern.timeOfMonth;
        
        let daysUntilPattern = targetDate - currentDate;
        if (daysUntilPattern < 0) {
          // Next month
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1, targetDate);
          daysUntilPattern = Math.floor(
            (nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        if (daysUntilPattern <= settings.daysToPredict && daysUntilPattern > 0) {
          const confidence = calculateConfidence(
            pattern.frequency,
            sortedEntries.length,
            false,
            daysSinceLastOccurrence
          );

          if (confidence >= settings.minConfidence) {
            const likelihood = Math.round(confidence * 100);
            const predictedDate = new Date(today);
            predictedDate.setDate(predictedDate.getDate() + daysUntilPattern);

            predictions.push({
              id: `pred-${Date.now()}-${Math.random()}`,
              type: 'symptom',
              symptom: pattern.symptom,
              riskLevel: getRiskLevel(confidence, likelihood),
              confidence,
              daysAhead: daysUntilPattern,
              predictedDate: predictedDate.toISOString().split('T')[0],
              likelihood,
              triggers: [
                {
                  type: 'cyclic',
                  factor: 'Monthly cycle',
                  impact: 0.7,
                  description: `${pattern.symptom} tends to occur around day ${targetDate} of the month`,
                },
              ],
              recommendations: getRecommendationsForSymptom(pattern.symptom).slice(0, 4),
              reasoning: `Based on consistent monthly timing pattern`,
              createdAt: Date.now(),
            });
          }
        }
      }
    });

    // Sort by days ahead and confidence
    predictions.sort((a, b) => {
      if (a.daysAhead !== b.daysAhead) return a.daysAhead - b.daysAhead;
      return b.confidence - a.confidence;
    });

    // Store predictions
    savePredictions(predictions);

    return predictions;
  } catch (error) {
    console.error("Error generating predictions:", error);
    return [];
  }
};

// Save predictions to storage
export const savePredictions = (predictions: HealthPrediction[]): void => {
  localStorage.setItem(PREDICTION_STORAGE_KEY, JSON.stringify(predictions));
};

// Get stored predictions
export const getStoredPredictions = (): HealthPrediction[] => {
  const stored = localStorage.getItem(PREDICTION_STORAGE_KEY);
  if (stored) {
    try {
      const predictions = JSON.parse(stored);
      // Filter out expired predictions
      const today = new Date().toISOString().split('T')[0];
      return predictions.filter((p: HealthPrediction) => p.predictedDate >= today);
    } catch {
      return [];
    }
  }
  return [];
};

// Clear old predictions
export const clearOldPredictions = (): void => {
  const predictions = getStoredPredictions();
  const today = new Date().toISOString().split('T')[0];
  const active = predictions.filter(p => p.predictedDate >= today);
  savePredictions(active);
};

// Get predictions for today
export const getTodayPredictions = (): HealthPrediction[] => {
  const predictions = getStoredPredictions();
  const today = new Date().toISOString().split('T')[0];
  return predictions.filter(p => p.predictedDate === today);
};

// Get high-risk predictions
export const getHighRiskPredictions = (): HealthPrediction[] => {
  const predictions = getStoredPredictions();
  return predictions.filter(p => p.riskLevel === 'high');
};
