# Predictive Health Alerts - Integration Guide

## Quick Start

### Step 1: Add to Main Dashboard/Page

```tsx
// In your main health journal page component
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HealthPredictions from '@/components/HealthJournal/HealthPredictions';
import PredictionSettings from '@/components/HealthJournal/PredictionSettings';
import { getJournalEntries } from '@/lib/healthJournalStorage';

function HealthJournalPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(getJournalEntries());
  }, []);

  return (
    <Tabs defaultValue="journal">
      <TabsList>
        <TabsTrigger value="journal">Journal</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
        <TabsTrigger value="predictions">🔮 Predictions</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="journal">
        {/* Your existing journal form */}
      </TabsContent>

      <TabsContent value="insights">
        {/* Your existing insights dashboard */}
      </TabsContent>

      <TabsContent value="predictions">
        <HealthPredictions entries={entries} />
      </TabsContent>

      <TabsContent value="settings">
        <PredictionSettings onSettingsChange={() => {
          // Optionally refresh predictions when settings change
        }} />
      </TabsContent>
    </Tabs>
  );
}
```

### Step 2: Add Home Page Widget (Optional)

Show high-risk predictions on the home page:

```tsx
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { getHighRiskPredictions } from '@/lib/healthPredictionEngine';
import { HealthPrediction } from '@/lib/healthPredictionTypes';
import { format } from 'date-fns';

function PredictionWidget() {
  const [highRiskPredictions, setHighRiskPredictions] = useState<HealthPrediction[]>([]);

  useEffect(() => {
    setHighRiskPredictions(getHighRiskPredictions());
  }, []);

  if (highRiskPredictions.length === 0) return null;

  return (
    <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h3 className="font-semibold text-red-900 dark:text-red-100">
          High Risk Alerts
        </h3>
      </div>
      <div className="space-y-2">
        {highRiskPredictions.map((prediction) => (
          <div key={prediction.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{prediction.symptom}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(prediction.predictedDate), 'MMM d')}
              </p>
            </div>
            <Badge variant="destructive">{prediction.likelihood}%</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

### Step 3: Add Notification System (Optional)

```tsx
import { useEffect } from 'react';
import { getTodayPredictions } from '@/lib/healthPredictionEngine';
import { toast } from 'sonner';

function useHealthAlerts() {
  useEffect(() => {
    // Check for today's predictions on load
    const todayPredictions = getTodayPredictions();
    
    if (todayPredictions.length > 0) {
      todayPredictions.forEach(prediction => {
        if (prediction.riskLevel === 'high') {
          toast.warning(`Health Alert: ${prediction.symptom} risk today`, {
            description: prediction.recommendations[0],
            duration: 10000,
          });
        }
      });
    }
  }, []);
}

// Use in your main App component
function App() {
  useHealthAlerts();
  
  return (
    // Your app content
  );
}
```

### Step 4: Auto-Generate Predictions

Add automatic prediction generation when entries are updated:

```tsx
import { useEffect } from 'react';
import { generateHealthPredictions } from '@/lib/healthPredictionEngine';
import { getJournalEntries } from '@/lib/healthJournalStorage';

function useAutoPredict() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const entries = getJournalEntries();
      if (entries.length >= 7) {
        await generateHealthPredictions(entries);
      }
    }, 24 * 60 * 60 * 1000); // Once per day

    return () => clearInterval(interval);
  }, []);
}
```

## Testing the Feature

### 1. Create Test Data

```typescript
import { saveJournalEntry } from '@/lib/healthJournalStorage';
import { JournalEntry } from '@/lib/healthJournalTypes';

// Generate test entries with patterns
function generateTestData() {
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayOfWeek = date.getDay();
    
    // Create Monday headache pattern
    const symptoms = dayOfWeek === 1 ? ['Headache', 'Fatigue'] : 
                     dayOfWeek === 5 ? ['Back pain'] : [];
    
    const entry: JournalEntry = {
      id: `test-${i}`,
      date: date.toISOString().split('T')[0],
      mood: Math.floor(Math.random() * 3) + 2,
      symptoms,
      diet: ['Vegetables', 'Water'],
      sleepHours: 7 + Math.random() * 2,
      sleepQuality: Math.floor(Math.random() * 3) + 2,
      activities: ['Work'],
      stressLevel: Math.floor(Math.random() * 3) + 2,
      createdAt: Date.now() - (i * 24 * 60 * 60 * 1000),
    };
    
    saveJournalEntry(entry);
  }
}
```

### 2. Test Predictions

```typescript
import { generateHealthPredictions } from '@/lib/healthPredictionEngine';
import { getJournalEntries } from '@/lib/healthJournalStorage';

