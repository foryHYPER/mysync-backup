"use client"

import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import companyData from "@/app/dashboard/data/company.json";
import { ColumnDef } from "@tanstack/react-table";

const companyColumns: ColumnDef<any>[] = [
  { accessorKey: "header", header: "Projekt" },
  { accessorKey: "type", header: "Typ" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "target", header: "Kunde" },
  { accessorKey: "limit", header: "Frist" },
  { accessorKey: "reviewer", header: "Bearbeiter" },
];

export default function CompanyDashboard() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable columns={companyColumns} data={companyData.table} />
    </>
  );
} 