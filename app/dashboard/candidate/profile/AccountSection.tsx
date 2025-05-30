"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField } from "@/components/ui/form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import SkillTagInput from "./SkillTagInput";
import type { Skill } from "./SkillTagInput";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DatabaseSkillRow = {
  skill_id: string;
  skills: Skill | null;
};

const accountFormSchema = z.object({
  first_name: z.string().min(2, { message: "Vorname muss mindestens 2 Zeichen haben." }),
  last_name: z.string().min(2, { message: "Nachname muss mindestens 2 Zeichen haben." }),
  email: z.string().email(),
  phone: z.string().optional(),
  resume_url: z.string().url().optional().or(z.literal("")),
  profile_photo_url: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  availabilityNow: z.boolean().optional(),
  availabilityDate: z.date().optional().or(z.null()),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const [defaultValues, setDefaultValues] = useState<Partial<AccountFormValues>>({});

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", user.id)
        .single();
      const { data: skillRows } = await supabase
        .from("candidate_skills")
        .select("skill_id, skills(name, id)")
        .eq("candidate_id", user.id);

      const formattedSkills = (skillRows as DatabaseSkillRow[] | null)
        ?.filter(row => row.skills !== null)
        .map(row => ({
          id: row.skills!.id,
          name: row.skills!.name
        })) || [];

      setDefaultValues({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        email: user.email || "",
        phone: data?.phone || "",
        resume_url: data?.resume_url || "",
        profile_photo_url: data?.profile_photo_url || "",
        skills: formattedSkills,
        availabilityNow: data?.availability === "Ab sofort",
        availabilityDate: data?.availability && data.availability !== "Ab sofort" ? new Date(data.availability) : undefined,
      });
      form.reset({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        email: user.email || "",
        phone: data?.phone || "",
        resume_url: data?.resume_url || "",
        profile_photo_url: data?.profile_photo_url || "",
        skills: formattedSkills,
        availabilityNow: data?.availability === "Ab sofort",
        availabilityDate: data?.availability && data.availability !== "Ab sofort" ? new Date(data.availability) : undefined,
      });
      setLoading(false);
    }
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  async function onSubmit(data: AccountFormValues) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const availability = data.availabilityNow
        ? "Ab sofort"
        : data.availabilityDate
          ? format(data.availabilityDate, "yyyy-MM-dd")
          : "";

      const { data: candidateExists } = await supabase
        .from("candidates")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!candidateExists) {
        await supabase.from("candidates").insert({
          id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          resume_url: data.resume_url,
          profile_photo_url: data.profile_photo_url,
          availability,
          status: "active",
        });
      } else {
        await supabase
          .from("candidates")
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            resume_url: data.resume_url,
            profile_photo_url: data.profile_photo_url,
            availability,
          })
          .eq("id", user.id);
      }

      await supabase.from("candidate_skills").delete().eq("candidate_id", user.id);
      if (data.skills && data.skills.length > 0) {
        await supabase.from("candidate_skills").insert(
          data.skills.map((s) => ({ candidate_id: user.id, skill_id: s.id }))
        );
      }

      toast.success("Profil erfolgreich gespeichert!");
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast.error("Fehler beim Speichern des Profils. Bitte versuchen Sie es später erneut.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-muted-foreground">Lade Profildaten...</div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vorname</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Vorname" 
                      {...field} 
                      className="font-medium"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nachname</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nachname" 
                      {...field} 
                      className="font-medium"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E-Mail" 
                      {...field} 
                      disabled 
                      className="bg-muted/50 font-medium"
                    />
                  </FormControl>
                  <FormDescription>
                    Ihre E-Mail-Adresse kann nicht geändert werden.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+49 123 456789" 
                      {...field} 
                      className="font-medium"
                    />
                  </FormControl>
                  <FormDescription>
                    Ihre Telefonnummer für Rückfragen von Unternehmen.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resume_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lebenslauf</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://..." 
                      {...field} 
                      className="font-medium"
                    />
                  </FormControl>
                  <FormDescription>
                    Link zu Ihrem Lebenslauf (PDF oder DOCX). Stellen Sie sicher, dass der Link öffentlich zugänglich ist.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profile_photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profilfoto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://..." 
                      {...field} 
                      className="font-medium"
                    />
                  </FormControl>
                  <FormDescription>
                    Link zu Ihrem Profilfoto (JPG oder PNG). Empfohlene Größe: 400x400 Pixel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <SkillTagInput 
                      value={field.value || []} 
                      onChange={field.onChange} 
                    />
                  </FormControl>
                  <FormDescription>
                    Fügen Sie Ihre wichtigsten Fähigkeiten und Kompetenzen hinzu.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availabilityNow"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>Verfügbarkeit</FormLabel>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="availability_now"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label 
                        htmlFor="availability_now" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Ab sofort verfügbar
                      </label>
                    </div>

                    <FormField
                      control={form.control}
                      name="availabilityDate"
                      render={({ field: dateField }) => (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="availability-date"
                                  variant="outline"
                                  className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    field.value && "opacity-50 pointer-events-none"
                                  )}
                                  disabled={field.value}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateField.value ? (
                                    format(dateField.value, "dd.MM.yyyy")
                                  ) : (
                                    <span className="text-muted-foreground">Verfügbares Datum wählen</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={dateField.value ?? undefined}
                                  onSelect={dateField.onChange}
                                  disabled={field.value}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormDescription>
                            Wählen Sie ein Datum, ab dem Sie verfügbar sind.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving}
            className="font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichern...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Profil speichern
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 