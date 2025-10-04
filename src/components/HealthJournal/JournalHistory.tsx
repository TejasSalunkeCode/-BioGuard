import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, Paperclip } from "lucide-react";
import { JournalEntry, MOOD_EMOJIS, MOOD_LABELS } from "@/lib/healthJournalTypes";
import { deleteJournalEntry } from "@/lib/healthJournalStorage";
import { toast } from "sonner";
import { format } from "date-fns";
import AttachmentGallery from "./AttachmentGallery";

interface JournalHistoryProps {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: () => void;
}

const JournalHistory = ({ entries, onEdit, onDelete }: JournalHistoryProps) => {
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteJournalEntry(id);
      toast.success("Entry deleted");
      onDelete();
    }
  };

  if (entries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Journal Entries Yet</h3>
        <p className="text-muted-foreground">
          Start logging your health to track patterns and gain insights over time.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Your Journal History</h2>
        <Badge variant="secondary">{entries.length} entries</Badge>
      </div>

      {entries.map((entry) => (
        <Card key={entry.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{MOOD_EMOJIS[entry.mood]}</div>
              <div>
                <h3 className="font-semibold text-lg">
                  {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Feeling {MOOD_LABELS[entry.mood]}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(entry)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(entry.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {entry.moodNote && (
            <p className="text-muted-foreground mb-4 italic">"{entry.moodNote}"</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Sleep */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Sleep:</span>
              <span className="text-muted-foreground">
                {entry.sleepHours}h ({entry.sleepQuality}⭐)
              </span>
            </div>

            {/* Stress */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Stress:</span>
              <Badge variant="outline" className="text-xs">
                Level {entry.stressLevel}
              </Badge>
            </div>
          </div>

          {/* Symptoms */}
          {entry.symptoms.length > 0 && (
            <div className="mb-3">
              <span className="text-sm font-medium mb-2 block">Symptoms:</span>
              <div className="flex flex-wrap gap-1">
                {entry.symptoms.map((symptom) => (
                  <Badge key={symptom} variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-950/20 text-xs">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Diet */}
          {entry.diet.length > 0 && (
            <div className="mb-3">
              <span className="text-sm font-medium mb-2 block">Diet:</span>
              <div className="flex flex-wrap gap-1">
                {entry.diet.map((food) => (
                  <Badge key={food} variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950/20 text-xs">
                    {food}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {entry.activities.length > 0 && (
            <div className="mb-3">
              <span className="text-sm font-medium mb-2 block">Activities:</span>
              <div className="flex flex-wrap gap-1">
                {entry.activities.map((activity) => (
                  <Badge key={activity} variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/20 text-xs">
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{entry.notes}</p>
            </div>
          )}

          {/* Attachments */}
          {entry.attachments && entry.attachments.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Attachments ({entry.attachments.length})
                </span>
              </div>
              <AttachmentGallery attachments={entry.attachments} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default JournalHistory;
