import type { Viewport } from "next";
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileProvider } from '@/context/ProfileProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import DynamicBreadcrumbs from '@/components/dynamic-breadcrumbs';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  const profileWithEmail = {
    ...profile,
    email: user.email,
  };

  const { data: company } = profileWithEmail.role === "company"
    ? await supabase
        .from("companies")
        .select("onboarding_status")
        .eq("id", user.id)
        .single()
    : { data: null };

  // Verhindere Redirect-Loop: Wenn children die OnboardingPage ist, kein Redirect
  // Annahme: OnboardingPage wird nicht im DashboardLayout gerendert, sondern separat
  if (profileWithEmail.role === "company" && company && company.onboarding_status === "not_started") {
    redirect("/onboarding");
  }

  return (
    <ProfileProvider profile={profileWithEmail}>
      <SidebarProvider
        defaultOpen={true}
        style={{
          "--sidebar-width": "16rem",
          "--header-height": "3rem",
        } as React.CSSProperties}
      >
        <div className="flex h-screen w-full">
          <AppSidebar user={profileWithEmail} role={profileWithEmail.role} />
          <div className="flex-1 flex flex-col min-h-0">
            <SiteHeader>
              <Breadcrumb>
                <DynamicBreadcrumbs />
              </Breadcrumb>
            </SiteHeader>
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ProfileProvider>
  );
}