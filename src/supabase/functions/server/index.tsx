import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to get authenticated user
async function getAuthenticatedUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return null;
  }
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }
  return user;
}

// Create admin account (can be called multiple times safely)
app.post('/make-server-3e6b123f/create-admin', async (c) => {
  try {
    // Try to create the admin account
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@hotel.com',
      password: 'admin123',
      user_metadata: { name: 'Hotel Administrator', role: 'admin' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (adminError) {
      // Check if user already exists
      if (adminError.message.includes('already') || adminError.message.includes('exists')) {
        console.log('Admin account already exists');
        return c.json({ message: 'Admin account already exists', email: 'admin@hotel.com' });
      }
      console.log('Error creating admin account:', adminError.message);
      return c.json({ error: adminError.message }, 400);
    }

    if (adminData?.user) {
      // Create admin profile
      const adminProfile = {
        id: adminData.user.id,
        email: 'admin@hotel.com',
        name: 'Hotel Administrator',
        role: 'admin'
      };
      await kv.set(`user:${adminData.user.id}`, adminProfile);
      console.log('✓ Admin account created successfully: admin@hotel.com / admin123');
      return c.json({ 
        message: 'Admin account created successfully', 
        email: 'admin@hotel.com',
        userId: adminData.user.id
      });
    }

    return c.json({ error: 'Failed to create admin account' }, 500);
  } catch (error) {
    console.log('Exception creating admin account:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Initialize sample data
app.post('/make-server-3e6b123f/init', async (c) => {
  try {
    // Check if already initialized
    const existingData = await kv.get('initialized');
    if (existingData) {
      console.log('System already initialized');
      return c.json({ message: 'Already initialized' });
    }

    console.log('Starting initialization...');

    // Create default admin account
    try {
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: 'admin@hotel.com',
        password: 'admin123',
        user_metadata: { name: 'Hotel Administrator', role: 'admin' },
        // Automatically confirm the user's email since an email server hasn't been configured.
        email_confirm: true
      });

      if (adminData?.user) {
        // Create admin profile
        const adminProfile = {
          id: adminData.user.id,
          email: 'admin@hotel.com',
          name: 'Hotel Administrator',
          role: 'admin'
        };
        await kv.set(`user:${adminData.user.id}`, adminProfile);
        console.log('✓ Admin account created: admin@hotel.com / admin123');
      } else if (adminError) {
        if (adminError.message.includes('already') || adminError.message.includes('exists')) {
          console.log('✓ Admin account already exists');
        } else {
          console.log('⚠ Admin creation error:', adminError.message);
        }
      }
    } catch (adminErr) {
      console.log('⚠ Admin creation exception:', adminErr);
    }

    // Create room types
    const roomTypes = [
      {
        id: 'rt1',
        name: 'Standard Room',
        description: 'Comfortable room with essential amenities',
        price_per_night: 99,
        max_guests: 2,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Fridge'],
        image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'
      },
      {
        id: 'rt2',
        name: 'Deluxe Room',
        description: 'Spacious room with premium amenities',
        price_per_night: 159,
        max_guests: 3,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker', 'Balcony'],
        image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
      },
      {
        id: 'rt3',
        name: 'Suite',
        description: 'Luxurious suite with separate living area',
        price_per_night: 249,
        max_guests: 4,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker', 'Balcony', 'Jacuzzi', 'Living Room'],
        image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      }
    ];

    for (const roomType of roomTypes) {
      await kv.set(`room_type:${roomType.id}`, roomType);
    }

    // Create rooms
    const rooms = [
      // Standard rooms
      { id: 'r101', room_number: '101', room_type_id: 'rt1', status: 'available', floor: 1 },
      { id: 'r102', room_number: '102', room_type_id: 'rt1', status: 'available', floor: 1 },
      { id: 'r103', room_number: '103', room_type_id: 'rt1', status: 'available', floor: 1 },
      { id: 'r104', room_number: '104', room_type_id: 'rt1', status: 'available', floor: 1 },
      // Deluxe rooms
      { id: 'r201', room_number: '201', room_type_id: 'rt2', status: 'available', floor: 2 },
      { id: 'r202', room_number: '202', room_type_id: 'rt2', status: 'available', floor: 2 },
      { id: 'r203', room_number: '203', room_type_id: 'rt2', status: 'available', floor: 2 },
      // Suites
      { id: 'r301', room_number: '301', room_type_id: 'rt3', status: 'available', floor: 3 },
      { id: 'r302', room_number: '302', room_type_id: 'rt3', status: 'available', floor: 3 }
    ];

    for (const room of rooms) {
      await kv.set(`room:${room.id}`, room);
    }

    await kv.set('initialized', true);

    return c.json({ message: 'Initialization complete', roomTypes: roomTypes.length, rooms: rooms.length });
  } catch (error) {
    console.log(`Error initializing data: ${error}`);
    return c.json({ error: 'Failed to initialize data', details: String(error) }, 500);
  }
});

// Get all room types
app.get('/make-server-3e6b123f/room-types', async (c) => {
  try {
    const roomTypes = await kv.getByPrefix('room_type:');
    return c.json(roomTypes);
  } catch (error) {
    console.log(`Error fetching room types: ${error}`);
    return c.json({ error: 'Failed to fetch room types', details: String(error) }, 500);
  }
});

// Get all rooms
app.get('/make-server-3e6b123f/rooms', async (c) => {
  try {
    const rooms = await kv.getByPrefix('room:');
    return c.json(rooms);
  } catch (error) {
    console.log(`Error fetching rooms: ${error}`);
    return c.json({ error: 'Failed to fetch rooms', details: String(error) }, 500);
  }
});

// Search available rooms
app.post('/make-server-3e6b123f/search-rooms', async (c) => {
  try {
    const { checkIn, checkOut } = await c.req.json();
    
    const allRooms = await kv.getByPrefix('room:');
    const allBookings = await kv.getByPrefix('booking:');
    const roomTypes = await kv.getByPrefix('room_type:');

    // Filter out rooms that have overlapping bookings
    const availableRooms = allRooms.filter(room => {
      const roomBookings = allBookings.filter(booking => 
        booking.room_id === room.id && 
        booking.status !== 'cancelled' &&
        booking.status !== 'checked_out'
      );

      const hasConflict = roomBookings.some(booking => {
        const bookingCheckIn = new Date(booking.check_in);
        const bookingCheckOut = new Date(booking.check_out);
        const searchCheckIn = new Date(checkIn);
        const searchCheckOut = new Date(checkOut);

        return (searchCheckIn < bookingCheckOut && searchCheckOut > bookingCheckIn);
      });

      return !hasConflict && room.status === 'available';
    });

    // Group by room type
    const roomsByType = new Map();
    for (const room of availableRooms) {
      const roomType = roomTypes.find(rt => rt.id === room.room_type_id);
      if (roomType) {
        if (!roomsByType.has(roomType.id)) {
          roomsByType.set(roomType.id, { ...roomType, available_rooms: [] });
        }
        roomsByType.get(roomType.id).available_rooms.push(room);
      }
    }

    return c.json(Array.from(roomsByType.values()));
  } catch (error) {
    console.log(`Error searching rooms: ${error}`);
    return c.json({ error: 'Failed to search rooms', details: String(error) }, 500);
  }
});

// Create booking
app.post('/make-server-3e6b123f/bookings', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { room_id, check_in, check_out, guests, total_price } = await c.req.json();

    // Get room and room type details
    const room = await kv.get(`room:${room_id}`);
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    const roomType = await kv.get(`room_type:${room.room_type_id}`);

    // Get user profile
    let userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      userProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: 'guest'
      };
      await kv.set(`user:${user.id}`, userProfile);
    }

    const bookingId = `b${Date.now()}`;
    const booking = {
      id: bookingId,
      user_id: user.id,
      user_email: userProfile.email,
      user_name: userProfile.name,
      room_id,
      room_number: room.room_number,
      room_type_name: roomType?.name || 'Unknown',
      check_in,
      check_out,
      guests,
      total_price,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };

    await kv.set(`booking:${bookingId}`, booking);

    return c.json(booking);
  } catch (error) {
    console.log(`Error creating booking: ${error}`);
    return c.json({ error: 'Failed to create booking', details: String(error) }, 500);
  }
});

