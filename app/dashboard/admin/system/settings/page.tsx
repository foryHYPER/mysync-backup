"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { 
  IconSettings,
  IconArrowLeft,
  IconDeviceFloppy,
  IconRefresh,
  IconShield,
  IconMail,
  IconDatabase,
  IconCloud,
  IconBell,
  IconToggleLeft,
  IconKey,
  IconGlobe,
  IconUsers,
  IconFileText
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SystemSettings = {
  general: {
    platform_name: string;
    platform_description: string;
    maintenance_mode: boolean;
    registration_enabled: boolean;
    max_candidates_per_company: number;
    max_job_postings_per_company: number;
  };
  authentication: {
    password_min_length: number;
    require_email_verification: boolean;
    enable_two_factor: boolean;
    session_timeout: number;
    max_login_attempts: number;
  };
  notifications: {
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    notification_frequency: "immediate" | "daily" | "weekly";
  };
  matching: {
    enable_auto_matching: boolean;
    min_match_score: number;
    max_matches_per_candidate: number;
    match_expiry_days: number;
  };
  data: {
    data_retention_days: number;
    enable_analytics: boolean;
    backup_frequency: "daily" | "weekly" | "monthly";
    export_format: "csv" | "json" | "xlsx";
  };
  integrations: {
    enable_api: boolean;
    api_rate_limit: number;
    webhook_enabled: boolean;
    third_party_integrations: boolean;
  };
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      // Mock settings data - in real app, this would come from a settings table
      const mockSettings: SystemSettings = {
        general: {
          platform_name: "mySync",
          platform_description: "Moderne Recruitment-Plattform für IT-Professionals",
          maintenance_mode: false,
          registration_enabled: true,
          max_candidates_per_company: 100,
          max_job_postings_per_company: 50
        },
        authentication: {
          password_min_length: 8,
          require_email_verification: true,
          enable_two_factor: false,
          session_timeout: 480, // 8 hours in minutes
          max_login_attempts: 5
        },
        notifications: {
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          notification_frequency: "immediate"
        },
        matching: {
          enable_auto_matching: true,
          min_match_score: 70,
          max_matches_per_candidate: 10,
          match_expiry_days: 30
        },
        data: {
          data_retention_days: 365,
          enable_analytics: true,
          backup_frequency: "daily",
          export_format: "xlsx"
        },
        integrations: {
          enable_api: true,
          api_rate_limit: 1000,
          webhook_enabled: true,
          third_party_integrations: true
        }
      };

      setSettings(mockSettings);

    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Fehler beim Laden der Einstellungen");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    try {
      setSaving(true);

      // In real app, save to database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay

      toast.success("Einstellungen erfolgreich gespeichert");

    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(category: keyof SystemSettings, key: string, value: any) {
    if (!settings) return;

    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value
      }
    }));
  }

  if (loading || !settings) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">System-Einstellungen</h1>
            <p className="text-muted-foreground">Lade Einstellungen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin">
              <Button variant="outline" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Dashboard
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">System-Einstellungen</h1>
              <p className="text-muted-foreground">
                Konfiguriere plattformweite Einstellungen und Features
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadSettings}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              {saving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSettings className="h-5 w-5" />
                Allgemeine Einstellungen
              </CardTitle>
              <CardDescription>
                Grundlegende Plattform-Konfigurationen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plattform-Name</label>
                  <Input
                    value={settings.general.platform_name}
                    onChange={(e) => updateSetting("general", "platform_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Beschreibung</label>
                  <Input
                    value={settings.general.platform_description}
                    onChange={(e) => updateSetting("general", "platform_description", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max. Kandidaten pro Unternehmen</label>
                  <Input
                    type="number"
                    value={settings.general.max_candidates_per_company}
                    onChange={(e) => updateSetting("general", "max_candidates_per_company", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max. Job-Postings pro Unternehmen</label>
                  <Input
                    type="number"
                    value={settings.general.max_job_postings_per_company}
                    onChange={(e) => updateSetting("general", "max_job_postings_per_company", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Wartungsmodus</div>
                  <div className="text-sm text-muted-foreground">
                    Plattform für Wartungsarbeiten sperren
                  </div>
                </div>
                <Switch
                  checked={settings.general.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting("general", "maintenance_mode", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Registrierung aktiviert</div>
                  <div className="text-sm text-muted-foreground">
                    Neue Benutzer-Registrierungen erlauben
                  </div>
                </div>
                <Switch
                  checked={settings.general.registration_enabled}
                  onCheckedChange={(checked) => updateSetting("general", "registration_enabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Authentication Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5" />
                Authentifizierung & Sicherheit
              </CardTitle>
              <CardDescription>
                Sicherheitsrichtlinien und Authentifizierungseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min. Passwort-Länge</label>
                  <Input
                    type="number"
                    value={settings.authentication.password_min_length}
                    onChange={(e) => updateSetting("authentication", "password_min_length", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session-Timeout (Minuten)</label>
                  <Input
                    type="number"
                    value={settings.authentication.session_timeout}
                    onChange={(e) => updateSetting("authentication", "session_timeout", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max. Login-Versuche</label>
                  <Input
                    type="number"
                    value={settings.authentication.max_login_attempts}
                    onChange={(e) => updateSetting("authentication", "max_login_attempts", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">E-Mail-Verifizierung erforderlich</div>
                  <div className="text-sm text-muted-foreground">
                    E-Mail-Bestätigung bei Registrierung verlangen
                  </div>
                </div>
                <Switch
                  checked={settings.authentication.require_email_verification}
                  onCheckedChange={(checked) => updateSetting("authentication", "require_email_verification", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Zwei-Faktor-Authentifizierung</div>
                  <div className="text-sm text-muted-foreground">
                    2FA für erhöhte Sicherheit aktivieren
                  </div>
                </div>
                <Switch
                  checked={settings.authentication.enable_two_factor}
                  onCheckedChange={(checked) => updateSetting("authentication", "enable_two_factor", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBell className="h-5 w-5" />
                Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Konfiguriere Benachrichtigungskanäle und -häufigkeit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Benachrichtigungs-Häufigkeit</label>
                <Select
                  value={settings.notifications.notification_frequency}
                  onValueChange={(value) => updateSetting("notifications", "notification_frequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Sofort</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">E-Mail</div>
                    <div className="text-sm text-muted-foreground">E-Mail-Benachrichtigungen</div>
                  </div>
                  <Switch
                    checked={settings.notifications.email_notifications}
                    onCheckedChange={(checked) => updateSetting("notifications", "email_notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Push</div>
                    <div className="text-sm text-muted-foreground">Browser-Push-Benachrichtigungen</div>
                  </div>
                  <Switch
                    checked={settings.notifications.push_notifications}
                    onCheckedChange={(checked) => updateSetting("notifications", "push_notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">SMS</div>
                    <div className="text-sm text-muted-foreground">SMS-Benachrichtigungen</div>
                  </div>
                  <Switch
                    checked={settings.notifications.sms_notifications}
                    onCheckedChange={(checked) => updateSetting("notifications", "sms_notifications", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matching Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Matching-Algorithmus
              </CardTitle>
              <CardDescription>
                Konfiguriere Matching-Parameter und -Logik
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min. Match-Score (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.matching.min_match_score}
                    onChange={(e) => updateSetting("matching", "min_match_score", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max. Matches pro Kandidat</label>
                  <Input
                    type="number"
                    value={settings.matching.max_matches_per_candidate}
                    onChange={(e) => updateSetting("matching", "max_matches_per_candidate", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Match-Ablauf (Tage)</label>
                  <Input
                    type="number"
                    value={settings.matching.match_expiry_days}
                    onChange={(e) => updateSetting("matching", "match_expiry_days", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Automatisches Matching</div>
                  <div className="text-sm text-muted-foreground">
                    Automatische Kandidaten-Job-Matches erstellen
                  </div>
                </div>
                <Switch
                  checked={settings.matching.enable_auto_matching}
                  onCheckedChange={(checked) => updateSetting("matching", "enable_auto_matching", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDatabase className="h-5 w-5" />
                Daten & Analytik
              </CardTitle>
              <CardDescription>
                Datenaufbewahrung, Backups und Export-Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Datenaufbewahrung (Tage)</label>
                  <Input
                    type="number"
                    value={settings.data.data_retention_days}
                    onChange={(e) => updateSetting("data", "data_retention_days", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export-Format</label>
                  <Select
                    value={settings.data.export_format}
                    onValueChange={(value) => updateSetting("data", "export_format", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Backup-Häufigkeit</label>
                <Select
                  value={settings.data.backup_frequency}
                  onValueChange={(value) => updateSetting("data", "backup_frequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Analytik aktiviert</div>
                  <div className="text-sm text-muted-foreground">
                    Datensammlung für Analytik und Berichte
                  </div>
                </div>
                <Switch
                  checked={settings.data.enable_analytics}
                  onCheckedChange={(checked) => updateSetting("data", "enable_analytics", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* API & Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCloud className="h-5 w-5" />
                API & Integrationen
              </CardTitle>
              <CardDescription>
                Externe API-Zugänge und Drittanbieter-Integrationen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Rate Limit (Anfragen/Stunde)</label>
                <Input
                  type="number"
                  value={settings.integrations.api_rate_limit}
                  onChange={(e) => updateSetting("integrations", "api_rate_limit", parseInt(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">API aktiviert</div>
                    <div className="text-sm text-muted-foreground">Externe API-Zugriffe erlauben</div>
                  </div>
                  <Switch
                    checked={settings.integrations.enable_api}
                    onCheckedChange={(checked) => updateSetting("integrations", "enable_api", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Webhooks</div>
                    <div className="text-sm text-muted-foreground">Webhook-Benachrichtigungen senden</div>
                  </div>
                  <Switch
                    checked={settings.integrations.webhook_enabled}
                    onCheckedChange={(checked) => updateSetting("integrations", "webhook_enabled", checked)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Drittanbieter-Integrationen</div>
                  <div className="text-sm text-muted-foreground">
                    Integrationen mit externen Services (LinkedIn, XING, etc.)
                  </div>
                </div>
                <Switch
                  checked={settings.integrations.third_party_integrations}
                  onCheckedChange={(checked) => updateSetting("integrations", "third_party_integrations", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 