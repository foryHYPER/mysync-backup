"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import {
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Optionally map route segments to readable names
const segmentNameMap: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  client: "Client",
  candidate: "Candidate",
  candidates: "Kandidatenverwaltung",
  profile: "Profil",
  projects: "Projekte",
  users: "User Management",
};

export default function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build up the breadcrumb path
  let path = "";
  const items = segments.map((segment, idx) => {
    path += "/" + segment;
    const isLast = idx === segments.length - 1;
    const name = segmentNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    if (isLast) {
      return (
        <BreadcrumbItem key={path}>
          <BreadcrumbPage>{name}</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }
    return (
      <React.Fragment key={path}>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={path}>{name}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
      </React.Fragment>
    );
  });

  return <BreadcrumbList>{items}</BreadcrumbList>;
} 