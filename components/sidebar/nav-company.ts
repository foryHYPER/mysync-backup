import { 
  IconHome, 
  IconUserCheck, 
  IconUsers,
  IconFileText,
  IconChartDots,
  IconSettings,
  IconHelpCircle,
  IconBuildingBank,
  IconSwimming
} from "@tabler/icons-react";
  
export const companyNavigation = [
  {
    title: "Dashboard",
    url: "/dashboard/company",
    icon: IconHome,
  },
  {
    title: "Kandidaten-Pools",
    url: "/dashboard/company/pools", 
    icon: IconSwimming,
  },
  {
    title: "Matches",
    url: "/dashboard/company/matches",
    icon: IconUserCheck,
  },
  {
    title: "Team",
    url: "/dashboard/company/team",
    icon: IconUsers,
  },
  {
    title: "Berichte",
    url: "/dashboard/company/reports",
    icon: IconChartDots,
  },
  {
    title: "Unternehmensprofil",
    url: "/dashboard/company/profile",
    icon: IconBuildingBank,
  },
  {
    title: "Einstellungen",
    url: "/dashboard/company/settings",
    icon: IconSettings,
  },
]; 