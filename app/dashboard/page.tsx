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
    } else if (["admin", "company", "candidate"].includes(profile.role)) {
      router.replace(`/dashboard/${profile.role}`);
    } else {
      // Fallback für unbekannte Rollen
      console.error(`Unbekannte Rolle: ${profile.role}`);
      router.replace("/auth/login");
    }
  }, [profile.role, router]);

  return null;
} 