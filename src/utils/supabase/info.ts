// Supabase project configuration
// Using environment variables for production-ready setup

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
export const projectId = supabaseUrl.split('https://')[1]?.split('.')[0] || 'your-project-id';

// For local development, create a .env.local file with these variables:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key