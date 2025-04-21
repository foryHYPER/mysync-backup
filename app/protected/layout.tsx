import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  // Die Rolle kann weiterhin geladen werden, falls du sie für andere Zwecke brauchst
  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select("role")
  //   .eq("id", user.id)
  //   .single();

  return <>{children}</>;
} 