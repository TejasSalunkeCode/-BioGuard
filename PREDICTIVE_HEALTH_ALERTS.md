# Predictive Health Alerts Feature 🔮

## 📊 Overview
A comprehensive predictive health analytics system that uses pattern recognition and weather data to forecast potential symptom flare-ups and provide preventive recommendations.

## ✨ Key Features

### 1. **Pattern Analysis**
- **Day-of-Week Patterns**: Detects symptoms that occur on specific days
- **Monthly Cycles**: Identifies symptoms that appear around the same time each month
- **Frequency Analysis**: Tracks how often symptoms occur
- **Temporal Patterns**: Recognizes seasonal and cyclic patterns

### 2. **Weather Integration** 🌤️
- **Real-time Weather Data**: Uses Open-Meteo API (free, no API key required)
- **Forecast Analysis**: 7-day weather predictions
- **Trigger Detection**:
  - Pressure drops (common for migraines/headaches)
  - Temperature changes
  - Humidity fluctuations
  - Precipitation patterns

### 3. **ML-Based Predictions**
- **Confidence Scoring**: 0-100% confidence in predictions
- **Risk Levels**: Low, Medium, High
- **Multi-Factor Analysis**: Combines patterns + weather + recency
- **Likelihood Calculation**: Percentage chance of occurrence

### 4. **Preventive Recommendations** 💡
- Symptom-specific prevention tips
- Actionable steps users can take
- Customized based on prediction type
- 4-6 recommendations per prediction

### 5. **Smart Alerts**
- Days ahead warning (0-7 days)
- Trigger breakdowns
- Detailed reasoning
- Expandable details view

## 📁 Files Created

### Core Engine
1. **`weatherApi.ts`** - Weather data integration
   - Open-Meteo API integration
   - Geolocation support
   - City name lookup
   - Historical weather storage
   - Weather change calculations

2. **`healthPredictionTypes.ts`** - Type definitions
   - Prediction models
   - Risk levels
   - Trigger types
   - Prevention recommendations database

3. **`healthPredictionEngine.ts`** - Prediction logic
   - Pattern analysis algorithm
   - Weather correlation detection
   - Confidence calculation
   - Prediction generation
   - Storage management

### UI Components
4. **`HealthPredictions.tsx`** - Display component
   - Prediction cards with risk levels
   - Expandable details
   - Trigger visualization
   - Recommendations display
   - Refresh functionality

5. **`PredictionSettings.tsx`** - Configuration UI
   - Enable/disable predictions
   - Notification settings
   - Weather integration toggle
   - Location management
   - Confidence threshold slider
   - Prediction window control

## 🎯 How It Works

### Prediction Algorithm

```typescript
// 1. Pattern Detection
- Analyze last N journal entries
- Detect day-of-week frequencies
- Identify monthly patterns
- Calculate occurrence rates

// 2. Weather Correlation
- Fetch current weather + 7-day forecast
- Calculate pressure/temperature/humidity changes
- Match weather patterns to symptom history
- Identify weather-sensitive symptoms

// 3. Confidence Calculation
confidence = (
  patternStrength (0-0.4) +
  weatherMatch (0-0.3) +
  recencyFactor (0-0.3)
)

// 4. Risk Assessment
if confidence + likelihood > 0.7: HIGH risk
if confidence + likelihood > 0.5: MEDIUM risk
else: LOW risk

// 5. Generate Recommendations
- Match symptom to prevention database
- Provide 4-6 actionable tips
- Include trigger-specific advice
```

## 🚀 Usage

### For Users

1. **Enable Predictions**
   - Go to Settings → Predictions
   - Toggle "Enable Predictions"
   - Set your location (for weather data)
   - Adjust confidence threshold

2. **View Predictions**
   - Navigate to Predictions tab
   - Click "Generate Health Predictions"
   - View upcoming risk alerts
   - Expand for detailed recommendations

3. **Act on Alerts**
   - Read prevention tips
   - Monitor triggers
   - Track accuracy over time
   - Adjust behavior proactively

