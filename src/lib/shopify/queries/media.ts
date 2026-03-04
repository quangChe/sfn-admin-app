export const FILES_QUERY = `
  query GetFiles($first: Int!, $after: String, $query: String) {
    files(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          alt
          createdAt
          fileStatus
          ... on MediaImage {
            image {
              url
              width
              height
              altText
            }
            mimeType
          }
          ... on GenericFile {
            url
            mimeType
          }
          ... on Video {
            filename
            sources {
              url
              mimeType
              width
              height
            }
          }
        }
      }
    }
  }
`;
