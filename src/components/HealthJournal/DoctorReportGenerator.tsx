import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Loader2, Info, Download } from "lucide-react";
import { generateDoctorReport, generateQuickSummary } from "@/lib/doctorReportPDF";
import { JournalEntry, HealthInsights } from "@/lib/healthJournalTypes";
import { analyzeHealthPatterns } from "@/lib/healthJournalAI";
import { toast } from "sonner";

interface DoctorReportGeneratorProps {
  entries: JournalEntry[];
}

const DoctorReportGenerator = ({ entries }: DoctorReportGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [includePatientInfo, setIncludePatientInfo] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [dateRange, setDateRange] = useState<"all" | "30" | "90">("30");

  const handleGenerateReport = async () => {
    if (entries.length === 0) {
      toast.error("No entries to generate report");
      return;
    }

    setIsGenerating(true);

    try {
      // Filter entries based on date range
      let filteredEntries = entries;
      if (dateRange !== "all") {
        const days = parseInt(dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffString = cutoffDate.toISOString().split('T')[0];
        filteredEntries = entries.filter(e => e.date >= cutoffString);
      }

      if (filteredEntries.length === 0) {
        toast.error("No entries in selected date range");
        setIsGenerating(false);
        return;
      }

      // Get AI insights if enough entries
      let insights: HealthInsights | undefined;
      if (filteredEntries.length >= 7) {
        try {
          insights = await analyzeHealthPatterns(filteredEntries);
        } catch (error) {
          console.warn("Could not generate insights:", error);
          // Continue without insights
        }
      }

      // Generate PDF
      await generateDoctorReport({
        entries: filteredEntries,
        insights,
        patientInfo: includePatientInfo ? {
          name: patientName || undefined,
          age: patientAge || undefined,
          gender: patientGender || undefined
        } : undefined,
        dateRange: dateRange !== "all" ? {
          start: filteredEntries[filteredEntries.length - 1].date,
          end: filteredEntries[0].date
        } : undefined
      });

      toast.success(`Doctor report generated with ${filteredEntries.length} entries!`);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickSummary = () => {
    if (entries.length === 0) {
      toast.error("No entries available");
      return;
    }

    const summary = generateQuickSummary(entries);
    
    // Copy to clipboard
    navigator.clipboard.writeText(summary).then(() => {
      toast.success("Summary copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy summary");
    });
  };

  if (entries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Entries Yet</h3>
        <p className="text-muted-foreground">
          Log at least one journal entry to generate a doctor report.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Generate Doctor Report</h3>
          <p className="text-sm text-muted-foreground">
            Professional PDF summary for medical appointments
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Date Range Selection */}
        <div>
          <Label htmlFor="date-range">Report Period</Label>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as "all" | "30" | "90")}>
            <SelectTrigger id="date-range" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="all">All Entries ({entries.length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Patient Information Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="include-patient-info"
            checked={includePatientInfo}
            onChange={(e) => setIncludePatientInfo(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="include-patient-info" className="cursor-pointer">
            Include patient information (optional)
          </Label>
        </div>

        {/* Patient Info Fields */}
        {includePatientInfo && (
          <div className="space-y-3 pl-6 animate-slide-up">
            <div>
              <Label htmlFor="patient-name">Patient Name</Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="patient-age">Age</Label>
                <Input
                  id="patient-age"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="e.g., 35"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="patient-gender">Gender</Label>
                <Select value={patientGender} onValueChange={setPatientGender}>
                  <SelectTrigger id="patient-gender" className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Report Preview Info */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Report includes:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Clinical summary with averages</li>
              <li>Symptom frequency analysis</li>
              <li>AI-detected health patterns</li>
              <li>Mood and sleep trends</li>
              <li>Timeline of recent entries</li>
              <li>Detailed entry log</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Generate Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate PDF Report
              </>
            )}
          </Button>

          <Button
            onClick={handleQuickSummary}
            variant="outline"
            disabled={isGenerating}
          >
            Copy Quick Summary
          </Button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center">
          The report will be downloaded as a PDF file formatted for medical professionals
        </p>
      </div>
    </Card>
  );
};

export default DoctorReportGenerator;
