// Shopify Analytics via REST Admin API (Shop info + order aggregation)
// The GraphQL Admin API doesn't expose analytics reports directly;
// we compute them from order data.

export const ANALYTICS_ORDERS_QUERY = `
  query GetAnalyticsOrders($first: Int!, $after: String, $query: String) {
    orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          createdAt
          displayFinancialStatus
          totalPriceSet {
            shopMoney { amount currencyCode }
          }
        }
      }
    }
  }
`;

export const SHOP_INFO_QUERY = `
  query GetShopInfo {
    shop {
      name
      myshopifyDomain
      currencyCode
      ianaTimezone
    }
  }
`;
