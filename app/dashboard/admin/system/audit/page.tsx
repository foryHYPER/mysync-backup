"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import Link from "next/link";
import { 
  IconShieldCheck,
  IconArrowLeft,
  IconRefresh,
  IconFilter,
  IconCalendar,
  IconUser,
  IconActivity,
  IconAlertTriangle,
  IconDownload,
  IconEye,
  IconClock,
  IconDatabase,
  IconSettings,
  IconLock,
  IconShield
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuditLog = {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  resource_type: "user" | "company" | "candidate" | "job" | "match" | "system" | "settings";
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  details: any;
  severity: "info" | "warning" | "error" | "critical";
  success: boolean;
  session_id?: string;
};

type AuditMetrics = {
  totalLogs: number;
  todayLogs: number;
  errorLogs: number;
  warningLogs: number;
  uniqueUsers: number;
  failedLogins: number;
};

export default function SystemAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<string>("7days");
  const supabase = createClient();

  useEffect(() => {
    loadAuditLogs();
  }, [dateRange]);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, actionFilter, severityFilter, resourceFilter, searchTerm]);

  async function loadAuditLogs() {
    try {
      setLoading(true);

      // Mock audit log data - in real app, this would come from an audit_logs table
      const mockActions = [
        "user_login", "user_logout", "user_created", "user_updated", "user_deleted",
        "company_created", "company_approved", "company_rejected", "company_updated",
        "candidate_created", "candidate_updated", "candidate_verified", "candidate_flagged",
        "job_created", "job_published", "job_closed", "job_updated",
        "match_created", "match_accepted", "match_rejected",
        "settings_updated", "backup_created", "system_maintenance", "api_access",
        "password_reset", "email_sent", "report_generated", "data_export"
      ];

      const mockLogs: AuditLog[] = Array.from({ length: 500 }, (_, i) => {
        const timestamp = new Date(Date.now() - Math.random() * (parseInt(dateRange.replace('days', '')) * 24 * 60 * 60 * 1000)).toISOString();
        const action = mockActions[Math.floor(Math.random() * mockActions.length)];
        const resourceTypes = ["user", "company", "candidate", "job", "match", "system", "settings"];
        const severities = ["info", "warning", "error", "critical"];
        const userEmails = ["admin@mysync.de", "test@company.com", "user@candidate.de", "system@mysync.de"];
        const roles = ["admin", "company", "candidate", "system"];

        return {
          id: `audit-${i}`,
          timestamp,
          user_id: Math.random() > 0.1 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
          user_email: Math.random() > 0.1 ? userEmails[Math.floor(Math.random() * userEmails.length)] : "System",
          user_role: roles[Math.floor(Math.random() * roles.length)],
          action,
          resource_type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)] as AuditLog["resource_type"],
          resource_id: Math.random() > 0.3 ? `resource-${Math.floor(Math.random() * 1000)}` : undefined,
          ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          details: {
            old_value: action.includes('updated') ? "Previous value" : undefined,
            new_value: action.includes('updated') ? "New value" : undefined,
            reason: action.includes('failed') ? "Invalid credentials" : undefined,
            additional_info: `Action performed: ${action}`
          },
          severity: severities[Math.floor(Math.random() * severities.length)] as AuditLog["severity"],
          success: Math.random() > 0.1,
          session_id: `session-${Math.floor(Math.random() * 10000)}`
        };
      });

      // Sort by timestamp (newest first)
      mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculate metrics
      const totalLogs = mockLogs.length;
      const todayLogs = mockLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length;
      const errorLogs = mockLogs.filter(log => log.severity === "error" || log.severity === "critical").length;
      const warningLogs = mockLogs.filter(log => log.severity === "warning").length;
      const uniqueUsers = new Set(mockLogs.map(log => log.user_email).filter(Boolean)).size;
      const failedLogins = mockLogs.filter(log => log.action === "user_login" && !log.success).length;

      setMetrics({
        totalLogs,
        todayLogs,
        errorLogs,
        warningLogs,
        uniqueUsers,
        failedLogins
      });

      setAuditLogs(mockLogs);

    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast.error("Fehler beim Laden der Audit-Logs");
    } finally {
      setLoading(false);
    }
  }

  function filterLogs() {
    let filtered = auditLogs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address.includes(searchTerm) ||
        log.resource_id?.includes(searchTerm)
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action.includes(actionFilter));
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    if (resourceFilter !== "all") {
      filtered = filtered.filter(log => log.resource_type === resourceFilter);
    }

    setFilteredLogs(filtered);
  }

  function getSeverityBadge(severity: AuditLog["severity"]) {
    switch (severity) {
      case "info":
        return <Badge variant="default" className="bg-blue-600">Info</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Warnung</Badge>;
      case "error":
        return <Badge variant="destructive">Fehler</Badge>;
      case "critical":
        return <Badge variant="destructive" className="bg-red-800">Kritisch</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  }

  function getResourceIcon(resourceType: AuditLog["resource_type"]) {
    switch (resourceType) {
      case "user":
        return <IconUser className="h-4 w-4" />;
      case "company":
        return <IconSettings className="h-4 w-4" />;
      case "candidate":
        return <IconUser className="h-4 w-4" />;
      case "job":
        return <IconActivity className="h-4 w-4" />;
      case "match":
        return <IconShield className="h-4 w-4" />;
      case "system":
        return <IconDatabase className="h-4 w-4" />;
      case "settings":
        return <IconSettings className="h-4 w-4" />;
      default:
        return <IconActivity className="h-4 w-4" />;
    }
  }

  function formatAction(action: string) {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  async function exportAuditLogs() {
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Audit-Logs erfolgreich exportiert");
    } catch (error) {
      toast.error("Fehler beim Exportieren der Logs");
    }
  }

  const auditColumns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Zeitstempel",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.timestamp).toLocaleString("de-DE")}
        </div>
      ),
    },
    {
      accessorKey: "user_email",
      header: "Benutzer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.user_email || "System"}</span>
          <span className="text-xs text-muted-foreground">{row.original.user_role}</span>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Aktion",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getResourceIcon(row.original.resource_type)}
          <span className="text-sm">{formatAction(row.original.action)}</span>
        </div>
      ),
    },
    {
      accessorKey: "resource_type",
      header: "Ressource",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.resource_type}
        </Badge>
      ),
    },
    {
      accessorKey: "severity",
      header: "Schweregrad",
      cell: ({ row }) => getSeverityBadge(row.original.severity),
    },
    {
      accessorKey: "success",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.success ? (
            <Badge variant="default" className="bg-green-600">Erfolg</Badge>
          ) : (
            <Badge variant="destructive">Fehlgeschlagen</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP-Adresse",
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.original.ip_address}</span>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedLog(row.original)}
            >
              <IconEye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </Dialog>
      ),
    },
  ];

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">System-Audit</h1>
            <p className="text-muted-foreground">Lade Audit-Logs...</p>
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin">
              <Button variant="outline" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Dashboard
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">System-Audit</h1>
              <p className="text-muted-foreground">
                Verfolge Benutzeraktivitäten und Systemereignisse
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportAuditLogs}>
              <IconDownload className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
            <Button variant="outline" onClick={loadAuditLogs}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Logs</p>
                  <p className="text-2xl font-bold">{metrics.totalLogs}</p>
                </div>
                <IconActivity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Heute</p>
                  <p className="text-2xl font-bold">{metrics.todayLogs}</p>
                </div>
                <IconClock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fehler</p>
                  <p className="text-2xl font-bold">{metrics.errorLogs}</p>
                </div>
                <IconAlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Warnungen</p>
                  <p className="text-2xl font-bold">{metrics.warningLogs}</p>
                </div>
                <IconShield className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Benutzer</p>
                  <p className="text-2xl font-bold">{metrics.uniqueUsers}</p>
                </div>
                <IconUser className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fehlgeschl. Logins</p>
                  <p className="text-2xl font-bold">{metrics.failedLogins}</p>
                </div>
                <IconLock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <IconFilter className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Logs suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Zeitraum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1days">Letzter Tag</SelectItem>
                    <SelectItem value="7days">Letzte 7 Tage</SelectItem>
                    <SelectItem value="30days">Letzte 30 Tage</SelectItem>
                    <SelectItem value="90days">Letzte 90 Tage</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Schweregrad filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Schweregrade</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warnung</SelectItem>
                    <SelectItem value="error">Fehler</SelectItem>
                    <SelectItem value="critical">Kritisch</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ressource filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Ressourcen</SelectItem>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="company">Unternehmen</SelectItem>
                    <SelectItem value="candidate">Kandidaten</SelectItem>
                    <SelectItem value="job">Jobs</SelectItem>
                    <SelectItem value="match">Matches</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="settings">Einstellungen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit-Protokoll</CardTitle>
            <CardDescription>
              Detaillierte Aufzeichnung aller Systemaktivitäten ({filteredLogs.length} Logs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={auditColumns} 
              data={filteredLogs}
            />
          </CardContent>
        </Card>

        {/* Log Details Modal */}
        {selectedLog && (
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconShieldCheck className="h-5 w-5" />
                  Audit-Log Details
                  {getSeverityBadge(selectedLog.severity)}
                </DialogTitle>
                <DialogDescription>
                  Detaillierte Informationen zum Audit-Eintrag
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Grundlegende Informationen</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(selectedLog.timestamp).toLocaleString("de-DE")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconUser className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedLog.user_email || "System"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconActivity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatAction(selectedLog.action)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getResourceIcon(selectedLog.resource_type)}
                      <span className="text-sm">
                        {selectedLog.resource_type}
                        {selectedLog.resource_id && ` (${selectedLog.resource_id})`}
                      </span>
                    </div>
                  </div>

                  {/* Session Information */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Session-Informationen</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">IP-Adresse:</span>
                        <span className="font-mono">{selectedLog.ip_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Session-ID:</span>
                        <span className="font-mono text-xs">{selectedLog.session_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">User-Agent:</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {selectedLog.user_agent}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status & Details</h3>
                  
                  {/* Status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Ausführungsstatus</span>
                      {selectedLog.success ? (
                        <Badge variant="default" className="bg-green-600">Erfolgreich</Badge>
                      ) : (
                        <Badge variant="destructive">Fehlgeschlagen</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Schweregrad</span>
                      {getSeverityBadge(selectedLog.severity)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Zusätzliche Details</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* User Information */}
                  {selectedLog.user_id && (
                    <div>
                      <h4 className="font-medium mb-2">Benutzer-Details</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">ID:</span> {selectedLog.user_id}
                        </div>
                        <div>
                          <span className="font-medium">E-Mail:</span> {selectedLog.user_email}
                        </div>
                        <div>
                          <span className="font-medium">Rolle:</span> {selectedLog.user_role}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 