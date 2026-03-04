export interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: {
    shopMoney: { amount: string; currencyCode: string };
  };
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        quantity: number;
        originalUnitPriceSet: {
          shopMoney: { amount: string; currencyCode: string };
        };
      };
    }>;
  };
  customer?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  productType: string;
  vendor: string;
  createdAt: string;
  updatedAt: string;
  totalInventory: number;
  featuredImage?: { url: string; altText?: string };
  priceRangeV2: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  };
}

export interface ShopifyCustomer {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  numberOfOrders: number;
  amountSpent: { amount: string; currencyCode: string };
  createdAt: string;
  tags: string[];
  emailMarketingConsent?: { marketingState: string };
}

export interface ShopifyAnalytics {
  totalSales: string;
  totalOrders: number;
  averageOrderValue: string;
  currency: string;
}

export interface ShopifyMediaImage {
  id: string;
  image: {
    url: string;
    altText?: string;
    width?: number;
    height?: number;
  };
  status: string;
  createdAt: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}
