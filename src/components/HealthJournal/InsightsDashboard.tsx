import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Minus, Brain, Lightbulb, BarChart3, AlertCircle, Loader2 } from "lucide-react";
import { JournalEntry, HealthInsights } from "@/lib/healthJournalTypes";
import { analyzeHealthPatterns } from "@/lib/healthJournalAI";
import { getRecentEntries } from "@/lib/healthJournalStorage";

interface InsightsDashboardProps {
  entries: JournalEntry[];
}

const InsightsDashboard = ({ entries }: InsightsDashboardProps) => {
  const [insights, setInsights] = useState<HealthInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length >= 7) {
      analyzePatterns();
    }
  }, [entries.length]);

  const analyzePatterns = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const recentEntries = getRecentEntries(30);
      const analysis = await analyzeHealthPatterns(recentEntries);
      setInsights(analysis);
    } catch (err) {
      setError("Failed to analyze patterns. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 dark:text-green-400';
      case 'declining':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-950/20';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-950/20';
  };

  if (entries.length < 7) {
    return (
      <Card className="p-12 text-center">
        <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Not Enough Data Yet</h3>
        <p className="text-muted-foreground mb-4">
          Keep logging for at least 7 days to unlock AI-powered pattern detection and personalized insights.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
          <span className="text-2xl font-bold text-primary">{entries.length}</span>
          <span className="text-muted-foreground">/ 7 entries</span>
        </div>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analyzing Your Health Patterns</h3>
        <p className="text-muted-foreground">
          Our AI is examining your journal entries to discover meaningful patterns...
        </p>
      </Card>
    );
  }

  if (error || !insights) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
        <p className="text-muted-foreground mb-4">{error || "Unable to analyze patterns"}</p>
        <Button onClick={analyzePatterns}>Try Again</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Health Insights
          </h2>
          <p className="text-muted-foreground">Based on {entries.length} journal entries</p>
        </div>
        <Button onClick={analyzePatterns} variant="outline">
          Refresh Analysis
        </Button>
      </div>

      {/* Summary */}
      {insights.summary && (
        <Alert className="border-primary/20 bg-primary/5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription className="text-base">
            <strong>Summary:</strong> {insights.summary}
          </AlertDescription>
        </Alert>
      )}

      {/* Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Mood Trend</h3>
            {getTrendIcon(insights.trends.moodTrend)}
          </div>
          <p className={`text-2xl font-bold capitalize ${getTrendColor(insights.trends.moodTrend)}`}>
            {insights.trends.moodTrend}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Sleep Trend</h3>
            {getTrendIcon(insights.trends.sleepTrend)}
          </div>
          <p className={`text-2xl font-bold capitalize ${getTrendColor(insights.trends.sleepTrend)}`}>
            {insights.trends.sleepTrend}
          </p>
        </Card>
      </div>

      {/* Detected Patterns */}
      {insights.patterns.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Detected Patterns
          </h3>
          <div className="space-y-4">
            {insights.patterns.map((pattern) => (
              <Card key={pattern.id} className="p-4 border-2">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {pattern.type}
                      </Badge>
                      <Badge className={getConfidenceColor(pattern.confidence)}>
                        {Math.round(pattern.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="font-medium mb-1">{pattern.pattern}</p>
                    <p className="text-sm text-muted-foreground">
                      Occurred {pattern.occurrences} time{pattern.occurrences !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {pattern.relatedFactors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Related Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {pattern.relatedFactors.map((factor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Recommendation:</strong> {pattern.recommendation}
                  </AlertDescription>
                </Alert>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Correlations */}
      {insights.correlations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Discovered Correlations</h3>
          <div className="space-y-3">
            {insights.correlations.map((correlation, idx) => (
              <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{correlation.factor1}</span>
                  <span className="text-muted-foreground">↔</span>
                  <span className="font-medium">{correlation.factor2}</span>
                  <Badge className={getConfidenceColor(correlation.correlation)}>
                    {Math.round(correlation.correlation * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{correlation.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Symptom Frequency */}
      {Object.keys(insights.trends.symptomsFrequency).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Common Symptoms</h3>
          <div className="space-y-2">
            {Object.entries(insights.trends.symptomsFrequency)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([symptom, count]) => (
                <div key={symptom} className="flex items-center justify-between">
                  <span className="font-medium">{symptom}</span>
                  <Badge variant="secondary">{count} times</Badge>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* No Patterns Found */}
      {insights.patterns.length === 0 && insights.correlations.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No significant patterns detected yet. Keep logging consistently to help our AI discover meaningful insights.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default InsightsDashboard;
