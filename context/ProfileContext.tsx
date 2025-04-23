

import { createContext, useContext } from "react"

export type Profile = {
  id: string
  email: string
  name?: string
  role: string
  [key: string]: any
}

export const ProfileContext = createContext<Profile | null>(null)

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider")
  return ctx
} 