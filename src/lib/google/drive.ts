import { getDriveClient } from "./oauth-client";

export async function listDriveFiles(
  folderId?: string,
  pageToken?: string,
  pageSize = 50
) {
  const drive = await getDriveClient();
  const query = folderId ? `'${folderId}' in parents` : undefined;

  const response = await drive.files.list({
    q: query,
    pageSize,
    pageToken,
    fields:
      "nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, parents)",
    orderBy: "modifiedTime desc",
  });
  return response.data;
}

export async function getDriveFile(fileId: string) {
  const drive = await getDriveClient();
  const response = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size, modifiedTime, webViewLink, parents, description",
  });
  return response.data;
}

export async function searchDriveFiles(query: string, pageSize = 20) {
  const drive = await getDriveClient();
  const response = await drive.files.list({
    q: `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
    pageSize,
    fields: "files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink)",
    orderBy: "modifiedTime desc",
  });
  return response.data;
}
