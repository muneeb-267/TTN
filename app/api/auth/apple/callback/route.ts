import {
  appleProfileFromCallback,
  finishOAuthSignIn,
  oauthErrorRedirect,
  parseOAuthFrom,
  parseOAuthRole,
  readOAuthState,
} from "@/lib/oauth";

async function finish(fields: Record<string, string>) {
  const fallbackRole = parseOAuthRole(fields.role);
  const fallbackFrom = parseOAuthFrom(fields.from);
  if (fields.error) {
    oauthErrorRedirect(fallbackRole, fallbackFrom, "denied");
  }
  const state = await readOAuthState(fields.state);
  if (!state || state.provider !== "apple") {
    oauthErrorRedirect(fallbackRole, fallbackFrom, "invalid_state");
  }
  const idToken = fields.id_token || "";
  if (!idToken) oauthErrorRedirect(state.role, state.from, "failed");
  try {
    const profile = await appleProfileFromCallback({
      idToken,
      code: fields.code,
      nonce: state.nonce,
      userJson: fields.user,
    });
    return finishOAuthSignIn(profile, state);
  } catch (error) {
    const codeName = error instanceof Error && error.message === "missing_email" ? "missing_email" : "failed";
    oauthErrorRedirect(state.role, state.from, codeName);
  }
}

export async function POST(req: Request) {
  const form = await req.formData();
  const fields: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") fields[key] = value;
  });
  return finish(fields);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fields: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    fields[key] = value;
  });
  return finish(fields);
}
