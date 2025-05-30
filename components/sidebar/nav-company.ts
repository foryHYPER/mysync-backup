import { IconDashboard, IconFolder, IconUsers } from "@tabler/icons-react";
  
export const navClient = [
  { title: "Dashboard", url: "/dashboard/company", icon: IconDashboard },
  { title: "Projects", url: "/dashboard/company/projects", icon: IconFolder },
  { title: "Matches", url: "/dashboard/company/matches", icon: IconUsers, roles: ["client", "company"] },
  // ...weitere Client-Items
]; 