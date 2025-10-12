import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Auth } from './components/Auth';
import { RoomSearch } from './components/RoomSearch';
import { MyBookings } from './components/MyBookings';
import { AdminGuestManagement } from './components/AdminGuestManagement';
import { AdminRoomManagement } from './components/AdminRoomManagement';
import { AdminBookingOverview } from './components/AdminBookingOverview';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Hotel, LogOut, Search, Calendar, Users, Settings, BarChart, Home, Info } from 'lucide-react';

type View = 'search' | 'bookings';
type AdminView = 'check-ins' | 'rooms' | 'bookings' | 'dashboard';

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<View>('search');
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
      }
      setInitializing(false);
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Initialize the database with sample data and admin account
    const initializeData = async () => {
      try {
        // Create admin account
        const adminResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/create-admin`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const adminResult = await adminResponse.json();
        console.log('Admin account setup:', adminResult);

        // Initialize room data
        const initResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/init`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const initResult = await initResponse.json();
        console.log('Initialization result:', initResult);
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    initializeData();
  }, []);

  const handleAuthSuccess = (token: string) => {
    setAccessToken(token);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setIsAdmin(false);
    setView('search');
  };

  const handleBookingSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setView('bookings');
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Hotel className="w-12 h-12 text-blue-600" />
              <h1 className="text-4xl">Hotel Management System</h1>
            </div>
            <p className="text-gray-600 mb-6">Welcome to our hotel booking platform</p>
            <Alert className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-left">
                <strong className="text-blue-900">🎯 Quick Start Guide:</strong>
                <div className="mt-2 space-y-1 text-sm text-blue-800">
                  <p>• <strong>Guest Portal:</strong> Create an account to search and book rooms</p>
                  <p>• <strong>Admin Portal:</strong> Login with admin@hotel.com / admin123</p>
                  <p>• All data is stored in your Supabase database and visible in your dashboard</p>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant={!isAdmin ? 'default' : 'outline'}
              onClick={() => setIsAdmin(false)}
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Guest Portal
            </Button>
            <Button
              variant={isAdmin ? 'default' : 'outline'}
              onClick={() => setIsAdmin(true)}
              size="lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              Admin Portal
            </Button>
          </div>

          <Auth onAuthSuccess={handleAuthSuccess} isAdmin={isAdmin} />
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Hotel className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl">Hotel Admin Panel</h1>
              </div>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-4 mb-6">
            <Button
              variant={adminView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setAdminView('dashboard')}
            >
              <BarChart className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={adminView === 'check-ins' ? 'default' : 'outline'}
              onClick={() => setAdminView('check-ins')}
            >
              <Users className="w-4 h-4 mr-2" />
              Guest Check-ins
            </Button>
            <Button
              variant={adminView === 'rooms' ? 'default' : 'outline'}
              onClick={() => setAdminView('rooms')}
            >
              <Hotel className="w-4 h-4 mr-2" />
              Room Management
            </Button>
            <Button
              variant={adminView === 'bookings' ? 'default' : 'outline'}
              onClick={() => setAdminView('bookings')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              All Bookings
            </Button>
          </div>

          {adminView === 'dashboard' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Hotel className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-3xl mb-4">Welcome to Admin Dashboard</h2>
                <p className="text-gray-600 mb-8">Manage your hotel operations efficiently</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setAdminView('check-ins')}
                    className="h-auto py-6 flex-col gap-2"
                  >
                    <Users className="w-8 h-8" />
                    <div>Guest Check-ins</div>
                    <p className="text-sm text-gray-500">Process today's arrivals</p>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setAdminView('rooms')}
                    className="h-auto py-6 flex-col gap-2"
                  >
                    <Hotel className="w-8 h-8" />
                    <div>Room Management</div>
                    <p className="text-sm text-gray-500">Manage rooms and types</p>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setAdminView('bookings')}
                    className="h-auto py-6 flex-col gap-2"
                  >
                    <Calendar className="w-8 h-8" />
                    <div>All Bookings</div>
                    <p className="text-sm text-gray-500">View and manage reservations</p>
                  </Button>
                </div>
              </div>
            </div>
          )}
          {adminView === 'check-ins' && <AdminGuestManagement accessToken={accessToken} />}
          {adminView === 'rooms' && <AdminRoomManagement accessToken={accessToken} />}
          {adminView === 'bookings' && <AdminBookingOverview accessToken={accessToken} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Hotel className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl">Hotel Guest Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={view === 'search' ? 'default' : 'ghost'}
                onClick={() => setView('search')}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Rooms
              </Button>
              <Button
                variant={view === 'bookings' ? 'default' : 'ghost'}
                onClick={() => setView('bookings')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                My Bookings
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {view === 'search' && (
          <RoomSearch accessToken={accessToken} onBookingSuccess={handleBookingSuccess} />
        )}
        {view === 'bookings' && (
          <MyBookings accessToken={accessToken} refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
}

export default App;
