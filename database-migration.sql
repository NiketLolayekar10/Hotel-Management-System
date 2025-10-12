-- Hotel Management System Database Schema Migration
-- Run this in your Supabase SQL Editor to set up the proper database structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('guest', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room types table
CREATE TABLE IF NOT EXISTS room_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  max_guests INTEGER NOT NULL,
  amenities JSONB NOT NULL DEFAULT '[]',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'maintenance')),
  floor INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure check_out is after check_in
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY user_profiles_select ON user_profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY user_profiles_insert ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY user_profiles_update ON user_profiles
  FOR UPDATE USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Room types policies (anyone can view)
CREATE POLICY room_types_select ON room_types FOR SELECT USING (true);
CREATE POLICY room_types_insert ON room_types FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY room_types_update ON room_types FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY room_types_delete ON room_types FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Rooms policies
CREATE POLICY rooms_select ON rooms FOR SELECT USING (true);
CREATE POLICY rooms_insert ON rooms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY rooms_update ON rooms FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY rooms_delete ON rooms FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings policies
CREATE POLICY bookings_select ON bookings FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY bookings_insert ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bookings_update ON bookings FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY bookings_delete ON bookings FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
  room_id_param TEXT,
  check_in_param DATE,
  check_out_param DATE,
  exclude_booking_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = room_id_param
    AND status != 'cancelled'
    AND (id != exclude_booking_id OR exclude_booking_id IS NULL)
    AND (
      (check_in <= check_in_param AND check_out > check_in_param) OR
      (check_in < check_out_param AND check_out >= check_out_param) OR
      (check_in >= check_in_param AND check_out <= check_out_param)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO room_types (id, name, description, price_per_night, max_guests, amenities, image_url) VALUES
('rt1', 'Standard Room', 'Comfortable room with essential amenities', 99, 2, '["WiFi", "TV", "Air Conditioning", "Mini Fridge"]', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'),
('rt2', 'Deluxe Room', 'Spacious room with premium amenities', 159, 3, '["WiFi", "TV", "Air Conditioning", "Mini Bar", "Coffee Maker", "Balcony"]', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'),
('rt3', 'Suite', 'Luxurious suite with separate living area', 249, 4, '["WiFi", "TV", "Air Conditioning", "Mini Bar", "Coffee Maker", "Balcony", "Jacuzzi", "Living Room"]', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, room_number, room_type_id, status, floor) VALUES
('r101', '101', 'rt1', 'available', 1),
('r102', '102', 'rt1', 'available', 1),
('r103', '103', 'rt1', 'available', 1),
('r104', '104', 'rt1', 'available', 1),
('r201', '201', 'rt2', 'available', 2),
('r202', '202', 'rt2', 'available', 2),
('r203', '203', 'rt2', 'available', 2),
('r301', '301', 'rt3', 'available', 3),
('r302', '302', 'rt3', 'available', 3)
ON CONFLICT (id) DO NOTHING;