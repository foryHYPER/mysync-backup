"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/context/ProfileContext";
import { 
  IconChartDots, 
  IconDownload, 
  IconEye,
  IconUsers,
  IconStar,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown
} from "@tabler/icons-react";

type ReportStats = {
  totalPoolsAccess: number;
  totalCandidatesViewed: number;
  totalSelections: number;
  thisMonthSelections: number;
  averageResponseTime: number;
  topSkills: { skill: string; count: number }[];
};

export default function CompanyReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const profile = useProfile();
  const supabase = createClient();

  useEffect(() => {
    if (profile?.id) {
      loadReportData();
    }
  }, [profile?.id]);

  async function loadReportData() {
    try {
      setLoading(true);

      console.log('🔍 Profile data:', profile);
      console.log('🆔 Profile ID:', profile?.id);
      console.log('👤 Profile role:', profile?.role);

      if (!profile?.id) {
        console.error('❌ No profile.id available');
        throw new Error("Keine Benutzer-ID verfügbar");
      }

      // For companies, the profile.id IS the company_id
      const companyId = profile.id;
      console.log('🏢 Using company ID:', companyId);

      // Get pool access count
      const { count: poolsAccess } = await supabase
        .from("pool_company_access")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      console.log('🏊 Pool access count:', poolsAccess);

      // Get total selections
      const { count: totalSelections } = await supabase
        .from("candidate_selections")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      console.log('⭐ Total selections:', totalSelections);

      // Get this month's selections
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const { count: thisMonthSelections } = await supabase
        .from("candidate_selections")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", oneMonthAgo.toISOString());

      console.log('📅 This month selections:', thisMonthSelections);

      // Get top skills from selected candidates
      const { data: selectionsData } = await supabase
        .from("candidate_selections")
        .select(`
          candidate:candidates(skills)
        `)
        .eq("company_id", companyId);

      console.log('🎯 Selections data:', selectionsData);

      const skillCounts: { [key: string]: number } = {};
      if (selectionsData) {
        selectionsData.forEach((selection: any) => {
          const skills = selection.candidate?.skills;
          if (Array.isArray(skills)) {
            skills.forEach((skill: string) => {
              skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
          }
        });
      }

      const topSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      console.log('🔧 Top skills:', topSkills);

      const newStats = {
        totalPoolsAccess: poolsAccess || 0,
        totalCandidatesViewed: 0, // This would need access logs implementation
        totalSelections: totalSelections || 0,
        thisMonthSelections: thisMonthSelections || 0,
        averageResponseTime: 2.3, // Mock data
        topSkills
      };

      console.log('📊 Setting stats:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error("❌ Error loading report data:", error);
      toast.error("Fehler beim Laden der Report-Daten");
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    toast.info("Export-Funktion wird in einer zukünftigen Version verfügbar sein");
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Berichte werden geladen...</h1>
            <p className="text-muted-foreground">Lade Analytics-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Fehler</h1>
            <p className="text-muted-foreground">Berichte konnten nicht geladen werden</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Berichte & Analytics</h1>
            <p className="text-muted-foreground">
              Übersicht über Ihre Recruiting-Aktivitäten und Performance
            </p>
          </div>
          <Button onClick={exportReport} variant="outline">
            <IconDownload className="h-4 w-4 mr-2" />
            Bericht exportieren
          </Button>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pool-Zugriffe</p>
                  <p className="text-2xl font-bold">{stats.totalPoolsAccess}</p>
                </div>
                <IconChartDots className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Verfügbare Kandidaten-Pools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auswahlen gesamt</p>
                  <p className="text-2xl font-bold">{stats.totalSelections}</p>
                </div>
                <IconStar className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Insgesamt ausgewählte Kandidaten
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Diesen Monat</p>
                  <p className="text-2xl font-bold">{stats.thisMonthSelections}</p>
                </div>
                <IconCalendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center mt-2">
                {stats.thisMonthSelections > 0 ? (
                  <IconTrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <IconTrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <p className="text-xs text-muted-foreground">
                  Auswahlen in diesem Monat
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Reaktionszeit</p>
                  <p className="text-2xl font-bold">{stats.averageResponseTime}d</p>
                </div>
                <IconUsers className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Durchschnittliche Bearbeitungszeit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Reports */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Top Skills bei Auswahlen</CardTitle>
              <CardDescription>
                Die häufigsten Skills Ihrer ausgewählten Kandidaten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topSkills.length > 0 ? (
                <div className="space-y-3">
                  {stats.topSkills.map((skill, index) => (
                    <div key={skill.skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{skill.skill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${Math.min(100, (skill.count / Math.max(...stats.topSkills.map(s => s.count))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-6">{skill.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconChartDots className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Skill-Daten verfügbar</p>
                  <p className="text-sm">Wählen Sie Kandidaten aus, um Skill-Analytics zu sehen</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitäts-Zusammenfassung</CardTitle>
              <CardDescription>
                Ihre Recruiting-Aktivitäten im Überblick
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconEye className="h-5 w-5 text-blue-600" />
                    <span>Pool-Zugriffe</span>
                  </div>
                  <span className="font-medium">{stats.totalPoolsAccess}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconStar className="h-5 w-5 text-yellow-600" />
                    <span>Kandidaten-Auswahlen</span>
                  </div>
                  <span className="font-medium">{stats.totalSelections}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconCalendar className="h-5 w-5 text-green-600" />
                    <span>Auswahlen diesen Monat</span>
                  </div>
                  <span className="font-medium">{stats.thisMonthSelections}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconTrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Durchschn. Reaktionszeit</span>
                  </div>
                  <span className="font-medium">{stats.averageResponseTime} Tage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 