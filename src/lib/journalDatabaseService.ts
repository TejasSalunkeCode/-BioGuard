import { supabase } from '@/integrations/supabase/client';
import { JournalEntry, Attachment, MoodLevel, AttachmentType } from './healthJournalTypes';

export interface DatabaseJournalEntry {
  id: string;
  user_id: string;
  date: string;
  mood: number;
  mood_note?: string;
  symptoms: string[];
  diet: string[];
  sleep_hours: number;
  sleep_quality: number;
  activities: string[];
  stress_level: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  journal_attachments?: DatabaseAttachment[];
}

export interface DatabaseAttachment {
  id: string;
  journal_entry_id: string;
  type: string;
  file_name: string;
  file_size: number;
  data_url: string;
  caption?: string;
  uploaded_at: string;
}

// Convert database entry to JournalEntry format
export const convertFromDatabase = (dbEntry: DatabaseJournalEntry): JournalEntry => ({
  id: dbEntry.id,
  date: dbEntry.date,
  mood: dbEntry.mood as MoodLevel,
  moodNote: dbEntry.mood_note,
  symptoms: dbEntry.symptoms,
  diet: dbEntry.diet,
  sleepHours: dbEntry.sleep_hours,
  sleepQuality: dbEntry.sleep_quality as 1 | 2 | 3 | 4 | 5,
  activities: dbEntry.activities,
  stressLevel: dbEntry.stress_level as 1 | 2 | 3 | 4 | 5,
  notes: dbEntry.notes,
  attachments: dbEntry.journal_attachments?.map(convertAttachmentFromDatabase),
  createdAt: new Date(dbEntry.created_at).getTime(),
});

// Convert JournalEntry to database format
export const convertToDatabase = (entry: JournalEntry) => ({
  id: entry.id,
  date: entry.date,
  mood: entry.mood,
  mood_note: entry.moodNote,
  symptoms: entry.symptoms,
  diet: entry.diet,
  sleep_hours: entry.sleepHours,
  sleep_quality: entry.sleepQuality,
  activities: entry.activities,
  stress_level: entry.stressLevel,
  notes: entry.notes,
  updated_at: new Date().toISOString(),
});

// Convert attachment from database format
export const convertAttachmentFromDatabase = (dbAttachment: DatabaseAttachment): Attachment => ({
  id: dbAttachment.id,
  type: dbAttachment.type as AttachmentType,
  fileName: dbAttachment.file_name,
  fileSize: dbAttachment.file_size,
  dataUrl: dbAttachment.data_url,
  caption: dbAttachment.caption,
  uploadedAt: new Date(dbAttachment.uploaded_at).getTime(),
});

// Convert attachment to database format
export const convertAttachmentToDatabase = (attachment: Attachment, journalEntryId: string) => ({
  id: attachment.id,
  journal_entry_id: journalEntryId,
  type: attachment.type,
  file_name: attachment.fileName,
  file_size: attachment.fileSize,
  data_url: attachment.dataUrl,
  caption: attachment.caption,
  uploaded_at: new Date(attachment.uploadedAt).toISOString(),
});

export class JournalDatabaseService {
  // Get all entries for the current user
  static async getJournalEntries(): Promise<JournalEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_attachments (*)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;
    return data?.map(convertFromDatabase) || [];
  }

  // Get a specific entry by ID
  static async getJournalEntry(id: string): Promise<JournalEntry | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_attachments (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return convertFromDatabase(data);
  }

  // Get entries by date range
  static async getJournalEntriesByDateRange(startDate: string, endDate: string): Promise<JournalEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_attachments (*)
      `)
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data?.map(convertFromDatabase) || [];
  }

  // Save or update an entry
  static async saveJournalEntry(entry: JournalEntry): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = convertToDatabase(entry);

    // Check if entry exists
    const { data: existing } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', entry.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('journal_entries')
        .update(dbData)
        .eq('id', entry.id);

      if (error) throw error;

      // Handle attachments separately
      await this.updateAttachments(entry);
    } else {
      // Insert new entry
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({ ...dbData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Handle attachments for new entry
      await this.updateAttachments(entry, data.id);
    }
  }

  // Update attachments for an entry
  private static async updateAttachments(entry: JournalEntry, entryId?: string): Promise<void> {
    if (!entry.attachments?.length) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const journalEntryId = entryId || entry.id;

    // Delete existing attachments for this entry
    await supabase
      .from('journal_attachments')
      .delete()
      .eq('journal_entry_id', journalEntryId);

    // Insert new attachments
    const attachmentData = entry.attachments.map(att =>
      convertAttachmentToDatabase(att, journalEntryId)
    );

    const { error } = await supabase
      .from('journal_attachments')
      .insert(attachmentData);

    if (error) throw error;
  }

  // Delete an entry and its attachments
  static async deleteJournalEntry(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  // Get recent entries (last N days)
  static async getRecentEntries(days: number = 30): Promise<JournalEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_attachments (*)
      `)
      .eq('user_id', user.id)
      .gte('date', cutoffString)
      .order('date', { ascending: false });

    if (error) throw error;
    return data?.map(convertFromDatabase) || [];
  }
}