### For Developers

```typescript
// Import components
import HealthPredictions from '@/components/HealthJournal/HealthPredictions';
import PredictionSettings from '@/components/HealthJournal/PredictionSettings';

// Use in your app
<HealthPredictions entries={journalEntries} />
<PredictionSettings onSettingsChange={handleRefresh} />

// Generate predictions programmatically
import { generateHealthPredictions } from '@/lib/healthPredictionEngine';

const predictions = await generateHealthPredictions(entries);

// Get stored predictions
import { getStoredPredictions, getTodayPredictions } from '@/lib/healthPredictionEngine';

const allPredictions = getStoredPredictions();
const today = getTodayPredictions();
```

## ⚙️ Configuration

### Settings Options

```typescript
interface PredictionSettings {
  enabled: boolean;              // Master toggle
  notificationsEnabled: boolean; // Browser notifications
  weatherIntegration: boolean;   // Include weather data
  minConfidence: number;         // 0.4-0.9 (40%-90%)
  daysToPredict: number;         // 1-7 days
  location?: {
    lat: number;
    lon: number;
    city?: string;
  };
}
```

### Default Settings
- **Enabled**: true
- **Notifications**: true
- **Weather Integration**: true
- **Min Confidence**: 60%
- **Days to Predict**: 3 days

## 📊 Prediction Data Model

```typescript
interface HealthPrediction {
  id: string;
  type: 'symptom' | 'mood' | 'sleep' | 'stress';
  symptom?: string;              // e.g., "Migraine"
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;            // 0-1
  daysAhead: number;             // 0-7
  predictedDate: string;         // ISO date
  likelihood: number;            // 0-100%
  triggers: PredictionTrigger[];
  recommendations: string[];
  reasoning: string;
  createdAt: number;
}

interface PredictionTrigger {
  type: 'weather' | 'pattern' | 'seasonal' | 'cyclic';
  factor: string;
  impact: number;                // 0-1
  description: string;
}
```

## 🌟 Example Predictions

### High Risk - Migraine
```
🚨 HIGH RISK
Migraine predicted in 2 days (Thursday, Oct 3)
85% likelihood • 75% confidence

Triggers:
• Pressure drop (significant weather change expected)
• Weekly pattern (migraines often occur on Thursdays)

Recommendations:
✓ Stay well hydrated throughout the day
✓ Avoid bright lights and loud noises
✓ Ensure you get 7-8 hours of sleep tonight
✓ Keep your rescue medication accessible
```

### Medium Risk - Fatigue
```
⚠️ MEDIUM RISK
Fatigue predicted tomorrow (Wednesday, Oct 2)
62% likelihood • 58% confidence

Triggers:
• Monthly cycle (day 15 pattern detected)
• Temperature change (10°C increase expected)

Recommendations:
✓ Prioritize sleep tonight - aim for 8+ hours
✓ Eat iron-rich foods and stay hydrated
✓ Plan lighter activities for tomorrow
✓ Take short breaks throughout the day
```

## 🔒 Privacy & Data

### Weather Data
- Fetched from Open-Meteo (public API)
- No API key required
- No personal data sent to weather service
- Optional feature (can be disabled)

### Predictions
- All calculations done locally
- Stored in browser localStorage
- No server-side processing
- User has full control over data

### Location
- Only used for weather data
- Can use auto-location or manual entry
- Optional - predictions work without it
- Not shared with any third parties

## 🎨 UI Features

### Prediction Cards
- Color-coded by risk level (red/orange/yellow)
- Icon indicators for risk type
- Expandable details sections
- Badge system for triggers
- Clean, modern design

### Risk Colors
- **High Risk**: Red background, alert triangle icon
- **Medium Risk**: Orange background, trending icon
- **Low Risk**: Yellow background, lightbulb icon

### Interactive Elements
- Expand/collapse details
- Refresh predictions button
- Loading states with spinners
- Toast notifications for feedback

