export interface NavItem {
  label: string;
  href: string;
  icon: string;
  group: "shopify" | "google" | "main";
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard", group: "main" },
  // Shopify
  { label: "Orders", href: "/orders", icon: "ShoppingCart", group: "shopify" },
  { label: "Products", href: "/products", icon: "Package", group: "shopify" },
  { label: "Customers", href: "/customers", icon: "Users", group: "shopify" },
  { label: "Analytics", href: "/analytics", icon: "BarChart2", group: "shopify" },
  { label: "Media", href: "/media", icon: "Image", group: "shopify" },
  // Google
  { label: "Sheets", href: "/sheets", icon: "Table2", group: "google" },
  { label: "Drive", href: "/drive", icon: "HardDrive", group: "google" },
  { label: "Gmail", href: "/gmail", icon: "Mail", group: "google" },
  { label: "Calendar", href: "/calendar", icon: "Calendar", group: "google" },
];
