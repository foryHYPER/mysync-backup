"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export type MatchTableItem = {
  id: string;
  company: string;
  job_title: string;
  match_score: number;
  match_details: {
    skillMatches: Array<{ skill: string; score: number }>;
    experienceMatch: number;
    locationMatch: boolean;
    availabilityMatch: boolean;
  };
  status: "pending" | "reviewed" | "contacted" | "rejected";
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800",
  contacted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-800",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-800",
};

export function getColumns(
  onShowDetails: (match: MatchTableItem) => void,
  onUpdateStatus: (matchId: string, status: string) => void
): ColumnDef<MatchTableItem>[] {
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
      accessorKey: "match_score",
      header: "Match Score",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress value={row.original.match_score} className="w-[100px]" />
          <span className="text-sm font-medium">
            {Math.round(row.original.match_score)}%
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusColor[row.original.status] || ""}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const match = row.original;
        return (
          <div className="space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onShowDetails(match)}
            >
              Details
            </Button>
            {match.status === "pending" && (
              <>
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={() => onUpdateStatus(match.id, "reviewed")}
                >
                  Geprüft
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => onUpdateStatus(match.id, "rejected")}
                >
                  Ablehnen
                </Button>
              </>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
} 