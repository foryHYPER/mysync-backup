"use client"

import { useEffect, useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";

const adminColumns: ColumnDef<any>[] = [
  { accessorKey: "action", header: "Aktion" },
  { accessorKey: "table_name", header: "Tabelle" },
  { accessorKey: "user_email", header: "Benutzer" },
  { accessorKey: "created_at", header: "Zeitstempel" },
  { accessorKey: "record_id", header: "Datensatz-ID" },
];

export default function AdminDashboard() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Lade Audit-Logs
        const { data: logs } = await supabase
          .from("audit_logs")
          .select(`
            *,
            profiles(
              id,
              role
            )
          `)
          .order("created_at", { ascending: false })
          .limit(50);

        if (logs) {
          const formattedLogs = logs.map((log: any) => ({
            id: log.id,
            action: getActionText(log.action),
            table_name: getTableText(log.table_name),
            user_email: log.user_id || "System",
            created_at: new Date(log.created_at).toLocaleString("de-DE"),
            record_id: log.record_id ? log.record_id.substring(0, 8) + "..." : "N/A"
          }));
          setAuditLogs(formattedLogs);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Admin-Daten:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  const getActionText = (action: string) => {
    switch (action) {
      case "create": return "Erstellt";
      case "update": return "Aktualisiert";
      case "delete": return "Gelöscht";
      default: return action;
    }
  };

  const getTableText = (table: string) => {
    switch (table) {
      case "profiles": return "Profile";
      case "companies": return "Unternehmen";
      case "candidates": return "Kandidaten";
      case "job_postings": return "Stellenanzeigen";
      case "invitations": return "Einladungen";
      case "candidate_matches": return "Matches";
      default: return table;
    }
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-bold mb-4">System-Aktivitäten</h2>
          <DataTable 
            columns={adminColumns} 
            data={loading ? [] : auditLogs} 
          />
        </div>
      </div>
    </div>
  );
} 