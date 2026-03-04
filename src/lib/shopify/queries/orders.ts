export const ORDERS_QUERY = `
  query GetOrders($first: Int!, $after: String, $query: String) {
    orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          name
          email
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customer {
            id
            displayName
            email
          }
          lineItems(first: 5) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const ORDER_BY_ID_QUERY = `
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      name
      email
      phone
      createdAt
      updatedAt
      displayFinancialStatus
      displayFulfillmentStatus
      note
      tags
      totalPriceSet {
        shopMoney { amount currencyCode }
      }
      subtotalPriceSet {
        shopMoney { amount currencyCode }
      }
      totalTaxSet {
        shopMoney { amount currencyCode }
      }
      totalShippingPriceSet {
        shopMoney { amount currencyCode }
      }
      customer {
        id
        displayName
        email
        phone
      }
      shippingAddress {
        name
        address1
        address2
        city
        province
        zip
        country
      }
      lineItems(first: 50) {
        edges {
          node {
            id
            title
            quantity
            sku
            originalUnitPriceSet {
              shopMoney { amount currencyCode }
            }
            variant {
              id
              title
              image { url altText }
            }
          }
        }
      }
      fulfillments {
        id
        status
        trackingInfo { number url company }
        createdAt
      }
    }
  }
`;
