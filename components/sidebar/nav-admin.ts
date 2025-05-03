import { IconDashboard, IconUsers, IconFileDescription } from "@tabler/icons-react";

export const navAdmin = [
  { title: "Dashboard", url: "/dashboard/admin", icon: IconDashboard },
  { title: "User Management", url: "/dashboard/admin/users", icon: IconUsers },
  { title: "Kandidatenverwaltung", url: "/dashboard/admin/candidates", icon: IconUsers },
  { title: "Resumes", url: "/dashboard/admin/resumes", icon: IconFileDescription },
  // ...weitere Admin-Items
]; 