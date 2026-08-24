import { redirect } from "next/navigation";
import {
  appleAuthorizeUrl,
  appleOAuthConfigured,
  parseOAuthFrom,
  parseOAuthRole,
  oauthErrorRedirect,
} from "@/lib/oauth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = parseOAuthRole(url.searchParams.get("role"));
  const from = parseOAuthFrom(url.searchParams.get("from"));
  if (!appleOAuthConfigured()) oauthErrorRedirect(role, from, "apple_not_configured");
  redirect(await appleAuthorizeUrl(role, from));
}
