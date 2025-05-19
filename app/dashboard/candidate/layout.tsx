import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileProvider } from '@/context/ProfileProvider';

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/auth/login");
  }

  // Stelle sicher, dass der Benutzer ein Kandidat ist
  if (profile.role !== "candidate") {
    redirect("/dashboard");
  }

  const profileWithEmail = {
    ...profile,
    email: user.email,
  };

  return (
    <ProfileProvider profile={profileWithEmail}>
      {children}
    </ProfileProvider>
  );
} 