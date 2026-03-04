import { getSheetsClient } from "./oauth-client";

export async function getSheetValues(spreadsheetId: string, range: string) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data;
}

export async function updateSheetValues(
  spreadsheetId: string,
  range: string,
  values: string[][]
) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
  return response.data;
}

export async function appendSheetValues(
  spreadsheetId: string,
  range: string,
  values: string[][]
) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
  return response.data;
}

export async function getSpreadsheetMeta(spreadsheetId: string) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  return response.data;
}
