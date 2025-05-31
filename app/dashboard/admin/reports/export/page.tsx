"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { 
  IconFileAnalytics,
  IconDownload,
  IconArrowLeft,
  IconCalendar,
  IconFile,
  IconFileText,
  IconFileSpreadsheet,
  IconFileCode,
  IconDatabase,
  IconUsers,
  IconBuilding,
  IconBriefcase,
  IconTarget,
  IconActivity,
  IconSettings,
  IconClock,
  IconCheck,
  IconX
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExportOption = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  estimatedSize: string;
  estimatedTime: string;
  availableFormats: string[];
  requiresDateRange: boolean;
  category: "users" | "matching" | "activity" | "system";
};

type ExportHistory = {
  id: string;
  reportName: string;
  format: string;
  createdAt: string;
  fileSize: string;
  status: "completed" | "processing" | "failed";
  downloadUrl?: string;
};

export default function ExportReportPage() {
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [dateRange, setDateRange] = useState("30d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const exportOptions: ExportOption[] = [
    {
      id: "all_users",
      name: "Alle Benutzer",
      description: "Vollständige Benutzerdatenbank mit Profilen und Metadaten",
      icon: <IconUsers className="h-5 w-5" />,
      estimatedSize: "~2.5 MB",
      estimatedTime: "30s",
      availableFormats: ["csv", "xlsx", "json"],
      requiresDateRange: false,
      category: "users"
    },
    {
      id: "candidates",
      name: "Kandidatenprofile",
      description: "Detaillierte Kandidateninformationen, Skills und Lebensläufe",
      icon: <IconUsers className="h-5 w-5" />,
      estimatedSize: "~1.8 MB",
      estimatedTime: "25s",
      availableFormats: ["csv", "xlsx", "json", "pdf"],
      requiresDateRange: false,
      category: "users"
    },
    {
      id: "companies",
      name: "Unternehmensprofile",
      description: "Unternehmensdaten, Branchen und Kontaktinformationen",
      icon: <IconBuilding className="h-5 w-5" />,
      estimatedSize: "~900 KB",
      estimatedTime: "15s",
      availableFormats: ["csv", "xlsx", "json"],
      requiresDateRange: false,
      category: "users"
    },
    {
      id: "job_postings",
      name: "Stellenausschreibungen",
      description: "Aktive und archivierte Job-Postings mit Details",
      icon: <IconBriefcase className="h-5 w-5" />,
      estimatedSize: "~1.2 MB",
      estimatedTime: "20s",
      availableFormats: ["csv", "xlsx", "json"],
      requiresDateRange: true,
      category: "matching"
    },
    {
      id: "matches",
      name: "Matching-Daten",
      description: "Alle Kandidaten-Job-Matches mit Scores und Status",
      icon: <IconTarget className="h-5 w-5" />,
      estimatedSize: "~3.1 MB",
      estimatedTime: "45s",
      availableFormats: ["csv", "xlsx", "json"],
      requiresDateRange: true,
      category: "matching"
    },
    {
      id: "applications",
      name: "Bewerbungen",
      description: "Bewerbungsverläufe und Hiring-Pipeline",
      icon: <IconFileText className="h-5 w-5" />,
      estimatedSize: "~2.8 MB",
      estimatedTime: "40s",
      availableFormats: ["csv", "xlsx", "json", "pdf"],
      requiresDateRange: true,
      category: "matching"
    },
    {
      id: "user_activity",
      name: "Benutzeraktivitäten",
      description: "Login-Statistiken und Engagement-Metriken",
      icon: <IconActivity className="h-5 w-5" />,
      estimatedSize: "~5.2 MB",
      estimatedTime: "60s",
      availableFormats: ["csv", "xlsx", "json"],
      requiresDateRange: true,
      category: "activity"
    },
    {
      id: "audit_logs",
      name: "Admin-Aktivitäten",
      description: "Audit-Logs und Administrator-Aktionen",
      icon: <IconSettings className="h-5 w-5" />,
      estimatedSize: "~1.5 MB",
      estimatedTime: "20s",
      availableFormats: ["csv", "json"],
      requiresDateRange: true,
      category: "system"
    },
    {
      id: "platform_analytics",
      name: "Plattform-Analytik",
      description: "Zusammengefasste Metriken und KPI-Berichte",
      icon: <IconFileAnalytics className="h-5 w-5" />,
      estimatedSize: "~500 KB",
      estimatedTime: "10s",
      availableFormats: ["xlsx", "pdf"],
      requiresDateRange: true,
      category: "system"
    }
  ];

  useEffect(() => {
    loadExportHistory();
  }, []);

  async function loadExportHistory() {
    try {
      setLoading(true);
      
      // Mock export history - in real app, this would come from database
      const mockHistory: ExportHistory[] = [
        {
          id: "1",
          reportName: "Kandidatenprofile",
          format: "xlsx",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          fileSize: "1.8 MB",
          status: "completed",
          downloadUrl: "/exports/candidates_2024.xlsx"
        },
        {
          id: "2",
          reportName: "Matching-Daten",
          format: "csv",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          fileSize: "3.1 MB",
          status: "completed",
          downloadUrl: "/exports/matches_2024.csv"
        },
        {
          id: "3",
          reportName: "Plattform-Analytik",
          format: "pdf",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          fileSize: "450 KB",
          status: "processing"
        },
        {
          id: "4",
          reportName: "Alle Benutzer",
          format: "json",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          fileSize: "2.5 MB",
          status: "failed"
        }
      ];

      setExportHistory(mockHistory);
    } catch (error) {
      console.error("Error loading export history:", error);
      toast.error("Fehler beim Laden der Export-Historie");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (selectedExports.length === 0) {
      toast.error("Bitte wählen Sie mindestens einen Datensatz zum Exportieren aus");
      return;
    }

    try {
      setIsExporting(true);

      // Mock export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create new export entry
      const newExport: ExportHistory = {
        id: Date.now().toString(),
        reportName: selectedExports.length === 1 
          ? exportOptions.find(opt => opt.id === selectedExports[0])?.name || "Export"
          : `Kombinierter Export (${selectedExports.length} Datensätze)`,
        format: selectedFormat,
        createdAt: new Date().toISOString(),
        fileSize: "~" + (selectedExports.length * 1.5).toFixed(1) + " MB",
        status: "processing"
      };

      setExportHistory(prev => [newExport, ...prev]);

      // Simulate processing completion
      setTimeout(() => {
        setExportHistory(prev => prev.map(item => 
          item.id === newExport.id 
            ? { ...item, status: "completed" as const, downloadUrl: `/exports/${newExport.id}.${selectedFormat}` }
            : item
        ));
        toast.success("Export erfolgreich abgeschlossen!");
      }, 5000);

      toast.success("Export gestartet! Sie werden benachrichtigt, wenn er abgeschlossen ist.");
      setSelectedExports([]);

    } catch (error) {
      console.error("Error starting export:", error);
      toast.error("Fehler beim Starten des Exports");
    } finally {
      setIsExporting(false);
    }
  }

  function handleExportSelection(exportId: string) {
    setSelectedExports(prev => 
      prev.includes(exportId) 
        ? prev.filter(id => id !== exportId)
        : [...prev, exportId]
    );
  }

  function getFormatIcon(format: string) {
    switch (format) {
      case "csv": return <IconFileText className="h-4 w-4" />;
      case "xlsx": return <IconFileSpreadsheet className="h-4 w-4" />;
      case "json": return <IconFileCode className="h-4 w-4" />;
      case "pdf": return <IconFile className="h-4 w-4" />;
      default: return <IconFileAnalytics className="h-4 w-4" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600">Abgeschlossen</Badge>;
      case "processing":
        return <Badge variant="secondary">Verarbeitung</Badge>;
      case "failed":
        return <Badge variant="destructive">Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  const categorizedOptions = {
    users: exportOptions.filter(opt => opt.category === "users"),
    matching: exportOptions.filter(opt => opt.category === "matching"),
    activity: exportOptions.filter(opt => opt.category === "activity"),
    system: exportOptions.filter(opt => opt.category === "system")
  };

  const selectedOptions = exportOptions.filter(opt => selectedExports.includes(opt.id));
  const availableFormats = selectedOptions.length > 0 
    ? selectedOptions.reduce((formats, opt) => 
        formats.filter(f => opt.availableFormats.includes(f)), 
        ["csv", "xlsx", "json", "pdf"]
      )
    : ["csv", "xlsx", "json", "pdf"];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/admin/reports">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Berichten
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Daten-Export</h1>
            <p className="text-muted-foreground">
              Exportiere detaillierte Berichte und Rohdaten für weitere Analyse
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Export Configuration */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconDatabase className="h-5 w-5" />
                  Datensätze auswählen
                </CardTitle>
                <CardDescription>
                  Wählen Sie die Datensätze aus, die Sie exportieren möchten
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Users Category */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <IconUsers className="h-4 w-4" />
                    Benutzerdaten
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {categorizedOptions.users.map((option) => (
                      <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={option.id}
                          checked={selectedExports.includes(option.id)}
                          onCheckedChange={() => handleExportSelection(option.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {option.icon}
                            <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                              {option.name}
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{option.estimatedSize}</span>
                            <span>•</span>
                            <span>{option.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matching Category */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <IconTarget className="h-4 w-4" />
                    Matching & Bewerbungen
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {categorizedOptions.matching.map((option) => (
                      <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={option.id}
                          checked={selectedExports.includes(option.id)}
                          onCheckedChange={() => handleExportSelection(option.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {option.icon}
                            <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                              {option.name}
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{option.estimatedSize}</span>
                            <span>•</span>
                            <span>{option.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Category */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <IconActivity className="h-4 w-4" />
                    Aktivitäten & Analytik
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[...categorizedOptions.activity, ...categorizedOptions.system].map((option) => (
                      <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={option.id}
                          checked={selectedExports.includes(option.id)}
                          onCheckedChange={() => handleExportSelection(option.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {option.icon}
                            <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                              {option.name}
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{option.estimatedSize}</span>
                            <span>•</span>
                            <span>{option.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            {selectedExports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSettings className="h-5 w-5" />
                    Export-Einstellungen
                  </CardTitle>
                  <CardDescription>
                    Konfigurieren Sie Format und Zeitraum für den Export
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Dateiformat</label>
                      <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                        <SelectTrigger>
                          <SelectValue placeholder="Format wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFormats.map(format => (
                            <SelectItem key={format} value={format}>
                              <div className="flex items-center gap-2">
                                {getFormatIcon(format)}
                                {format.toUpperCase()}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedOptions.some(opt => opt.requiresDateRange) && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Zeitraum</label>
                        <Select value={dateRange} onValueChange={setDateRange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Zeitraum wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                            <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                            <SelectItem value="90d">Letzte 90 Tage</SelectItem>
                            <SelectItem value="1y">Letztes Jahr</SelectItem>
                            <SelectItem value="all">Alle Daten</SelectItem>
                            <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {dateRange === "custom" && (
                    <div className="grid gap-4 md:grid-cols-2 mt-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Von</label>
                        <Input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Bis</label>
                        <Input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Gewählte Datensätze: {selectedExports.length}</p>
                        <p className="text-xs text-muted-foreground">
                          Geschätzte Dateigröße: ~{(selectedExports.length * 1.5).toFixed(1)} MB
                        </p>
                      </div>
                      <Button 
                        onClick={handleExport} 
                        disabled={isExporting}
                        className="flex items-center gap-2"
                      >
                        {isExporting ? (
                          <>
                            <IconClock className="h-4 w-4 animate-spin" />
                            Exportiere...
                          </>
                        ) : (
                          <>
                            <IconDownload className="h-4 w-4" />
                            Export starten
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Export History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconClock className="h-5 w-5" />
                  Export-Historie
                </CardTitle>
                <CardDescription>
                  Ihre letzten Exporte und Downloads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exportHistory.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getFormatIcon(item.format)}
                          <span className="text-sm font-medium">{item.reportName}</span>
                        </div>
                        <div className="space-y-1">
                          {getStatusBadge(item.status)}
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString("de-DE")} • {item.fileSize}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {item.status === "completed" && item.downloadUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={item.downloadUrl} download>
                              <IconDownload className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {item.status === "processing" && (
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                        {item.status === "failed" && (
                          <Button variant="outline" size="sm" onClick={() => toast.info("Erneuter Export möglich")}>
                            <IconX className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {exportHistory.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <IconFileAnalytics className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Noch keine Exporte vorhanden</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Export Templates */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Schnell-Exporte</CardTitle>
                <CardDescription>Häufig verwendete Export-Kombinationen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setSelectedExports(["all_users", "user_activity"])}
                  >
                    <IconUsers className="h-4 w-4 mr-2" />
                    Benutzer-Vollbericht
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setSelectedExports(["matches", "applications", "job_postings"])}
                  >
                    <IconTarget className="h-4 w-4 mr-2" />
                    Matching-Vollbericht
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setSelectedExports(["platform_analytics", "audit_logs"])}
                  >
                    <IconFileAnalytics className="h-4 w-4 mr-2" />
                    System-Analytik
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 