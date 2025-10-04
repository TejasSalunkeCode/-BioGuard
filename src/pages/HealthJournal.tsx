import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, TrendingUp, Calendar, BarChart3, Settings, Loader2 } from "lucide-react";
import JournalEntryForm from "@/components/HealthJournal/JournalEntryForm";
import JournalHistory from "@/components/HealthJournal/JournalHistory";
import InsightsDashboard from "@/components/HealthJournal/InsightsDashboard";
import ChartsView from "@/components/HealthJournal/ChartsView";
import SettingsPanel from "@/components/HealthJournal/SettingsPanel";
import { JournalEntry } from "@/lib/healthJournalTypes";
import { getJournalEntries } from "@/lib/healthJournalStorage";

const HealthJournal = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const loadedEntries = await getJournalEntries();
      setEntries(loadedEntries.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntrySaved = () => {
    loadEntries();
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
    setActiveTab("overview");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Health Journal</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your daily health, mood, and activities. Discover patterns with AI-powered insights.
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Entry</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <Card className="p-8 text-center space-y-4">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading your health journal...</p>
              </Card>
            ) : !showEntryForm && !editingEntry ? (
              <Card className="p-8 text-center space-y-4">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Create a Journal Entry</h3>
                  <p className="text-muted-foreground mb-6">
                    Log your mood, symptoms, diet, and sleep to track your health over time.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowEntryForm(true)}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Entry
                </Button>

                {entries.length > 0 && (
                  <div className="pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      You have {entries.length} journal {entries.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <JournalEntryForm 
                entry={editingEntry}
                onSave={handleEntrySaved}
                onCancel={() => {
                  setShowEntryForm(false);
                  setEditingEntry(null);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="history">
            <JournalHistory 
              entries={entries}
              onEdit={handleEdit}
              onDelete={loadEntries}
            />
          </TabsContent>

          <TabsContent value="charts">
            <ChartsView entries={entries} />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsDashboard entries={entries} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel entries={entries} onImport={loadEntries} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HealthJournal;
