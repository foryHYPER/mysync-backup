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
  invitations: "Einladungen",
};

// Liste der Benutzerrollen, die aus den Breadcrumbs gefiltert werden sollen
const roleSegments = ["candidate", "client", "admin"];

export default function DynamicBreadcrumbs() {
  const pathname = usePathname();
  // Filtere die Segmente und entferne die Benutzerrolle
  const segments = pathname.split("/").filter(Boolean).filter(segment => !roleSegments.includes(segment));

  // Build up the breadcrumb path
  let path = "";
  const items = segments.map((segment, idx) => {
    // Füge die Rolle zum Pfad hinzu, aber zeige sie nicht in den Breadcrumbs an
    if (idx === 0) { // Nach "dashboard"
      const roleSegment = pathname.split("/").filter(Boolean).find(s => roleSegments.includes(s));
      if (roleSegment) {
        path += "/" + roleSegment;
      }
    }
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