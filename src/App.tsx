import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase/client';
import info, { publicAnonKey, projectId } from './utils/supabase/info';
import { Auth } from './components/Auth';
import { RoomSearch } from './components/RoomSearch';
import { MyBookings } from './components/MyBookings';
import { AdminGuestManagement } from './components/AdminGuestManagement';
import { AdminRoomManagement } from './components/AdminRoomManagement';
import { AdminBookingOverview } from './components/AdminBookingOverview';
import { Button } from './components/ui/button';

type View = 'search' | 'bookings' | 'admin';
type AdminView = 'dashboard' | 'check-ins' | 'rooms' | 'bookings';

export default function App() {
  const [session, setSession] = useState(null as any);
  const [view, setView] = useState('search' as View);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminView, setAdminView] = useState('dashboard' as AdminView);

  useEffect(() => {
    // Sync initial session
    supabase.auth.getSession().then(({ data }) => setSession((data as any).session ?? null));

    // Listen for changes
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s ?? null);
    });

    // `data` contains { subscription }
    // unsubscribe when component unmounts
    return () => {
      try {
        (data as any)?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('search');
    setIsAdminMode(false);
  };

  // Explicit init call so developers can control when seeding happens
  const handleInitialize = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3e6b123f/init`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const json = await res.json();
      console.log('Init:', json);
      alert('Initialization finished: ' + (json?.message || 'done'));
    } catch (err) {
      console.error('Init failed', err);
      alert('Initialization failed; check console.');
    }
  };

  // Simple layout
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-bold text-lg">Hotel Management</div>
            <nav className="hidden md:flex gap-2 text-sm text-slate-600">
              <button onClick={() => { setIsAdminMode(false); setView('search'); }} className={`px-3 py-1 rounded ${view === 'search' ? 'bg-slate-100' : ''}`}>Guest</button>
              <button onClick={() => { setIsAdminMode(true); setView('admin'); }} className={`px-3 py-1 rounded ${view === 'admin' ? 'bg-slate-100' : ''}`}>Admin</button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleInitialize} variant="outline">Initialize Data</Button>
            {session ? (
              <Button onClick={handleSignOut} variant="ghost">Sign Out</Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!session && (
          <div className="max-w-md mx-auto">
            <Auth onAuthSuccess={(token: string) => setSession({ access_token: token })} isAdmin={isAdminMode} />
          </div>
        )}

        {session && !isAdminMode && (
          <div>
            <div className="mb-4 flex gap-2">
              <Button onClick={() => setView('search')} variant={view === 'search' ? 'default' : 'ghost'}>Search</Button>
              <Button onClick={() => setView('bookings')} variant={view === 'bookings' ? 'default' : 'ghost'}>My Bookings</Button>
            </div>

            {view === 'search' && <RoomSearch accessToken={session.access_token} onBookingSuccess={() => setView('bookings')} />}
            {view === 'bookings' && <MyBookings accessToken={session.access_token} />}
          </div>
        )}

        {session && isAdminMode && (
          <div>
            <div className="mb-4 flex gap-2">
              <Button onClick={() => setAdminView('dashboard')} variant={adminView === 'dashboard' ? 'default' : 'ghost'}>Dashboard</Button>
              <Button onClick={() => setAdminView('check-ins')} variant={adminView === 'check-ins' ? 'default' : 'ghost'}>Check-ins</Button>
              <Button onClick={() => setAdminView('rooms')} variant={adminView === 'rooms' ? 'default' : 'ghost'}>Rooms</Button>
              <Button onClick={() => setAdminView('bookings')} variant={adminView === 'bookings' ? 'default' : 'ghost'}>Bookings</Button>
            </div>

            {adminView === 'check-ins' && <AdminGuestManagement accessToken={session.access_token} />}
            {adminView === 'rooms' && <AdminRoomManagement accessToken={session.access_token} />}
            {adminView === 'bookings' && <AdminBookingOverview accessToken={session.access_token} />}
            {adminView === 'dashboard' && (
              <div className="bg-white p-6 rounded shadow">Welcome to the admin dashboard.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}