"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

export type Skill = { id: string; name: string };

export default function SkillTagInput({ value, onChange }: {
  value: Skill[];
  onChange: (skills: Skill[]) => void;
}) {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSkills() {
      const { data, error: fetchError } = await supabase
        .from("skills")
        .select("*")
        .order("name");
      if (fetchError) {
        console.error("Fehler beim Laden der Skills:", fetchError);
        return;
      }
      if (data) {
        setAllSkills(data);
      }
    }
    fetchSkills();
  }, [supabase]);

  const filteredSkills = allSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(input.toLowerCase()) &&
      !value.some((v) => v.id === skill.id)
  );

  const removeSkill = (id: string) => {
    onChange(value.filter((skill) => skill.id !== id));
  };

  const addSkill = async (skillName: string) => {
    if (!skillName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Prüfen, ob der Skill bereits existiert
      const existingSkill = allSkills.find(
        (s) => s.name.toLowerCase() === skillName.toLowerCase()
      );

      if (existingSkill) {
        if (!value.some((v) => v.id === existingSkill.id)) {
          onChange([...value, existingSkill]);
        }
        setInput("");
        return;
      }

      // Neuen Skill erstellen
      const { data, error: insertError } = await supabase
        .from("skills")
        .insert({ name: skillName })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        const newSkill = { id: data.id, name: data.name };
        setAllSkills([...allSkills, newSkill]);
        onChange([...value, newSkill]);
        setInput("");
        toast.success("Neuer Skill hinzugefügt");
      }
    } catch (err) {
      console.error("Fehler beim Hinzufügen des Skills:", err);
      setError("Fehler beim Hinzufügen des Skills. Bitte versuchen Sie es erneut.");
      toast.error("Fehler beim Hinzufügen des Skills");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {value.map((skill) => (
          <span
            key={skill.id}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {skill.name}
            <button
              type="button"
              onClick={() => removeSkill(skill.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-background/20 focus:outline-none focus:ring-2 focus:ring-secondary-foreground/50"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Skill entfernen</span>
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Skill hinzufügen..."
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              await addSkill(input);
            }
          }}
          className="font-medium"
        />
        <Button
          type="button"
          onClick={() => addSkill(input)}
          disabled={!input.trim() || loading}
          variant="outline"
          className="font-medium"
        >
          <Plus className="mr-2 h-4 w-4" />
          Hinzufügen
        </Button>
      </div>

      {input && filteredSkills.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background py-1 shadow-lg">
          {filteredSkills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              onClick={() => addSkill(skill.name)}
            >
              {skill.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 