import { IconDashboard, IconFileAi, IconUser, IconMail } from "@tabler/icons-react";

export const navCandidate = [
  { title: "Dashboard", url: "/dashboard/candidate", icon: IconDashboard },
  { title: "Profil", url: "/dashboard/candidate/profile", icon: IconUser },
  { title: "Einladungen", url: "/dashboard/candidate/invitations", icon: IconMail },
  { title: "Prompts", url: "#", icon: IconFileAi },
  // ...weitere Candidate-Items
]; 