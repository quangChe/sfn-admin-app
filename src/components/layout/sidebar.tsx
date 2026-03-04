"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  Image,
  Table2,
  HardDrive,
  Mail,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  Image,
  Table2,
  HardDrive,
  Mail,
  Calendar,
};

export function Sidebar() {
  const pathname = usePathname();

  const shopifyItems = navItems.filter((i) => i.group === "shopify");
  const googleItems = navItems.filter((i) => i.group === "google");
  const mainItems = navItems.filter((i) => i.group === "main");

  function NavLink({ item }: { item: (typeof navItems)[0] }) {
    const Icon = iconMap[item.icon];
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-background px-3 py-4">
      <div className="mb-4 px-3">
        <h1 className="text-lg font-bold tracking-tight">SFN Admin</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {mainItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <Separator className="my-2" />
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Shopify
        </p>
        {shopifyItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <Separator className="my-2" />
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Google
        </p>
        {googleItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
