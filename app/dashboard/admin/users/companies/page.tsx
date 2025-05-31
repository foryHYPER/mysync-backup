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
  IconBuilding, 
  IconSearch, 
  IconFilter,
  IconEdit,
  IconEye,
  IconMail,
  IconMapPin,
  IconUsers,
  IconBriefcase,
  IconCheck,
  IconX,
  IconExternalLink,
  IconCalendar
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

type CompanyUser = {
  id: string;
  email: string;
  name: string;
  industry: string;
  location: string;
  size: string;
  website?: string;
  description?: string;
  contact_email?: string;
  onboarding_status: "not_started" | "in_progress" | "completed";
  created_at: string;
  last_sign_in_at?: string;
  active_job_postings: number;
  total_candidates_invited: number;
  total_applications: number;
};

export default function CompanyUsersPage() {
  const [companies, setCompanies] = useState<CompanyUser[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, statusFilter, industryFilter, sizeFilter]);

  async function loadCompanies() {
    try {
      setLoading(true);

      // Load company profiles with auth data
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const companyAuthUsers = authUsers.users.filter(user => 
        user.user_metadata?.role === 'company' || 
        user.app_metadata?.role === 'company'
      );

      // Load company data from companies table
      const { data: companiesData } = await supabase
        .from("companies")
        .select(`
          id, name, industry, location, size, website, description,
          contact_email, onboarding_status, created_at
        `)
        .in("id", companyAuthUsers.map(u => u.id));

      if (!companiesData) return;

      // Load statistics for each company
      const companiesWithStats = await Promise.all(
        companiesData.map(async (company) => {
          const authUser = companyAuthUsers.find(u => u.id === company.id);
          
          // Get company statistics
          const [jobPostingsResult, invitationsResult, applicationsResult] = await Promise.all([
            supabase
              .from("job_postings")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id)
              .eq("status", "active"),
            supabase
              .from("invitations")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id),
            supabase
              .from("applications")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id)
          ]);

          return {
            ...company,
            email: authUser?.email || "Unbekannt",
            last_sign_in_at: authUser?.last_sign_in_at,
            active_job_postings: jobPostingsResult.count || 0,
            total_candidates_invited: invitationsResult.count || 0,
            total_applications: applicationsResult.count || 0,
          };
        })
      );

      setCompanies(companiesWithStats);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Fehler beim Laden der Unternehmen");
    } finally {
      setLoading(false);
    }
  }

  function filterCompanies() {
    let filtered = companies;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(company => company.onboarding_status === statusFilter);
    }

    // Industry filter
    if (industryFilter !== "all") {
      filtered = filtered.filter(company => company.industry === industryFilter);
    }

    // Size filter
    if (sizeFilter !== "all") {
      filtered = filtered.filter(company => company.size === sizeFilter);
    }

    setFilteredCompanies(filtered);
  }

  async function handleCompanyAction(companyId: string, action: "approve" | "reject" | "email" | "delete") {
    try {
      switch (action) {
        case "approve":
          await supabase
            .from("companies")
            .update({ onboarding_status: "completed" })
            .eq("id", companyId);
          toast.success("Unternehmen genehmigt");
          loadCompanies();
          break;
        case "reject":
          await supabase
            .from("companies")
            .update({ onboarding_status: "not_started" })
            .eq("id", companyId);
          toast.success("Genehmigung zurückgezogen");
          loadCompanies();
          break;
        case "email":
          toast.info("E-Mail-Funktion noch nicht implementiert");
          break;
        case "delete":
          // This would require careful cascade deletion
          toast.info("Löschfunktion noch nicht implementiert");
          break;
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Fehler bei der Unternehmensaktion");
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Genehmigt</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Bearbeitung</Badge>;
      case "not_started":
        return <Badge variant="destructive">Wartend</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSizeBadge = (size: string) => {
    const sizeMap = {
      "startup": "Startup",
      "small": "Klein (1-50)",
      "medium": "Mittel (51-250)", 
      "large": "Groß (251-1000)",
      "enterprise": "Konzern (1000+)"
    };
    return <Badge variant="outline">{sizeMap[size as keyof typeof sizeMap] || size}</Badge>;
  };

  const companyColumns: ColumnDef<CompanyUser>[] = [
    {
      accessorKey: "name",
      header: "Unternehmen",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <IconMapPin className="h-3 w-3" />
            {row.original.location}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "industry",
      header: "Branche",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.industry}</span>
      ),
    },
    {
      accessorKey: "size",
      header: "Größe",
      cell: ({ row }) => getSizeBadge(row.original.size),
    },
    {
      accessorKey: "onboarding_status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.onboarding_status),
    },
    {
      accessorKey: "active_job_postings",
      header: "Aktivität",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <div className="flex items-center gap-1">
            <IconBriefcase className="h-3 w-3 text-muted-foreground" />
            <span>{row.original.active_job_postings} Jobs</span>
          </div>
          <div className="flex items-center gap-1">
            <IconUsers className="h-3 w-3 text-muted-foreground" />
            <span>{row.original.total_candidates_invited} Einladungen</span>
          </div>
          <span className="text-muted-foreground">{row.original.total_applications} Bewerbungen</span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Beigetreten",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span>{new Date(row.original.created_at).toLocaleDateString("de-DE")}</span>
          <span className="text-muted-foreground">
            {row.original.last_sign_in_at 
              ? `Zuletzt: ${new Date(row.original.last_sign_in_at).toLocaleDateString("de-DE")}`
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
                    Unternehmensprofil - {row.original.name}
                  </DialogTitle>
                  <DialogDescription>
                    Vollständige Unternehmensinformationen und Statistiken
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Firmenname</label>
                      <p className="text-sm text-muted-foreground">{row.original.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">E-Mail</label>
                      <p className="text-sm text-muted-foreground">{row.original.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Branche</label>
                      <p className="text-sm text-muted-foreground">{row.original.industry}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Standort</label>
                      <p className="text-sm text-muted-foreground">{row.original.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Unternehmensgröße</label>
                      <p className="text-sm text-muted-foreground">{row.original.size}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className="text-sm text-muted-foreground">{row.original.onboarding_status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Kontakt-E-Mail</label>
                      <p className="text-sm text-muted-foreground">{row.original.contact_email || "Nicht angegeben"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Website</label>
                      {row.original.website ? (
                        <a href={row.original.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 flex items-center gap-1">
                          <IconExternalLink className="h-3 w-3" />
                          Website besuchen
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nicht angegeben</p>
                      )}
                    </div>
                  </div>
                  {row.original.description && (
                    <div>
                      <label className="text-sm font-medium">Beschreibung</label>
                      <p className="text-sm text-muted-foreground">{row.original.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.active_job_postings}</p>
                      <p className="text-sm text-muted-foreground">Aktive Jobs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.total_candidates_invited}</p>
                      <p className="text-sm text-muted-foreground">Einladungen</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{row.original.total_applications}</p>
                      <p className="text-sm text-muted-foreground">Bewerbungen</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <DropdownMenuItem onClick={() => handleCompanyAction(row.original.id, "email")}>
              <IconMail className="h-4 w-4 mr-2" />
              E-Mail senden
            </DropdownMenuItem>
            
            {row.original.onboarding_status !== "completed" ? (
              <DropdownMenuItem 
                onClick={() => handleCompanyAction(row.original.id, "approve")}
              >
                <IconCheck className="h-4 w-4 mr-2" />
                Genehmigen
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => handleCompanyAction(row.original.id, "reject")}
              >
                <IconX className="h-4 w-4 mr-2" />
                Genehmigung entziehen
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => handleCompanyAction(row.original.id, "delete")}
            >
              Unternehmen löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const uniqueIndustries = [...new Set(companies.map(c => c.industry))];
  const uniqueSizes = [...new Set(companies.map(c => c.size))];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Unternehmens-Benutzer</h1>
          <p className="text-muted-foreground">
            Verwaltung aller Benutzer mit Unternehmens-Rolle im System
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Unternehmen</p>
                  <p className="text-2xl font-bold">{companies.length}</p>
                </div>
                <IconBuilding className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Genehmigt</p>
                  <p className="text-2xl font-bold">
                    {companies.filter(c => c.onboarding_status === "completed").length}
                  </p>
                </div>
                <IconCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Jobs</p>
                  <p className="text-2xl font-bold">
                    {companies.reduce((sum, c) => sum + c.active_job_postings, 0)}
                  </p>
                </div>
                <IconBriefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Jobs/Unternehmen</p>
                  <p className="text-2xl font-bold">
                    {companies.length > 0 
                      ? Math.round(companies.reduce((sum, c) => sum + c.active_job_postings, 0) / companies.length)
                      : 0
                    }
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
                    placeholder="Suche nach Unternehmen, E-Mail, Branche, Ort..."
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
                  <SelectItem value="completed">Genehmigt</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="not_started">Wartend</SelectItem>
                </SelectContent>
              </Select>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Branche wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Branchen</SelectItem>
                  {uniqueIndustries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Größe wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Größen</SelectItem>
                  {uniqueSizes.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Unternehmens-Benutzer ({filteredCompanies.length})</CardTitle>
            <CardDescription>
              Alle Benutzerkonten mit Unternehmens-Rolle und deren Profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={companyColumns} 
              data={filteredCompanies}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 