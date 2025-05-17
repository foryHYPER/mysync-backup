"use client";
import { Profile, ProfileContext } from "@/context/ProfileContext";
import { useEffect } from "react";

export function ProfileProvider({ profile, children }: { profile: Profile, children: React.ReactNode }) {
  // Speichere das Profil im localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('profile', JSON.stringify(profile));
    }
  }, [profile]);

  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
} 