"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ONBOARDING_STEPS = [
  { key: "company_info", label: "Unternehmensdaten", fields: [
    { name: "name", label: "Firmenname", type: "text", required: true },
    { name: "address", label: "Adresse", type: "text", required: false },
    { name: "website", label: "Website", type: "text", required: false },
  ]},
  { key: "contact_info", label: "Ansprechpartner", fields: [
    { name: "contact_name", label: "Name", type: "text", required: true },
    { name: "contact_email", label: "E-Mail", type: "email", required: true }, 
    { name: "contact_phone", label: "Telefon", type: "text", required: false },
  ]},
  { key: "profile_picture", label: "Firmenlogo", fields: [
    { name: "logo", label: "Logo (URL)", type: "text", required: false }, // Fileupload wäre extra
  ]},
  { key: "finish", label: "Abschließen", fields: [] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const profile = useProfile();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [editContact, setEditContact] = useState(false);
  const [contactPrefilled, setContactPrefilled] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.id)
        .single();
      if (data) {
        setCompany(data);
        setForm({
          name: data.name || "",
          address: data.address || "",
          website: data.website || "",
          contact_name: data.contact_name || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          logo: data.logo || "",
        });
        setContactPrefilled(!!(data.contact_name && data.contact_email));
        setCompletedSteps(data.onboarding_steps ? Object.keys(data.onboarding_steps).filter(k => data.onboarding_steps[k]) : []);
        if (data.onboarding_status === "completed") {
          router.replace("/dashboard/client");
        }
      }
      setLoading(false);
    };
    if (profile?.role === "company") fetchCompany();
  }, [profile, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStepComplete = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const step = ONBOARDING_STEPS[currentStep];
    let updateData: any = {};
    if (step.key === "company_info") {
      updateData = {
        name: form.name,
        address: form.address,
        website: form.website,
      };
      if (!form.name) {
        setError("Firmenname ist erforderlich.");
        setSaving(false);
        return;
      }
    } else if (step.key === "contact_info") {
      updateData = {
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
      };
      if (!form.contact_name || !form.contact_email) {
        setError("Name und E-Mail sind erforderlich.");
        setSaving(false);
        return;
      }
    } else if (step.key === "profile_picture") {
      updateData = {
        logo: form.logo,
      };
    }
    // Onboarding steps/progress
    const newSteps = { ...(company?.onboarding_steps || {}) };
    newSteps[step.key] = true;
    const progress = Math.round((Object.keys(newSteps).length / ONBOARDING_STEPS.length) * 100);
    const status = progress === 100 ? "completed" : "in_progress";
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        ...updateData,
        onboarding_steps: newSteps,
        onboarding_progress: progress,
        onboarding_status: status,
        onboarding_completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", profile.id);
    if (!updateError) {
      setCompletedSteps(Object.keys(newSteps).filter(k => newSteps[k]));
      if (status === "completed") {
        router.replace("/dashboard/client");
        return;
      }
      setCurrentStep((prev) => prev + 1);
    } else {
      setError("Fehler beim Speichern: " + (updateError.message || "Unbekannter Fehler"));
      console.error("Onboarding Update Error:", updateError);
    }
    setSaving(false);
  };

  const handleSkip = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("companies")
      .update({ onboarding_status: "in_progress" })
      .eq("id", profile.id);
    router.replace("/dashboard/client");
    setSaving(false);
  };

  if (loading) return <div className="p-8">Lade Onboarding...</div>;
  if (!company) return <div className="p-8">Fehler: Company nicht gefunden.</div>;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="max-w-3xl w-full mx-auto py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{step.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-sm text-gray-500">Du kannst das Onboarding jederzeit über das Dashboard fortsetzen.</div>
          <div className="mb-4">Fortschritt: {company.onboarding_progress || 0}%</div>
          <ol className="mb-6 list-decimal pl-6">
            {ONBOARDING_STEPS.map((s, idx) => (
              <li key={s.key} className={completedSteps.includes(s.key) ? "text-green-600" : idx === currentStep ? "font-bold" : "text-gray-500"}>
                {s.label}
              </li>
            ))}
          </ol>
          {step.key === "contact_info" && contactPrefilled && !editContact ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Unternehmensname</label>
                <div className="bg-gray-100 rounded px-3 py-2 text-gray-400">{form.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name der Kontaktperson</label>
                <div className="bg-gray-100 rounded px-3 py-2">{form.contact_name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Login-E-Mail</label>
                <div className="bg-gray-100 rounded px-3 py-2 text-gray-400">{profile.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kontakt-E-Mail</label>
                <div className="bg-gray-100 rounded px-3 py-2">{form.contact_email}</div>
              </div>
              {form.contact_phone && (
                <div>
                  <label className="block text-sm font-medium mb-1">Telefon</label>
                  <div className="bg-gray-100 rounded px-3 py-2">{form.contact_phone}</div>
                </div>
              )}
              <Button type="button" variant="secondary" onClick={() => setEditContact(true)}>
                Bearbeiten
              </Button>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  disabled={currentStep === 0 || saving}
                  className="min-w-[120px]"
                >
                  Zurück
                </Button>
                <Button type="button" className="flex-1" onClick={handleStepComplete} disabled={saving}>
                  {saving ? (isLastStep ? "Abschließen..." : "Speichern...") : (isLastStep ? "Onboarding abschließen" : "Nächster Schritt")}
                </Button>
              </div>
            </div>
          ) : step.fields.length > 0 && (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleStepComplete(); }}>
              {step.fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1" htmlFor={field.name}>{field.label}{field.required && " *"}</label>
                  {field.name === "contact_email" && (
                    <div className="mb-1 text-xs text-gray-400">Login-E-Mail: {profile.email}</div>
                  )}
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={form[field.name] || ""}
                    onChange={handleInputChange}
                    required={field.required}
                  />
                </div>
              ))}
              {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  disabled={currentStep === 0 || saving}
                  className="min-w-[120px]"
                >
                  Zurück
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? (isLastStep ? "Abschließen..." : "Speichern...") : (isLastStep ? "Onboarding abschließen" : "Nächster Schritt")}
                </Button>
              </div>
            </form>
          )}
          {step.key === "finish" && (
            <div className="flex flex-col items-center">
              <div className="mb-4 text-green-700 font-bold">Onboarding fast abgeschlossen!</div>
              <Button onClick={handleStepComplete} className="w-full" disabled={saving}>
                {saving ? "Abschließen..." : "Onboarding abschließen"}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleSkip} disabled={saving}>
            Später abschließen
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 