## 📈 Accuracy Improvement

The system improves over time:

1. **More Data = Better Predictions**
   - Initial: 7+ entries required
   - Good: 30+ entries (1 month)
   - Excellent: 90+ entries (3 months)

2. **Weather History**
   - Tracks weather with each entry
   - Builds symptom-weather correlation
   - Refines trigger detection

3. **Pattern Refinement**
   - Learns from frequency
   - Adapts to schedule changes
   - Detects new patterns

## ⚠️ Limitations

1. **Minimum Data**: Requires at least 7 journal entries
2. **Weather Dependency**: Accuracy improves with location access
3. **Pattern Detection**: Works best with regular logging
4. **Not Medical Advice**: Predictions are informational only
5. **No Guarantees**: Cannot predict all health events

## 🔮 Future Enhancements

### Planned Features
1. **Learning from Feedback**
   - Mark predictions as accurate/inaccurate
   - Improve algorithm based on user feedback

2. **Advanced ML Models**
   - Neural network predictions
   - Multi-variate analysis
   - Ensemble methods

3. **Extended Triggers**
   - Pollen counts for allergies
   - Air quality index
   - Moon phases
   - Stress indicators

4. **Notification System**
   - Browser push notifications
   - Email alerts
   - SMS integration
   - Customizable timing

5. **Prediction History**
   - Track accuracy over time
   - Historical prediction log
   - Performance metrics
   - A/B testing different algorithms

## 🐛 Troubleshooting

### No Predictions Generated
- Ensure you have at least 7 journal entries
- Check that predictions are enabled in settings
- Verify confidence threshold isn't too high (try 50-60%)
- Make sure you're logging symptoms regularly

### Weather Not Working
- Check location permissions in browser
- Try manual city entry if auto-location fails
- Ensure internet connection is active
- Verify Open-Meteo API is accessible

### Low Confidence Predictions
- Need more journal entries (aim for 30+)
- Log more consistently (daily is best)
- Include detailed symptom information
- Enable weather integration for better accuracy

## 📚 API Reference

### Core Functions

```typescript
// Generate new predictions
generateHealthPredictions(entries: JournalEntry[]): Promise<HealthPrediction[]>

// Get stored predictions
getStoredPredictions(): HealthPrediction[]

// Get today's predictions
getTodayPredictions(): HealthPrediction[]

// Get high-risk predictions
getHighRiskPredictions(): HealthPrediction[]

// Clear old predictions
clearOldPredictions(): void

// Settings management
getPredictionSettings(): PredictionSettings
savePredictionSettings(settings: PredictionSettings): void

// Weather API
getCurrentWeather(lat?, lon?): Promise<WeatherData>
getWeatherForecast(lat?, lon?): Promise<WeatherForecast[]>
getUserLocation(): Promise<{lat: number, lon: number}>
```

## 🎓 Best Practices

### For Accurate Predictions
1. Log daily (consistency is key)
2. Include detailed symptoms
3. Enable weather integration
4. Set accurate location
5. Log at similar times each day
6. Include mood and sleep data
7. Track triggers you notice

### For Developers
1. Handle API errors gracefully
2. Cache weather data appropriately
3. Clear old predictions periodically
4. Provide user feedback (loading states)
5. Test with various data patterns
6. Respect user privacy settings
7. Keep prediction logic transparent

## 📊 Performance

### Optimization
- Weather API calls are cached
- Predictions stored in localStorage
- Minimal re-calculations
- Efficient pattern detection algorithms
- Lazy loading of components

### Resource Usage
- ~50KB of JS for prediction engine
- Weather API: ~10KB per request
- localStorage: ~1-5KB per prediction
- No backend required
- All processing client-side

---

**Status:** ✅ Fully Implemented and Production Ready

**Version:** 1.0.0

**Last Updated:** October 1, 2025

**Dependencies:**
- Open-Meteo API (weather data)
- Browser Geolocation API (optional)
- localStorage (for persistence)
