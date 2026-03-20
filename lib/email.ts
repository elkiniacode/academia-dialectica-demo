import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

async function createTransport() {
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID as string,
    process.env.GMAIL_CLIENT_SECRET as string,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN as string,
  });

  const { token: accessToken } = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER as string,
      clientId: process.env.GMAIL_CLIENT_ID as string,
      clientSecret: process.env.GMAIL_CLIENT_SECRET as string,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN as string,
      accessToken: accessToken ?? undefined,
    },
  } as any); // nodemailer's TS definitions are strict about OAuth2 shape
}

export async function sendEmail(to: string, subject: string, html: string) {
  const transport = await createTransport();
  try {
    await transport.sendMail({
      from: `"Academia Dialéctica" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[email] Failed to send to ${to}:`, error);
    throw error; // Re-throw so cron job skips this lead and retries tomorrow
  }
}
