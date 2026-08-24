import {
  finishOAuthSignIn,
  googleProfileFromCode,
  oauthErrorRedirect,
  parseOAuthFrom,
  parseOAuthRole,
  readOAuthState,
} from "@/lib/oauth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = parseOAuthRole(url.searchParams.get("role"));
  const from = parseOAuthFrom(url.searchParams.get("from"));
  if (url.searchParams.get("error")) {
    oauthErrorRedirect(role, from, "denied");
  }
  const state = await readOAuthState(url.searchParams.get("state"));
  if (!state || state.provider !== "google") {
    oauthErrorRedirect(role, from, "invalid_state");
  }
  const code = url.searchParams.get("code") || "";
  if (!code) oauthErrorRedirect(state.role, state.from, "failed");
  try {
    const profile = await googleProfileFromCode(code, state.nonce);
    return finishOAuthSignIn(profile, state);
  } catch (error) {
    const codeName = error instanceof Error && error.message === "missing_email" ? "missing_email" : "failed";
    oauthErrorRedirect(state.role, state.from, codeName);
  }
}
