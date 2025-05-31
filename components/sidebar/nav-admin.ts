import { 
  IconDashboard, 
  IconUsers, 
  IconFileDescription, 
  IconBuilding,
  IconChartBar,
  IconSettings,
  IconShield,
  IconClipboardList,
  IconUserCheck,
  IconHistory
} from "@tabler/icons-react";

export const navAdmin = [
  { title: "Dashboard", url: "/dashboard/admin", icon: IconDashboard },
  { 
    title: "Benutzerverwaltung", 
    url: "/dashboard/admin/users", 
    icon: IconUsers,
    items: [
      { title: "Alle Benutzer", url: "/dashboard/admin/users" },
      { title: "Kandidaten", url: "/dashboard/admin/users/candidates" },
      { title: "Unternehmen", url: "/dashboard/admin/users/companies" },
      { title: "Administratoren", url: "/dashboard/admin/users/admins" }
    ]
  },
  { 
    title: "Unternehmen", 
    url: "/dashboard/admin/companies", 
    icon: IconBuilding,
    items: [
      { title: "Übersicht", url: "/dashboard/admin/companies" },
      { title: "Genehmigungen", url: "/dashboard/admin/companies/approvals" },
      { title: "Onboarding", url: "/dashboard/admin/companies/onboarding" }
    ]
  },
  { 
    title: "Kandidaten", 
    url: "/dashboard/admin/candidates", 
    icon: IconUserCheck,
    items: [
      { title: "Übersicht", url: "/dashboard/admin/candidates" },
      { title: "Qualitätskontrolle", url: "/dashboard/admin/candidates/quality" },
      { title: "Lebensläufe", url: "/dashboard/admin/resumes" }
    ]
  },
  { 
    title: "Berichte", 
    url: "/dashboard/admin/reports", 
    icon: IconChartBar,
    items: [
      { title: "Übersicht", url: "/dashboard/admin/reports" },
      { title: "Benutzeraktivität", url: "/dashboard/admin/reports/activity" },
      { title: "Matching-Statistiken", url: "/dashboard/admin/reports/matching" },
      { title: "Export", url: "/dashboard/admin/reports/export" }
    ]
  },
  { 
    title: "System", 
    url: "/dashboard/admin/system", 
    icon: IconSettings,
    items: [
      { title: "Einstellungen", url: "/dashboard/admin/system/settings" },
      { title: "Audit Logs", url: "/dashboard/admin/system/audit" },
      { title: "Sicherheit", url: "/dashboard/admin/system/security" }
    ]
  }
]; 