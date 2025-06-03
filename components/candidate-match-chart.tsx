"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
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

interface CandidateMatchChartProps {
  data: Application[];
}

export function CandidateMatchChart({ data }: CandidateMatchChartProps) {
  // Transform data for chart
  const chartData = data
    .map(app => ({
      date: new Date(app.raw_created_at).toLocaleDateString("de-DE", { 
        month: 'short', 
        day: 'numeric' 
      }),
      score: app.raw_match_score,
      company: app.company_name,
      position: app.job_title,
      fullDate: app.raw_created_at
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    .slice(-10); // Show last 10 entries

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
        score: {
          label: "Match Score",
          color: "hsl(var(--primary))",
        },
      }}
      className="h-[200px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                formatter={(value, name) => [
                  `${value}%`,
                  "Match Score"
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.company} - ${data.position}`;
                  }
                  return label;
                }}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
} 