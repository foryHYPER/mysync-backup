import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import CompanyDashboard from "@/components/dashboards/CompanyDashboard";
import CandidateDashboard from "@/components/dashboards/CandidateDashboard";

export default async function DashboardRouter() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.role) {
    redirect("/auth/login");
  }

  switch (profile.role) {
    case "admin":
      return <AdminDashboard />;
    case "client":
      return <CompanyDashboard />;
    case "candidate":
      return <CandidateDashboard />;
    default:
      redirect("/auth/login");
  }
} 