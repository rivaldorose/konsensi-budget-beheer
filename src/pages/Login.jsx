import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) throw error;

        if (data.user && !data.session) {
          // Email confirmation required
          toast({
            title: 'Check je email! 📧',
            description: 'We hebben een bevestigingslink gestuurd naar je email.',
          });
        } else {
          // Auto sign in after signup
          toast({
            title: 'Account aangemaakt! ✅',
            description: 'Welkom bij Konsensi!',
          });
          navigate('/onboarding');
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Ingelogd! ✅',
          description: 'Welkom terug!',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Er is iets misgegaan. Probeer het opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Account aanmaken' : 'Welkom bij Konsensi'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Maak een account aan om te beginnen' 
              : 'Log in om je budget te beheren'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jouw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading ? 'Bezig...' : isSignUp ? 'Account aanmaken' : 'Inloggen'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isSignUp 
                ? 'Al een account? Log in' 
                : 'Nog geen account? Maak er een aan'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


