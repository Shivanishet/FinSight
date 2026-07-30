import { supabase } from './supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';

function mapAuthError(error: AuthError | null): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const message = error.message ?? 'Authentication failed.';
  const normalized = message.toLowerCase();

  if (normalized.includes('confirm') || normalized.includes('unverified') || normalized.includes('not confirmed')) {
    return 'Please verify your email by clicking the link sent to your inbox.';
  }
  if (normalized.includes('invalid email') || normalized.includes('invalid input syntax for type email')) {
    return 'Please enter a valid email address.';
  }
  if (normalized.includes('password should be at least') || normalized.includes('password must be at least') || normalized.includes('weak password')) {
    return 'Password must be at least 6 characters.';
  }
  if (normalized.includes('already registered') || normalized.includes('duplicate') || normalized.includes('already exists') || normalized.includes('user already exists')) {
    return 'An account already exists with that email.';
  }
  if (normalized.includes('expired') && normalized.includes('link')) {
    return 'The verification link has expired or is invalid. Please request a new one.';
  }

  return message;
}

const redirectBase = import.meta.env.VITE_SUPABASE_REDIRECT_URL as string | undefined;

export async function signUp(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
  const credentials = {
    email,
    password,
    ...(redirectBase ? { emailRedirectTo: `${redirectBase}/verify-email` } : {}),
  };
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) throw new Error(mapAuthError(error));
  return data;
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mapAuthError(error));
  if (!data.session) {
    throw new Error('Unable to sign in. Please verify your email and try again.');
  }
  return data.session;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo = redirectBase ? `${redirectBase}/reset-password` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(mapAuthError(error));
}

export async function updateEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw new Error(mapAuthError(error));
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

