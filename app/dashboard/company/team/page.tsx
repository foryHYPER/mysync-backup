"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useProfile } from "@/context/ProfileContext";
import { 
  IconUsers, 
  IconUserPlus, 
  IconMail, 
  IconPhone,
  IconBuilding,
  IconCalendar
} from "@tabler/icons-react";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  status: "active" | "inactive";
  joined_at: string;
};

export default function CompanyTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const profile = useProfile();
  const supabase = createClient();

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    try {
      setLoading(true);
      
      // For now, this is a placeholder since we don't have a team members table
      // In a real implementation, you would load team members from a database
      const mockTeamMembers: TeamMember[] = [
        {
          id: "1",
          name: profile?.company_name ? `${profile.company_name} Admin` : "Company Admin",
          email: profile?.email || "",
          role: "Administrator",
          department: "Management",
          status: "active",
          joined_at: new Date().toISOString()
        }
      ];

      setTeamMembers(mockTeamMembers);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast.error("Fehler beim Laden der Team-Daten");
    } finally {
      setLoading(false);
    }
  }

  const teamColumns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <IconUsers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.department}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "E-Mail",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconMail className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Rolle",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge 
          variant={row.original.status === "active" ? "default" : "secondary"}
          className={row.original.status === "active" ? "bg-green-600" : ""}
        >
          {row.original.status === "active" ? "Aktiv" : "Inaktiv"}
        </Badge>
      ),
    },
    {
      accessorKey: "joined_at",
      header: "Beigetreten",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(row.original.joined_at).toLocaleDateString("de-DE")}</span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Team wird geladen...</h1>
            <p className="text-muted-foreground">Lade Team-Daten...</p>
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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Team-Verwaltung</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihr Team und dessen Berechtigungen
            </p>
          </div>
          <Button disabled>
            <IconUserPlus className="h-4 w-4 mr-2" />
            Mitarbeiter hinzufügen
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team-Mitglieder</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
                <IconUsers className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Mitarbeiter</p>
                  <p className="text-2xl font-bold">
                    {teamMembers.filter(m => m.status === "active").length}
                  </p>
                </div>
                <IconBuilding className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Administratoren</p>
                  <p className="text-2xl font-bold">
                    {teamMembers.filter(m => m.role === "Administrator").length}
                  </p>
                </div>
                <IconUserPlus className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abteilungen</p>
                  <p className="text-2xl font-bold">
                    {new Set(teamMembers.map(m => m.department)).size}
                  </p>
                </div>
                <IconBuilding className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team-Übersicht</CardTitle>
            <CardDescription>
              Übersicht aller Mitarbeiter in Ihrem Unternehmen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={teamColumns} data={teamMembers} />
            
            {teamMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Team-Mitglieder vorhanden</p>
                <p className="text-sm">Team-Verwaltung wird in einer zukünftigen Version verfügbar sein</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 