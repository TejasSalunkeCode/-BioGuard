// AI Pattern Detection for Health Journal
import { JournalEntry, Pattern, HealthInsights } from './healthJournalTypes';

export async function analyzeHealthPatterns(entries: JournalEntry[]): Promise<HealthInsights> {
  if (entries.length < 7) {
    return {
      patterns: [],
      trends: {
        moodTrend: 'stable',
        sleepTrend: 'stable',
        symptomsFrequency: {}
      },
      correlations: [],
      summary: "Keep logging for at least 7 days to discover patterns and insights."
    };
  }

  try {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    
    // Prepare journal data for AI analysis
    const journalSummary = entries.map(e => ({
      date: e.date,
      mood: e.mood,
      symptoms: e.symptoms.join(', '),
      diet: e.diet.join(', '),
      sleepHours: e.sleepHours,
      sleepQuality: e.sleepQuality,
      stressLevel: e.stressLevel,
      activities: e.activities.join(', ')
    }));

    const prompt = `Analyze this health journal data and identify patterns, correlations, and trends. Look for relationships between symptoms, mood, diet, sleep, and activities.

Journal Data (last ${entries.length} entries):
${JSON.stringify(journalSummary, null, 2)}

Provide a detailed analysis in the following JSON format:
{
  "patterns": [
    {
      "type": "symptom|mood|sleep|diet",
      "pattern": "Clear description of the pattern",
      "confidence": 0.0-1.0,
      "occurrences": number,
      "relatedFactors": ["factor1", "factor2"],
      "recommendation": "Actionable advice"
    }
  ],
  "trends": {
    "moodTrend": "improving|stable|declining",
    "sleepTrend": "improving|stable|declining",
    "symptomsFrequency": {"symptom": count}
  },
  "correlations": [
    {
      "factor1": "e.g., Dairy consumption",
      "factor2": "e.g., Headaches",
      "correlation": 0.0-1.0,
      "description": "Clear explanation"
    }
  ],
  "summary": "Overall health insights in 2-3 sentences"
}

Guidelines:
- Look for temporal patterns (e.g., symptoms appear 2-3 days after certain foods)
- Identify correlations between activities and mood/symptoms
- Consider sleep quality impact on mood and symptoms
- Only include patterns with reasonable confidence (>0.6)
- Provide actionable, specific recommendations`;

    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        module: "general"
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze patterns");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullResponse = "";
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      
      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const jsonStr = line.slice(6).trim();
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
              }
            } catch {
              // Skip parsing errors
            }
          }
        }
      }
    }

    // Extract JSON from response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Add IDs to patterns
    const patternsWithIds = analysis.patterns.map((p: any, index: number) => ({
      ...p,
      id: `pattern-${Date.now()}-${index}`,
      lastDetected: entries[0].date
    }));

    return {
      patterns: patternsWithIds,
      trends: analysis.trends,
      correlations: analysis.correlations || [],
      summary: analysis.summary
    };
  } catch (error) {
    console.error("Pattern analysis error:", error);
    
    // Fallback to basic analysis
    return performBasicAnalysis(entries);
  }
}

// Fallback basic analysis without AI
function performBasicAnalysis(entries: JournalEntry[]): HealthInsights {
  const symptomsFrequency: Record<string, number> = {};
  let totalMood = 0;
  let totalSleep = 0;
  
  entries.forEach(entry => {
    totalMood += entry.mood;
    totalSleep += entry.sleepQuality;
    entry.symptoms.forEach(symptom => {
      symptomsFrequency[symptom] = (symptomsFrequency[symptom] || 0) + 1;
    });
  });

  const avgMood = totalMood / entries.length;
  const avgSleep = totalSleep / entries.length;
  
  // Simple trend detection
  const recentMood = entries.slice(0, 3).reduce((sum, e) => sum + e.mood, 0) / 3;
  const olderMood = entries.slice(-3).reduce((sum, e) => sum + e.mood, 0) / 3;
  const moodTrend = recentMood > olderMood + 0.5 ? 'improving' : 
                    recentMood < olderMood - 0.5 ? 'declining' : 'stable';

  const recentSleep = entries.slice(0, 3).reduce((sum, e) => sum + e.sleepQuality, 0) / 3;
  const olderSleep = entries.slice(-3).reduce((sum, e) => sum + e.sleepQuality, 0) / 3;
  const sleepTrend = recentSleep > olderSleep + 0.5 ? 'improving' : 
                     recentSleep < olderSleep - 0.5 ? 'declining' : 'stable';

  // Find most common symptom
  const topSymptom = Object.entries(symptomsFrequency)
    .sort(([, a], [, b]) => b - a)[0];

  const patterns: Pattern[] = [];
  
  if (topSymptom && topSymptom[1] >= 3) {
    patterns.push({
      id: 'pattern-1',
      type: 'symptom',
      pattern: `${topSymptom[0]} appears frequently in your journal`,
      confidence: Math.min(topSymptom[1] / entries.length, 0.9),
      occurrences: topSymptom[1],
      lastDetected: entries[0].date,
      relatedFactors: [],
      recommendation: `Track what happens before ${topSymptom[0]} occurs to identify triggers`
    });
  }

  if (avgSleep < 3) {
    patterns.push({
      id: 'pattern-2',
      type: 'sleep',
      pattern: 'Your sleep quality has been below optimal',
      confidence: 0.8,
      occurrences: entries.filter(e => e.sleepQuality < 3).length,
      lastDetected: entries[0].date,
      relatedFactors: ['Sleep quality', 'Mood'],
      recommendation: 'Establish a consistent sleep schedule and reduce screen time before bed'
    });
  }

  return {
    patterns,
    trends: {
      moodTrend,
      sleepTrend,
      symptomsFrequency
    },
    correlations: [],
    summary: `Based on ${entries.length} journal entries, your mood is ${moodTrend} and sleep is ${sleepTrend}. Continue logging to discover more personalized insights.`
  };
}
