import { createClient } from '@supabase/supabase-js';
import info, { supabaseUrl as SUPABASE_URL, publicAnonKey } from './info';

// Create client for browser usage. Ensure the anon key is provided.
if (!publicAnonKey || publicAnonKey === 'YOUR_PUBLIC_ANON_KEY') {
  // In development we warn; in production this should be configured.
  // eslint-disable-next-line no-console
  console.warn('Supabase anon key is not set. Set VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(SUPABASE_URL, publicAnonKey);

// Helper to create a server (service_role) client when you have the service key available.
export function createServerClient(serviceRoleKey: string) {
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key');
  }
  return createClient(SUPABASE_URL, serviceRoleKey);
}

export type RoomType = {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
  image_url: string;
};

export type Room = {
  id: string;
  room_number: string;
  room_type_id: string;
  status: 'available' | 'occupied' | 'maintenance';
  floor: number;
};

export type Booking = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  room_id: string;
  room_number: string;
  room_type_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: 'guest' | 'admin';
};
