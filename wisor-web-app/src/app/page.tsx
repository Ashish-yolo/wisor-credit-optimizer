'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LoginForm from '@/components/auth/LoginForm';
import OTPForm from '@/components/auth/OTPForm';
import AddCardForm from '@/components/cards/AddCardForm';
import Dashboard from '@/components/Dashboard';
import { AuthSession, Card } from '@/types';
import toast from 'react-hot-toast';

type AppState = 'loading' | 'login' | 'otp' | 'add-cards' | 'dashboard';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [session, setSession] = useState<AuthSession>({ user: null, isLoading: true });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userCards, setUserCards] = useState<Card[]>([]);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setSession({ user: session.user as any, isLoading: false });
          await checkUserCards(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setSession({ user: null, isLoading: false });
          setAppState('login');
          setUserCards([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        setSession({ user: null, isLoading: false });
        setAppState('login');
        return;
      }

      if (session) {
        setSession({ user: session.user as any, isLoading: false });
        await checkUserCards(session.user.id);
      } else {
        setSession({ user: null, isLoading: false });
        setAppState('login');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setSession({ user: null, isLoading: false });
      setAppState('login');
    }
  };

  const checkUserCards = async (userId: string) => {
    try {
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching cards:', error);
        setAppState('add-cards');
        return;
      }

      setUserCards(cards || []);
      
      if (cards && cards.length > 0) {
        setAppState('dashboard');
      } else {
        setAppState('add-cards');
      }
    } catch (error) {
      console.error('Error checking user cards:', error);
      setAppState('add-cards');
    }
  };

  const handleOTPSent = (phone: string) => {
    setPhoneNumber(phone);
    setAppState('otp');
  };

  const handlePhoneVerified = () => {
    // Session will be updated by auth state change listener
    // which will then check for cards and set appropriate state
  };

  const handleCardsAdded = async (cards: Omit<Card, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    if (!session.user) return;

    try {
      const { data: insertedCards, error } = await supabase
        .from('cards')
        .insert(
          cards.map(card => ({
            user_id: session.user!.id,
            ...card
          }))
        )
        .select();

      if (error) {
        throw error;
      }

      setUserCards(insertedCards);
      setAppState('dashboard');
      toast.success(`Successfully added ${insertedCards.length} card(s)!`);
    } catch (error: any) {
      console.error('Error adding cards:', error);
      toast.error(error.message || 'Failed to add cards');
    }
  };

  const handleBackToLogin = () => {
    setAppState('login');
    setPhoneNumber('');
  };

  // Loading state
  if (session.isLoading || appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">W</span>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-600">Loading Wisor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {appState === 'login' && (
          <LoginForm onOTPSent={handleOTPSent} />
        )}
        
        {appState === 'otp' && (
          <OTPForm 
            phone={phoneNumber}
            onBack={handleBackToLogin}
            onVerified={handlePhoneVerified}
          />
        )}
        
        {appState === 'add-cards' && (
          <AddCardForm onCardsAdded={handleCardsAdded} />
        )}
        
        {appState === 'dashboard' && (
          <Dashboard 
            user={session.user!}
            cards={userCards}
            onCardsUpdated={setUserCards}
          />
        )}
      </div>
    </main>
  );
}