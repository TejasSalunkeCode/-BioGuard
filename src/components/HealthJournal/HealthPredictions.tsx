import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  TrendingUp, 
  CloudRain, 
  Calendar, 
  Lightbulb, 
  RefreshCw, 
  Settings,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2
} from "lucide-react";
import { JournalEntry } from "@/lib/healthJournalTypes";
import { HealthPrediction, RiskLevel } from "@/lib/healthPredictionTypes";
import { generateHealthPredictions, getStoredPredictions } from "@/lib/healthPredictionEngine";
import { toast } from "sonner";
import { format } from "date-fns";

interface HealthPredictionsProps {
  entries: JournalEntry[];
}

const HealthPredictions = ({ entries }: HealthPredictionsProps) => {
  const [predictions, setPredictions] = useState<HealthPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPrediction, setExpandedPrediction] = useState<string | null>(null);

  useEffect(() => {
    // Load stored predictions on mount
    const stored = getStoredPredictions();
    if (stored.length > 0) {
      setPredictions(stored);
    } else if (entries.length >= 7) {
      // Generate if none exist
      generatePredictions();
    }
  }, []);

  const generatePredictions = async () => {
    if (entries.length < 7) {
      toast.error("Need at least 7 journal entries to generate predictions");
      return;
    }

    setIsLoading(true);
    try {
      const newPredictions = await generateHealthPredictions(entries);
      setPredictions(newPredictions);
      
      if (newPredictions.length === 0) {
        toast.info("No significant patterns detected yet. Keep logging!");
      } else {
        toast.success(`Generated ${newPredictions.length} health prediction(s)`);
      }
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error("Failed to generate predictions");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/20';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/20';
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/20';
    }
  };

  const getRiskIcon = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <TrendingUp className="h-5 w-5" />;
      case 'low':
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <CloudRain className="h-4 w-4" />;
      case 'pattern':
        return <TrendingUp className="h-4 w-4" />;
      case 'cyclic':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getDaysAheadText = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  if (entries.length < 7) {
    return (
      <Card className="p-12 text-center">
        <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Predictive Analytics Coming Soon</h3>
        <p className="text-muted-foreground mb-4">
          Log at least 7 days of health data to unlock AI-powered predictions and health alerts.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
          <span className="text-2xl font-bold text-primary">{entries.length}</span>
          <span className="text-muted-foreground">/ 7 entries</span>
        </div>
      </Card>
    );
  }

  if (predictions.length === 0 && !isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center mb-6">
          <TrendingUp className="h-12 w-12 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-2">Ready for Predictions</h3>
          <p className="text-muted-foreground mb-4">
            Generate health predictions based on your {entries.length} journal entries and weather patterns.
          </p>
        </div>
        <Button onClick={generatePredictions} className="w-full" size="lg">
          <Zap className="h-4 w-4 mr-2" />
          Generate Health Predictions
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Health Predictions
          </h2>
          <p className="text-muted-foreground">
            AI-powered alerts based on patterns and weather
          </p>
        </div>
        <Button
          onClick={generatePredictions}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Analyzing...' : 'Refresh'}
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
          <strong>How it works:</strong> Our AI analyzes your health patterns, day-of-week trends, and weather 
          conditions to predict potential symptom flare-ups and provide preventive recommendations.
        </AlertDescription>
      </Alert>

      {/* Predictions List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Analyzing patterns and generating predictions...</p>
        </Card>
      ) : predictions.length > 0 ? (
        <div className="space-y-3">
          {predictions.map((prediction) => (
            <Card
              key={prediction.id}
              className={`p-5 border-2 ${getRiskColor(prediction.riskLevel)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getRiskColor(prediction.riskLevel)}`}>
                    {getRiskIcon(prediction.riskLevel)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{prediction.symptom || 'Health Event'}</h3>
                      <Badge variant="outline" className="text-xs">
                        {getDaysAheadText(prediction.daysAhead)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(prediction.predictedDate), 'EEEE, MMMM d')}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">
                        Risk: <span className="uppercase">{prediction.riskLevel}</span>
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium">
                        {prediction.likelihood}% likelihood
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {Math.round(prediction.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedPrediction(
                    expandedPrediction === prediction.id ? null : prediction.id
                  )}
                >
                  {expandedPrediction === prediction.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Reasoning */}
              <p className="text-sm mb-4 italic text-muted-foreground">
                {prediction.reasoning}
              </p>

              {/* Triggers */}
              {prediction.triggers.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Detected Triggers:</p>
                  <div className="flex flex-wrap gap-2">
                    {prediction.triggers.map((trigger, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {getTriggerIcon(trigger.type)}
                        {trigger.factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {expandedPrediction === prediction.id && (
                <div className="mt-4 pt-4 border-t space-y-4 animate-slide-down">
                  {/* Trigger Details */}
                  <div>
                    <p className="text-sm font-medium mb-2">Trigger Details:</p>
                    <div className="space-y-2">
                      {prediction.triggers.map((trigger, idx) => (
                        <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            {getTriggerIcon(trigger.type)}
                            <span className="font-medium text-sm">{trigger.factor}</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {Math.round(trigger.impact * 100)}% impact
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{trigger.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Preventive Actions:
                    </p>
                    <ul className="space-y-2">
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Quick Recommendations (if not expanded) */}
              {expandedPrediction !== prediction.id && prediction.recommendations.length > 0 && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Quick Tips:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prediction.recommendations[0]}
                  </p>
                  {prediction.recommendations.length > 1 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs mt-1"
                      onClick={() => setExpandedPrediction(prediction.id)}
                    >
                      +{prediction.recommendations.length - 1} more tips
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <h3 className="font-semibold mb-2">No Predictions at This Time</h3>
          <p className="text-sm text-muted-foreground">
            No significant patterns detected for the next few days. Keep logging to improve predictions!
          </p>
        </Card>
      )}
    </div>
  );
};

export default HealthPredictions;
