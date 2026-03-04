export const CUSTOMERS_QUERY = `
  query GetCustomers($first: Int!, $after: String, $query: String) {
    customers(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          displayName
          email
          phone
          numberOfOrders
          amountSpent { amount currencyCode }
          createdAt
          tags
          emailMarketingConsent { marketingState }
        }
      }
    }
  }
`;

export const CUSTOMER_BY_ID_QUERY = `
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      id
      displayName
      firstName
      lastName
      email
      phone
      numberOfOrders
      amountSpent { amount currencyCode }
      createdAt
      updatedAt
      tags
      note
      verifiedEmail
      emailMarketingConsent { marketingState marketingOptInLevel }
      defaultAddress {
        address1
        address2
        city
        province
        zip
        country
        phone
      }
      orders(first: 10, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            totalPriceSet {
              shopMoney { amount currencyCode }
            }
          }
        }
      }
    }
  }
`;
