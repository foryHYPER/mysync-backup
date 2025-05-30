import { IconDashboard, IconUser, IconMail, IconMessages, IconUsers } from "@tabler/icons-react";

export const navCandidate = [
  { title: "Dashboard", url: "/dashboard/candidate", icon: IconDashboard },
  { title: "Profil", url: "/dashboard/candidate/profile", icon: IconUser },
  { title: "Matches", url: "/dashboard/candidate/matches", icon: IconUsers },
  { title: "Einladungen", url: "/dashboard/candidate/invitations", icon: IconMail },
  { title: "Chats", url: "#", icon: IconMessages },
  // ...weitere Candidate-Items
]; 