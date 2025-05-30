"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { getColumns, Invitation } from "./columns";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/context/ProfileContext";

const PAGE_SIZE = 5;

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-800",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-800",
};

type RawInvitation = {
  id: string;
  companies: { name: string; logo: string | null } | null;
  job_postings: { title: string; location: string | null } | null;
  proposed_at: string;
  location: string | null;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
};

export default function CandidateInvitationsPage() {
  const profile = useProfile();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [details, setDetails] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestDate, setSuggestDate] = useState("");
  const [suggestTime, setSuggestTime] = useState("");
  const [suggestConfirmed, setSuggestConfirmed] = useState(false);
  const supabase = createClient();

  const loadInvitations = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select(`
          *,
          companies(name, logo),
          job_postings(title, location)
        `)
        .eq("candidate_id", profile.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const formattedInvitations: Invitation[] = data.map((inv: RawInvitation) => ({
          id: inv.id,
          company: inv.companies?.name || "Unbekannt",
          job_title: inv.job_postings?.title || "Unbekannte Position",
          date: new Date(inv.proposed_at).toLocaleDateString("de-DE"),
          time: new Date(inv.proposed_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
          location: inv.location || inv.job_postings?.location || "Remote",
          status: inv.status,
          message: inv.message || undefined
        }));
        setInvitations(formattedInvitations);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Einladungen:", err);
      setError("Fehler beim Laden der Einladungen. Bitte versuchen Sie es später erneut.");
    } finally {
      setLoading(false);
    }
  }, [profile?.id, supabase]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const filtered = useMemo(() =>
    invitations.filter(
      (inv) =>
        inv.company.toLowerCase().includes(search.toLowerCase()) ||
        inv.job_title.toLowerCase().includes(search.toLowerCase())
    ),
    [search, invitations]
  );

  const paged = useMemo(() =>
    filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const handleShowDetails = (invitation: Invitation) => {
    setDetails(invitation);
    setShowSuggest(false);
    setSuggestDate("");
    setSuggestTime("");
  };

  const handleShowSuggest = (invitation: Invitation) => {
    setDetails(invitation);
    setShowSuggest(true);
    setSuggestDate("");
    setSuggestTime("");
  };

  const handleAccept = async (invitation: Invitation) => {
    try {
      const { error: updateError } = await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);
      
      if (updateError) throw updateError;
      
      toast.success("Einladung angenommen.");
      loadInvitations();
      handleDialogClose();
    } catch (err) {
      console.error("Fehler beim Annehmen der Einladung:", err);
      toast.error("Fehler beim Annehmen der Einladung.");
    }
  };

  const handleDecline = async (invitation: Invitation) => {
    try {
      const { error: updateError } = await supabase
        .from("invitations")
        .update({ status: "declined" })
        .eq("id", invitation.id);
      
      if (updateError) throw updateError;
      
      toast.success("Einladung abgelehnt.");
      loadInvitations();
      handleDialogClose();
    } catch (err) {
      console.error("Fehler beim Ablehnen der Einladung:", err);
      toast.error("Fehler beim Ablehnen der Einladung.");
    }
  };

  const handleAction = async (action: string) => {
    if (!details) return;
    if (action === "suggest") {
      setShowSuggest(true);
      return;
    }
    if (action === "accept") {
      await handleAccept(details);
      return;
    }
    if (action === "decline") {
      await handleDecline(details);
      return;
    }
  };

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details) return;

    try {
      // Hier könnte eine neue Einladung mit dem vorgeschlagenen Termin erstellt werden
      // oder eine Benachrichtigung an das Unternehmen gesendet werden
      toast.success(`Neuer Terminvorschlag: ${suggestDate} ${suggestTime}`);
      handleDialogClose();
    } catch (err) {
      console.error("Fehler beim Senden des Terminvorschlags:", err);
      toast.error("Fehler beim Senden des Terminvorschlags.");
    }
  };

  const handleDialogClose = () => {
    setDetails(null);
    setError(null);
    setShowSuggest(false);
    setSuggestDate("");
    setSuggestTime("");
    setSuggestConfirmed(false);
  };

  if (loading) {
    return (
      <main className="container mx-auto p-8">
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <div className="text-muted-foreground">Lade Einladungen...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Interview-Einladungen</h1>
        <p className="text-muted-foreground">
          Hier finden Sie alle Ihre Interview-Einladungen und können diese verwalten.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle>Ihre Einladungen</CardTitle>
              <p className="text-sm text-muted-foreground">
                {invitations.length} Einladung{invitations.length !== 1 ? 'en' : ''} insgesamt
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <Input
                placeholder="Nach Unternehmen oder Position suchen..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full sm:w-[300px] font-medium text-[#000000] placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 space-y-4">
              <div className="text-red-500 text-lg">{error}</div>
              <Button 
                variant="outline" 
                onClick={loadInvitations}
                className="font-medium text-[#000000]"
              >
                Erneut versuchen
              </Button>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Keine Einladungen vorhanden</h3>
              <p className="text-muted-foreground">
                Sie haben aktuell keine Interview-Einladungen.
              </p>
            </div>
          ) : (
            <>
              <DataTable 
                columns={getColumns(handleShowDetails, handleShowSuggest, handleAccept, handleDecline)} 
                data={paged} 
              />
              {pageCount > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">
                    Seite {page + 1} von {pageCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="font-medium text-[#000000]"
                    >
                      Zurück
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                      disabled={page >= pageCount - 1}
                      className="font-medium text-[#000000]"
                    >
                      Weiter
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!details} onOpenChange={() => handleDialogClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Einladungsdetails</DialogTitle>
            <DialogDescription>
              {details?.company} - {details?.job_title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Datum</p>
                <p className="text-sm">{details?.date}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Uhrzeit</p>
                <p className="text-sm">{details?.time}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Ort</p>
                <p className="text-sm">{details?.location}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={statusColor[details?.status || 'pending']}>
                  {details?.status === 'pending' ? 'Ausstehend' : 
                   details?.status === 'accepted' ? 'Angenommen' : 'Abgelehnt'}
                </Badge>
              </div>
            </div>
            
            {details?.message && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nachricht</p>
                <p className="text-sm whitespace-pre-wrap">{details.message}</p>
              </div>
            )}
          </div>

          {details?.status === 'pending' && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {!showSuggest ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleAction('suggest')}
                    className="font-medium text-[#000000]"
                  >
                    Termin vorschlagen
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAction('decline')}
                      className="font-medium text-[#000000]"
                    >
                      Ablehnen
                    </Button>
                    <Button
                      onClick={() => handleAction('accept')}
                      className="font-medium text-white bg-primary hover:bg-primary/90"
                    >
                      Annehmen
                    </Button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSuggestSubmit} className="w-full space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Datum</label>
                      <Input
                        type="date"
                        value={suggestDate}
                        onChange={e => setSuggestDate(e.target.value)}
                        required
                        className="font-medium text-[#000000]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Uhrzeit</label>
                      <Input
                        type="time"
                        value={suggestTime}
                        onChange={e => setSuggestTime(e.target.value)}
                        required
                        className="font-medium text-[#000000]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSuggest(false)}
                      className="font-medium text-[#000000]"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      className="font-medium text-white bg-primary hover:bg-primary/90"
                    >
                      Vorschlag senden
                    </Button>
                  </div>
                </form>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
} 