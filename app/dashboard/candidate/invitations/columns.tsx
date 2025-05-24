"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

export type Invitation = {
  id: string;
  company: string;
  job_title: string;
  date: string;
  time: string;
  location: string;
  status: string;
  message?: string;
  actions?: string[];
};

export function getColumns(
  onShowDetails: (invitation: Invitation) => void,
  onShowSuggest: (invitation: Invitation) => void,
  onAccept: (invitation: Invitation) => void,
  onDecline: (invitation: Invitation) => void
): ColumnDef<Invitation>[] {
  return [
    {
      accessorKey: "company",
      header: "Unternehmen",
    },
    {
      accessorKey: "job_title",
      header: "Position",
    },
    {
      accessorKey: "date",
      header: "Datum",
    },
    {
      accessorKey: "time",
      header: "Uhrzeit",
    },
    {
      accessorKey: "location",
      header: "Ort",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.status}</span>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const invitation = row.original;
        return (
          <div className="space-x-2">
            {invitation.status === "pending" ? (
              <>
                <Button size="sm" variant="default" onClick={() => onAccept(invitation)}>Annehmen</Button>
                <Button size="sm" variant="destructive" onClick={() => onDecline(invitation)}>Ablehnen</Button>
                <Button size="sm" variant="outline" onClick={() => onShowSuggest(invitation)}>Alternativtermin</Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onShowDetails(invitation)}>Details</Button>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
} 