"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField } from "@/components/ui/form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import SkillTagInput, { Skill } from "./SkillTagInput";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [success, setSuccess] = useState(false);
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
      setDefaultValues({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        email: user.email || "",
        phone: data?.phone || "",
        resume_url: data?.resume_url || "",
        profile_photo_url: data?.profile_photo_url || "",
        skills: skillRows ? skillRows.map((row: any) => ({ id: row.skills.id, name: row.skills.name })) : [],
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
        skills: skillRows ? skillRows.map((row: any) => ({ id: row.skills.id, name: row.skills.name })) : [],
        availabilityNow: data?.availability === "Ab sofort",
        availabilityDate: data?.availability && data.availability !== "Ab sofort" ? new Date(data.availability) : undefined,
      });
      setLoading(false);
    }
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  async function onSubmit(data: AccountFormValues) {
    setSuccess(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const availability = data.availabilityNow
      ? "Ab sofort"
      : data.availabilityDate
        ? format(data.availabilityDate, "yyyy-MM-dd")
        : "";
    // Insert/Update wie gehabt
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
    // Skills speichern
    await supabase.from("candidate_skills").delete().eq("candidate_id", user.id);
    if (data.skills && data.skills.length > 0) {
      await supabase.from("candidate_skills").insert(
        data.skills.map((s) => ({ candidate_id: user.id, skill_id: s.id }))
      );
    }
    setSuccess(true);
  }

  if (loading) return <div>Lade Accountdaten...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konto</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname</FormLabel>
                    <FormControl>
                      <Input placeholder="Vorname" {...field} />
                    </FormControl>
                    <FormDescription>Dein Vorname für das Profil.</FormDescription>
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
                      <Input placeholder="Nachname" {...field} />
                    </FormControl>
                    <FormDescription>Dein Nachname für das Profil.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input placeholder="E-Mail" {...field} disabled />
                    </FormControl>
                    <FormDescription>Deine E-Mail-Adresse (nicht änderbar).</FormDescription>
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
                      <Input placeholder="Telefon" {...field} />
                    </FormControl>
                    <FormDescription>Deine Telefonnummer für Rückfragen.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resume_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lebenslauf-Link</FormLabel>
                    <FormControl>
                      <Input placeholder="URL zum Lebenslauf" {...field} />
                    </FormControl>
                    <FormDescription>Link zu deinem Lebenslauf (optional).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profile_photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profilfoto-Link</FormLabel>
                    <FormControl>
                      <Input placeholder="URL zum Profilfoto" {...field} />
                    </FormControl>
                    <FormDescription>Link zu deinem Profilfoto (optional).</FormDescription>
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
                      <SkillTagInput value={field.value || []} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>Füge deine wichtigsten Skills als Tags hinzu.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availabilityNow"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Verfügbarkeit</FormLabel>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="availability_now"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <label htmlFor="availability_now" className="text-sm">Ab sofort verfügbar</label>
                      </div>
                      <FormField
                        control={form.control}
                        name="availabilityDate"
                        render={({ field: dateField }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  id="availability-date"
                                  variant={"outline"}
                                  className={cn(
                                    "w-[240px] pl-3 text-left font-normal",
                                    field.value && "opacity-50 pointer-events-none"
                                  )}
                                  disabled={field.value}
                                >
                                  {dateField.value ? (
                                    format(dateField.value, "dd.MM.yyyy")
                                  ) : (
                                    <span>Datum wählen</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
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
                        )}
                      />
                    </div>
                    <FormDescription>Wähle ein Datum oder setze die Checkbox für "Ab sofort".</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {success && <div className="text-green-600">Profil erfolgreich gespeichert!</div>}
              <Button type="submit">Profil speichern</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 