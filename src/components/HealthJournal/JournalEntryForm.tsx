import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  JournalEntry,
  MoodLevel,
  MOOD_EMOJIS,
  MOOD_LABELS,
  COMMON_SYMPTOMS,
  COMMON_FOODS,
  COMMON_ACTIVITIES,
  Attachment
} from "@/lib/healthJournalTypes";
import { saveJournalEntry } from "@/lib/healthJournalStorage";
import AttachmentUploader from "./AttachmentUploader";

interface JournalEntryFormProps {
  entry?: JournalEntry | null;
  onSave: () => void;
  onCancel: () => void;
}

const JournalEntryForm = ({ entry, onSave, onCancel }: JournalEntryFormProps) => {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(entry?.date || today);
  const [mood, setMood] = useState<MoodLevel>(entry?.mood || 3);
  const [moodNote, setMoodNote] = useState(entry?.moodNote || "");
  const [symptoms, setSymptoms] = useState<string[]>(entry?.symptoms || []);
  const [customSymptom, setCustomSymptom] = useState("");
  const [diet, setDiet] = useState<string[]>(entry?.diet || []);
  const [customFood, setCustomFood] = useState("");
  const [sleepHours, setSleepHours] = useState(entry?.sleepHours || 7);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(entry?.sleepQuality || 3);
  const [activities, setActivities] = useState<string[]>(entry?.activities || []);
  const [customActivity, setCustomActivity] = useState("");
  const [stressLevel, setStressLevel] = useState<1 | 2 | 3 | 4 | 5>(entry?.stressLevel || 3);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [attachments, setAttachments] = useState<Attachment[]>(entry?.attachments || []);
  const [isSaving, setIsSaving] = useState(false);

  const toggleItem = (item: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const addCustomItem = (value: string, list: string[], setter: (list: string[]) => void, clearInput: () => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
      clearInput();
    }
  };

  const handleSubmit = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    const journalEntry: JournalEntry = {
      id: entry?.id || `entry-${Date.now()}`,
      date,
      mood,
      moodNote,
      symptoms,
      diet,
      sleepHours,
      sleepQuality,
      activities,
      stressLevel,
      notes,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: entry?.createdAt || Date.now()
    };

    try {
      await saveJournalEntry(journalEntry);
      toast.success(entry ? "Journal entry updated!" : "Journal entry saved!");
      onSave();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error("Failed to save journal entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 shadow-card animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{entry ? "Edit Entry" : "New Journal Entry"}</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Date */}
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="mt-1"
          />
        </div>

        {/* Mood */}
        <div>
          <Label className="mb-3 block">How are you feeling today?</Label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setMood(level as MoodLevel)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  mood === level
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="text-3xl mb-1">{MOOD_EMOJIS[level as MoodLevel]}</div>
                <div className="text-xs font-medium">{MOOD_LABELS[level as MoodLevel]}</div>
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Optional: Any notes about your mood?"
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            className="mt-3"
            rows={2}
          />
        </div>

        {/* Symptoms */}
        <div>
          <Label className="mb-3 block">Symptoms (if any)</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_SYMPTOMS.map((symptom) => (
              <Badge
                key={symptom}
                variant={symptoms.includes(symptom) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => toggleItem(symptom, symptoms, setSymptoms)}
              >
                {symptom}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add custom symptom..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomItem(customSymptom, symptoms, setSymptoms, () => setCustomSymptom(""))}
            />
            <Button
              onClick={() => addCustomItem(customSymptom, symptoms, setSymptoms, () => setCustomSymptom(""))}
              variant="outline"
            >
              Add
            </Button>
          </div>
          {symptoms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {symptoms.map((symptom) => (
                <Badge key={symptom} className="bg-orange-100 text-orange-700 dark:bg-orange-950/20">
                  {symptom}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setSymptoms(symptoms.filter(s => s !== symptom))}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Diet */}
        <div>
          <Label className="mb-3 block">What did you eat/drink today?</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_FOODS.map((food) => (
              <Badge
                key={food}
                variant={diet.includes(food) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => toggleItem(food, diet, setDiet)}
              >
                {food}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add custom food/drink..."
              value={customFood}
              onChange={(e) => setCustomFood(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomItem(customFood, diet, setDiet, () => setCustomFood(""))}
            />
            <Button
              onClick={() => addCustomItem(customFood, diet, setDiet, () => setCustomFood(""))}
              variant="outline"
            >
              Add
            </Button>
          </div>
          {diet.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {diet.map((item) => (
                <Badge key={item} className="bg-green-100 text-green-700 dark:bg-green-950/20">
                  {item}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setDiet(diet.filter(d => d !== item))}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sleep */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sleepHours">Hours of Sleep</Label>
            <Input
              id="sleepHours"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="mb-2 block">Sleep Quality</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setSleepQuality(level as 1 | 2 | 3 | 4 | 5)}
                  className={`flex-1 p-2 rounded border-2 text-sm transition-all ${
                    sleepQuality === level
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {level}⭐
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stress Level */}
        <div>
          <Label className="mb-2 block">Stress Level</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setStressLevel(level as 1 | 2 | 3 | 4 | 5)}
                className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  stressLevel === level
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                {level === 1 ? 'Very Low' : level === 2 ? 'Low' : level === 3 ? 'Medium' : level === 4 ? 'High' : 'Very High'}
              </button>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div>
          <Label className="mb-3 block">Activities</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_ACTIVITIES.map((activity) => (
              <Badge
                key={activity}
                variant={activities.includes(activity) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => toggleItem(activity, activities, setActivities)}
              >
                {activity}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add custom activity..."
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomItem(customActivity, activities, setActivities, () => setCustomActivity(""))}
            />
            <Button
              onClick={() => addCustomItem(customActivity, activities, setActivities, () => setCustomActivity(""))}
              variant="outline"
            >
              Add
            </Button>
          </div>
          {activities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activities.map((activity) => (
                <Badge key={activity} className="bg-blue-100 text-blue-700 dark:bg-blue-950/20">
                  {activity}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setActivities(activities.filter(a => a !== activity))}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Anything else you'd like to remember about today?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
            rows={4}
          />
        </div>

        {/* Attachments */}
        <AttachmentUploader
          attachments={attachments}
          onAttachmentsChange={setAttachments}
        />

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {entry ? "Update Entry" : "Save Entry"}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default JournalEntryForm;
