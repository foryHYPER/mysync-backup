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
  IconShield, 
  IconSearch, 
  IconFilter,
  IconEdit,
  IconEye,
  IconMail,
  IconUserPlus,
  IconActivity,
  IconCalendar,
  IconSettings,
  IconAlertTriangle
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  status: "active" | "inactive";
  role: "admin" | "super_admin";
  permissions: string[];
  recent_actions_count: number;
  last_action_at?: string;
};

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm, statusFilter, roleFilter]);

  async function loadAdmins() {
    try {
      setLoading(true);

      // Load admin profiles with auth data
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const adminAuthUsers = authUsers.users.filter(user => 
        user.user_metadata?.role === 'admin' || 
        user.app_metadata?.role === 'admin' ||
        user.user_metadata?.role === 'super_admin' || 
        user.app_metadata?.role === 'super_admin'
      );

      // Load admin activity data
      const adminsWithStats = await Promise.all(
        adminAuthUsers.map(async (admin) => {
          // Get recent admin activity
          const [recentActionsResult, lastActionResult] = await Promise.all([
            supabase
              .from("audit_logs")
              .select("id", { count: "exact", head: true })
              .eq("user_id", admin.id)
              .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), // Last 30 days
            supabase
              .from("audit_logs")
              .select("created_at")
              .eq("user_id", admin.id)
              .order("created_at", { ascending: false })
              .limit(1)
          ]);

          const role = admin.user_metadata?.role || admin.app_metadata?.role || "admin";
          const permissions = role === "super_admin" 
            ? ["all_permissions"] 
            : ["user_management", "company_approval", "reports"];

          return {
            id: admin.id,
            email: admin.email || "Unbekannt",
            created_at: admin.created_at,
            last_sign_in_at: admin.last_sign_in_at,
            email_confirmed_at: admin.email_confirmed_at,
            status: (admin as any).banned_until ? "inactive" : "active" as "active" | "inactive",
            role: role as "admin" | "super_admin",
            permissions,
            recent_actions_count: recentActionsResult.count || 0,
            last_action_at: lastActionResult.data?.[0]?.created_at,
          };
        })
      );

      setAdmins(adminsWithStats);
    } catch (error) {
      console.error("Error loading admins:", error);
      toast.error("Fehler beim Laden der Administratoren");
    } finally {
      setLoading(false);
    }
  }

  function filterAdmins() {
    let filtered = admins;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(admin => 
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(admin => admin.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(admin => admin.role === roleFilter);
    }

    setFilteredAdmins(filtered);
  }

  async function handleAdminAction(adminId: string, action: "activate" | "deactivate" | "email" | "reset_password") {
    try {
      switch (action) {
        case "activate":
          // Unban user in Supabase Auth
          await supabase.auth.admin.updateUserById(adminId, { ban_duration: "none" });
          toast.success("Administrator aktiviert");
          loadAdmins();
          break;
        case "deactivate":
          // Ban user for a very long time (effectively permanent)
          await supabase.auth.admin.updateUserById(adminId, { ban_duration: "876000h" }); // ~100 years
          toast.success("Administrator deaktiviert");
          loadAdmins();
          break;
        case "reset_password":
          // Send password reset email
          const admin = admins.find(a => a.id === adminId);
          if (admin?.email) {
            await supabase.auth.resetPasswordForEmail(admin.email);
            toast.success("Passwort-Reset E-Mail gesendet");
          }
          break;
        case "email":
          toast.info("E-Mail-Funktion noch nicht implementiert");
          break;
      }
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Fehler bei der Administrator-Aktion");
    }
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "active" ? "default" : "destructive"}>
        {status === "active" ? "Aktiv" : "Gesperrt"}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant={role === "super_admin" ? "destructive" : "secondary"}>
        {role === "super_admin" ? "Super Admin" : "Administrator"}
      </Badge>
    );
  };

  const adminColumns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "email",
      header: "Administrator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.email}</span>
          {row.original.email_confirmed_at ? (
            <span className="text-xs text-green-600">E-Mail bestätigt</span>
          ) : (
            <span className="text-xs text-amber-600">E-Mail nicht bestätigt</span>
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
      accessorKey: "recent_actions_count",
      header: "Aktivität (30 Tage)",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{row.original.recent_actions_count} Aktionen</span>
          {row.original.last_action_at && (
            <span className="text-muted-foreground">
              Zuletzt: {new Date(row.original.last_action_at).toLocaleDateString("de-DE")}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "permissions",
      header: "Berechtigungen",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.permissions.slice(0, 2).map((permission, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {permission === "all_permissions" ? "Alle" : permission}
            </Badge>
          ))}
          {row.original.permissions.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.permissions.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Erstellt",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span>{new Date(row.original.created_at).toLocaleDateString("de-DE")}</span>
          <span className="text-muted-foreground">
            {row.original.last_sign_in_at 
              ? `Login: ${new Date(row.original.last_sign_in_at).toLocaleDateString("de-DE")}`
              : "Nie eingeloggt"
            }
          </span>
        </div>
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
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <IconEye className="h-4 w-4 mr-2" />
                  Details ansehen
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Administrator Details - {row.original.email}
                  </DialogTitle>
                  <DialogDescription>
                    Vollständige Administratorinformationen und Berechtigungen
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">E-Mail</label>
                      <p className="text-sm text-muted-foreground">{row.original.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rolle</label>
                      <p className="text-sm text-muted-foreground">{row.original.role}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className="text-sm text-muted-foreground">{row.original.status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">E-Mail bestätigt</label>
                      <p className="text-sm text-muted-foreground">
                        {row.original.email_confirmed_at ? "Ja" : "Nein"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Erstellt am</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(row.original.created_at).toLocaleString("de-DE")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Letzter Login</label>
                      <p className="text-sm text-muted-foreground">
                        {row.original.last_sign_in_at 
                          ? new Date(row.original.last_sign_in_at).toLocaleString("de-DE")
                          : "Nie"
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Berechtigungen</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {row.original.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.recent_actions_count}</p>
                      <p className="text-sm text-muted-foreground">Aktionen (30 Tage)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {row.original.last_action_at 
                          ? Math.floor((new Date().getTime() - new Date(row.original.last_action_at).getTime()) / (1000 * 60 * 60 * 24))
                          : "N/A"
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">Tage seit letzter Aktion</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <DropdownMenuItem onClick={() => handleAdminAction(row.original.id, "email")}>
              <IconMail className="h-4 w-4 mr-2" />
              E-Mail senden
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleAdminAction(row.original.id, "reset_password")}>
              <IconSettings className="h-4 w-4 mr-2" />
              Passwort zurücksetzen
            </DropdownMenuItem>
            
            {row.original.status === "active" ? (
              <DropdownMenuItem 
                onClick={() => handleAdminAction(row.original.id, "deactivate")}
                className="text-destructive"
              >
                <IconAlertTriangle className="h-4 w-4 mr-2" />
                Deaktivieren
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => handleAdminAction(row.original.id, "activate")}
              >
                Aktivieren
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">System-Administratoren</h1>
          <p className="text-muted-foreground">
            Verwaltung aller Administrator-Konten und deren Berechtigungen
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Admins</p>
                  <p className="text-2xl font-bold">{admins.length}</p>
                </div>
                <IconShield className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Admins</p>
                  <p className="text-2xl font-bold">
                    {admins.filter(a => a.status === "active").length}
                  </p>
                </div>
                <IconActivity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Super Admins</p>
                  <p className="text-2xl font-bold">
                    {admins.filter(a => a.role === "super_admin").length}
                  </p>
                </div>
                <IconSettings className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktionen (30 Tage)</p>
                  <p className="text-2xl font-bold">
                    {admins.reduce((sum, a) => sum + a.recent_actions_count, 0)}
                  </p>
                </div>
                <IconCalendar className="h-8 w-8 text-muted-foreground" />
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
                    placeholder="Suche nach E-Mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Gesperrt</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Rolle wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Rollen</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <IconUserPlus className="h-4 w-4 mr-2" />
                Neuer Admin
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>System-Administratoren ({filteredAdmins.length})</CardTitle>
            <CardDescription>
              Übersicht aller Administrator-Konten mit Berechtigungen und Aktivitäten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={adminColumns} 
              data={filteredAdmins}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 