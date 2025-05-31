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
  IconShieldLock,
  IconArrowLeft,
  IconRefresh,
  IconFilter,
  IconAlertTriangle,
  IconBan,
  IconShield,
  IconEye,
  IconTrash,
  IconPlus,
  IconClock,
  IconGlobe,
  IconLock,
  IconKey,
  IconFingerprint,
  IconActivity
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SecurityThreat = {
  id: string;
  ip_address: string;
  country?: string;
  threat_type: "brute_force" | "ddos" | "sql_injection" | "xss" | "suspicious_activity" | "malware";
  severity: "low" | "medium" | "high" | "critical";
  detected_at: string;
  last_activity: string;
  attempt_count: number;
  blocked: boolean;
  user_agent?: string;
  description: string;
  auto_blocked: boolean;
};

type BlockedIP = {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  blocked_by: string;
  expires_at?: string;
  permanent: boolean;
  attempts_before_block: number;
};

type SecurityMetrics = {
  totalThreats: number;
  blockedIPs: number;
  todayThreats: number;
  criticalThreats: number;
  successfulBlocks: number;
  activeMonitoring: boolean;
};

export default function SystemSecurityPage() {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [filteredThreats, setFilteredThreats] = useState<SecurityThreat[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState<SecurityThreat | null>(null);
  const [activeTab, setActiveTab] = useState<"threats" | "blocked">("threats");
  const [threatFilter, setThreatFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newBlockIP, setNewBlockIP] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadSecurityData();
  }, []);

  useEffect(() => {
    filterThreats();
  }, [threats, threatFilter, severityFilter, searchTerm]);

  async function loadSecurityData() {
    try {
      setLoading(true);

      // Mock security threat data
      const threatTypes = ["brute_force", "ddos", "sql_injection", "xss", "suspicious_activity", "malware"];
      const severities = ["low", "medium", "high", "critical"];
      const countries = ["Unknown", "Russia", "China", "North Korea", "Iran", "Germany", "USA"];

      const mockThreats: SecurityThreat[] = Array.from({ length: 200 }, (_, i) => {
        const detectedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
        const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)] as SecurityThreat["threat_type"];
        const severity = severities[Math.floor(Math.random() * severities.length)] as SecurityThreat["severity"];
        
        return {
          id: `threat-${i}`,
          ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          country: countries[Math.floor(Math.random() * countries.length)],
          threat_type: threatType,
          severity,
          detected_at: detectedAt,
          last_activity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          attempt_count: Math.floor(Math.random() * 100) + 1,
          blocked: Math.random() > 0.3,
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          description: `${threatType.replace('_', ' ').toUpperCase()} attack detected from ${countries[Math.floor(Math.random() * countries.length)]}`,
          auto_blocked: Math.random() > 0.4
        };
      });

      // Mock blocked IPs data
      const mockBlockedIPs: BlockedIP[] = Array.from({ length: 50 }, (_, i) => {
        const blockedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
        const permanent = Math.random() > 0.7;
        
        return {
          id: `blocked-${i}`,
          ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          reason: "Multiple failed login attempts",
          blocked_at: blockedAt,
          blocked_by: "System",
          expires_at: permanent ? undefined : new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          permanent,
          attempts_before_block: Math.floor(Math.random() * 20) + 5
        };
      });

      // Calculate metrics
      const totalThreats = mockThreats.length;
      const blockedIPsCount = mockBlockedIPs.length;
      const todayThreats = mockThreats.filter(threat => {
        const threatDate = new Date(threat.detected_at);
        const today = new Date();
        return threatDate.toDateString() === today.toDateString();
      }).length;
      const criticalThreats = mockThreats.filter(threat => threat.severity === "critical").length;
      const successfulBlocks = mockThreats.filter(threat => threat.blocked).length;

      setMetrics({
        totalThreats,
        blockedIPs: blockedIPsCount,
        todayThreats,
        criticalThreats,
        successfulBlocks,
        activeMonitoring: true
      });

      setThreats(mockThreats);
      setBlockedIPs(mockBlockedIPs);

    } catch (error) {
      console.error("Error loading security data:", error);
      toast.error("Fehler beim Laden der Sicherheitsdaten");
    } finally {
      setLoading(false);
    }
  }

  function filterThreats() {
    let filtered = threats;

    if (searchTerm) {
      filtered = filtered.filter(threat => 
        threat.ip_address.includes(searchTerm) ||
        threat.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (threatFilter !== "all") {
      filtered = filtered.filter(threat => threat.threat_type === threatFilter);
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter(threat => threat.severity === severityFilter);
    }

    setFilteredThreats(filtered);
  }

  async function blockIP(ipAddress: string, reason: string, permanent: boolean = false) {
    try {
      // Mock blocking functionality
      const newBlock: BlockedIP = {
        id: `blocked-${Date.now()}`,
        ip_address: ipAddress,
        reason,
        blocked_at: new Date().toISOString(),
        blocked_by: "Admin",
        expires_at: permanent ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        permanent,
        attempts_before_block: 0
      };

      setBlockedIPs(prev => [newBlock, ...prev]);
      toast.success(`IP ${ipAddress} erfolgreich blockiert`);

    } catch (error) {
      toast.error("Fehler beim Blockieren der IP");
    }
  }

  async function unblockIP(id: string) {
    try {
      setBlockedIPs(prev => prev.filter(ip => ip.id !== id));
      toast.success("IP erfolgreich entsperrt");
    } catch (error) {
      toast.error("Fehler beim Entsperren der IP");
    }
  }

  function getSeverityBadge(severity: SecurityThreat["severity"]) {
    switch (severity) {
      case "low":
        return <Badge variant="outline" className="border-green-500 text-green-600">Niedrig</Badge>;
      case "medium":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Mittel</Badge>;
      case "high":
        return <Badge variant="destructive">Hoch</Badge>;
      case "critical":
        return <Badge variant="destructive" className="bg-red-800">Kritisch</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  }

  function getThreatTypeBadge(type: SecurityThreat["threat_type"]) {
    const typeLabels = {
      brute_force: "Brute Force",
      ddos: "DDoS",
      sql_injection: "SQL Injection",
      xss: "XSS",
      suspicious_activity: "Verdächtige Aktivität",
      malware: "Malware"
    };

    return <Badge variant="secondary">{typeLabels[type]}</Badge>;
  }

  const threatColumns: ColumnDef<SecurityThreat>[] = [
    {
      accessorKey: "ip_address",
      header: "IP-Adresse",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm">{row.original.ip_address}</span>
          <span className="text-xs text-muted-foreground">{row.original.country}</span>
        </div>
      ),
    },
    {
      accessorKey: "threat_type",
      header: "Bedrohungstyp",
      cell: ({ row }) => getThreatTypeBadge(row.original.threat_type),
    },
    {
      accessorKey: "severity",
      header: "Schweregrad",
      cell: ({ row }) => getSeverityBadge(row.original.severity),
    },
    {
      accessorKey: "attempt_count",
      header: "Versuche",
      cell: ({ row }) => (
        <span className="text-sm font-bold">{row.original.attempt_count}</span>
      ),
    },
    {
      accessorKey: "blocked",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.blocked ? (
            <Badge variant="destructive">Blockiert</Badge>
          ) : (
            <Badge variant="outline">Aktiv</Badge>
          )}
          {row.original.auto_blocked && (
            <Badge variant="secondary" className="text-xs">Auto</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "detected_at",
      header: "Erkannt",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.detected_at).toLocaleDateString("de-DE")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedThreat(row.original)}
              >
                <IconEye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </Dialog>
          
          {!row.original.blocked && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => blockIP(row.original.ip_address, `Blocked due to ${row.original.threat_type}`)}
            >
              <IconBan className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const blockedColumns: ColumnDef<BlockedIP>[] = [
    {
      accessorKey: "ip_address",
      header: "IP-Adresse",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.ip_address}</span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Grund",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.reason}</span>
      ),
    },
    {
      accessorKey: "permanent",
      header: "Typ",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.permanent ? (
            <Badge variant="destructive">Permanent</Badge>
          ) : (
            <Badge variant="outline">Temporär</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "blocked_at",
      header: "Blockiert am",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.blocked_at).toLocaleDateString("de-DE")}
        </div>
      ),
    },
    {
      accessorKey: "expires_at",
      header: "Läuft ab",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.expires_at 
            ? new Date(row.original.expires_at).toLocaleDateString("de-DE")
            : "Nie"
          }
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => unblockIP(row.original.id)}
        >
          <IconTrash className="h-4 w-4" />
          Entsperren
        </Button>
      ),
    },
  ];

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">System-Sicherheit</h1>
            <p className="text-muted-foreground">Lade Sicherheitsdaten...</p>
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
              <h1 className="text-3xl font-bold tracking-tight">System-Sicherheit</h1>
              <p className="text-muted-foreground">
                Überwache Sicherheitsbedrohungen und verwalte Zugriffskontrollen
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadSecurityData}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Security Status */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <IconShield className={`h-6 w-6 ${metrics.activeMonitoring ? "text-green-600" : "text-red-600"}`} />
                  <span className="font-medium">
                    Sicherheitsmonitoring: {metrics.activeMonitoring ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <Badge variant="default" className="bg-green-600">
                  System geschützt
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Letztes Update: {new Date().toLocaleString("de-DE")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bedrohungen</p>
                  <p className="text-2xl font-bold">{metrics.totalThreats}</p>
                </div>
                <IconAlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Heute</p>
                  <p className="text-2xl font-bold">{metrics.todayThreats}</p>
                </div>
                <IconClock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kritisch</p>
                  <p className="text-2xl font-bold">{metrics.criticalThreats}</p>
                </div>
                <IconShieldLock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blockierte IPs</p>
                  <p className="text-2xl font-bold">{metrics.blockedIPs}</p>
                </div>
                <IconBan className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erfolg. Blocks</p>
                  <p className="text-2xl font-bold">{metrics.successfulBlocks}</p>
                </div>
                <IconShield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blockrate</p>
                  <p className="text-2xl font-bold">
                    {((metrics.successfulBlocks / Math.max(metrics.totalThreats, 1)) * 100).toFixed(1)}%
                  </p>
                </div>
                <IconFingerprint className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant={activeTab === "threats" ? "default" : "outline"}
            onClick={() => setActiveTab("threats")}
          >
            <IconAlertTriangle className="h-4 w-4 mr-2" />
            Sicherheitsbedrohungen
          </Button>
          <Button 
            variant={activeTab === "blocked" ? "default" : "outline"}
            onClick={() => setActiveTab("blocked")}
          >
            <IconBan className="h-4 w-4 mr-2" />
            Blockierte IPs
          </Button>
        </div>

        {activeTab === "threats" && (
          <>
            {/* Threat Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <IconFilter className="h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="IP-Adresse oder Land suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Select value={threatFilter} onValueChange={setThreatFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Bedrohungstyp filtern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Typen</SelectItem>
                        <SelectItem value="brute_force">Brute Force</SelectItem>
                        <SelectItem value="ddos">DDoS</SelectItem>
                        <SelectItem value="sql_injection">SQL Injection</SelectItem>
                        <SelectItem value="xss">XSS</SelectItem>
                        <SelectItem value="suspicious_activity">Verdächtige Aktivität</SelectItem>
                        <SelectItem value="malware">Malware</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Schweregrad filtern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Schweregrade</SelectItem>
                        <SelectItem value="low">Niedrig</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                        <SelectItem value="critical">Kritisch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Threats Table */}
            <Card>
              <CardHeader>
                <CardTitle>Sicherheitsbedrohungen</CardTitle>
                <CardDescription>
                  Erkannte Bedrohungen und Angriffe ({filteredThreats.length} Bedrohungen)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={threatColumns} 
                  data={filteredThreats}
                />
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "blocked" && (
          <>
            {/* Add New Block */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>IP-Adresse manuell blockieren</CardTitle>
                <CardDescription>
                  Füge eine neue IP-Adresse zur Blockliste hinzu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="IP-Adresse (z.B. 192.168.1.1)"
                    value={newBlockIP}
                    onChange={(e) => setNewBlockIP(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Grund für Blockierung"
                    value={newBlockReason}
                    onChange={(e) => setNewBlockReason(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => {
                      if (newBlockIP && newBlockReason) {
                        blockIP(newBlockIP, newBlockReason, true);
                        setNewBlockIP("");
                        setNewBlockReason("");
                      }
                    }}
                    disabled={!newBlockIP || !newBlockReason}
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Blockieren
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Blocked IPs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Blockierte IP-Adressen</CardTitle>
                <CardDescription>
                  Verwalte blockierte IP-Adressen und deren Status ({blockedIPs.length} IPs)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={blockedColumns} 
                  data={blockedIPs}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Threat Details Modal */}
        {selectedThreat && (
          <Dialog open={!!selectedThreat} onOpenChange={() => setSelectedThreat(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconShieldLock className="h-5 w-5" />
                  Bedrohungs-Details
                  {getSeverityBadge(selectedThreat.severity)}
                </DialogTitle>
                <DialogDescription>
                  Detaillierte Informationen zur Sicherheitsbedrohung
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Threat Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Bedrohungsinformationen</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconGlobe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{selectedThreat.ip_address}</span>
                      <span className="text-sm text-muted-foreground">({selectedThreat.country})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconShield className="h-4 w-4 text-muted-foreground" />
                      {getThreatTypeBadge(selectedThreat.threat_type)}
                    </div>
                    <div className="flex items-center gap-2">
                      <IconActivity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedThreat.attempt_count} Versuche</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Erkannt: {new Date(selectedThreat.detected_at).toLocaleString("de-DE")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Letzte Aktivität: {new Date(selectedThreat.last_activity).toLocaleString("de-DE")}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Beschreibung</h4>
                    <p className="text-sm text-muted-foreground">{selectedThreat.description}</p>
                  </div>

                  {/* User Agent */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">User-Agent</h4>
                    <p className="text-xs font-mono bg-muted p-2 rounded">{selectedThreat.user_agent}</p>
                  </div>
                </div>

                {/* Status & Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status & Aktionen</h3>
                  
                  {/* Current Status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Aktueller Status</span>
                      {selectedThreat.blocked ? (
                        <Badge variant="destructive">Blockiert</Badge>
                      ) : (
                        <Badge variant="outline">Aktiv</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Automatisch blockiert</span>
                      {selectedThreat.auto_blocked ? (
                        <Badge variant="secondary">Ja</Badge>
                      ) : (
                        <Badge variant="outline">Nein</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Schweregrad</span>
                      {getSeverityBadge(selectedThreat.severity)}
                    </div>
                  </div>

                  {/* Security Actions */}
                  <div className="space-y-2">
                    <h4 className="font-medium mb-2">Sicherheitsaktionen</h4>
                    {!selectedThreat.blocked && (
                      <Button 
                        onClick={() => {
                          blockIP(selectedThreat.ip_address, `Blocked due to ${selectedThreat.threat_type}`);
                          setSelectedThreat(null);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <IconBan className="h-4 w-4 mr-2" />
                        IP blockieren
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Mock whitelist functionality
                        toast.success("IP zur Whitelist hinzugefügt");
                        setSelectedThreat(null);
                      }}
                    >
                      <IconShield className="h-4 w-4 mr-2" />
                      Zur Whitelist hinzufügen
                    </Button>
                  </div>

                  {/* Risk Assessment */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Risikobewertung</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Häufigkeit:</span>
                        <span className="font-medium">
                          {selectedThreat.attempt_count > 50 ? "Sehr hoch" : 
                           selectedThreat.attempt_count > 20 ? "Hoch" : 
                           selectedThreat.attempt_count > 10 ? "Mittel" : "Niedrig"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potentielle Gefahr:</span>
                        <span className="font-medium">
                          {selectedThreat.severity === "critical" ? "Extrem hoch" :
                           selectedThreat.severity === "high" ? "Hoch" :
                           selectedThreat.severity === "medium" ? "Mittel" : "Niedrig"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Empfehlung:</span>
                        <span className="font-medium text-red-600">
                          {selectedThreat.blocked ? "Bereits blockiert" : "Sofort blockieren"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 