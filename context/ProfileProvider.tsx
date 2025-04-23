"use client";
import { Profile, ProfileContext } from "@/context/ProfileContext";

export function ProfileProvider({ profile, children }: { profile: Profile, children: React.ReactNode }) {
  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
} 