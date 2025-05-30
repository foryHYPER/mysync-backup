"use client"

import { useProfile } from "@/context/ProfileContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRouter() {
  const profile = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!profile.role) {
      router.replace("/auth/login");
    } else if (profile.role === "company") {
      // Unternehmen werden zum Company-Dashboard weitergeleitet
      router.replace("/dashboard/company");
    } else {
      router.replace(`/dashboard/${profile.role}`);
    }
  }, [profile.role, router]);

  return null;
} 