// Get user's bookings
app.get('/make-server-3e6b123f/my-bookings', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allBookings = await kv.getByPrefix('booking:');
    const userBookings = allBookings.filter(booking => booking.user_id === user.id);
    
    // Sort by created_at descending
    userBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json(userBookings);
  } catch (error) {
    console.log(`Error fetching user bookings: ${error}`);
    return c.json({ error: 'Failed to fetch bookings', details: String(error) }, 500);
  }
});

// Update booking status
app.patch('/make-server-3e6b123f/bookings/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bookingId = c.req.param('id');
    const { status } = await c.req.json();

    const booking = await kv.get(`booking:${bookingId}`);
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    // Check if user owns this booking or is admin
    const userProfile = await kv.get(`user:${user.id}`);
    if (booking.user_id !== user.id && userProfile?.role !== 'admin') {
      return c.json({ error: 'Unauthorized to modify this booking' }, 403);
    }

    booking.status = status;
    await kv.set(`booking:${bookingId}`, booking);

    return c.json(booking);
  } catch (error) {
    console.log(`Error updating booking: ${error}`);
    return c.json({ error: 'Failed to update booking', details: String(error) }, 500);
  }
});

// Admin: Get all bookings
app.get('/make-server-3e6b123f/admin/bookings', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allBookings = await kv.getByPrefix('booking:');
    allBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json(allBookings);
  } catch (error) {
    console.log(`Error fetching all bookings: ${error}`);
    return c.json({ error: 'Failed to fetch bookings', details: String(error) }, 500);
  }
});

