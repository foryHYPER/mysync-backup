"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField } from "@/components/ui/form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar as CalendarIcon, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Link as LinkIcon,
  Camera,
  Briefcase,
  Clock,
  Plus,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
type Skill = {
  id: string;
  name: string;
};

type DatabaseSkillRow = {
  skill_id: string;
  skills: Skill | null;
};

// Schema
const profileSchema = z.object({
  first_name: z.string().min(2, "Vorname muss mindestens 2 Zeichen haben"),
  last_name: z.string().min(2, "Nachname muss mindestens 2 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().optional(),
  resume_url: z.string().url("Ungültige URL").optional().or(z.literal("")),
  profile_photo_url: z.string().url("Ungültige URL").optional().or(z.literal("")),
  skills: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  bio: z.string().max(500, "Bio darf maximal 500 Zeichen haben").optional(),
  location: z.string().optional(),
  experience: z.number().min(0).max(50).optional(),
  availability_now: z.boolean().optional(),
  availability_date: z.date().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Simple Skill Input Component
function SkillInput({ 
  value = [], 
  onChange 
}: { 
  value: Skill[]; 
  onChange: (skills: Skill[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSkills() {
      setIsLoading(true);
      const { data } = await supabase.from("skills").select("*").order("name");
      setAvailableSkills(data || []);
      setIsLoading(false);
    }
    fetchSkills();
  }, [supabase]);

  const handleAddSkill = async () => {
    if (!inputValue.trim()) return;

    // Check if skill already exists
    let skill = availableSkills.find(s => s.name.toLowerCase() === inputValue.toLowerCase());
    
    if (!skill) {
      // Create new skill
      const { data, error } = await supabase
        .from("skills")
        .insert({ name: inputValue.trim() })
        .select()
        .single();
      
      if (error) {
        toast.error("Fehler beim Hinzufügen des Skills");
        return;
      }
      skill = data;
      setAvailableSkills(prev => [...prev, skill!]);
    }

    if (!value.find(s => s.id === skill!.id)) {
      onChange([...value, skill!]);
    }
    setInputValue("");
  };

  const handleRemoveSkill = (skillId: string) => {
    onChange(value.filter(s => s.id !== skillId));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Skill hinzufügen..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddSkill();
            }
          }}
        />
        <Button type="button" onClick={handleAddSkill} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {value.map((skill) => (
          <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
            {skill.name}
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill.id)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function CandidateProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      resume_url: "",
      profile_photo_url: "",
      bio: "",
      location: "",
      experience: 0,
      skills: [],
      availability_now: false,
      availability_date: null,
    },
  });

  const watchedPhotoUrl = form.watch("profile_photo_url");
  const watchedFirstName = form.watch("first_name");
  const watchedLastName = form.watch("last_name");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: candidate } = await supabase
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

        const formData = {
          first_name: candidate?.first_name || "",
          last_name: candidate?.last_name || "",
          email: user.email || "",
          phone: candidate?.phone || "",
          resume_url: candidate?.resume_url || "",
          profile_photo_url: candidate?.profile_photo_url || "",
          bio: "", // Add bio field to database if needed
          location: candidate?.location || "",
          experience: candidate?.experience || 0,
          skills: formattedSkills,
          availability_now: candidate?.availability === "Ab sofort",
          availability_date: candidate?.availability && candidate.availability !== "Ab sofort" 
            ? new Date(candidate.availability) 
            : null,
        };

        form.reset(formData);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Fehler beim Laden des Profils");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [form, supabase]);

  async function onSubmit(data: ProfileFormValues) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const availability = data.availability_now
        ? "Ab sofort"
        : data.availability_date
          ? format(data.availability_date, "yyyy-MM-dd")
          : "";

      // Check if candidate exists
      const { data: candidateExists } = await supabase
        .from("candidates")
        .select("id")
        .eq("id", user.id)
        .single();

      const candidateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        resume_url: data.resume_url,
        profile_photo_url: data.profile_photo_url,
        location: data.location,
        experience: data.experience,
        availability,
        status: "active",
      };

      if (!candidateExists) {
        await supabase.from("candidates").insert({
          id: user.id,
          ...candidateData,
        });
      } else {
        await supabase
          .from("candidates")
          .update(candidateData)
          .eq("id", user.id);
      }

      // Update skills
      await supabase.from("candidate_skills").delete().eq("candidate_id", user.id);
      if (data.skills && data.skills.length > 0) {
        await supabase.from("candidate_skills").insert(
          data.skills.map((skill) => ({ 
            candidate_id: user.id, 
            skill_id: skill.id 
          }))
        );
      }

      toast.success("Profil erfolgreich gespeichert!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Fehler beim Speichern des Profils");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Lade Profildaten...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mein Profil</h1>
          <p className="text-muted-foreground">
            Verwalten Sie hier Ihre persönlichen Daten und Berufsinformationen.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Profile Header Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Persönliche Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={watchedPhotoUrl} />
                    <AvatarFallback className="text-lg">
                      {watchedFirstName?.[0]}{watchedLastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="profile_photo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Profilfoto URL
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Link zu Ihrem Profilfoto (JPG, PNG). Empfohlene Größe: 400x400px
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vorname *</FormLabel>
                        <FormControl>
                          <Input placeholder="Max" {...field} />
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
                        <FormLabel>Nachname *</FormLabel>
                        <FormControl>
                          <Input placeholder="Mustermann" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          E-Mail-Adresse
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-muted/50" />
                        </FormControl>
                        <FormDescription>
                          Ihre E-Mail-Adresse kann nicht geändert werden
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
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefonnummer
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+49 123 456789" {...field} />
                        </FormControl>
                        <FormDescription>
                          Für Rückfragen von Unternehmen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location and Experience */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standort</FormLabel>
                        <FormControl>
                          <Input placeholder="Berlin, Deutschland" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Berufserfahrung (Jahre)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="50" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Berufliche Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resume URL */}
                <FormField
                  control={form.control}
                  name="resume_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Lebenslauf URL
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Link zu Ihrem Lebenslauf (PDF oder Word). Stellen Sie sicher, dass der Link öffentlich zugänglich ist.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Skills */}
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fähigkeiten & Kompetenzen</FormLabel>
                      <FormControl>
                        <SkillInput 
                          value={field.value || []} 
                          onChange={field.onChange} 
                        />
                      </FormControl>
                      <FormDescription>
                        Fügen Sie Ihre wichtigsten Fähigkeiten hinzu
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Availability */}
                <FormField
                  control={form.control}
                  name="availability_now"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Verfügbarkeit
                      </FormLabel>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="availability_now"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <label htmlFor="availability_now" className="text-sm font-medium">
                            Ab sofort verfügbar
                          </label>
                        </div>

                        {!field.value && (
                          <FormField
                            control={form.control}
                            name="availability_date"
                            render={({ field: dateField }) => (
                              <FormItem>
                                <FormControl>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-[240px] justify-start text-left font-normal"
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateField.value ? (
                                          format(dateField.value, "dd.MM.yyyy")
                                        ) : (
                                          <span className="text-muted-foreground">
                                            Verfügbares Datum wählen
                                          </span>
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={dateField.value || undefined}
                                        onSelect={dateField.onChange}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </FormControl>
                                <FormDescription>
                                  Wählen Sie ein Datum, ab dem Sie verfügbar sind
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} size="lg">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Profil speichern
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 