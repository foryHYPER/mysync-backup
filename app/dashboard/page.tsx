"use client"

import { useProfile } from "@/context/ProfileContext";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import CompanyDashboard from "@/components/dashboards/CompanyDashboard";
import CandidateDashboard from "@/components/dashboards/CandidateDashboard";
import { useRouter } from "next/navigation";

export default function DashboardRouter() {
  const profile = useProfile();
  const router = useRouter();
  

  switch (profile.role) {
    case "admin":
      return <AdminDashboard />;
    case "client":
      return <CompanyDashboard />;
    case "candidate":
      return <CandidateDashboard />;
    default:
      if (typeof window !== "undefined") {
        router.replace("/auth/login");
      }
      return null;
  }
} 