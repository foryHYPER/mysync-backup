"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AccountSection from "@/app/protected/candidate-profile/AccountSection";
import AppearanceSection from "@/app/protected/candidate-profile/AppearanceSection";
import NotificationsSection from "@/app/protected/candidate-profile/NotificationsSection";
import DisplaySection from "@/app/protected/candidate-profile/DisplaySection";
import { createClient } from "@/lib/supabase/client";
import SkillTagInput, { Skill } from "@/app/protected/candidate-profile/SkillTagInput";

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState("account");
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
      // Skills laden
      const { data: skillRows } = await supabase
        .from("candidate_skills")
        .select("skill_id, skills(name, id)")
        .eq("candidate_id", user.id);
      if (skillRows) {
        setSkills(skillRows.map((row: any) => ({ id: row.skills.id, name: row.skills.name })));
      }
      setLoading(false);
    }
    fetchProfile();
    // eslint-disable-next-line
  }, [editMode]);

  if (loading) return <div>Lade Profil...</div>;

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar user={profile} role={profile?.role} />
      <SidebarInset>
        <SiteHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/protected/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Profil</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </SiteHeader>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="display">Display</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account">
                    <AccountSection />
                  </TabsContent>
                  <TabsContent value="appearance">
                    <AppearanceSection />
                  </TabsContent>
                  <TabsContent value="notifications">
                    <NotificationsSection />
                  </TabsContent>
                  <TabsContent value="display">
                    <DisplaySection />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 