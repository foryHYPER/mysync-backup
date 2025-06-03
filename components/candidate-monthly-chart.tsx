"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
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

interface CandidateMonthlyChartProps {
  data: Application[];
}

export function CandidateMonthlyChart({ data }: CandidateMonthlyChartProps) {
  // Group applications by month
  const monthlyData = data.reduce((acc, app) => {
    const date = new Date(app.raw_created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const displayMonth = date.toLocaleDateString("de-DE", { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: displayMonth,
        monthKey: monthKey,
        applications: 0,
        interviews: 0,
        avgMatchScore: 0,
        scores: []
      };
    }
    
    acc[monthKey].applications += 1;
    if (app.status === 'Kontaktiert') {
      acc[monthKey].interviews += 1;
    }
    acc[monthKey].scores.push(app.raw_match_score);
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate average match scores and format data
  const chartData = Object.values(monthlyData)
    .map((month: any) => ({
      ...month,
      avgMatchScore: Math.round(
        month.scores.reduce((sum: number, score: number) => sum + score, 0) / month.scores.length
      )
    }))
    .sort((a: any, b: any) => {
      return a.monthKey.localeCompare(b.monthKey);
    })
    .slice(-6); // Show last 6 months

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Keine Daten verfügbar</p>
      </div>
    );
  }

  return (
    <ChartContainer 
      config={{
        applications: {
          label: "Bewerbungen",
          color: "hsl(var(--primary))",
        },
        interviews: {
          label: "Interviews", 
          color: "hsl(var(--muted-foreground))",
        },
      }}
      className="h-[200px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                formatter={(value, name) => {
                  if (name === 'applications') {
                    return [`${value} Bewerbungen`, ""];
                  } else if (name === 'interviews') {
                    return [`${value} Interviews`, ""];
                  }
                  return [`${value}`, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${label} - Ø ${data.avgMatchScore}% Match`;
                  }
                  return label;
                }}
              />
            }
          />
          <Bar
            dataKey="applications"
            fill="#3b82f6"
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="interviews"
            fill="#93c5fd"
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
} 