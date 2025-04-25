"use client"

import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import candidateData from "@/app/dashboard/data/candidate.json";
import { useProfile } from "@/context/ProfileContext";
import { ColumnDef } from "@tanstack/react-table";

const candidateColumns: ColumnDef<any>[] = [
  { accessorKey: "header", header: "Bewerbung" },
  { accessorKey: "type", header: "Typ" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "target", header: "Stelle" },
  { accessorKey: "limit", header: "Frist" },
  { accessorKey: "reviewer", header: "Bearbeiter" },
];

export default function CandidateDashboard() {
  const profile = useProfile();
  const userObj = {
    name: profile.name || profile.email || profile.user_email || "Unbekannt",
    email: profile.email || profile.user_email || "Unbekannt",
    avatar: "/avatars/shadcn.jpg",
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable columns={candidateColumns} data={candidateData.table} />
        </div>
      </div>
    </div>
  );
} 