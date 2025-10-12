import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import type { RoomType } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarIcon, Users, CheckCircle, AlertCircle, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface RoomSearchProps {
  accessToken: string;
  onBookingSuccess: () => void;
}

interface RoomTypeWithRooms extends RoomType {
  available_rooms: Array<{
    id: string;
    room_number: string;
    room_type_id: string;
    status: string;
    floor: number;
  }>;
}

export function RoomSearch({ accessToken, onBookingSuccess }: RoomSearchProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [searchResults, setSearchResults] = useState<RoomTypeWithRooms[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSearched, setIsSearched] = useState(false);

  useEffect(() => {
    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setIsSearched(true);

    try {
      // Get all rooms with their types
      const { data: allRooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (*)
        `);

      if (roomsError) throw roomsError;

      // Get conflicting bookings
      const { data: conflictingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('room_id')
        .neq('status', 'cancelled')
        .neq('status', 'checked_out')
        .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`);

      if (bookingsError) throw bookingsError;

      const bookedRoomIds = new Set(conflictingBookings.map(b => b.room_id));

      // Filter available rooms
      const availableRooms = allRooms.filter(room =>
        !bookedRoomIds.has(room.id) && room.status === 'available'
      );

      // Group by room type
      const roomsByType = new Map();
      for (const room of availableRooms) {
        const roomType = room.room_types;
        if (roomType) {
          if (!roomsByType.has(roomType.id)) {
            roomsByType.set(roomType.id, { ...roomType, available_rooms: [] });
          }
          roomsByType.get(roomType.id).available_rooms.push(room);
        }
      }

      setSearchResults(Array.from(roomsByType.values()));
    } catch (err) {
      setError('Failed to search for available rooms. Please try again later.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (roomTypeWithRooms: RoomTypeWithRooms) => {
    setError('');
    setSuccess('');
    setBookingLoading(true);

    try {
      // Select the first available room
      const selectedRoom = roomTypeWithRooms.available_rooms[0];

      // Calculate total price
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * roomTypeWithRooms.price_per_night;

      // Add booking confirmation step
      if (!confirm(`Confirm booking details:
- Room: ${roomTypeWithRooms.name}
- Check-in: ${new Date(checkIn).toLocaleDateString()}
- Check-out: ${new Date(checkOut).toLocaleDateString()}
- Guests: ${guests}
- Total: $${totalPrice}

Click OK to confirm your booking.`)) {
        setBookingLoading(false);
        return;
      }

      // Get user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email,
            role: 'guest'
          })
          .select()
          .single();

        if (createError) throw createError;
        userProfile = newProfile;
      }

      const bookingId = `b${Date.now()}`;
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          user_id: user.id,
          room_id: selectedRoom.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          total_price: totalPrice,
          status: 'confirmed'
        });

      if (bookingError) throw bookingError;

      setSuccess('Booking created successfully! Redirecting to your bookings...');
      setTimeout(() => {
        onBookingSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-gray-800">Find Your Room</CardTitle>
          <CardDescription>Quick search for available accommodations</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Success</AlertTitle>
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="check-in" className="flex items-center gap-2 font-medium">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Check-in
                </Label>
                <Input
                  id="check-in"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="check-out" className="flex items-center gap-2 font-medium">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Check-out
                </Label>
                <Input
                  id="check-out"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  min={checkIn}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="guests" className="flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 text-primary" />
                  Guests
                </Label>
                <Input
                  id="guests"
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  required
                  min={1}
                  max={10}
                  className="h-10"
                />
              </div>
              
              <div className="flex items-end md:col-span-1">
                <Button 
                  type="submit" 
                  className="w-full h-10 gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Find Rooms</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">
              Available Rooms 
              <Badge variant="outline" className="ml-2 bg-blue-50">
                {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
              </Badge>
            </h3>
            <p className="text-sm text-gray-500">{searchResults.reduce((total, room) => total + room.available_rooms.length, 0)} rooms found</p>
          </div>
          
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((roomType) => (
                  <Card key={roomType.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={roomType.image_url || 'https://placehold.co/600x400?text=Room+Image'}
                        alt={roomType.name}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/600x400?text=Room+Image';
                        }}
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{roomType.name}</CardTitle>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          ${roomType.price_per_night}/night
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{roomType.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {roomType.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="bg-gray-100 text-gray-800">
                            {amenity}
                          </Badge>
                        ))}
                        {roomType.amenities.length > 3 && (
                          <Badge variant="outline">+{roomType.amenities.length - 3} more</Badge>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Up to {roomType.max_guests} guests</span>
                        </div>
                        <p className="font-medium">
                          Total: ${roomType.price_per_night * calculateNights()}
                        </p>
                      </div>
                      
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleBooking(roomType)}
                        disabled={bookingLoading}
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Book Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="list">
              <div className="space-y-3">
                {searchResults.map((roomType) => (
                  <Card key={roomType.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 aspect-video md:aspect-square overflow-hidden">
                        <img
                          src={roomType.image_url || 'https://placehold.co/600x400?text=Room+Image'}
                          alt={roomType.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/600x400?text=Room+Image';
                          }}
                        />
                      </div>
                      <div className="md:w-2/3 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold">{roomType.name}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            ${roomType.price_per_night}/night
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{roomType.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {roomType.amenities.map((amenity) => (
                            <Badge key={amenity} variant="secondary" className="bg-gray-100 text-gray-800">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Up to {roomType.max_guests} guests</span>
                          </div>
                          <Button
                            onClick={() => handleBooking(roomType)}
                            disabled={bookingLoading}
                          >
                            {bookingLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>Book - ${roomType.price_per_night * calculateNights()}</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {searchResults.length === 0 && !loading && isSearched && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">No Rooms Available</AlertTitle>
          <AlertDescription className="text-amber-700">
            No rooms available for the selected dates. Try different dates or contact us for assistance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
