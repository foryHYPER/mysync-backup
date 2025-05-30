'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // User-ID holen
      const user = data.user
      if (!user) throw new Error("Kein Benutzer gefunden")

      // Rolle aus profiles-Tabelle holen
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError || !profile?.role) throw new Error("Keine Rolle gefunden")

      // Rollenbasierte Weiterleitung
      if (["admin", "client", "candidate"].includes(profile.role)) {
        router.push("/dashboard")
      } else if (profile.role === "company") {
        // Für Unternehmen prüfen wir den Onboarding-Status
        const { data: company } = await supabase
          .from("companies")
          .select("onboarding_status")
          .eq("id", user.id)
          .single()

        if (company?.onboarding_status === "not_started") {
          router.push("/onboarding")
        } else {
          // Unternehmen werden zum Company-Dashboard weitergeleitet
          router.push("/dashboard/company")
        }
      } else {
        router.push("/auth/login")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Einloggen</CardTitle>
          <CardDescription>Bitte geben Sie Ihre E-Mail Adresse und Ihr Passwort ein, um sich mit Ihrem Account anzumelden.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="E-mail Adresse"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Passwort</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Passwort vergessen?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Du hast noch keinen Account?{' '}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Registrieren
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
