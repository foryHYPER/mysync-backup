"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
      setLoading(true);
      const { data, error } = await supabase.from("skills").select("id, name").order("name");
      if (data) setAllSkills(data);
      setLoading(false);
    }
    fetchSkills();
    // eslint-disable-next-line
  }, []);

  const addSkill = async (name: string) => {
    setError(null);
    name = name.trim();
    if (!name) return;
    // Prüfen, ob Skill schon existiert
    let skill = allSkills.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (!skill) {
      // Skill in DB anlegen
      const { data, error } = await supabase.from("skills").insert({ name }).select("id, name").single();
      if (error) {
        setError("Skill konnte nicht angelegt werden: " + error.message);
        return;
      }
      if (data) {
        skill = data;
        setAllSkills((prev) => [...prev, skill!]);
      } else {
        setError("Skill konnte nicht angelegt werden (keine Rückgabe von Supabase).");
        return;
      }
    }
    if (skill && !value.find((s) => s.id === skill!.id)) {
      onChange([...value, skill]);
    }
    setInput("");
  };

  const removeSkill = (id: string) => {
    onChange(value.filter((s) => s.id !== id));
  };

  const filteredSkills = allSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(input.toLowerCase()) &&
      !value.find((v) => v.id === s.id)
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((skill) => (
          <span key={skill.id} className="inline-flex items-center bg-primary/10 text-primary px-2 py-1 rounded text-sm">
            {skill.name}
            <button type="button" className="ml-1 text-red-500" onClick={() => removeSkill(skill.id)}>&times;</button>
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
          className="flex-1"
        />
        <Button type="button" onClick={() => addSkill(input)} disabled={!input.trim() || loading}>
          Hinzufügen
        </Button>
      </div>
      {input && filteredSkills.length > 0 && (
        <div className="border rounded mt-2 bg-white shadow z-10 max-h-40 overflow-auto">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="px-3 py-1 cursor-pointer hover:bg-primary/10"
              onClick={() => addSkill(skill.name)}
            >
              {skill.name}
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
} 