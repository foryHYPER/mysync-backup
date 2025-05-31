"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { 
  IconUsers, 
  IconSearch, 
  IconFilter,
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconEye,
  IconMail
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: string;
  email: string;
  role: "admin" | "company" | "candidate";
  created_at: string;
  last_sign_in_at?: string;
  name?: string;
  company_name?: string;
  candidate_name?: string;
  status: "active" | "inactive";
  onboarding_status?: string;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  async function loadUsers() {
    try {
      setLoading(true);

      // Load profiles with additional data
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, role, created_at")
        .order("created_at", { ascending: false });

      if (!profiles) return;

      // Get auth data for emails and last login
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      // Load additional data for each role
      const [candidatesData, companiesData] = await Promise.all([
        supabase.from("candidates").select("id, first_name, last_name, status"),
        supabase.from("companies").select("id, name, onboarding_status")
      ]);

      const usersWithDetails: User[] = profiles.map(profile => {
        const authUser = authUsers.users.find(u => u.id === profile.id);
        const candidate = candidatesData.data?.find(c => c.id === profile.id);
        const company = companiesData.data?.find(c => c.id === profile.id);

        return {
          id: profile.id,
          email: authUser?.email || "Unbekannt",
          role: profile.role as "admin" | "company" | "candidate",
          created_at: profile.created_at,
          last_sign_in_at: authUser?.last_sign_in_at,
          candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : undefined,
          company_name: company?.name,
          status: (candidate?.status === "inactive" ? "inactive" : "active") as "active" | "inactive",
          onboarding_status: company?.onboarding_status,
        };
      });

      setUsers(usersWithDetails);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Fehler beim Laden der Benutzer");
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }

  async function handleUserAction(userId: string, action: "activate" | "deactivate" | "delete") {
    try {
      switch (action) {
        case "activate":
        case "deactivate":
          const newStatus = action === "activate" ? "active" : "inactive";
          await supabase
            .from("candidates")
            .update({ status: newStatus })
            .eq("id", userId);
          toast.success(`Benutzer ${action === "activate" ? "aktiviert" : "deaktiviert"}`);
          break;
        case "delete":
          // This would need careful implementation with cascade deletes
          toast.info("Löschfunktion noch nicht implementiert");
          break;
      }
      loadUsers(); // Reload data
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Fehler bei der Benutzeraktion");
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "company":
        return <Badge variant="default">Unternehmen</Badge>;
      case "candidate":
        return <Badge variant="secondary">Kandidat</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "active" ? "default" : "secondary"}>
        {status === "active" ? "Aktiv" : "Inaktiv"}
      </Badge>
    );
  };

  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: "E-Mail",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.email}</span>
          {row.original.candidate_name && (
            <span className="text-sm text-muted-foreground">{row.original.candidate_name}</span>
          )}
          {row.original.company_name && (
            <span className="text-sm text-muted-foreground">{row.original.company_name}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Rolle",
      cell: ({ row }) => getRoleBadge(row.original.role),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "created_at",
      header: "Registriert",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.created_at).toLocaleDateString("de-DE")}
        </span>
      ),
    },
    {
      accessorKey: "last_sign_in_at",
      header: "Letzter Login",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.last_sign_in_at 
            ? new Date(row.original.last_sign_in_at).toLocaleDateString("de-DE")
            : "Nie"
          }
        </span>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <IconEdit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <IconEye className="h-4 w-4 mr-2" />
              Details ansehen
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconMail className="h-4 w-4 mr-2" />
              E-Mail senden
            </DropdownMenuItem>
            {row.original.status === "active" ? (
              <DropdownMenuItem 
                onClick={() => handleUserAction(row.original.id, "deactivate")}
              >
                Deaktivieren
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => handleUserAction(row.original.id, "activate")}
              >
                Aktivieren
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => handleUserAction(row.original.id, "delete")}
            >
              <IconTrash className="h-4 w-4 mr-2" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Benutzer in Ihrem mySync-System
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <IconUsers className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kandidaten</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.role === "candidate").length}
                  </p>
                </div>
                <IconUsers className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unternehmen</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.role === "company").length}
                  </p>
                </div>
                <IconUsers className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.role === "admin").length}
                  </p>
                </div>
                <IconUsers className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFilter className="h-5 w-5" />
              Filter & Suche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach E-Mail, Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Rolle wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Rollen</SelectItem>
                  <SelectItem value="candidate">Kandidaten</SelectItem>
                  <SelectItem value="company">Unternehmen</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <IconUserPlus className="h-4 w-4 mr-2" />
                Neuer Benutzer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Benutzer ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Übersicht aller Benutzer mit Filteroptionen und Verwaltungsfunktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={userColumns} 
              data={filteredUsers}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 