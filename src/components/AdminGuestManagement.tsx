import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import type { Booking } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface AdminGuestManagementProps {
  accessToken: string;
}

export function AdminGuestManagement({ accessToken }: AdminGuestManagementProps) {
  const [checkIns, setCheckIns] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const fetchCheckIns = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/admin/check-ins-today`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch check-ins');
      }

      const data = await response.json();
      setCheckIns(data);
    } catch (err) {
      setError('Failed to load today\'s check-ins');
      console.error('Fetch check-ins error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
  }, [accessToken]);

  const handleCheckIn = async (bookingId: string) => {
    setCheckingInId(bookingId);
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
            status: 'checked_in',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check in guest');
      }

      // Refresh the list
      await fetchCheckIns();
    } catch (err) {
      setError('Failed to check in guest');
      console.error('Check-in error:', err);
    } finally {
      setCheckingInId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-2">Guest Management</h2>
          <p className="text-gray-600">Today's check-ins</p>
        </div>
        <Button onClick={fetchCheckIns} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Check-ins for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
          <CardDescription>
            {checkIns.length} guest{checkIns.length !== 1 ? 's' : ''} scheduled for check-in today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading check-ins...</p>
          ) : checkIns.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No check-ins scheduled for today</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Guest Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkIns.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.id}</TableCell>
                      <TableCell>{booking.user_name}</TableCell>
                      <TableCell>{booking.user_email}</TableCell>
                      <TableCell>{booking.room_number}</TableCell>
                      <TableCell>{booking.room_type_name}</TableCell>
                      <TableCell>{formatDate(booking.check_out)}</TableCell>
                      <TableCell>{booking.guests}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500">
                          {booking.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(booking.id)}
                          disabled={checkingInId === booking.id}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {checkingInId === booking.id ? 'Checking in...' : 'Check In'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
