import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Search, AlertTriangle, DollarSign, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { searchMedicine, MedicineInfo } from "@/lib/medicineApi";
import { toast } from "sonner";

const MedGuard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<MedicineInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a medicine name");
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const medicineData = await searchMedicine(searchQuery);
      setResult(medicineData);
      toast.success("Medicine information retrieved successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch medicine information";
      setError(errorMessage);
      setResult(null);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-950/20 rounded-2xl mb-4">
            <Pill className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">MedGuard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Search for medicine information, dosage, side effects, and affordable alternatives
          </p>
        </div>

        {/* Search Section */}
        <Card className="p-6 shadow-card animate-slide-up">
          <div className="flex gap-3">
            <Input
              placeholder="Search medicine name (e.g., Amoxicillin, Ibuprofen, Lisinopril)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
              disabled={isSearching}
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 animate-scale-in">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-scale-in">
            {/* Medicine Name */}
            <Card className="p-6 shadow-card">
              <h2 className="text-2xl font-bold text-primary mb-2">
                {result.name}
                {result.genericName && result.genericName !== result.name && (
                  <span className="text-lg text-muted-foreground ml-2">({result.genericName})</span>
                )}
              </h2>
              <div className="flex items-start gap-2 text-muted-foreground">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p>{result.usage}</p>
              </div>
            </Card>

            {/* Dosage */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Recommended Dosage
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">{result.dosage}</p>
            </Card>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <strong>Important Warnings:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Side Effects */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Common Side Effects
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.sideEffects.map((effect, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-950/20">
                    {effect}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Drug Interactions Warning */}
            {result.interactions.length > 0 && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <strong>Drug Interaction Warning:</strong> This medicine may interact with: {result.interactions.join(", ")}. 
                  Consult your doctor before combining medications.
                </AlertDescription>
              </Alert>
            )}

            {/* Alternatives */}
            {result.alternatives.length > 0 && (
              <Card className="p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Alternative Medicines
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.alternatives.map((alt, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950/20">
                      {alt}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  These are alternative medicines that may be available. Consult your healthcare provider before switching.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Medical Disclaimer:</strong> This information is sourced from FDA databases and is for educational purposes only. 
            Always consult a qualified healthcare professional before starting, stopping, or changing any medication.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default MedGuard;
