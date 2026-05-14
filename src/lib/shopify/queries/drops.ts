export const DROPS_CALENDAR_QUERY = `
  query GetDropProducts($after: String) {
    products(
      first: 250
      after: $after
      query: "tag_prefix:0 OR tag_prefix:1 OR tag_prefix:2 OR tag_prefix:3 OR tag_prefix:4 OR tag_prefix:5 OR tag_prefix:6 OR tag_prefix:7 OR tag_prefix:8 OR tag_prefix:9"
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          tags
          status
          totalInventory
          priceRangeV2 {
            minVariantPrice {
              amount
            }
          }
        }
      }
    }
  }
`;

export const DROP_PRODUCTS_QUERY = `
  query GetDropByTag($tag: String!, $after: String) {
    products(first: 50, after: $after, query: $tag) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          description
          handle
          status
          tags
          images(first: 6) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                sku
                price
                compareAtPrice
                inventoryQuantity
              }
            }
          }
          metafields(
            identifiers: [
              { namespace: "custom", key: "cost" }
              { namespace: "fashionica", key: "condition_grade" }
              { namespace: "fashionica", key: "material" }
              { namespace: "fashionica", key: "hardware_color" }
              { namespace: "fashionica", key: "year" }
              { namespace: "fashionica", key: "serial_number" }
              { namespace: "fashionica", key: "reshoot_notes" }
              { namespace: "channels", key: "tiktok_price" }
              { namespace: "channels", key: "whatnot_price" }
            ]
          ) {
            namespace
            key
            value
          }
        }
      }
    }
  }
`;
