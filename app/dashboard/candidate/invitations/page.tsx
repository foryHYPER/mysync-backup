"use client";

import { useState, useMemo } from "react";
import { getColumns, Invitation } from "./columns";
import { DataTable } from "@/components/data-table";
import invitationsRaw from "@/app/dashboard/data/invitations.json";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const PAGE_SIZE = 5;

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-800",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-800",
};

export default function CandidateInvitationsPage() {
  const invitations = invitationsRaw as Invitation[];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [details, setDetails] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestDate, setSuggestDate] = useState("");
  const [suggestTime, setSuggestTime] = useState("");
  const [suggestConfirmed, setSuggestConfirmed] = useState(false);

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

  // Simulate loading when opening dialog
  const handleShowDetails = (invitation: Invitation) => {
    setLoading(true);
    setError(null);
    setDetails(invitation);
    setShowSuggest(false);
    setSuggestDate("");
    setSuggestTime("");
    setTimeout(() => setLoading(false), 500); // Simulate network delay
  };

  const handleShowSuggest = (invitation: Invitation) => {
    setLoading(false);
    setError(null);
    setDetails(invitation);
    setShowSuggest(true);
    setSuggestDate("");
    setSuggestTime("");
  };

  // Simulate error
  const handleSimulateError = () => {
    setError("Fehler beim Laden der Einladung. Bitte versuchen Sie es erneut.");
  };

  // Accept/Decline handlers for table actions
  const handleAccept = (invitation: Invitation) => {
    toast.success("Einladung angenommen.");
    handleDialogClose();
  };
  const handleDecline = (invitation: Invitation) => {
    toast.success("Einladung abgelehnt.");
    handleDialogClose();
  };

  // Actions in dialog
  const handleAction = (action: string) => {
    if (!details) return;
    if (action === "suggest") {
      setShowSuggest(true);
      return;
    }
    if (action === "accept") {
      toast.success("Einladung angenommen.");
      handleDialogClose();
      return;
    }
    if (action === "decline") {
      toast.success("Einladung abgelehnt.");
      handleDialogClose();
      return;
    }
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Neuer Terminvorschlag: ${suggestDate} ${suggestTime}`);
    handleDialogClose();
  };

  // Reset dialog state on close
  const handleDialogClose = () => {
    setDetails(null);
    setLoading(false);
    setError(null);
    setShowSuggest(false);
    setSuggestDate("");
    setSuggestTime("");
    setSuggestConfirmed(false);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Toaster />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Einladungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                  <Input
                    placeholder="Suche nach Unternehmen oder Position..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    className="max-w-xs"
                  />
                </div>
                <DataTable columns={getColumns(handleShowDetails, handleShowSuggest, handleAccept, handleDecline)} data={paged} />
              </CardContent>
              <CardFooter className="flex justify-between items-center mt-4">
                <span>
                  Seite {page + 1} von {pageCount || 1}
                </span>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Zurück
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                  >
                    Weiter
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={!!details} onOpenChange={open => { if (!open) handleDialogClose(); }}>
        <DialogContent className="transition-all duration-300">
          <DialogHeader>
            <DialogTitle>Einladungsdetails</DialogTitle>
            <DialogDescription>
              Alle Informationen zur Einladung.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8">Lade...</div>
          ) : error ? (
            <div className="text-red-600 py-4">{error}</div>
          ) : suggestConfirmed ? (
            <div className="py-8 text-center">
              <div className="text-green-600 font-semibold mb-2">Ihr Terminvorschlag wurde übermittelt!</div>
              <Button variant="default" onClick={handleDialogClose}>Schließen</Button>
            </div>
          ) : details && (
            <div className="space-y-2">
              <div><b>Unternehmen:</b> {details.company}</div>
              <div><b>Position:</b> {details.job_title}</div>
              <div><b>Datum:</b> {details.date}</div>
              <div><b>Uhrzeit:</b> {details.time}</div>
              <div><b>Ort:</b> {details.location}</div>
              <div className="flex items-center gap-2"><b>Status:</b> <Badge className={statusColor[details.status] || ""}>{details.status.charAt(0).toUpperCase() + details.status.slice(1)}</Badge></div>
              {showSuggest && details ? (
                <form className="space-y-2 pt-2" onSubmit={handleSuggestSubmit}>
                  <div>
                    <label className="block mb-1">Neuer Terminvorschlag:</label>
                    <Input type="date" value={suggestDate} onChange={e => setSuggestDate(e.target.value)} required className="mb-2" />
                    <Input type="time" value={suggestTime} onChange={e => setSuggestTime(e.target.value)} required />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm" variant="default">Vorschlag senden</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowSuggest(false)}>Abbrechen</Button>
                  </div>
                </form>
              ) : details && details.status === "pending" && !showSuggest && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="default" onClick={() => handleAction("accept")}>Annehmen</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleAction("decline")}>Ablehnen</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSuggest(true)}>Alternativtermin</Button>
                </div>
              )}
              <div className="pt-2">
                <Button size="sm" variant="outline" onClick={handleSimulateError}>Fehler simulieren</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 