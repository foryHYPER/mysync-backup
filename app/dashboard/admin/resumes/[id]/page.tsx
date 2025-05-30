"use client";
import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/context/ProfileContext";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Candidate } from "@/types/candidate";

type Skill = {
  id: string;
  name: string;
};

type FormData = Partial<Candidate>;

export default function AdminResumeDetailPage() {
  const params = useParams();
  const candidateId = params?.id as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FormData>({});
  const profile = useProfile();
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (profile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.from("candidates").select("*").eq("id", candidateId).single();
      if (!error) {
        setCandidate(data as Candidate);
        setForm(data as FormData);
      }
      setLoading(false);
    };
    if (candidateId) fetchCandidate();
  }, [candidateId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const supabase = createClient();
    await supabase.from("candidates").update(form).eq("id", candidateId);
    setCandidate(form as Candidate);
    setEditMode(false);
  };

  const handleExport = () => {
    if (!candidate) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colors and styles
    const accent = "#2563eb"; // blue-600
    const sidebarWidth = 140;
    const margin = 40;
    const lineHeight = 22;
    let y = margin;

    // Sidebar
    doc.setFillColor(accent);
    doc.rect(0, 0, sidebarWidth, pageHeight, "F");

    // Profile photo
    if (candidate.profile_photo_url) {
      doc.addImage(candidate.profile_photo_url, "JPEG", margin, y, 80, 80, undefined, "FAST");
      y += 100;
    }

    // Sidebar text (name, email, phone)
    doc.setTextColor("#fff");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${candidate.first_name || ""} ${candidate.last_name || ""}`.trim(), sidebarWidth / 2, y, { align: "center" });
    y += lineHeight;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(candidate.email || "", sidebarWidth / 2, y, { align: "center" });
    y += lineHeight;
    if (candidate.phone) {
      doc.text(candidate.phone, sidebarWidth / 2, y, { align: "center" });
      y += lineHeight;
    }

    // Main content
    const mainX = sidebarWidth + margin;
    let mainY = margin;

    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(accent);
    doc.text("Lebenslauf", mainX, mainY);
    mainY += 36;

    // Section: Persönliche Daten
    doc.setFontSize(14);
    doc.setTextColor(accent);
    doc.text("Persönliche Daten", mainX, mainY);
    mainY += 18;
    doc.setFontSize(11);
    doc.setTextColor("#222");
    doc.setFont("helvetica", "normal");
    doc.text(`Vorname: ${candidate.first_name || ""}`, mainX, mainY);
    mainY += lineHeight;
    doc.text(`Nachname: ${candidate.last_name || ""}`, mainX, mainY);
    mainY += lineHeight;
    doc.text(`E-Mail: ${candidate.email || ""}`, mainX, mainY);
    mainY += lineHeight;
    if (candidate.phone) {
      doc.text(`Telefon: ${candidate.phone}`, mainX, mainY);
      mainY += lineHeight;
    }
    if (candidate.resume_url) {
      doc.textWithLink("Lebenslauf-Link", mainX, mainY, { url: candidate.resume_url });
      mainY += lineHeight;
    }
    if (candidate.profile_photo_url) {
      doc.textWithLink("Profilfoto-Link", mainX, mainY, { url: candidate.profile_photo_url });
      mainY += lineHeight;
    }

    // Section: Skills
    if (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0) {
      mainY += 10;
      doc.setFontSize(14);
      doc.setTextColor(accent);
      doc.text("Skills", mainX, mainY);
      mainY += 18;
      doc.setFontSize(11);
      doc.setTextColor("#222");
      const skills = candidate.skills.map((s: Skill) => s.name).join(", ");
      doc.text(skills, mainX, mainY);
      mainY += lineHeight;
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor("#888");
    doc.text("Erstellt mit MySync", pageWidth - margin, pageHeight - 20, { align: "right" });

    doc.save(`Lebenslauf_${candidate.first_name || ""}_${candidate.last_name || ""}.pdf`);
  };

  const generatePdfBlobUrl = () => {
    if (!candidate) return null;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const accent = "#2563eb";
    const sidebarWidth = 140;
    const margin = 40;
    const lineHeight = 22;
    let y = margin;
    doc.setFillColor(accent);
    doc.rect(0, 0, sidebarWidth, pageHeight, "F");
    if (candidate.profile_photo_url) {
      doc.addImage(candidate.profile_photo_url, "JPEG", margin, y, 80, 80, undefined, "FAST");
      y += 100;
    }
    doc.setTextColor("#fff");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${candidate.first_name || ""} ${candidate.last_name || ""}`.trim(), sidebarWidth / 2, y, { align: "center" });
    y += lineHeight;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(candidate.email || "", sidebarWidth / 2, y, { align: "center" });
    y += lineHeight;
    if (candidate.phone) {
      doc.text(candidate.phone, sidebarWidth / 2, y, { align: "center" });
      y += lineHeight;
    }
    const mainX = sidebarWidth + margin;
    let mainY = margin;
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(accent);
    doc.text("Lebenslauf", mainX, mainY);
    mainY += 36;
    doc.setFontSize(14);
    doc.setTextColor(accent);
    doc.text("Persönliche Daten", mainX, mainY);
    mainY += 18;
    doc.setFontSize(11);
    doc.setTextColor("#222");
    doc.setFont("helvetica", "normal");
    doc.text(`Vorname: ${candidate.first_name || ""}`, mainX, mainY);
    mainY += lineHeight;
    doc.text(`Nachname: ${candidate.last_name || ""}`, mainX, mainY);
    mainY += lineHeight;
    doc.text(`E-Mail: ${candidate.email || ""}`, mainX, mainY);
    mainY += lineHeight;
    if (candidate.phone) {
      doc.text(`Telefon: ${candidate.phone}`, mainX, mainY);
      mainY += lineHeight;
    }
    if (candidate.resume_url) {
      doc.textWithLink("Lebenslauf-Link", mainX, mainY, { url: candidate.resume_url });
      mainY += lineHeight;
    }
    if (candidate.profile_photo_url) {
      doc.textWithLink("Profilfoto-Link", mainX, mainY, { url: candidate.profile_photo_url });
      mainY += lineHeight;
    }
    if (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0) {
      mainY += 10;
      doc.setFontSize(14);
      doc.setTextColor(accent);
      doc.text("Skills", mainX, mainY);
      mainY += 18;
      doc.setFontSize(11);
      doc.setTextColor("#222");
      const skills = candidate.skills.map((s: Skill) => s.name).join(", ");
      doc.text(skills, mainX, mainY);
      mainY += lineHeight;
    }
    doc.setFontSize(9);
    doc.setTextColor("#888");
    doc.text("Erstellt mit MySync", pageWidth - margin, pageHeight - 20, { align: "right" });
    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
  };

  const handlePreview = () => {
    const url = generatePdfBlobUrl();
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setShowPreview(false);
    setPreviewUrl(null);
  };

  if (loading) return <div>Lade Kandidatendaten...</div>;
  if (!candidate) return <div>Kandidat nicht gefunden.</div>;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Lebenslauf von {candidate.first_name} {candidate.last_name}</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <form className="space-y-4">
                    <div>
                      <label>Vorname</label>
                      <Input name="first_name" value={form.first_name || ""} onChange={handleChange} />
                    </div>
                    <div>
                      <label>Nachname</label>
                      <Input name="last_name" value={form.last_name || ""} onChange={handleChange} />
                    </div>
                    <div>
                      <label>E-Mail</label>
                      <Input name="email" value={form.email || ""} onChange={handleChange} />
                    </div>
                    <div>
                      <label>Telefon</label>
                      <Input name="phone" value={form.phone || ""} onChange={handleChange} />
                    </div>
                    <div>
                      <label>Lebenslauf-Link</label>
                      <Input name="resume_url" value={form.resume_url || ""} onChange={handleChange} />
                    </div>
                    <div>
                      <label>Profilfoto-Link</label>
                      <Input name="profile_photo_url" value={form.profile_photo_url || ""} onChange={handleChange} />
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <div><b>Vorname:</b> {candidate.first_name}</div>
                    <div><b>Nachname:</b> {candidate.last_name}</div>
                    <div><b>E-Mail:</b> {candidate.email}</div>
                    <div><b>Telefon:</b> {candidate.phone}</div>
                    <div><b>Lebenslauf-Link:</b> <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">{candidate.resume_url}</a></div>
                    <div><b>Profilfoto-Link:</b> <a href={candidate.profile_photo_url} target="_blank" rel="noopener noreferrer">{candidate.profile_photo_url}</a></div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                {editMode ? (
                  <>
                    <Button onClick={handleSave}>Speichern</Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>Abbrechen</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setEditMode(true)}>Bearbeiten</Button>
                    <Button variant="outline" onClick={handleExport}>Exportieren (PDF)</Button>
                    <Button variant="outline" onClick={handlePreview}>Vorschau</Button>
                  </>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      {showPreview && previewUrl && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 16, maxWidth: "90vw", maxHeight: "90vh", boxShadow: "0 2px 16px rgba(0,0,0,0.2)", position: "relative" }}>
            <button onClick={handleClosePreview} style={{ position: "absolute", top: 8, right: 8, background: "#eee", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}>Schließen</button>
            <iframe src={previewUrl} width="600" height="800" style={{ border: "none", maxWidth: "80vw", maxHeight: "80vh" }} title="PDF Vorschau" />
          </div>
        </div>
      )}
    </div>
  );
} 