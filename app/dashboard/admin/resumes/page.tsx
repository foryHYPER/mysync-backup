"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/ProfileContext";
import { useRouter } from "next/navigation";

export default function AdminResumesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const profile = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (profile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.from("candidates").select("*");
      if (!error) setCandidates(data || []);
      setLoading(false);
    };
    fetchCandidates();
  }, []);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumes Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div>Lade Kandidaten...</div>
                ) : (
                  <table className="min-w-full border mt-4">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">Vorname</th>
                        <th className="border px-2 py-1">Nachname</th>
                        <th className="border px-2 py-1">E-Mail</th>
                        <th className="border px-2 py-1">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((c) => (
                        <tr key={c.id}>
                          <td className="border px-2 py-1">{c.first_name}</td>
                          <td className="border px-2 py-1">{c.last_name}</td>
                          <td className="border px-2 py-1">{c.email}</td>
                          <td className="border px-2 py-1">
                            <Link href={`/dashboard/admin/resumes/${c.id}`}>
                              <Button variant="ghost" className="text-blue-600 mr-2">Anzeigen / Bearbeiten</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 