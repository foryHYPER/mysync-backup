"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CandidateFormModal from "./CandidateFormModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Candidate, CandidateFormValues } from "@/types/candidate";

export default function AdminCandidateList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("candidates").select("*");
    console.log("CANDIDATES:", data, error);
    if (!error) setCandidates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleCreate = () => {
    setEditCandidate(null);
    setModalOpen(true);
  };

  const handleEdit = (candidate: Candidate) => {
    setEditCandidate(candidate);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("candidates").delete().eq("id", deleteId);
    setDeleteId(null);
    setConfirmDelete(false);
    fetchCandidates();
  };

  const handleSubmit = async (values: CandidateFormValues) => {
    const supabase = createClient();
    if (editCandidate) {
      // Update
      await supabase.from("candidates").update(values).eq("id", editCandidate.id);
    } else {
      // Create
      await supabase.from("candidates").insert(values);
    }
    setModalOpen(false);
    fetchCandidates();
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Kandidatenverwaltung</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreate} className="mb-4">Neuen Kandidaten anlegen</Button>
                {loading ? (
                  <div>Lade Kandidaten...</div>
                ) : (
                  <table className="min-w-full border mt-4">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">Vorname</th>
                        <th className="border px-2 py-1">Nachname</th>
                        <th className="border px-2 py-1">E-Mail</th>
                        <th className="border px-2 py-1">Telefon</th>
                        <th className="border px-2 py-1">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((c) => (
                        <tr key={c.id}>
                          <td className="border px-2 py-1">{c.first_name}</td>
                          <td className="border px-2 py-1">{c.last_name}</td>
                          <td className="border px-2 py-1">{c.email}</td>
                          <td className="border px-2 py-1">{c.phone}</td>
                          <td className="border px-2 py-1">
                            <Button variant="ghost" className="text-blue-600 mr-2" onClick={() => handleEdit(c)}>Bearbeiten</Button>
                            <Button variant="ghost" className="text-red-600" onClick={() => { setDeleteId(c.id); setConfirmDelete(true); }}>Löschen</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <CandidateFormModal
                  open={modalOpen}
                  onOpenChange={setModalOpen}
                  initialValues={editCandidate || undefined}
                  onSubmit={handleSubmit}
                  mode={editCandidate ? "edit" : "create"}
                />
                {/* Lösch-Bestätigung */}
                {confirmDelete && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white p-6 rounded shadow">
                      <p>Möchtest du diesen Kandidaten wirklich löschen?</p>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleDelete} className="bg-red-600 text-white">Löschen</Button>
                        <Button variant="outline" onClick={() => { setDeleteId(null); setConfirmDelete(false); }}>Abbrechen</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 