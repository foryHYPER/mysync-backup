"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Application = {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  match_score: string;
  created_at: string;
  location: string;
  raw_created_at: string;
  raw_match_score: number;
};

interface CandidateStatusChartProps {
  data: Application[];
}

const statusColors = {
  "Ausstehend": "#fbbf24", // yellow-400
  "Geprüft": "#3b82f6",   // blue-500
  "Kontaktiert": "#10b981", // emerald-500
  "Abgelehnt": "#ef4444"   // red-500
};

const statusLabels = {
  "Ausstehend": "Ausstehend",
  "Geprüft": "In Prüfung", 
  "Kontaktiert": "Kontaktiert",
  "Abgelehnt": "Abgelehnt"
};

export function CandidateStatusChart({ data }: CandidateStatusChartProps) {
  // Count status occurrences
  const statusCounts = data.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Transform for chart
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count,
    percentage: Math.round((count / data.length) * 100),
    color: statusColors[status as keyof typeof statusColors] || "#6b7280"
  }));

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Keine Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-[160px] w-full">
        <ChartContainer 
          config={{}}
          className="h-full w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2.5 w-2.5 rounded-full" 
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="text-sm font-medium">{data.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.value} Bewerbungen ({data.percentage}%)
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      {/* Custom Legend */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="h-2 w-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground truncate">
              {entry.name} ({entry.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 