import { supabase } from './client';

/**
 * Migration utility to transition from key-value store to proper database tables
 * This script helps migrate data from the kv_store_3e6b123f table to the new schema
 */

export async function migrateData() {
  try {
    console.log('Starting migration from key-value store to proper database tables...');
    
    // Step 1: Migrate user profiles
    console.log('Migrating user profiles...');
    const { data: userProfiles, error: userError } = await supabase
      .from('kv_store_3e6b123f')
      .select('key, value')
      .like('key', 'user:%');
    
    if (userError) throw userError;
    
    for (const item of userProfiles || []) {
      const userData = item.value;
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        });
      
      if (error) console.error(`Error migrating user ${userData.id}:`, error);
    }
    
    // Step 2: Migrate room types
    console.log('Migrating room types...');
    const { data: roomTypes, error: roomTypesError } = await supabase
      .from('kv_store_3e6b123f')
      .select('key, value')
      .like('key', 'room_type:%');
    
    if (roomTypesError) throw roomTypesError;
    
    for (const item of roomTypes || []) {
      const roomTypeData = item.value;
      const id = item.key.replace('room_type:', '');
      
      const { error } = await supabase
        .from('room_types')
        .upsert({
          id,
          name: roomTypeData.name,
          description: roomTypeData.description,
          price_per_night: roomTypeData.price_per_night,
          max_guests: roomTypeData.max_guests,
          amenities: roomTypeData.amenities,
          image_url: roomTypeData.image_url
        });
      
      if (error) console.error(`Error migrating room type ${id}:`, error);
    }
    
    // Step 3: Migrate rooms
    console.log('Migrating rooms...');
    const { data: rooms, error: roomsError } = await supabase
      .from('kv_store_3e6b123f')
      .select('key, value')
      .like('key', 'room:%');
    
    if (roomsError) throw roomsError;
    
    for (const item of rooms || []) {
      const roomData = item.value;
      const id = item.key.replace('room:', '');
      
      const { error } = await supabase
        .from('rooms')
        .upsert({
          id,
          room_number: roomData.room_number,
          room_type_id: roomData.room_type_id,
          status: roomData.status,
          floor: roomData.floor
        });
      
      if (error) console.error(`Error migrating room ${id}:`, error);
    }
    
    // Step 4: Migrate bookings
    console.log('Migrating bookings...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('kv_store_3e6b123f')
      .select('key, value')
      .like('key', 'booking:%');
    
    if (bookingsError) throw bookingsError;
    
    for (const item of bookings || []) {
      const bookingData = item.value;
      const id = item.key.replace('booking:', '');
      
      const { error } = await supabase
        .from('bookings')
        .upsert({
          id,
          user_id: bookingData.user_id,
          room_id: bookingData.room_id,
          check_in: bookingData.check_in,
          check_out: bookingData.check_out,
          guests: bookingData.guests,
          total_price: bookingData.total_price,
          status: bookingData.status,
          created_at: bookingData.created_at
        });
      
      if (error) console.error(`Error migrating booking ${id}:`, error);
    }
    
    console.log('Migration completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}