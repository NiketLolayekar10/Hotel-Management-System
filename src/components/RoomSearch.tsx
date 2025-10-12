import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { RoomType } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarIcon, Users, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

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

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/search-rooms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            checkIn,
            checkOut,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search rooms');
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError('Failed to search for available rooms');
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

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            room_id: selectedRoom.id,
            check_in: checkIn,
            check_out: checkOut,
            guests,
            total_price: totalPrice,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Available Rooms</CardTitle>
          <CardDescription>Find your perfect accommodation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check-in">
                  <CalendarIcon className="inline w-4 h-4 mr-2" />
                  Check-in
                </Label>
                <Input
                  id="check-in"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check-out">
                  <CalendarIcon className="inline w-4 h-4 mr-2" />
                  Check-out
                </Label>
                <Input
                  id="check-out"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  min={checkIn}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">
                  <Users className="inline w-4 h-4 mr-2" />
                  Guests
                </Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="10"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Searching...' : 'Search Rooms'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg">Available Rooms ({calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((roomType) => (
              <Card key={roomType.id} className="overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={roomType.image_url}
                    alt={roomType.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{roomType.name}</CardTitle>
                  <CardDescription>{roomType.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {roomType.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Up to {roomType.max_guests} guests</p>
                      <p className="text-sm text-gray-500">
                        {roomType.available_rooms.length} room{roomType.available_rooms.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl">${roomType.price_per_night}</p>
                      <p className="text-sm text-gray-500">per night</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm">
                      Total: <span className="text-lg">${roomType.price_per_night * calculateNights()}</span>
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleBooking(roomType)}
                    disabled={bookingLoading || guests > roomType.max_guests}
                  >
                    {guests > roomType.max_guests
                      ? 'Too many guests'
                      : bookingLoading
                      ? 'Booking...'
                      : 'Book Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && searchResults.length === 0 && checkIn && checkOut && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No rooms available for the selected dates. Please try different dates.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
