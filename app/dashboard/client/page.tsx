"use client"

import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import companyData from "@/app/dashboard/data/company.json";
import { ColumnDef } from "@tanstack/react-table";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const companyColumns: ColumnDef<any>[] = [
  { accessorKey: "header", header: "Projekt" },
  { accessorKey: "type", header: "Typ" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "target", header: "Kunde" },
  { accessorKey: "limit", header: "Frist" },
  { accessorKey: "reviewer", header: "Bearbeiter" },
];

export default function CompanyDashboard() {
  const profile = useProfile();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("companies")
        .select("onboarding_status, onboarding_progress")
        .eq("id", profile.id)
        .single();
      setCompany(data);
      setLoading(false);
    };
    if (profile?.role === "company") fetchCompany();
  }, [profile]);

  return (
    <>
      {profile.role === "company" && !loading && company && company.onboarding_status !== "completed" && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <b>Bitte Onboarding abschließen!</b><br />
              Fortschritt: {company.onboarding_progress || 0}%
            </div>
            <button
              className="ml-4 bg-yellow-500 text-white px-4 py-2 rounded"
              onClick={() => router.push("/onboarding")}
            >
              Onboarding fortsetzen
            </button>
          </div>
        </div>
      )}
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable columns={companyColumns} data={companyData.table} />
    </>
  );
} 