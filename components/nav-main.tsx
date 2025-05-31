"use client"

import { type Icon } from "@tabler/icons-react"
import { IconChevronRight } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>([])

  // Check if any subitem is active to determine if parent should be open
  const isParentActive = (item: typeof items[0]) => {
    if (pathname === item.url) return true
    return item.items?.some(subItem => pathname === subItem.url) || false
  }

  // Initialize open state for items with active subroutes
  useEffect(() => {
    const activeParents = items
      .filter(isParentActive)
      .map(item => item.url)
    setOpenItems(activeParents)
  }, [items, pathname])

  const toggleItem = (url: string) => {
    setOpenItems(prev => 
      prev.includes(url) 
        ? prev.filter(item => item !== url)
        : [...prev, url]
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url
            const hasSubItems = item.items && item.items.length > 0
            const isOpen = openItems.includes(item.url)
            const hasActiveSubItem = item.items?.some(subItem => pathname === subItem.url)

            if (!hasSubItems) {
              // Simple menu item without subitems
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={isActive ? "!bg-primary !text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground !shadow-xs" : ""}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            // Menu item with collapsible subitems - using details/summary for now
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  onClick={() => toggleItem(item.url)}
                  isActive={isActive || hasActiveSubItem}
                  className={`${isActive || hasActiveSubItem ? "!bg-primary !text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground !shadow-xs" : ""} w-full cursor-pointer`}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <IconChevronRight 
                    className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} 
                  />
                </SidebarMenuButton>
                {isOpen && (
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubItemActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubItemActive}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
