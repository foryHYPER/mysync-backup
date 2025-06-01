"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useProfile } from "@/context/ProfileContext";
import { 
  IconSettings, 
  IconBell,
  IconShield,
  IconMail,
  IconDeviceFloppy,
  IconLogout,
  IconKey,
  IconDatabase
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CompanySettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [poolUpdates, setPoolUpdates] = useState(true);
  const [saving, setSaving] = useState(false);
  const profile = useProfile();
  const router = useRouter();
  const supabase = createClient();

  async function saveSettings() {
    try {
      setSaving(true);
      // In a real implementation, you would save these settings to the database
      // For now, this is just a mock save
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success("Einstellungen erfolgreich gespeichert");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Fehler beim Abmelden");
    }
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Account-Einstellungen und Benachrichtigungen
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 max-w-4xl">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBell className="h-5 w-5" />
                Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Ihre E-Mail-Benachrichtigungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notifications">E-Mail-Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Erhalten Sie allgemeine E-Mail-Benachrichtigungen
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="match-notifications">Neue Matches</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigung bei neuen Kandidaten-Matches
                  </p>
                </div>
                <Switch
                  id="match-notifications"
                  checked={matchNotifications}
                  onCheckedChange={setMatchNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="pool-updates">Pool-Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Updates zu Ihren zugewiesenen Kandidaten-Pools
                  </p>
                </div>
                <Switch
                  id="pool-updates"
                  checked={poolUpdates}
                  onCheckedChange={setPoolUpdates}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="weekly-reports">Wöchentliche Berichte</Label>
                  <p className="text-sm text-muted-foreground">
                    Erhalten Sie wöchentliche Aktivitätsberichte
                  </p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={weeklyReports}
                  onCheckedChange={setWeeklyReports}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5" />
                Account & Sicherheit
              </CardTitle>
              <CardDescription>
                Verwalten Sie Ihren Account und Sicherheitseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>E-Mail-Adresse</Label>
                  <p className="text-sm text-muted-foreground mt-1">{profile?.email}</p>
                </div>

                <div>
                  <Label>Rolle</Label>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{profile?.role}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <IconKey className="h-4 w-4 mr-2" />
                  Passwort ändern
                  <span className="ml-auto text-xs text-muted-foreground">Bald verfügbar</span>
                </Button>

                <Button variant="outline" className="w-full justify-start" disabled>
                  <IconMail className="h-4 w-4 mr-2" />
                  E-Mail-Adresse ändern
                  <span className="ml-auto text-xs text-muted-foreground">Bald verfügbar</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDatabase className="h-5 w-5" />
                Daten & Datenschutz
              </CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Daten und Datenschutzeinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <IconDatabase className="h-4 w-4 mr-2" />
                  Meine Daten herunterladen
                  <span className="ml-auto text-xs text-muted-foreground">Bald verfügbar</span>
                </Button>

                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" disabled>
                  <IconShield className="h-4 w-4 mr-2" />
                  Account löschen
                  <span className="ml-auto text-xs text-muted-foreground">Bald verfügbar</span>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                <p>
                  Ihre Daten werden gemäß unserer Datenschutzrichtlinie verarbeitet. 
                  Bei Fragen wenden Sie sich an unseren Support.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Settings */}
          <div className="flex items-center justify-between pt-6">
            <Button onClick={saveSettings} disabled={saving}>
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              {saving ? "Speichert..." : "Einstellungen speichern"}
            </Button>

            <Button variant="outline" onClick={handleLogout}>
              <IconLogout className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 