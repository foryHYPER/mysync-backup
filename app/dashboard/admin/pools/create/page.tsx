"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useProfile } from "@/context/ProfileContext";
import { useRouter } from "next/navigation";
import { 
  IconArrowLeft, 
  IconDeviceFloppy,
  IconTags,
  IconX
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreatePoolPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pool_type: "custom" as "custom" | "featured" | "premium",
    max_candidates: "",
    visibility: "private" as "public" | "private" | "restricted",
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const profile = useProfile();
  const router = useRouter();
  const supabase = createClient();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Pool-Name ist erforderlich");
      return false;
    }
    if (formData.max_candidates && parseInt(formData.max_candidates) <= 0) {
      toast.error("Maximale Kandidatenanzahl muss größer als 0 sein");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !profile?.id) return;

    try {
      setSaving(true);

      const poolData = {
        name: formData.name,
        description: formData.description || null,
        pool_type: formData.pool_type,
        max_candidates: formData.max_candidates ? parseInt(formData.max_candidates) : null,
        visibility: formData.visibility,
        tags: formData.tags,
        created_by: profile.id,
        status: "active"
      };

      const { data, error } = await supabase
        .from("candidate_pools")
        .insert([poolData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Pool erfolgreich erstellt!");
      router.push(`/dashboard/admin/pools/${data.id}`);

    } catch (error) {
      console.error("Error creating pool:", error);
      toast.error("Fehler beim Erstellen des Pools");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/admin/pools">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Pools
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Neuen Pool erstellen</h1>
            <p className="text-muted-foreground">
              Erstelle einen neuen Kandidatenpool für die Zuweisung an Unternehmen
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pool-Informationen</CardTitle>
                <CardDescription>
                  Grundlegende Informationen für den neuen Kandidatenpool
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pool Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Pool-Name *</Label>
                    <Input
                      id="name"
                      placeholder="z.B. Senior Entwickler Pool"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  {/* Pool Type */}
                  <div className="space-y-2">
                    <Label htmlFor="pool_type">Pool-Typ</Label>
                    <Select
                      value={formData.pool_type}
                      onValueChange={(value) => handleInputChange("pool_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pool-Typ auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Pool</SelectItem>
                        <SelectItem value="featured">Featured Pool</SelectItem>
                        <SelectItem value="premium">Premium Pool</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Featured und Premium Pools erhalten besondere Sichtbarkeit
                    </p>
                  </div>

                  {/* Description - spans full width */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Beschreibe den Zweck und die Zielgruppe dieses Pools..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Max Candidates */}
                  <div className="space-y-2">
                    <Label htmlFor="max_candidates">Maximale Kandidatenanzahl</Label>
                    <Input
                      id="max_candidates"
                      type="number"
                      placeholder="z.B. 50 (optional)"
                      value={formData.max_candidates}
                      onChange={(e) => handleInputChange("max_candidates", e.target.value)}
                      min="1"
                    />
                    <p className="text-sm text-muted-foreground">
                      Leer lassen für unbegrenzte Kandidatenanzahl
                    </p>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="space-y-2">
                    <Label>Sichtbarkeit</Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">Öffentlicher Pool</div>
                        <div className="text-sm text-muted-foreground">
                          Öffentliche Pools sind für alle zugewiesenen Unternehmen sichtbar
                        </div>
                      </div>
                      <Switch
                        checked={formData.visibility === "public"}
                        onCheckedChange={(checked) => handleInputChange("visibility", checked ? "public" : "private")}
                      />
                    </div>
                  </div>

                  {/* Tags - spans full width */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Tag hinzufügen..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        <IconTags className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <IconX className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Tags helfen bei der Organisation und Suche von Pools
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <Button type="submit" disabled={saving}>
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              {saving ? "Erstelle..." : "Pool erstellen"}
            </Button>
            <Link href="/dashboard/admin/pools">
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 