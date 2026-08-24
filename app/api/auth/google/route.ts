import { redirect } from "next/navigation";
import {
  appleOAuthConfigured,
  appleAuthorizeUrl,
  googleOAuthConfigured,
  googleAuthorizeUrl,
  parseOAuthFrom,
  parseOAuthRole,
  oauthErrorRedirect,
} from "@/lib/oauth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = parseOAuthRole(url.searchParams.get("role"));
  const from = parseOAuthFrom(url.searchParams.get("from"));
  if (!googleOAuthConfigured()) oauthErrorRedirect(role, from, "google_not_configured");
  redirect(await googleAuthorizeUrl(role, from));
}
