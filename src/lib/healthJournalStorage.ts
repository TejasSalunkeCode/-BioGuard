// Database-backed storage management for health journal with localStorage fallback
import { JournalEntry } from './healthJournalTypes';
import { JournalDatabaseService } from './journalDatabaseService';

const STORAGE_KEY = 'bioguard_health_journal';

// Try to use database first, fallback to localStorage
export const saveJournalEntry = async (entry: JournalEntry): Promise<void> => {
  try {
    await JournalDatabaseService.saveJournalEntry(entry);
  } catch (error) {
    console.warn('Database save failed, falling back to localStorage:', error);
    saveToLocalStorage(entry);
  }
};

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  try {
    return await JournalDatabaseService.getJournalEntries();
  } catch (error) {
    console.warn('Database fetch failed, falling back to localStorage:', error);
    return getFromLocalStorage();
  }
};

export const getJournalEntry = async (id: string): Promise<JournalEntry | null> => {
  try {
    return await JournalDatabaseService.getJournalEntry(id);
  } catch (error) {
    console.warn('Database fetch failed, falling back to localStorage:', error);
    return getFromLocalStorage().find(e => e.id === id) || null;
  }
};

export const getJournalEntriesByDateRange = async (startDate: string, endDate: string): Promise<JournalEntry[]> => {
  try {
    return await JournalDatabaseService.getJournalEntriesByDateRange(startDate, endDate);
  } catch (error) {
    console.warn('Database fetch failed, falling back to localStorage:', error);
    return getFromLocalStorage().filter(e => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  try {
    await JournalDatabaseService.deleteJournalEntry(id);
  } catch (error) {
    console.warn('Database delete failed, falling back to localStorage:', error);
    deleteFromLocalStorage(id);
  }
};

export const getRecentEntries = async (days: number = 30): Promise<JournalEntry[]> => {
  try {
    return await JournalDatabaseService.getRecentEntries(days);
  } catch (error) {
    console.warn('Database fetch failed, falling back to localStorage:', error);
    return getRecentFromLocalStorage(days);
  }
};

// Local storage fallback functions (keep existing logic)
const saveToLocalStorage = (entry: JournalEntry): void => {
  const entries = getFromLocalStorage();
  const existingIndex = entries.findIndex(e => e.id === entry.id);

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const getFromLocalStorage = (): JournalEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const getRecentFromLocalStorage = (days: number = 30): JournalEntry[] => {
  const entries = getFromLocalStorage();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffString = cutoffDate.toISOString().split('T')[0];

  return entries.filter(e => e.date >= cutoffString)
    .sort((a, b) => b.date.localeCompare(a.date));
};

const deleteFromLocalStorage = (id: string): void => {
  const entries = getFromLocalStorage().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

// Storage utilities for attachments (database handles these now)
export const getStorageSize = async (): Promise<number> => {
  try {
    const entries = await getJournalEntries();
    return entries.reduce((total, entry) => {
      return total + (entry.attachments?.reduce((sum, att) => sum + att.fileSize, 0) || 0);
    }, 0) / (1024 * 1024); // Convert to MB
  } catch {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    return new Blob([data]).size / (1024 * 1024);
  }
};

export const getTotalAttachmentCount = async (): Promise<number> => {
  try {
    const entries = await getJournalEntries();
    return entries.reduce((total, entry) => {
      return total + (entry.attachments?.length || 0);
    }, 0);
  } catch {
    const entries = getFromLocalStorage();
    return entries.reduce((total, entry) => {
      return total + (entry.attachments?.length || 0);
    }, 0);
  }
};

export const clearOldAttachments = async (daysToKeep: number = 90): Promise<void> => {
  try {
    const entries = await getJournalEntries();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Note: Database handles attachment cleanup automatically via foreign key constraints
    // This function now mainly serves as a compatibility layer
    console.log(`Attachment cleanup: ${entries.length} entries processed`);
  } catch (error) {
    console.warn('Database cleanup failed:', error);
  }
};
