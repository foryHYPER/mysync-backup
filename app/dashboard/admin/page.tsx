"use client"

import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import adminData from "@/app/dashboard/data/admin.json";
import { useProfile } from "@/context/ProfileContext";
import { ColumnDef } from "@tanstack/react-table";

const adminColumns: ColumnDef<any>[] = [
  { accessorKey: "header", header: "Report" },
  { accessorKey: "type", header: "Typ" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "target", header: "Ziel" },
  { accessorKey: "limit", header: "Frist" },
  { accessorKey: "reviewer", header: "Bearbeiter" },
];

export default function AdminDashboard() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable columns={adminColumns} data={adminData.table} />
      </div>
    </div>
  );
} 