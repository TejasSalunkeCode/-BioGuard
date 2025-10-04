import { JournalEntry } from './healthJournalTypes';
import { JournalDatabaseService } from './journalDatabaseService';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'bioguard_health_journal';

export const migrateLocalStorageToDatabase = async (): Promise<{
  success: boolean;
  migrated: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let migrated = 0;

  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated. Please log in to migrate data.');
    }

    // Get existing localStorage data
    const localStorageData = localStorage.getItem(STORAGE_KEY);
    if (!localStorageData) {
      return { success: true, migrated: 0, errors: [] };
    }

    const entries: JournalEntry[] = JSON.parse(localStorageData);

    if (entries.length === 0) {
      return { success: true, migrated: 0, errors: [] };
    }

    // Migrate each entry
    for (const entry of entries) {
      try {
        await JournalDatabaseService.saveJournalEntry(entry);
        migrated++;
      } catch (error) {
        errors.push(`Failed to migrate entry for ${entry.date}: ${error}`);
      }
    }

    // Clear localStorage after successful migration
    if (errors.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }

    return {
      success: errors.length === 0,
      migrated,
      errors
    };

  } catch (error) {
    return {
      success: false,
      migrated,
      errors: [`Migration failed: ${error}`]
    };
  }
};

export const hasLocalStorageData = (): boolean => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data !== null && data !== '[]';
};

export const getLocalStorageEntryCount = (): number => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return 0;

  try {
    const entries: JournalEntry[] = JSON.parse(data);
    return entries.length;
  } catch {
    return 0;
  }
};
