import { createAdminApiClient } from "@shopify/admin-api-client";
import { env } from "@/lib/env";

let shopifyClient: ReturnType<typeof createAdminApiClient> | null = null;

export function getShopifyClient() {
  if (!shopifyClient) {
    shopifyClient = createAdminApiClient({
      storeDomain: env.SHOPIFY_STORE_DOMAIN,
      apiVersion: env.SHOPIFY_API_VERSION,
      accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    });
  }
  return shopifyClient;
}
