import { IconDashboard, IconFolder, IconUsers } from "@tabler/icons-react";

export const navClient = [
  { title: "Dashboard", url: "/dashboard/client", icon: IconDashboard },
  { title: "Projects", url: "/dashboard/client/projects", icon: IconFolder },
  { title: "Matches", url: "/dashboard/company/matches", icon: IconUsers, roles: ["client", "company"] },
  // ...weitere Client-Items
]; 