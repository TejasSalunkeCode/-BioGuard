import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, Bell, FileJson, FileSpreadsheet, Flame, Info, FileText } from "lucide-react";
import { exportToJSON, exportToCSV, importFromJSON } from "@/lib/healthJournalExport";
import { 
  getReminderSettings, 
  saveReminderSettings, 
  requestNotificationPermission,
  getStreak 
} from "@/lib/healthJournalReminders";
import { JournalEntry } from "@/lib/healthJournalTypes";
import { saveJournalEntry } from "@/lib/healthJournalStorage";
import { toast } from "sonner";
import DoctorReportGenerator from "./DoctorReportGenerator";

interface SettingsPanelProps {
  entries: JournalEntry[];
  onImport: () => void;
}

const SettingsPanel = ({ entries, onImport }: SettingsPanelProps) => {
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const streak = getStreak(entries);

  useEffect(() => {
    const settings = getReminderSettings();
    setReminderEnabled(settings.enabled);
    setReminderTime(settings.time);
    setNotificationsGranted(settings.notificationsGranted);
  }, []);

  const handleExportJSON = () => {
    if (entries.length === 0) {
      toast.error("No entries to export");
      return;
    }
    exportToJSON(entries);
    toast.success(`Exported ${entries.length} entries as JSON`);
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      toast.error("No entries to export");
      return;
    }
    exportToCSV(entries);
    toast.success(`Exported ${entries.length} entries as CSV`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedEntries = await importFromJSON(file);
      
      // Save all imported entries
      importedEntries.forEach(entry => saveJournalEntry(entry));
      
      toast.success(`Imported ${importedEntries.length} entries successfully!`);
      onImport();
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import file");
    }
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled && !notificationsGranted) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.error("Notification permission denied");
        return;
      }
      setNotificationsGranted(true);
    }

    setReminderEnabled(enabled);
    saveReminderSettings({
      enabled,
      time: reminderTime,
      notificationsGranted: notificationsGranted || enabled
    });

    if (enabled) {
      toast.success(`Daily reminder set for ${reminderTime}`);
    } else {
      toast.info("Reminder disabled");
    }
  };

  const handleTimeChange = (time: string) => {
    setReminderTime(time);
    if (reminderEnabled) {
      saveReminderSettings({
        enabled: true,
        time,
        notificationsGranted
      });
      toast.success(`Reminder time updated to ${time}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Doctor Report Generator */}
      <DoctorReportGenerator entries={entries} />
      {/* Streak */}
      {streak > 0 && (
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <h3 className="text-2xl font-bold text-orange-600">{streak} Day Streak!</h3>
                <p className="text-sm text-muted-foreground">Keep logging daily to maintain your streak</p>
              </div>
            </div>
            <Badge className="bg-orange-500 text-white text-lg px-4 py-2">🔥</Badge>
          </div>
        </Card>
      )}

      {/* Export Data */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export Your Data
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Download your journal entries for backup or analysis in other tools.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExportJSON} variant="outline" className="flex-1">
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="flex-1">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {entries.length} entries available to export
        </p>
      </Card>

      {/* Import Data */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Import Data
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Restore journal entries from a previously exported JSON file.
        </p>
        <div className="flex items-center gap-3">
          <Input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="flex-1"
          />
        </div>
        <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
            Importing will merge with existing entries. Duplicate entries will be updated.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Daily Reminders */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Daily Reminders
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get a daily notification to log your health journal.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-toggle" className="cursor-pointer">
              Enable Daily Reminder
            </Label>
            <Switch
              id="reminder-toggle"
              checked={reminderEnabled}
              onCheckedChange={handleReminderToggle}
            />
          </div>

          {reminderEnabled && (
            <div className="space-y-2 animate-slide-up">
              <Label htmlFor="reminder-time">Reminder Time</Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => handleTimeChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You'll receive a notification at {reminderTime} every day
              </p>
            </div>
          )}

          {!notificationsGranted && !reminderEnabled && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
                Browser notifications need to be enabled for reminders to work.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Privacy Notice */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Privacy:</strong> All journal data is stored locally in your browser. 
          Your entries are private and never sent to external servers (except when using AI analysis).
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SettingsPanel;
