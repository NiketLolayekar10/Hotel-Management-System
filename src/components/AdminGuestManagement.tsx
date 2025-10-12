import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  room_number: string;
  room_type_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_price: number;
}

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
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id,
          user_name,
          user_email,
          room_number,
          room_type_name,
          check_in,
          check_out,
          guests,
          status,
          total_price
        `)
        .eq('check_in', today)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setCheckIns(data || []);
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
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'checked_in' })
        .eq('id', bookingId);

      if (updateError) {
        throw updateError;
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
          <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">Guest Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Today's check-ins and guest arrivals</p>
        </div>
        <Button onClick={fetchCheckIns} disabled={loading} variant="outline" className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
        <CardHeader className="relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
          <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Check-ins for {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {checkIns.length} guest{checkIns.length !== 1 ? 's' : ''} scheduled for check-in today
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Loading check-ins...</p>
            </div>
          ) : checkIns.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">No check-ins scheduled for today</p>
              <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">All guests have been checked in or no arrivals expected</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Booking ID</TableHead>
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Guest Name</TableHead>
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Email</TableHead>
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Room</TableHead>
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Room Type</TableHead>
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Check-out</TableHead>
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Guests</TableHead>
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkIns.map((booking) => (
                    <TableRow key={booking.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">{booking.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{booking.user_name}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{booking.user_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          {booking.room_number}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{booking.room_type_name}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(booking.check_out)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          booking.status === 'confirmed' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                            : booking.status === 'checked_in'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(booking.id)}
                          disabled={checkingInId === booking.id || booking.status === 'checked_in'}
                          className="gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-all duration-200"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {checkingInId === booking.id ? 'Checking in...' : booking.status === 'checked_in' ? 'Checked In' : 'Check In'}
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
