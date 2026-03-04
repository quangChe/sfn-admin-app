export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          status
          productType
          vendor
          createdAt
          updatedAt
          totalInventory
          featuredImage {
            url
            altText
          }
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_ID_QUERY = `
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      description
      status
      productType
      vendor
      tags
      createdAt
      updatedAt
      totalInventory
      featuredImage { url altText }
      images(first: 10) {
        edges {
          node { id url altText width height }
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            sku
            price
            compareAtPrice
            inventoryQuantity
            selectedOptions { name value }
          }
        }
      }
      priceRangeV2 {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
    }
  }
`;
