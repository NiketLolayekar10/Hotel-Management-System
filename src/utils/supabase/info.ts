// Supabase configuration loader
// Uses Vite's import.meta.env during development and build-time.

// Prefer VITE_* env vars for the client (Vite exposes VITE_ prefixed vars).
export const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
export const publicAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'YOUR_PUBLIC_ANON_KEY';

// service role key is not used on the client. Keep it for server deploy docs.
// export const serviceRoleKey = (process.env && process.env.SUPABASE_SERVICE_ROLE_KEY) || '';

export const projectId = supabaseUrl.split('https://')[1]?.split('.')[0] || 'your-project-id';

// Development notes: create a .env.local with the following keys
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key
// SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

if (!publicAnonKey || publicAnonKey === 'YOUR_PUBLIC_ANON_KEY') {
    // eslint-disable-next-line no-console
    console.warn('Warning: VITE_SUPABASE_ANON_KEY is not set. The app will not be able to talk to Supabase until you provide one.');
}

export default {
    supabaseUrl,
    publicAnonKey,
    // serviceRoleKey,
    projectId,
}; 