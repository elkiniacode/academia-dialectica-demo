import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

function getOAuth2Client() {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID as string,
    process.env.GOOGLE_CLIENT_SECRET as string,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN as string,
  });
  return oauth2Client;
}

function makeRawMessage(to: string, subject: string, html: string): string {
  const from = `"Academia Dialéctica" <${process.env.GMAIL_USER}>`;
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail(to: string, subject: string, html: string) {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth });

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: makeRawMessage(to, subject, html) },
    });
  } catch (error) {
    console.error(`[email] Failed to send to ${to}:`, error);
    throw error; // Re-throw so cron job skips this lead and retries tomorrow
  }
}
