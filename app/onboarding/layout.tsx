import { ProfileProvider } from "@/context/ProfileProvider";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // Optional: redirect("/auth/login");
    return <div>Bitte einloggen...</div>;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Optional: redirect("/auth/login");
    return <div>Profil nicht gefunden...</div>;
  }

  const profileWithEmail = {
    ...profile,
    email: user.email,
  };

  return (
    <ProfileProvider profile={profileWithEmail}>
      <div className="min-h-screen flex items-center justify-center bg-muted">
        {children}
      </div>
    </ProfileProvider>
  );
} 