async function testPredictions() {
  const entries = getJournalEntries();
  console.log(`Testing with ${entries.length} entries`);
  
  const predictions = await generateHealthPredictions(entries);
  console.log(`Generated ${predictions.length} predictions`);
  
  predictions.forEach(p => {
    console.log(`${p.symptom}: ${p.likelihood}% (${p.daysAhead} days ahead)`);
  });
}
```

## Common Scenarios

### Scenario 1: Weekly Migraine Pattern

User logs migraines every Monday for 4 weeks:
- **Detection**: Weekly pattern on Mondays
- **Prediction**: 80%+ likelihood of migraine next Monday
- **Risk**: High (if confidence > 70%)
- **Recommendations**: Prevention tips for migraines

### Scenario 2: Weather-Triggered Symptoms

User has headaches during pressure drops:
- **Detection**: Weather correlation with symptoms
- **Prediction**: 65% likelihood when pressure drop forecast
- **Risk**: Medium-High
- **Trigger**: Pressure drop + historical pattern

### Scenario 3: Monthly Cycle

User experiences fatigue around day 15 of each month:
- **Detection**: Monthly pattern
- **Prediction**: 70% likelihood on day 15
- **Risk**: Medium
- **Trigger**: Cyclic pattern

## Troubleshooting

### Issue: No Predictions Generated
**Solution:**
```typescript
// Check entry count
const entries = getJournalEntries();
console.log('Entries:', entries.length); // Need 7+

// Check settings
import { getPredictionSettings } from '@/lib/healthPredictionEngine';
const settings = getPredictionSettings();
console.log('Enabled:', settings.enabled);
console.log('Min Confidence:', settings.minConfidence); // Try lowering
```

### Issue: Low Accuracy
**Solution:**
- Increase journal entries (30+ recommended)
- Log symptoms consistently
- Enable weather integration
- Set accurate location
- Use detailed symptom names

### Issue: Weather Data Failing
**Solution:**
```typescript
// Test weather API directly
import { getCurrentWeather } from '@/lib/weatherApi';

getCurrentWeather()
  .then(weather => console.log('Weather:', weather))
  .catch(err => console.error('Weather error:', err));
```

## Performance Tips

1. **Cache Predictions**: Don't regenerate on every page load
2. **Lazy Load**: Load prediction component only when needed
3. **Background Processing**: Generate predictions in background
4. **Throttle API Calls**: Weather API calls should be limited
5. **Clear Old Data**: Periodically clear expired predictions

```typescript
import { clearOldPredictions } from '@/lib/healthPredictionEngine';

// Run periodically
setInterval(() => {
  clearOldPredictions();
}, 24 * 60 * 60 * 1000); // Daily
```

## Advanced Usage

### Custom Prediction Logic

```typescript
import { analyzePatterns } from '@/lib/healthPredictionEngine';

// Extend with custom analysis
function customPredictionLogic(entries: JournalEntry[]) {
  const patterns = analyzePatterns(entries);
  
  // Add your custom logic
  const customPredictions = patterns
    .filter(p => p.frequency > 5)
    .map(p => ({
      // Your custom prediction format
    }));
  
  return customPredictions;
}
```

### Custom Recommendations

```typescript
import { PREVENTION_RECOMMENDATIONS } from '@/lib/healthPredictionTypes';

// Add custom recommendations
PREVENTION_RECOMMENDATIONS['my_symptom'] = [
  'Custom recommendation 1',
  'Custom recommendation 2',
];
```

## Summary

The Predictive Health Alerts feature is now ready to use! Simply:

1. ✅ Import the components
2. ✅ Add to your UI (tabs/pages)
3. ✅ Pass journal entries as props
4. ✅ Let users configure settings
5. ✅ Watch predictions improve over time

The system is fully self-contained with no external API keys required (weather API is free and public).