// Admin: Get today's check-ins
app.get('/make-server-3e6b123f/admin/check-ins-today', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const today = new Date().toISOString().split('T')[0];
    const allBookings = await kv.getByPrefix('booking:');
    
    const todayCheckIns = allBookings.filter(booking => {
      const checkInDate = booking.check_in.split('T')[0];
      return checkInDate === today && booking.status === 'confirmed';
    });

    return c.json(todayCheckIns);
  } catch (error) {
    console.log(`Error fetching today's check-ins: ${error}`);
    return c.json({ error: 'Failed to fetch check-ins', details: String(error) }, 500);
  }
});

// Admin: Create room type
app.post('/make-server-3e6b123f/admin/room-types', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const roomTypeData = await c.req.json();
    const roomTypeId = `rt${Date.now()}`;
    const roomType = {
      id: roomTypeId,
      ...roomTypeData
    };

    await kv.set(`room_type:${roomTypeId}`, roomType);
    return c.json(roomType);
  } catch (error) {
    console.log(`Error creating room type: ${error}`);
    return c.json({ error: 'Failed to create room type', details: String(error) }, 500);
  }
});

// Admin: Update room type
app.put('/make-server-3e6b123f/admin/room-types/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const roomTypeId = c.req.param('id');
    const roomTypeData = await c.req.json();

    const existingRoomType = await kv.get(`room_type:${roomTypeId}`);
    if (!existingRoomType) {
      return c.json({ error: 'Room type not found' }, 404);
    }

    const updatedRoomType = {
      ...existingRoomType,
      ...roomTypeData,
      id: roomTypeId
    };

    await kv.set(`room_type:${roomTypeId}`, updatedRoomType);
    return c.json(updatedRoomType);
  } catch (error) {
    console.log(`Error updating room type: ${error}`);
    return c.json({ error: 'Failed to update room type', details: String(error) }, 500);
  }
});

// Admin: Delete room type
app.delete('/make-server-3e6b123f/admin/room-types/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const roomTypeId = c.req.param('id');
    await kv.del(`room_type:${roomTypeId}`);
    return c.json({ message: 'Room type deleted' });
  } catch (error) {
    console.log(`Error deleting room type: ${error}`);
    return c.json({ error: 'Failed to delete room type', details: String(error) }, 500);
  }
});

// Admin: Create room
app.post('/make-server-3e6b123f/admin/rooms', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const roomData = await c.req.json();
    const roomId = `r${Date.now()}`;
    const room = {
      id: roomId,
      ...roomData
    };

    await kv.set(`room:${roomId}`, room);
    return c.json(room);
  } catch (error) {
    console.log(`Error creating room: ${error}`);
    return c.json({ error: 'Failed to create room', details: String(error) }, 500);
  }
});

// Admin: Update room
app.put('/make-server-3e6b123f/admin/rooms/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const roomId = c.req.param('id');
    const roomData = await c.req.json();

    const existingRoom = await kv.get(`room:${roomId}`);
    if (!existingRoom) {
      return c.json({ error: 'Room not found' }, 404);
    }

    const updatedRoom = {
      ...existingRoom,
      ...roomData,
      id: roomId
    };

    await kv.set(`room:${roomId}`, updatedRoom);
    return c.json(updatedRoom);
  } catch (error) {
    console.log(`Error updating room: ${error}`);
    return c.json({ error: 'Failed to update room', details: String(error) }, 500);
  }
});

// Admin: Delete room
app.delete('/make-server-3e6b123f/admin/rooms/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const roomId = c.req.param('id');
    await kv.del(`room:${roomId}`);
    return c.json({ message: 'Room deleted' });
  } catch (error) {
    console.log(`Error deleting room: ${error}`);
    return c.json({ error: 'Failed to delete room', details: String(error) }, 500);
  }
});

// User signup
app.post('/make-server-3e6b123f/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'guest' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error during sign up: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile
    const userProfile = {
      id: data.user.id,
      email,
      name,
      role: role || 'guest'
    };
    await kv.set(`user:${data.user.id}`, userProfile);

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Error creating user account: ${error}`);
    return c.json({ error: 'Failed to create account', details: String(error) }, 500);
  }
});

// Get user profile
app.get('/make-server-3e6b123f/profile', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      // Create profile from auth metadata
      userProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'guest'
      };
      await kv.set(`user:${user.id}`, userProfile);
    }

    return c.json(userProfile);
  } catch (error) {
    console.log(`Error fetching user profile: ${error}`);
    return c.json({ error: 'Failed to fetch profile', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
