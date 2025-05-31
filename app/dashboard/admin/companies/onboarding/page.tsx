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
import Link from "next/link";
import { 
  IconBuilding,
  IconArrowLeft,
  IconCheck,
  IconX,
  IconEye,
  IconClock,
  IconMail,
  IconPhone,
  IconMapPin,
  IconUsers,
  IconBriefcase,
  IconExternalLink,
  IconRefresh,
  IconFilter,
  IconCalendar,
  IconAlertTriangle
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OnboardingCompany = {
  id: string;
  name: string;
  email: string;
  industry: string;
  size: string;
  website?: string;
  phone?: string;
  address?: string;
  description?: string;
  onboarding_status: "pending" | "in_review" | "approved" | "rejected" | "incomplete";
  created_at: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_id?: string;
  reviewer_notes?: string;
  completion_percentage: number;
  required_documents: {
    business_license: boolean;
    tax_certificate: boolean;
    company_profile: boolean;
    legal_documents: boolean;
  };
  contact_person: {
    name: string;
    role: string;
    email: string;
    phone?: string;
  };
};

type OnboardingMetrics = {
  totalSubmissions: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  avgProcessingTime: number;
  completionRate: number;
};

export default function CompanyOnboardingPage() {
  const [companies, setCompanies] = useState<OnboardingCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<OnboardingCompany[]>([]);
  const [metrics, setMetrics] = useState<OnboardingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<OnboardingCompany | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadOnboardingData();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, statusFilter, searchTerm]);

  async function loadOnboardingData() {
    try {
      setLoading(true);

      // Load companies with onboarding data
      const { data: companiesData } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (!companiesData) return;

      // Mock onboarding data - in real app, this would come from an onboarding table
      const onboardingCompanies: OnboardingCompany[] = companiesData.map(company => {
        const statuses = ["pending", "in_review", "approved", "rejected", "incomplete"];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as OnboardingCompany["onboarding_status"];
        
        return {
          id: company.id,
          name: company.name || "Unbekanntes Unternehmen",
          email: company.email || "Keine E-Mail",
          industry: company.industry || "Nicht angegeben",
          size: company.size || "Nicht angegeben",
          website: company.website,
          phone: company.phone,
          address: company.address,
          description: company.description,
          onboarding_status: randomStatus,
          created_at: company.created_at,
          submitted_at: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          reviewed_at: randomStatus === "approved" || randomStatus === "rejected" ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          completion_percentage: Math.floor(Math.random() * 100) + 1,
          required_documents: {
            business_license: Math.random() > 0.3,
            tax_certificate: Math.random() > 0.4,
            company_profile: Math.random() > 0.2,
            legal_documents: Math.random() > 0.5
          },
          contact_person: {
            name: "Max Mustermann",
            role: "Geschäftsführer",
            email: company.email || "contact@company.com",
            phone: company.phone
          }
        };
      });

      // Calculate metrics
      const totalSubmissions = onboardingCompanies.length;
      const pendingReview = onboardingCompanies.filter(c => c.onboarding_status === "pending" || c.onboarding_status === "in_review").length;
      const approved = onboardingCompanies.filter(c => c.onboarding_status === "approved").length;
      const rejected = onboardingCompanies.filter(c => c.onboarding_status === "rejected").length;
      const avgProcessingTime = 4.2; // Mock average in days
      const completionRate = (approved / Math.max(totalSubmissions, 1)) * 100;

      setMetrics({
        totalSubmissions,
        pendingReview,
        approved,
        rejected,
        avgProcessingTime,
        completionRate
      });

      setCompanies(onboardingCompanies);

    } catch (error) {
      console.error("Error loading onboarding data:", error);
      toast.error("Fehler beim Laden der Onboarding-Daten");
    } finally {
      setLoading(false);
    }
  }

  function filterCompanies() {
    let filtered = companies;

    if (searchTerm) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(company => company.onboarding_status === statusFilter);
    }

    setFilteredCompanies(filtered);
  }

  async function handleStatusUpdate(companyId: string, newStatus: OnboardingCompany["onboarding_status"], notes?: string) {
    try {
      // Update company status in database
      await supabase
        .from("companies")
        .update({ 
          onboarding_status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes
        })
        .eq("id", companyId);

      toast.success(`Unternehmen-Status auf "${getStatusLabel(newStatus)}" aktualisiert`);
      loadOnboardingData(); // Reload data
      setSelectedCompany(null);
      setReviewNotes("");

    } catch (error) {
      console.error("Error updating company status:", error);
      toast.error("Fehler beim Aktualisieren des Status");
    }
  }

  function getStatusBadge(status: OnboardingCompany["onboarding_status"]) {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Ausstehend</Badge>;
      case "in_review":
        return <Badge variant="secondary">In Prüfung</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600">Genehmigt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Abgelehnt</Badge>;
      case "incomplete":
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Unvollständig</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getStatusLabel(status: OnboardingCompany["onboarding_status"]) {
    switch (status) {
      case "pending": return "Ausstehend";
      case "in_review": return "In Prüfung";
      case "approved": return "Genehmigt";
      case "rejected": return "Abgelehnt";
      case "incomplete": return "Unvollständig";
      default: return status;
    }
  }

  function getCompletionColor(percentage: number) {
    if (percentage >= 80) return "bg-green-600";
    if (percentage >= 60) return "bg-yellow-600";
    return "bg-red-600";
  }

  const onboardingColumns: ColumnDef<OnboardingCompany>[] = [
    {
      accessorKey: "name",
      header: "Unternehmen",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-sm text-muted-foreground">{row.original.industry}</span>
        </div>
      ),
    },
    {
      accessorKey: "contact_person",
      header: "Kontaktperson",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.contact_person.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.contact_person.role}</span>
        </div>
      ),
    },
    {
      accessorKey: "completion_percentage",
      header: "Vollständigkeit",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full">
            <div
              className={`h-full rounded-full ${getCompletionColor(row.original.completion_percentage)}`}
              style={{ width: `${row.original.completion_percentage}%` }}
            />
          </div>
          <span className="text-sm">{row.original.completion_percentage}%</span>
        </div>
      ),
    },
    {
      accessorKey: "onboarding_status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.onboarding_status),
    },
    {
      accessorKey: "submitted_at",
      header: "Eingereicht",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.submitted_at 
            ? new Date(row.original.submitted_at).toLocaleDateString("de-DE")
            : "Nicht eingereicht"
          }
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedCompany(row.original)}
              >
                <IconEye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconCheck className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, "in_review")}>
                In Prüfung setzen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, "approved")}>
                Genehmigen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, "rejected")}>
                Ablehnen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, "incomplete")}>
                Als unvollständig markieren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Unternehmen-Onboarding</h1>
            <p className="text-muted-foreground">Lade Onboarding-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/admin/companies">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Unternehmen
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Unternehmen-Onboarding</h1>
            <p className="text-muted-foreground">
              Verwalte und überprüfe Unternehmen-Registrierungen und Onboarding-Prozesse
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Anträge</p>
                  <p className="text-2xl font-bold">{metrics.totalSubmissions}</p>
                </div>
                <IconBuilding className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Warten auf Prüfung</p>
                  <p className="text-2xl font-bold">{metrics.pendingReview}</p>
                </div>
                <IconClock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Genehmigt</p>
                  <p className="text-2xl font-bold">{metrics.approved}</p>
                </div>
                <IconCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abgelehnt</p>
                  <p className="text-2xl font-bold">{metrics.rejected}</p>
                </div>
                <IconX className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Genehmigungsrate</p>
                  <p className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</p>
                </div>
                <IconBriefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <IconFilter className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Unternehmen suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                    <SelectItem value="in_review">In Prüfung</SelectItem>
                    <SelectItem value="approved">Genehmigt</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
                    <SelectItem value="incomplete">Unvollständig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={loadOnboardingData}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding-Anträge</CardTitle>
            <CardDescription>
              Verwalte Unternehmen-Registrierungen und Onboarding-Status ({filteredCompanies.length} Unternehmen)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={onboardingColumns} 
              data={filteredCompanies}
            />
          </CardContent>
        </Card>

        {/* Company Details Modal */}
        {selectedCompany && (
          <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconBuilding className="h-5 w-5" />
                  {selectedCompany.name}
                  {getStatusBadge(selectedCompany.onboarding_status)}
                </DialogTitle>
                <DialogDescription>
                  Detaillierte Informationen und Onboarding-Status
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Company Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Unternehmensinformationen</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCompany.email}</span>
                    </div>
                    {selectedCompany.phone && (
                      <div className="flex items-center gap-2">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCompany.phone}</span>
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center gap-2">
                        <IconExternalLink className="h-4 w-4 text-muted-foreground" />
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {selectedCompany.website}
                        </a>
                      </div>
                    )}
                    {selectedCompany.address && (
                      <div className="flex items-center gap-2">
                        <IconMapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCompany.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Branche: {selectedCompany.industry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Größe: {selectedCompany.size}</span>
                    </div>
                  </div>

                  {selectedCompany.description && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Beschreibung</h4>
                      <p className="text-sm text-muted-foreground">{selectedCompany.description}</p>
                    </div>
                  )}
                </div>

                {/* Onboarding Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Onboarding-Status</h3>
                  
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Vollständigkeit</span>
                      <span className="text-sm">{selectedCompany.completion_percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className={`h-full rounded-full ${getCompletionColor(selectedCompany.completion_percentage)}`}
                        style={{ width: `${selectedCompany.completion_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Required Documents */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Erforderliche Dokumente</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedCompany.required_documents).map(([key, completed]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                          {completed ? (
                            <IconCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <IconX className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Kontaktperson</h4>
                    <div className="space-y-1">
                      <p className="text-sm">{selectedCompany.contact_person.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedCompany.contact_person.role}</p>
                      <p className="text-sm text-muted-foreground">{selectedCompany.contact_person.email}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <span>Erstellt: {new Date(selectedCompany.created_at).toLocaleDateString("de-DE")}</span>
                      </div>
                      {selectedCompany.submitted_at && (
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-muted-foreground" />
                          <span>Eingereicht: {new Date(selectedCompany.submitted_at).toLocaleDateString("de-DE")}</span>
                        </div>
                      )}
                      {selectedCompany.reviewed_at && (
                        <div className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-muted-foreground" />
                          <span>Überprüft: {new Date(selectedCompany.reviewed_at).toLocaleDateString("de-DE")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notizen zur Überprüfung (optional)</label>
                      <Input
                        placeholder="Notizen eingeben..."
                        value={reviewNotes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReviewNotes(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => handleStatusUpdate(selectedCompany.id, "approved", reviewNotes)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <IconCheck className="h-4 w-4 mr-2" />
                        Genehmigen
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedCompany.id, "rejected", reviewNotes)}
                      >
                        <IconX className="h-4 w-4 mr-2" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 