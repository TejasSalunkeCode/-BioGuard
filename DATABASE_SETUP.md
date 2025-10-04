# Database Setup Guide for BioGuard.AI Health Journal

## 🚀 Quick Setup

### Step 1: Create Database Tables

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database_migration.sql`
4. Run the migration

### Step 2: Enable Authentication (Optional but Recommended)

If you want users to be able to save their data securely:

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your authentication providers (Email, Google, etc.)
3. Update your app to include authentication UI

### Step 3: Update Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
VITE_SUPABASE_URL="https://your_project.supabase.co"
```

## 🔄 Data Migration (If you have existing data)

If users have been using the app and have data in localStorage, they can migrate it to the database:

1. The app will automatically detect localStorage data
2. A migration option will appear in the Health Journal settings
3. Users can choose to migrate their data to the database
4. After successful migration, localStorage is cleared

## 📊 Database Schema

### Tables Created:

#### `journal_entries`
- `id` - UUID primary key
- `user_id` - References auth.users (for multi-user support)
- `date` - Date of the journal entry
- `mood` - Mood level (1-5)
- `mood_note` - Optional mood notes
- `symptoms` - Array of symptoms
- `diet` - Array of food/drink items
- `sleep_hours` - Hours of sleep
- `sleep_quality` - Sleep quality rating (1-5)
- `activities` - Array of activities
- `stress_level` - Stress level (1-5)
- `notes` - Additional notes
- `created_at` - Timestamp
- `updated_at` - Last update timestamp

#### `journal_attachments`
- `id` - UUID primary key
- `journal_entry_id` - References journal_entries
- `type` - Attachment type (image, document, lab_result, prescription)
- `file_name` - Original file name
- `file_size` - File size in bytes
- `data_url` - Base64 encoded file data
- `caption` - Optional caption
- `uploaded_at` - Upload timestamp

## 🔐 Row Level Security (RLS)

The database includes RLS policies that ensure:
- Users can only view their own journal entries
- Users can only modify their own data
- Attachments are properly linked to their entries

## 🚨 Important Notes

1. **Authentication Required**: The database integration requires users to be authenticated. If you're not using authentication, the app will fall back to localStorage.

2. **Storage Limits**: Be aware of Supabase's storage limits for attachments. Large files might need to be stored elsewhere.

3. **Backup**: Consider implementing regular backups of your Supabase database.

4. **Migration**: The migration process is designed to be safe - it only clears localStorage after successful migration.

## 🛠️ Troubleshooting

### Common Issues:

1. **"User not authenticated" errors**: Make sure authentication is properly configured in Supabase and users are logged in.

2. **Migration fails**: Check that the database tables exist and RLS policies are correctly set up.

3. **Slow queries**: The database includes indexes for better performance, but very large datasets might need optimization.

4. **Storage quota exceeded**: Monitor your Supabase storage usage for attachments.

## 🎯 Next Steps

After setting up the database:
1. Test the Health Journal functionality
2. Run the migration utility if you have existing data
3. Consider implementing user authentication for better security
4. Set up database backups
5. Monitor performance and usage
