import { createAdminApiClient } from "@shopify/admin-api-client";
import { env } from "@/lib/env";

let shopifyClient: ReturnType<typeof createAdminApiClient> | null = null;
let tokenExpiresAt = 0;
let refreshing: Promise<void> | null = null;

async function refresh(): Promise<void> {
  const res = await fetch(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env.SHOPIFY_CLIENT_ID!,
        client_secret: env.SHOPIFY_CLIENT_SECRET!,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Shopify token refresh failed: ${res.status}`);
  }

  const { access_token, expires_in } = await res.json();
  tokenExpiresAt = Date.now() + (expires_in - 300) * 1000; // refresh 5 min early

  shopifyClient = createAdminApiClient({
    storeDomain: env.SHOPIFY_STORE_DOMAIN,
    apiVersion: env.SHOPIFY_API_VERSION,
    accessToken: access_token,
  });
}

export async function getShopifyClient() {
  const canAutoRefresh = Boolean(env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET);

  if (!shopifyClient) {
    if (canAutoRefresh) {
      if (!refreshing) refreshing = refresh().finally(() => { refreshing = null; });
      await refreshing;
    } else {
      shopifyClient = createAdminApiClient({
        storeDomain: env.SHOPIFY_STORE_DOMAIN,
        apiVersion: env.SHOPIFY_API_VERSION,
        accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      });
    }
  } else if (canAutoRefresh && Date.now() >= tokenExpiresAt) {
    if (!refreshing) refreshing = refresh().finally(() => { refreshing = null; });
    await refreshing;
  }

  return shopifyClient!;
}
