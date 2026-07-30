import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { signIn as svcSignIn, signUp as svcSignUp, signOut as svcSignOut } from '../services/auth';
import { useToast } from '../context/ToastContext';
import { triggerWelcomeEmail } from '../services/welcomeEmail';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Session>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { toast } = useToast();

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    signIn: async (email, password) => {
      const sessionData = await svcSignIn(email, password);
      if (sessionData.user?.email_confirmed_at && !sessionData.user.user_metadata?.welcomeEmailSent) {
        try {
          await triggerWelcomeEmail(sessionData.access_token);
          toast('Welcome email sent.', 'success');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to send welcome email.';
          toast(message, 'warning');
          console.error('Welcome email failed to send:', error);
        }
      }
      return sessionData;
    },
    signUp: async (email, password) => {
      await svcSignUp(email, password);
    },
    signOut: async () => {
      await svcSignOut();
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
