import { 
  IconChartBar, 
  IconSwimming,
  IconAward,
  IconMail,
  IconUsers,
  IconBuilding,
  IconSettings,
  IconBriefcase,
  IconEye
} from "@tabler/icons-react";
  
export const companyNavigation = [
  {
    title: "Dashboard",
    url: "/dashboard/company",
    icon: IconChartBar,
  },
  {
    title: "Kandidaten-Pools",
    url: "/dashboard/company/pools", 
    icon: IconSwimming,
  },
  {
    title: "Meine Auswahlen",
    url: "/dashboard/company/matches",
    icon: IconAward,
  },
  {
    title: "Nachrichten",
    url: "/dashboard/company/messages",
    icon: IconMail,
  },
  {
    title: "Berichte",
    url: "/dashboard/company/reports",
    icon: IconChartBar,
  },
  {
    title: "Team",
    url: "/dashboard/company/team",
    icon: IconUsers,
  },
  {
    title: "Unternehmensprofil",
    url: "/dashboard/company/profile",
    icon: IconBuilding,
  },
  {
    title: "Stellenausschreibungen",
    url: "/dashboard/company/jobs",
    icon: IconBriefcase,
  },
  {
    title: "Einstellungen",
    url: "/dashboard/company/settings",
    icon: IconSettings,
  },
]; 