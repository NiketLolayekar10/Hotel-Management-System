import { useState, useEffect } from 'react';
import info, { projectId } from '../utils/supabase/info';
import type { Booking } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarIcon, Users, MapPin, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface MyBookingsProps {
  accessToken: string;
  refreshTrigger?: number;
}

export function MyBookings({ accessToken, refreshTrigger }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError('Failed to load your bookings');
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [accessToken, refreshTrigger]);

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            status: 'cancelled',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      setError('Failed to cancel booking');
      console.error('Cancel booking error:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500';
      case 'checked_in':
        return 'bg-green-500';
      case 'checked_out':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Loading your bookings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">My Bookings</h2>
        <p className="text-gray-600">View and manage your hotel reservations</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">You don't have any bookings yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{booking.room_type_name}</CardTitle>
                    <CardDescription>Booking ID: {booking.id}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p>{formatDate(booking.check_in)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p>{formatDate(booking.check_out)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Room Number</p>
                      <p>{booking.room_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Guests</p>
                      <p>{booking.guests}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Total Price</p>
                      <p className="text-lg">${booking.total_price}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Booked on</p>
                    <p>{formatDate(booking.created_at)}</p>
                  </div>
                </div>

                {booking.status === 'confirmed' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="w-full md:w-auto"
                  >
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
