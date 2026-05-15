export interface NavItem {
  label: string;
  href: string;
  icon: string;
  group: "shopify" | "main";
  requiredPermission?: string;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard", group: "main" },
  { label: "Orders", href: "/orders", icon: "ShoppingCart", group: "shopify" },
  { label: "Products", href: "/products", icon: "Package", group: "shopify" },
  { label: "Customers", href: "/customers", icon: "Users", group: "shopify" },
  { label: "Analytics", href: "/analytics", icon: "BarChart2", group: "shopify" },
  { label: "Media", href: "/media", icon: "Image", group: "shopify" },
  { label: "Drops", href: "/drops", icon: "CalendarDays", group: "shopify", requiredPermission: "drops:view" },
];
