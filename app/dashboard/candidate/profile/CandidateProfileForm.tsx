"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import SkillTagInput, { Skill } from "./SkillTagInput";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function CandidateProfileForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    resume_url: "",
    profile_photo_url: "",
    skills: "",
    availability: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [availabilityNow, setAvailabilityNow] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(undefined);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          resume_url: data.resume_url || "",
          profile_photo_url: data.profile_photo_url || "",
          skills: "",
          availability: data.availability || "",
        });
        if (data.availability === "Ab sofort") {
          setAvailabilityNow(true);
          setAvailabilityDate(undefined);
        } else if (data.availability) {
          setAvailabilityNow(false);
          setAvailabilityDate(new Date(data.availability));
        }
      }
      const { data: skillRows } = await supabase
        .from("candidate_skills")
        .select("skill_id, skills(name, id)")
        .eq("candidate_id", user.id);
      if (skillRows) {
        setSkills(skillRows.map((row: any) => ({ id: row.skills.id, name: row.skills.name })));
      }
      setLoading(false);
    }
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const availabilityValue = availabilityNow
        ? "Ab sofort"
        : availabilityDate
          ? format(availabilityDate, "yyyy-MM-dd")
          : "";
      // Prüfen, ob Kandidat existiert
      const { data: candidateExists, error: selectError } = await supabase
        .from("candidates")
        .select("id")
        .eq("id", user.id)
        .single();
      let updateError = null;
      if (!candidateExists) {
        // Insert
        const { error: insertError } = await supabase.from("candidates").insert({
          id: user.id,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          resume_url: form.resume_url,
          profile_photo_url: form.profile_photo_url,
          availability: availabilityValue,
          status: "active",
        });
        updateError = insertError;
      } else {
        // Update
        const { error } = await supabase
          .from("candidates")
          .update({
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            resume_url: form.resume_url,
            profile_photo_url: form.profile_photo_url,
            availability: availabilityValue,
          })
          .eq("id", user.id);
        updateError = error;
      }
      await supabase.from("candidate_skills").delete().eq("candidate_id", user.id);
      if (skills.length > 0) {
        await supabase.from("candidate_skills").insert(
          skills.map((s) => ({ candidate_id: user.id, skill_id: s.id }))
        );
      }
      if (updateError) {
        setError(updateError.message);
        setSuccess(false);
        console.error("Update/Insert error:", updateError);
      } else {
        setSuccess(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Unbekannter Fehler beim Speichern.");
      setSuccess(false);
      console.error("Submit error:", err);
    }
    setSaving(false);
  };

  if (loading) return <div>Lade Profil...</div>;

  return (
    <div className="flex justify-center items-start py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Kandidatenprofil</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="mb-3 block">Vorname</Label>
                <Input name="first_name" value={form.first_name} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="last_name" className="mb-3 block">Nachname</Label>
                <Input name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="email" className="mb-3 block">E-Mail</Label>
                <Input name="email" value={form.email} disabled />
              </div>
              <div>
                <Label htmlFor="phone" className="mb-3 block">Telefon</Label>
                <Input name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="resume_url" className="mb-3 block">Lebenslauf-Link</Label>
                <Input name="resume_url" value={form.resume_url} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="profile_photo_url" className="mb-3 block">Profilfoto-Link</Label>
                <Input name="profile_photo_url" value={form.profile_photo_url} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-3 block">Skills</Label>
                <SkillTagInput value={skills} onChange={setSkills} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-3 block">Verfügbarkeit</Label>
                <div className="flex flex-col gap-2 mb-2">
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="availability-date"
                          variant={"outline"}
                          className={
                            cn(
                              "w-[300px] justify-start text-left font-normal",
                              availabilityNow && "opacity-50 pointer-events-none"
                            )
                          }
                          disabled={availabilityNow}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {availabilityDate ? (
                            format(availabilityDate, "dd.MM.yyyy")
                          ) : (
                            <span className="text-muted-foreground">Datum wählen</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={availabilityDate}
                          onSelect={(date) => {
                            setAvailabilityDate(date ?? undefined);
                            if (date) setAvailabilityNow(false);
                          }}
                          disabled={availabilityNow}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pl-[2px]">
                    <input
                      type="checkbox"
                      id="availability_now"
                      checked={availabilityNow}
                      onChange={(e) => {
                        setAvailabilityNow(e.target.checked);
                        if (e.target.checked) setAvailabilityDate(undefined);
                      }}
                    />
                    <label htmlFor="availability_now" className="text-sm">Ab sofort verfügbar</label>
                  </div>
                </div>
              </div>
            </div>
            {success && <div className="text-green-600">Profil erfolgreich gespeichert!</div>}
            {error && <div className="text-red-500">{error}</div>}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <span className="animate-spin mr-2 inline-block">⏳</span> : null}
              {saving ? "Speichern..." : "Speichern"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 