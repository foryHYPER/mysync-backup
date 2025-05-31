"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { 
  IconCheck, 
  IconX, 
  IconEye,
  IconClock,
  IconChecks,
  IconAlertTriangle,
  IconMapPin,
  IconBuilding,
  IconCalendar,
  IconExternalLink
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type PendingCompany = {
  id: string;
  name: string;
  industry: string;
  location: string;
  size: string;
  website?: string;
  description?: string;
  contact_email?: string;
  created_at: string;
  onboarding_status: "not_started" | "in_progress";
  submitted_documents?: string[];
  business_registration?: string;
  tax_id?: string;
};

export default function CompanyApprovalsPage() {
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectingCompanyId, setRejectingCompanyId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadPendingCompanies();
  }, []);

  async function loadPendingCompanies() {
    try {
      setLoading(true);

      const { data: companies } = await supabase
        .from("companies")
        .select(`
          id, name, industry, location, size, website, description,
          contact_email, created_at, onboarding_status,
          business_registration, tax_id
        `)
        .in("onboarding_status", ["not_started", "in_progress"])
        .order("created_at", { ascending: true });

      if (companies) {
        setPendingCompanies(companies);
      }
    } catch (error) {
      console.error("Error loading pending companies:", error);
      toast.error("Fehler beim Laden der ausstehenden Genehmigungen");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(companyId: string) {
    try {
      setActionLoading(true);
      
      await supabase
        .from("companies")
        .update({ 
          onboarding_status: "completed",
          approved_at: new Date().toISOString(),
        })
        .eq("id", companyId);

      // Log the approval action
      await supabase
        .from("audit_logs")
        .insert({
          action: "approve",
          table_name: "companies",
          record_id: companyId,
          details: { action: "company_approved" }
        });

      toast.success("Unternehmen erfolgreich genehmigt");
      loadPendingCompanies();
    } catch (error) {
      console.error("Error approving company:", error);
      toast.error("Fehler bei der Genehmigung");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(companyId: string, reason?: string) {
    try {
      setActionLoading(true);
      
      await supabase
        .from("companies")
        .update({ 
          onboarding_status: "not_started",
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", companyId);

      // Log the rejection action
      await supabase
        .from("audit_logs")
        .insert({
          action: "reject",
          table_name: "companies",
          record_id: companyId,
          details: { action: "company_rejected", reason }
        });

      toast.success("Unternehmen abgelehnt");
      loadPendingCompanies();
      setShowRejectionDialog(false);
      setRejectionReason("");
      setRejectingCompanyId(null);
    } catch (error) {
      console.error("Error rejecting company:", error);
      toast.error("Fehler bei der Ablehnung");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkApproval() {
    if (selectedCompanies.length === 0) {
      toast.error("Bitte wählen Sie mindestens ein Unternehmen aus");
      return;
    }

    try {
      setActionLoading(true);
      
      await supabase
        .from("companies")
        .update({ 
          onboarding_status: "completed",
          approved_at: new Date().toISOString(),
        })
        .in("id", selectedCompanies);

      // Log bulk approval
      for (const companyId of selectedCompanies) {
        await supabase
          .from("audit_logs")
          .insert({
            action: "approve",
            table_name: "companies",
            record_id: companyId,
            details: { action: "bulk_company_approved" }
          });
      }

      toast.success(`${selectedCompanies.length} Unternehmen genehmigt`);
      setSelectedCompanies([]);
      loadPendingCompanies();
    } catch (error) {
      console.error("Error bulk approving companies:", error);
      toast.error("Fehler bei der Massengenehmigung");
    } finally {
      setActionLoading(false);
    }
  }

  const getStatusBadge = (status: string, createdAt: string) => {
    const daysSinceSubmission = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24)
    );
    
    if (status === "in_progress") {
      return <Badge variant="secondary">In Bearbeitung</Badge>;
    }
    
    if (daysSinceSubmission > 7) {
      return <Badge variant="destructive">Überfällig ({daysSinceSubmission} Tage)</Badge>;
    } else if (daysSinceSubmission > 3) {
      return <Badge variant="outline">Dringend ({daysSinceSubmission} Tage)</Badge>;
    } else {
      return <Badge variant="default">Neu ({daysSinceSubmission} Tage)</Badge>;
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

  const companyColumns: ColumnDef<PendingCompany>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            if (value) {
              setSelectedCompanies(pendingCompanies.map(c => c.id));
            } else {
              setSelectedCompanies([]);
            }
          }}
          aria-label="Alle auswählen"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedCompanies.includes(row.original.id)}
          onCheckedChange={(value) => {
            if (value) {
              setSelectedCompanies([...selectedCompanies, row.original.id]);
            } else {
              setSelectedCompanies(selectedCompanies.filter(id => id !== row.original.id));
            }
          }}
          aria-label="Zeile auswählen"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
          {row.original.website && (
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <IconExternalLink className="h-3 w-3" />
              <a href={row.original.website} target="_blank" rel="noopener noreferrer">
                Website
              </a>
            </div>
          )}
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
      accessorKey: "created_at",
      header: "Eingereicht",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {new Date(row.original.created_at).toLocaleDateString("de-DE")}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.created_at).toLocaleTimeString("de-DE")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "onboarding_status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.onboarding_status, row.original.created_at),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <IconEye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Unternehmensdetails - {row.original.name}</DialogTitle>
                <DialogDescription>
                  Überprüfen Sie die Unternehmensinformationen für die Genehmigung
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">{row.original.name}</p>
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
                    <label className="text-sm font-medium">Größe</label>
                    <p className="text-sm text-muted-foreground">{row.original.size}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">E-Mail</label>
                    <p className="text-sm text-muted-foreground">{row.original.contact_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <p className="text-sm text-muted-foreground">{row.original.website || "Nicht angegeben"}</p>
                  </div>
                </div>
                {row.original.description && (
                  <div>
                    <label className="text-sm font-medium">Beschreibung</label>
                    <p className="text-sm text-muted-foreground">{row.original.description}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setRejectingCompanyId(row.original.id);
                      setShowRejectionDialog(true);
                    }}
                    disabled={actionLoading}
                  >
                    <IconX className="h-4 w-4 mr-2" />
                    Ablehnen
                  </Button>
                  <Button 
                    onClick={() => handleApprove(row.original.id)}
                    disabled={actionLoading}
                  >
                    <IconCheck className="h-4 w-4 mr-2" />
                    Genehmigen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleApprove(row.original.id)}
            disabled={actionLoading}
          >
            <IconCheck className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => {
              setRejectingCompanyId(row.original.id);
              setShowRejectionDialog(true);
            }}
            disabled={actionLoading}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Unternehmensgenehmigungen</h1>
          <p className="text-muted-foreground">
            Genehmigen oder lehnen Sie ausstehende Unternehmensregistrierungen ab
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wartend</p>
                  <p className="text-2xl font-bold">{pendingCompanies.length}</p>
                </div>
                <IconClock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Überfällig</p>
                  <p className="text-2xl font-bold text-destructive">
                    {pendingCompanies.filter(c => {
                      const days = Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24));
                      return days > 7;
                    }).length}
                  </p>
                </div>
                <IconAlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Heute eingereicht</p>
                  <p className="text-2xl font-bold">
                    {pendingCompanies.filter(c => {
                      const today = new Date().toDateString();
                      return new Date(c.created_at).toDateString() === today;
                    }).length}
                  </p>
                </div>
                <IconCalendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ausgewählt</p>
                  <p className="text-2xl font-bold">{selectedCompanies.length}</p>
                </div>
                <IconChecks className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedCompanies.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedCompanies.length} Unternehmen ausgewählt
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCompanies([])}
                  >
                    Auswahl aufheben
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkApproval}
                    disabled={actionLoading}
                  >
                    <IconCheck className="h-4 w-4 mr-2" />
                    Alle genehmigen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ausstehende Genehmigungen ({pendingCompanies.length})</CardTitle>
            <CardDescription>
              Unternehmen, die auf Genehmigung warten oder in Bearbeitung sind
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={companyColumns} 
              data={pendingCompanies}
            />
          </CardContent>
        </Card>

        {/* Rejection Dialog */}
        <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unternehmen ablehnen</DialogTitle>
              <DialogDescription>
                Bitte geben Sie einen Grund für die Ablehnung an
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Grund für die Ablehnung..."
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectionDialog(false);
                  setRejectionReason("");
                  setRejectingCompanyId(null);
                }}
              >
                Abbrechen
              </Button>
              <Button 
                variant="destructive"
                onClick={() => rejectingCompanyId && handleReject(rejectingCompanyId, rejectionReason)}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                <IconX className="h-4 w-4 mr-2" />
                Ablehnen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 