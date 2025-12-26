# VOID Music App

## Database Setup - Row Level Security Policies

If you encounter "new row violates row-level security policy" errors when using the like functionality, you need to set up the proper RLS policies in Supabase.

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable RLS on song_likes table (if not already enabled)
ALTER TABLE song_likes ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own likes
CREATE POLICY "Users can view their own likes" ON song_likes
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own likes
CREATE POLICY "Users can insert their own likes" ON song_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Users can delete their own likes" ON song_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Allow users to view all likes (for counting purposes)
CREATE POLICY "Users can view all likes for counting" ON song_likes
  FOR SELECT USING (true);
```

## Alternative: Disable RLS (Not recommended for production)

If you want to quickly test the functionality, you can disable RLS:

```sql
ALTER TABLE song_likes DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** Disabling RLS exposes your data to security risks. Only use this for testing and re-enable RLS with proper policies for production.
