"use client";
import { Profile, ProfileContext } from "@/context/ProfileContext";
import { useEffect, useState } from "react";

export function ProfileProvider({ profile, children }: { profile: Profile, children: React.ReactNode }) {
  const [currentProfile, setCurrentProfile] = useState<Profile>(profile);

  // Lade und speichere das Profil im localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speichere das neue Profil
      localStorage.setItem('profile', JSON.stringify(profile));
      setCurrentProfile(profile);
    }
  }, [profile]);

  // Lade das Profil aus dem localStorage beim ersten Render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('profile');
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          setCurrentProfile(parsedProfile);
        } catch (error) {
          console.error('Fehler beim Laden des Profils aus dem localStorage:', error);
        }
      }
    }
  }, []);

  return (
    <ProfileContext.Provider value={currentProfile}>
      {children}
    </ProfileContext.Provider>
  );
} 