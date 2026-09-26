"use client"

import * as React from "react"
import Link from "next/link"
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
import {
  LayoutDashboardIcon,
  WalletIcon,
  ArrowLeftRightIcon,
  CreditCardIcon,
  TargetIcon,
  SettingsIcon,
  LandmarkIcon,
  SendIcon,
  BellIcon,
  LogInIcon,
  UserPlusIcon,
  ReceiptTextIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Member",
    email: "member@anchor.bank",
    avatar: "/avatars/user.jpg",
  },
  navDaily: [
    { title: "Overview", url: "/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Accounts", url: "/accounts", icon: <WalletIcon /> },
    { title: "Transactions", url: "/transactions", icon: <ArrowLeftRightIcon /> },
    { title: "Cards", url: "/cards", icon: <CreditCardIcon /> },
  ],
  navMoney: [
    { title: "Transfers", url: "/transfers", icon: <SendIcon /> },
    { title: "Bill Pay", url: "/bills", icon: <ReceiptTextIcon /> },
    { title: "Budgets", url: "/budgets", icon: <TargetIcon /> },
  ],
  navAuth: [
    { title: "Sign In", url: "/sign-in", icon: <LogInIcon /> },
    { title: "Sign Up", url: "/sign-up", icon: <UserPlusIcon /> },
  ],
  navSecondary: [
    { title: "Notifications", url: "/notifications", icon: <BellIcon /> },
    { title: "Settings", url: "/settings", icon: <SettingsIcon /> },
  ],
}

import type { NotificationRow } from "@/lib/data"

export function AppSidebar({
  notifications,
  ...props
}: React.ComponentProps<typeof Sidebar> & { notifications: NotificationRow[] }) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LandmarkIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-display font-semibold">Anchor</span>
                <span className="truncate text-xs text-muted-foreground">
                  Banking
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navDaily} label="Daily" />
        <NavMain items={data.navMoney} label="Money" />
        <NavMain items={data.navAuth} label="Auth" />
        <NavSecondary items={data.navSecondary} notifications={notifications} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
