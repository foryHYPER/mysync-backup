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
  IconCheck,
  IconX,
  IconMapPin,
  IconUsers,
  IconBriefcase
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

type Company = {
  id: string;
  name: string;
  industry: string;
  location: string;
  size: string;
  website?: string;
  description?: string;
  onboarding_status: "not_started" | "in_progress" | "completed";
  created_at: string;
  contact_email?: string;
  active_job_postings: number;
  total_candidates_invited: number;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, statusFilter, industryFilter]);

  async function loadCompanies() {
    try {
      setLoading(true);

      // Load companies with related data
      const { data: companiesData } = await supabase
        .from("companies")
        .select(`
          id, name, industry, location, size, website, description,
          onboarding_status, created_at, contact_email
        `)
        .order("created_at", { ascending: false });

      if (!companiesData) return;

      // Get job postings count and invitation counts for each company
      const companiesWithStats = await Promise.all(
        companiesData.map(async (company) => {
          const [jobPostingsResult, invitationsResult] = await Promise.all([
            supabase
              .from("job_postings")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id)
              .eq("status", "active"),
            supabase
              .from("invitations")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id)
          ]);

          return {
            ...company,
            active_job_postings: jobPostingsResult.count || 0,
            total_candidates_invited: invitationsResult.count || 0,
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

    setFilteredCompanies(filtered);
  }

  async function handleCompanyAction(companyId: string, action: "approve" | "reject" | "view") {
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
        case "view":
          // Navigate to company details
          toast.info("Unternehmensdetails öffnen");
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
        return <Badge variant="default">Abgeschlossen</Badge>;
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

  const companyColumns: ColumnDef<Company>[] = [
    {
      accessorKey: "name",
      header: "Unternehmen",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
      header: "Aktive Jobs",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.active_job_postings}</span>
        </div>
      ),
    },
    {
      accessorKey: "total_candidates_invited",
      header: "Einladungen",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IconUsers className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.total_candidates_invited}</span>
        </div>
      ),
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
            <DropdownMenuItem onClick={() => handleCompanyAction(row.original.id, "view")}>
              <IconEye className="h-4 w-4 mr-2" />
              Details ansehen
            </DropdownMenuItem>
            {row.original.onboarding_status !== "completed" && (
              <DropdownMenuItem 
                onClick={() => handleCompanyAction(row.original.id, "approve")}
              >
                <IconCheck className="h-4 w-4 mr-2" />
                Genehmigen
              </DropdownMenuItem>
            )}
            {row.original.onboarding_status === "completed" && (
              <DropdownMenuItem 
                onClick={() => handleCompanyAction(row.original.id, "reject")}
              >
                <IconX className="h-4 w-4 mr-2" />
                Genehmigung entziehen
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const uniqueIndustries = [...new Set(companies.map(c => c.industry))];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Unternehmensverwaltung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle registrierten Unternehmen und deren Status
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt</p>
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
                  <p className="text-sm text-muted-foreground">Wartend</p>
                  <p className="text-2xl font-bold">
                    {companies.filter(c => c.onboarding_status === "not_started").length}
                  </p>
                </div>
                <IconX className="h-8 w-8 text-destructive" />
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
                    placeholder="Suche nach Unternehmen, Branche, Ort..."
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
                  <SelectItem value="not_started">Wartend</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="completed">Genehmigt</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Unternehmen ({filteredCompanies.length})</CardTitle>
            <CardDescription>
              Übersicht aller registrierten Unternehmen mit Verwaltungsfunktionen
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