import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JournalEntry, MOOD_LABELS } from "@/lib/healthJournalTypes";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { TrendingUp, Moon, Brain } from "lucide-react";

interface ChartsViewProps {
  entries: JournalEntry[];
}

const ChartsView = ({ entries }: ChartsViewProps) => {
  if (entries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No data to visualize yet. Start logging to see charts!</p>
      </Card>
    );
  }

  // Prepare mood data
  const moodData = entries
    .slice(0, 30) // Last 30 entries
    .reverse()
    .map(entry => ({
      date: format(new Date(entry.date), 'MMM dd'),
      mood: entry.mood,
      stress: entry.stressLevel
    }));

  // Prepare sleep data
  const sleepData = entries
    .slice(0, 30)
    .reverse()
    .map(entry => ({
      date: format(new Date(entry.date), 'MMM dd'),
      hours: entry.sleepHours,
      quality: entry.sleepQuality
    }));

  // Calculate averages
  const avgMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
  const avgSleep = entries.reduce((sum, e) => sum + e.sleepHours, 0) / entries.length;
  const avgStress = entries.reduce((sum, e) => sum + e.stressLevel, 0) / entries.length;

  // Most common symptoms
  const symptomFrequency: Record<string, number> = {};
  entries.forEach(entry => {
    entry.symptoms.forEach(symptom => {
      symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
    });
  });

  const topSymptoms = Object.entries(symptomFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([symptom, count]) => ({ symptom, count }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Average Mood</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{avgMood.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">{MOOD_LABELS[Math.round(avgMood) as 1 | 2 | 3 | 4 | 5]}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Moon className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Average Sleep</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{avgSleep.toFixed(1)}h</p>
          <p className="text-sm text-muted-foreground">Quality: {(entries.reduce((sum, e) => sum + e.sleepQuality, 0) / entries.length).toFixed(1)}⭐</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Average Stress</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">{avgStress.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Level {Math.round(avgStress)} of 5</p>
        </Card>
      </div>

      {/* Mood & Stress Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Mood & Stress Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={moodData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Mood"
              dot={{ fill: '#8b5cf6' }}
            />
            <Line 
              type="monotone" 
              dataKey="stress" 
              stroke="#f97316" 
              strokeWidth={2}
              name="Stress"
              dot={{ fill: '#f97316' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Sleep Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sleep Patterns</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sleepData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
            <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="hours" 
              fill="#3b82f6" 
              name="Sleep Hours"
            />
            <Bar 
              yAxisId="right"
              dataKey="quality" 
              fill="#8b5cf6" 
              name="Sleep Quality"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Symptoms */}
      {topSymptoms.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Frequent Symptoms</h3>
          <div className="space-y-3">
            {topSymptoms.map(({ symptom, count }) => (
              <div key={symptom} className="flex items-center justify-between">
                <span className="font-medium">{symptom}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full"
                      style={{ width: `${(count / entries.length) * 100}%` }}
                    />
                  </div>
                  <Badge variant="secondary">{count}x</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChartsView;
