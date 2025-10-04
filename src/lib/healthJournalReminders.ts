// Daily journal reminder system
const REMINDER_STORAGE_KEY = 'bioguard_journal_reminder';
const LAST_ENTRY_KEY = 'bioguard_last_journal_entry';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM format
  notificationsGranted: boolean;
}

export const getReminderSettings = (): ReminderSettings => {
  const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultSettings();
    }
  }
  return getDefaultSettings();
};

const getDefaultSettings = (): ReminderSettings => ({
  enabled: false,
  time: '20:00',
  notificationsGranted: false
});

export const saveReminderSettings = (settings: ReminderSettings): void => {
  localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  if (settings.enabled) {
    scheduleReminder(settings.time);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendReminderNotification = (): void => {
  if (Notification.permission === 'granted') {
    new Notification('Health Journal Reminder', {
      body: 'Time to log your daily health! Track your mood, symptoms, and activities.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'health-journal-reminder',
      requireInteraction: false
    });
  }
};

export const scheduleReminder = (timeString: string): void => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(hours, minutes, 0, 0);

  // If reminder time has passed today, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const timeUntilReminder = reminderTime.getTime() - now.getTime();

  // Schedule the reminder
  setTimeout(() => {
    sendReminderNotification();
    // Reschedule for next day
    scheduleReminder(timeString);
  }, timeUntilReminder);
};

export const checkIfEntryNeeded = (): boolean => {
  const lastEntry = localStorage.getItem(LAST_ENTRY_KEY);
  if (!lastEntry) return true;

  const today = new Date().toISOString().split('T')[0];
  return lastEntry !== today;
};

export const markEntryForToday = (): void => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(LAST_ENTRY_KEY, today);
};

export const getStreak = (entries: { date: string }[]): number => {
  if (entries.length === 0) return 0;

  const sortedDates = entries
    .map(e => e.date)
    .sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDates.length; i++) {
    const entryDate = new Date(sortedDates[i]);
    entryDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};
