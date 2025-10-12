import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

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
