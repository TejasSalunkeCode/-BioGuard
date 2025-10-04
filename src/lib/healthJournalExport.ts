// Export health journal data
import { JournalEntry } from './healthJournalTypes';
import { format } from 'date-fns';

export const exportToJSON = (entries: JournalEntry[]): void => {
  const dataStr = JSON.stringify(entries, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `health-journal-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (entries: JournalEntry[]): void => {
  // CSV header
  const headers = [
    'Date',
    'Mood',
    'Mood Note',
    'Sleep Hours',
    'Sleep Quality',
    'Stress Level',
    'Symptoms',
    'Diet',
    'Activities',
    'Notes'
  ];

  // Convert entries to CSV rows
  const rows = entries.map(entry => [
    entry.date,
    entry.mood.toString(),
    `"${(entry.moodNote || '').replace(/"/g, '""')}"`,
    entry.sleepHours.toString(),
    entry.sleepQuality.toString(),
    entry.stressLevel.toString(),
    `"${entry.symptoms.join(', ')}"`,
    `"${entry.diet.join(', ')}"`,
    `"${entry.activities.join(', ')}"`,
    `"${(entry.notes || '').replace(/"/g, '""')}"`
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Download CSV
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `health-journal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<JournalEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const entries = JSON.parse(content) as JournalEntry[];
        
        // Validate entries
        if (!Array.isArray(entries)) {
          throw new Error('Invalid format: expected array of entries');
        }
        
        // Basic validation of entry structure
        const validEntries = entries.filter(entry => 
          entry.id && entry.date && entry.mood && entry.sleepHours !== undefined
        );
        
        if (validEntries.length === 0) {
          throw new Error('No valid entries found in file');
        }
        
        resolve(validEntries);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
