import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, CheckCircle2, PhoneCall, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { analyzeSymptoms, SymptomAnalysis } from "@/lib/symptomApi";
import { toast } from "sonner";

const PredictGuard = () => {
  const [symptoms, setSymptoms] = useState("");
  const [prediction, setPrediction] = useState<SymptomAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysis = await analyzeSymptoms(symptoms);
      setPrediction(analysis);
      toast.success("Symptom analysis complete!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze symptoms";
      setError(errorMessage);
      setPrediction(null);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-200";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-200";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-950/20 rounded-2xl mb-4">
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">PredictGuard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered symptom checker to help identify possible conditions and provide early-care guidance
          </p>
        </div>

        {/* Input Section */}
        <Card className="p-6 shadow-card animate-slide-up">
          <h3 className="text-lg font-semibold mb-4">Describe Your Symptoms</h3>
          <Textarea
            placeholder="Example: I have a headache, runny nose, and slight fever for 2 days..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="min-h-[120px] mb-4"
            disabled={isAnalyzing}
          />
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !symptoms.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isAnalyzing ? "Analyzing Symptoms..." : "Analyze Symptoms"}
          </Button>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 animate-scale-in">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {prediction && (
          <div className="space-y-4 animate-scale-in">
            {/* Severity Badge */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                <Badge className={getSeverityColor(prediction.severity)}>
                  {prediction.severity.toUpperCase()} SEVERITY
                </Badge>
              </div>

              {/* Possible Conditions */}
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">Possible Conditions:</h4>
                <div className="flex flex-wrap gap-2">
                  {prediction.conditions.map((condition) => (
                    <Badge key={condition} variant="secondary" className="text-base">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Reasoning */}
            {prediction.reasoning && (
              <Card className="p-6 shadow-card bg-muted/30">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Analysis Summary
                </h3>
                <p className="text-muted-foreground">{prediction.reasoning}</p>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Care Recommendations
              </h3>
              <ul className="space-y-3">
                {prediction.recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Doctor Alert */}
            {prediction.seekDoctor ? (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <PhoneCall className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <strong>Seek Medical Attention:</strong> Based on your symptoms, we recommend consulting a healthcare professional as soon as possible.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Self-Care Recommended:</strong> These symptoms can typically be managed at home. However, if symptoms worsen or persist beyond 7 days, please consult a doctor.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <Alert className="border-primary/20 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Important:</strong> This is not a medical diagnosis. AI predictions are for informational purposes only. 
            Always consult a qualified healthcare professional for proper diagnosis and treatment. In case of emergency, call your local emergency services immediately.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default PredictGuard;
