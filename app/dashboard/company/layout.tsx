import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileProvider } from '@/context/ProfileProvider';

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
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

  // Stelle sicher, dass der Benutzer ein Unternehmen ist
  if (profile.role !== "company") {
    redirect("/dashboard");
  }

  // Get company data to include company_id in profile
  const { data: companyData } = await supabase
    .from("companies")
    .select("id, name, onboarding_status")
    .eq("id", user.id)
    .single();

  const profileWithEmailAndCompany = {
    ...profile,
    email: user.email,
    company_id: user.id, // For companies, the profile id IS the company id
    company_name: companyData?.name || "",
    onboarding_status: companyData?.onboarding_status || "not_started"
  };

  return (
    <ProfileProvider profile={profileWithEmailAndCompany}>
      {children}
    </ProfileProvider>
  );
} 