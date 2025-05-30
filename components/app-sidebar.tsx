"use client"

import * as React from "react"
import {
  IconInnerShadowTop,
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { navAdmin } from "@/components/sidebar/nav-admin";
import { navClient } from "@/components/sidebar/nav-client";
import { navCandidate } from "@/components/sidebar/nav-candidate";

type NavItem = {
  title: string;
  url: string;
  icon: Icon;
  roles?: string[];
};

export function AppSidebar({ user, role, ...props }: React.ComponentProps<typeof Sidebar> & { user: { name: string, email: string, avatar: string }, role: string }) {
  console.log("Sidebar user prop:", user);
  let navItems: NavItem[] = [];
  switch (role) {
    case "admin":
      navItems = navAdmin;
      break;
    case "client":
    case "company":
      navItems = navClient.filter(item => !item.roles || item.roles.includes(role));
      break;
    case "candidate":
      navItems = navCandidate;
      break;
    default:
      navItems = [];
  }
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Dein Unternehmen</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavDocuments items={[]} />
        <NavSecondary items={[]} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
