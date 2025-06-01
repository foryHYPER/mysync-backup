"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/context/ProfileContext";
import { 
  IconBuilding, 
  IconMail, 
  IconPhone, 
  IconLink, 
  IconUser,
  IconDeviceFloppy
} from "@tabler/icons-react";

export default function CompanyProfilePage() {
  const profile = useProfile();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Unternehmensprofil</h1>
          <p className="text-muted-foreground">
            Verwalten Sie hier Ihre Unternehmensdaten und Kontaktinformationen.
          </p>
        </div>

        {/* Company Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuilding className="h-5 w-5" />
              Unternehmensinformationen
            </CardTitle>
            <CardDescription>
              Grundlegende Informationen über Ihr Unternehmen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Firmenname</Label>
                <Input
                  id="company_name"
                  placeholder="Ihr Firmenname"
                  value={profile?.company_name || ""}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                placeholder="Straße, PLZ Stadt, Land"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2">
                  <IconMail className="h-4 w-4" />
                  Kontakt E-Mail
                </Label>
                <Input
                  id="contact_email"
                  placeholder="kontakt@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="flex items-center gap-2">
                  <IconPhone className="h-4 w-4" />
                  Telefon
                </Label>
                <Input
                  id="contact_phone"
                  placeholder="+49 123 456789"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Unternehmensbeschreibung</Label>
              <Textarea
                id="description"
                placeholder="Beschreiben Sie Ihr Unternehmen und Ihre Tätigkeitsbereiche..."
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button disabled={loading}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                {loading ? "Speichern..." : "Profil speichern"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Person Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Ansprechpartner
            </CardTitle>
            <CardDescription>
              Primärer Ansprechpartner für Bewerbungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Name</Label>
                <Input
                  id="contact_name"
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_title">Position</Label>
                <Input
                  id="contact_title"
                  placeholder="HR Manager"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button disabled={loading}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                {loading ? "Speichern..." : "Kontakt speichern"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 