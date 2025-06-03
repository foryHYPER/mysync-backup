"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconTarget,
  IconStar,
  IconBriefcase,
  IconMessage
} from "@tabler/icons-react"

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

type DashboardStats = {
  totalApplications: number;
  activeApplications: number;
  averageMatchScore: number;
  interviewInvitations: number;
  topMatchScore: number;
  responseRate: number;
  thisWeekApplications: number;
  thisMonthApplications: number;
  matchTrend: 'up' | 'down' | 'neutral';
  skillsInDemand: string[];
  nextSteps: string[];
};

interface CandidateSuccessMetricsProps {
  data: Application[];
  stats: DashboardStats;
}

export function CandidateSuccessMetrics({ data, stats }: CandidateSuccessMetricsProps) {
  // Calculate detailed metrics
  const interviewRate = stats.totalApplications > 0 
    ? Math.round((stats.interviewInvitations / stats.totalApplications) * 100) 
    : 0;
    
  const responseRate = stats.totalApplications > 0 
    ? Math.round(((stats.totalApplications - data.filter(app => app.status === 'Ausstehend').length) / stats.totalApplications) * 100)
    : 0;

  // Calculate score distribution
  const highScoreMatches = data.filter(app => app.raw_match_score >= 80).length;
  const highScoreRate = stats.totalApplications > 0 
    ? Math.round((highScoreMatches / stats.totalApplications) * 100)
    : 0;

  // Calculate this month's performance
  const thisMonth = new Date();
  const oneMonthAgo = new Date(thisMonth.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thisMonthData = data.filter(app => new Date(app.raw_created_at) >= oneMonthAgo);
  const thisMonthAvgScore = thisMonthData.length > 0 
    ? Math.round(thisMonthData.reduce((sum, app) => sum + app.raw_match_score, 0) / thisMonthData.length)
    : 0;

  const metrics = [
    {
      label: "Interview-Quote",
      value: interviewRate,
      icon: IconMessage,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: `${stats.interviewInvitations} von ${stats.totalApplications} Bewerbungen`
    },
    {
      label: "Antwort-Rate",
      value: responseRate,
      icon: IconBriefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Unternehmen haben geantwortet"
    },
    {
      label: "High-Score Matches",
      value: highScoreRate,
      icon: IconStar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: `${highScoreMatches} Matches über 80%`
    },
    {
      label: "Dieser Monat Ø",
      value: thisMonthAvgScore,
      icon: IconTarget,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: `${thisMonthData.length} Bewerbungen`
    }
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{metric.label}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{metric.value}%</p>
              <Progress 
                value={metric.value} 
                className="w-16 h-2 mt-1" 
              />
            </div>
          </div>
        );
      })}

      {/* Trend Indicator */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            stats.matchTrend === 'up' ? 'bg-green-100' : 
            stats.matchTrend === 'down' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {stats.matchTrend === 'up' ? (
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            ) : stats.matchTrend === 'down' ? (
              <IconTrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <IconTarget className="h-4 w-4 text-gray-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Match-Trend</p>
            <p className="text-xs text-muted-foreground">Letzte Woche vs. vorherigem Zeitraum</p>
          </div>
        </div>
        <div className="text-right">
          <Badge 
            variant={stats.matchTrend === 'up' ? 'default' : stats.matchTrend === 'down' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {stats.matchTrend === 'up' ? 'Steigend' : stats.matchTrend === 'down' ? 'Fallend' : 'Stabil'}
          </Badge>
        </div>
      </div>
    </div>
  );
} 