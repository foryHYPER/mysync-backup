"use client"

import * as React from "react"
import { useEffect, useState } from "react"
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
import { navClient } from "@/components/sidebar/nav-company";
import { navCandidate } from "@/components/sidebar/nav-candidate";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  title: string;
  url: string;
  icon: Icon;
  roles?: string[];
};

export function AppSidebar({ user, role, ...props }: React.ComponentProps<typeof Sidebar> & { user: { id: string, name?: string, email: string, avatar?: string }, role: string }) {
  const [displayName, setDisplayName] = useState<string>("mySync");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDisplayName() {
      setLoading(true);
      try {
        if (role === "candidate" || role === "admin") {
          // Fetch candidate/admin name
          const { data } = await supabase
            .from("candidates")
            .select("first_name, last_name")
            .eq("id", user.id)
            .single();
          
          if (data?.first_name && data?.last_name) {
            setDisplayName(`${data.first_name} ${data.last_name}`);
          } else if (data?.first_name) {
            setDisplayName(data.first_name);
          } else {
            setDisplayName(user.name || user.email.split('@')[0]);
          }
        } else if (role === "company" || role === "client") {
          // Fetch company name
          const { data } = await supabase
            .from("companies")
            .select("name")
            .eq("id", user.id)
            .single();
          
          if (data?.name) {
            setDisplayName(data.name);
          } else {
            setDisplayName("Ihr Unternehmen");
          }
        } else {
          setDisplayName("mySync");
        }
      } catch (error) {
        console.error("Error fetching display name:", error);
        // Fallback to email prefix or default
        setDisplayName(user.name || user.email.split('@')[0] || "mySync");
      } finally {
        setLoading(false);
      }
    }

    fetchDisplayName();
  }, [user.id, user.email, user.name, role, supabase]);

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
                <span className="text-base font-semibold">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
                    </span>
                  ) : (
                    displayName
                  )}
                </span>
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
        <NavUser user={{
          name: displayName,
          email: user.email,
          avatar: user.avatar || ""
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}