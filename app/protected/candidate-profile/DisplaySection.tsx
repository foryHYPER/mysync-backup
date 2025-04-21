"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

const items = [
  { id: "recents", label: "Zuletzt verwendet" },
  { id: "home", label: "Home" },
  { id: "applications", label: "Bewerbungen" },
  { id: "desktop", label: "Desktop" },
  { id: "downloads", label: "Downloads" },
  { id: "documents", label: "Dokumente" },
] as const;

const displayFormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Du musst mindestens ein Element auswählen.",
  }),
});

type DisplayFormValues = z.infer<typeof displayFormSchema>;

const defaultValues: Partial<DisplayFormValues> = {
  items: ["recents", "home"],
};

export default function DisplaySection() {
  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues,
  });

  function onSubmit(data: DisplayFormValues) {
    alert("Gespeichert: " + JSON.stringify(data, null, 2));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="items"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Sidebar</FormLabel>
                    <FormDescription>
                      Wähle die Elemente, die in der Sidebar angezeigt werden sollen.
                    </FormDescription>
                  </div>
                  {items.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="items"
                      render={({ field }) => (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Anzeige speichern</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 