export type DropType = "bags" | "watches" | "jewelry" | "mixed";
export type DropStatus = "future" | "draft" | "upcoming" | "live" | "ended";
export type WorkflowStage =
  | "receive"
  | "photography"
  | "authentication"
  | "copy"
  | "specs"
  | "pricing"
  | "channels";
export type Channel = "shopify" | "tiktok" | "whatnot";

export interface DropTag {
  raw: string;
  date: Date;
  type: DropType;
}

export interface Drop {
  tag: DropTag;
  name: string;
  productCount: number;
  activeCount: number;
  status: DropStatus;
  channels: Channel[];
  completionPct: number;
}

// JSON-serializable shape returned by API routes (date as ISO string)
export interface DropApiDrop {
  tag: string;
  date: string;
  type: DropType;
  name: string;
  productCount: number;
  activeCount: number;
  status: DropStatus;
  channels: Channel[];
  completionPct: number;
}

export interface DropProductImage {
  id: string;
  url: string;
  altText: string | null;
}

export interface DropProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  tags: string[];
  sku: string;
  variantId: string;
  images: DropProductImage[];
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
  cost: string | null;
  // Copy tab
  description: string;
  // Specs tab (fashionica namespace metafields)
  conditionGrade: string | null;
  material: string | null;
  hardwareColor: string | null;
  year: string | null;
  serialNumber: string | null;
  // Media tab
  reshootNotes: string | null;
  // Channels tab (channels namespace metafields)
  tiktokPrice: string | null;
  whatnotPrice: string | null;
}

export interface PriceUpdate {
  price: string;
  compareAtPrice: string | null;
}

export interface WorkflowTab {
  id: WorkflowStage;
  label: string;
  emoji: string;
  path: string;
  doneCount: number;
  totalCount: number;
}
