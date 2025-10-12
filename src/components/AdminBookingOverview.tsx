import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { RefreshCw, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  room_number: string;
  room_type_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
}

interface AdminBookingOverviewProps {
  accessToken: string;
}

export function AdminBookingOverview({ accessToken }: AdminBookingOverviewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
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
          total_price,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setBookings(data || []);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [accessToken]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancellingId(bookingId);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (updateError) {
        throw updateError;
      }

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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'checked_in':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filterBookings = (status?: string) => {
    if (!status) return bookings;
    return bookings.filter(b => b.status === status);
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    checkedIn: bookings.filter(b => b.status === 'checked_in').length,
    checkedOut: bookings.filter(b => b.status === 'checked_out').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">Booking Overview</h2>
          <p className="text-slate-600 dark:text-slate-400">View and manage all reservations</p>
        </div>
        <Button onClick={fetchBookings} disabled={loading} variant="outline" className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-600 dark:text-slate-400">Total Bookings</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardDescription className="text-blue-700 dark:text-blue-300">Confirmed</CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.confirmed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-700 dark:text-green-300">Checked In</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.checkedIn}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-700 dark:text-gray-300">Checked Out</CardDescription>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.checkedOut}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardDescription className="text-red-700 dark:text-red-300">Cancelled</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.cancelled}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
        <CardHeader className="relative bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
          <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">All Bookings</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Comprehensive view of all reservations</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 mb-6">
              <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                Confirmed ({stats.confirmed})
              </TabsTrigger>
              <TabsTrigger value="checked_in" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                Checked In ({stats.checkedIn})
              </TabsTrigger>
              <TabsTrigger value="checked_out" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                Checked Out ({stats.checkedOut})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                Cancelled ({stats.cancelled})
              </TabsTrigger>
            </TabsList>

            {(['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] as const).map((tab) => (
              <TabsContent key={tab} value={tab}>
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Loading bookings...</p>
                  </div>
                ) : filterBookings(tab === 'all' ? undefined : tab).length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg">No bookings found</p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">No bookings match the selected filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 dark:border-slate-700">
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Booking ID</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Guest</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Email</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Room</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Room Type</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Check-in</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Check-out</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Guests</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Total</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Status</TableHead>
                          <TableHead className="text-slate-900 dark:text-slate-100 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterBookings(tab === 'all' ? undefined : tab).map((booking) => (
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
                            <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(booking.check_in)}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(booking.check_out)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600 dark:text-green-400">${booking.total_price}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingId === booking.id}
                                  className="gap-2 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200"
                                >
                                  <XCircle className="w-4 h-4" />
                                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
