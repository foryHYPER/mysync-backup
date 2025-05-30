"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import SkillTagInput from "../../candidate/profile/SkillTagInput";
import { useEffect } from "react";
import { CandidateFormValues } from "@/types/candidate";

const candidateFormSchema = z.object({
  first_name: z.string().min(2, { message: "Vorname muss mindestens 2 Zeichen haben." }),
  last_name: z.string().min(2, { message: "Nachname muss mindestens 2 Zeichen haben." }),
  email: z.string().email(),
  phone: z.string().optional(),
  resume_url: z.string().url().optional().or(z.literal("")),
  profile_photo_url: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
});

type CandidateFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<CandidateFormValues>;
  onSubmit: (values: CandidateFormValues) => Promise<void>;
  mode: "create" | "edit";
};

export default function CandidateFormModal({ open, onOpenChange, initialValues, onSubmit, mode }: CandidateFormModalProps) {
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: initialValues || {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      resume_url: "",
      profile_photo_url: "",
      skills: [],
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{mode === "create" ? "Kandidat anlegen" : "Kandidat bearbeiten"}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async (values) => {
                await onSubmit(values);
                onOpenChange(false);
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname</FormLabel>
                    <FormControl>
                      <Input placeholder="Vorname" {...field} />
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
                      <Input placeholder="Nachname" {...field} />
                    </FormControl>
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
                      <Input placeholder="E-Mail" {...field} />
                    </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DrawerFooter>
                <Button type="submit" className="w-full">
                  {mode === "create" ? "Anlegen" : "Speichern"}
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline" className="w-full">Abbrechen</Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
} 