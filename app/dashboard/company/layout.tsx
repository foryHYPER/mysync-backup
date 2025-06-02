"use client";

import { useProfile } from "@/context/ProfileContext";
import { redirect } from "next/navigation";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = useProfile();

  // Redirect if user is not a company
  if (profile && profile.role !== "company") {
    redirect("/dashboard");
  }

  // The parent dashboard layout already provides the sidebar
  // so we just need to render the children
  return <>{children}</>;
} 