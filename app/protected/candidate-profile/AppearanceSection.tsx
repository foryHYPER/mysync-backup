"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark"], {
    required_error: "Bitte wähle ein Theme.",
  }),
  font: z.enum(["inter", "manrope", "system"], {
    invalid_type_error: "Bitte wähle eine Schriftart.",
    required_error: "Bitte wähle eine Schriftart.",
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const defaultValues: Partial<AppearanceFormValues> = {
  theme: "light",
  font: "inter",
};

export default function AppearanceSection() {
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
  });

  function onSubmit(data: AppearanceFormValues) {
    // Hier könnte ein Toast oder API-Call stehen
    alert("Gespeichert: " + JSON.stringify(data, null, 2));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="font"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font</FormLabel>
                  <div className="relative w-max">
                    <FormControl>
                      <select
                        className={cn(
                          "w-[200px] appearance-none font-normal border rounded-md px-3 py-2 bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors",
                        )}
                        {...field}
                      >
                        <option value="inter">Inter</option>
                        <option value="manrope">Manrope</option>
                        <option value="system">System</option>
                      </select>
                    </FormControl>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                  </div>
                  <FormDescription>
                    Wähle die Schriftart für das Dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Theme</FormLabel>
                  <FormDescription>
                    Wähle das Theme für das Dashboard.
                  </FormDescription>
                  <FormMessage />
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid max-w-md grid-cols-2 gap-8 pt-2"
                  >
                    <FormItem>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <FormControl>
                          <RadioGroupItem value="light" className="sr-only" />
                        </FormControl>
                        <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                          <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                            <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                              <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                              <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                              <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                              <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                            </div>
                          </div>
                        </div>
                        <span className="block w-full p-2 text-center font-normal">
                          Light
                        </span>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <FormControl>
                          <RadioGroupItem value="dark" className="sr-only" />
                        </FormControl>
                        <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                          <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                            <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                              <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                              <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-slate-400" />
                              <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-slate-400" />
                              <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                          </div>
                        </div>
                        <span className="block w-full p-2 text-center font-normal">
                          Dark
                        </span>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormItem>
              )}
            />
            <Button type="submit">Einstellungen speichern</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 