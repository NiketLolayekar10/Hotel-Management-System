import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface AuthProps {
  onAuthSuccess: (accessToken: string) => void;
  isAdmin?: boolean;
}

export function Auth({ onAuthSuccess, isAdmin = false }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.session?.access_token) {
        // Verify role if admin login
        if (isAdmin) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError || profile?.role !== 'admin') {
            setError('Access denied. Admin privileges required.');
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }

        onAuthSuccess(data.session.access_token);
      }
    } catch (err) {
      setError('An error occurred during sign in');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'guest'
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email,
            name,
            role: 'guest'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          setError('Account created but profile setup failed. Please try signing in.');
          setLoading(false);
          return;
        }

        // Sign in after successful signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        if (signInData.session?.access_token) {
          onAuthSuccess(signInData.session.access_token);
        }
      }
    } catch (err) {
      setError('An error occurred during sign up');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setCreatingAdmin(true);
    setError('');
    setAdminCreated(false);

    try {
      // Create admin user
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: 'admin@hotel.com',
        password: 'admin123',
        user_metadata: { name: 'Hotel Administrator', role: 'admin' },
        email_confirm: true
      });

      if (adminError) {
        if (adminError.message.includes('already') || adminError.message.includes('exists')) {
          setAdminCreated(true);
          setEmail('admin@hotel.com');
          setPassword('admin123');
        } else {
          setError(adminError.message);
        }
        setCreatingAdmin(false);
        return;
      }

      if (adminData?.user) {
        // Create admin profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: adminData.user.id,
            email: 'admin@hotel.com',
            name: 'Hotel Administrator',
            role: 'admin'
          });

        if (profileError) {
          console.error('Error creating admin profile:', profileError);
          setError('Admin user created but profile setup failed.');
        } else {
          setAdminCreated(true);
          setEmail('admin@hotel.com');
          setPassword('admin123');
        }
      }
    } catch (err) {
      setError('Failed to create admin account');
      console.error('Create admin error:', err);
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div>
      <Card className="w-full">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">{isAdmin ? 'Admin Portal' : 'Hotel Guest Portal'}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {isAdmin ? 'Sign in to access the admin dashboard' : 'Sign in or create an account to book your stay'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
              <Alert className="bg-blue-50 border-blue-200 text-xs sm:text-sm py-2 sm:py-3">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Default Admin Credentials:</strong><br />
                  Email: admin@hotel.com<br />
                  Password: admin123
                </AlertDescription>
              </Alert>
              {adminCreated && (
                <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm py-2 sm:py-3">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Admin account created successfully! You can now sign in.
                  </AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive" className="text-xs sm:text-sm py-2 sm:py-3">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <AlertDescription>
                    {error}
                    {error.includes('Invalid') && (
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCreateAdmin}
                          disabled={creatingAdmin}
                          className="w-full text-xs sm:text-sm py-1 sm:py-2"
                        >
                          {creatingAdmin ? 'Creating Admin Account...' : 'Create Admin Account'}
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="admin-email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@hotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="admin-password" className="text-xs sm:text-sm">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full text-xs sm:text-sm h-8 sm:h-10 mt-2" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 h-8 sm:h-10">
                <TabsTrigger value="signin" className="text-xs sm:text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-xs sm:text-sm">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-3 sm:mt-4">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  {error && (
                    <Alert variant="destructive" className="text-xs sm:text-sm py-2 sm:py-3">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-email" className="text-xs sm:text-sm">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-password" className="text-xs sm:text-sm">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-xs sm:text-sm h-8 sm:h-10 mt-2" 
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-3 sm:mt-4">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  {error && (
                    <Alert variant="destructive" className="text-xs sm:text-sm py-2 sm:py-3">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-name" className="text-xs sm:text-sm">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-email" className="text-xs sm:text-sm">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-password" className="text-xs sm:text-sm">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-xs sm:text-sm h-8 sm:h-10 mt-2" 
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
