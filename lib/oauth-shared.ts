export type OAuthProvider = "google" | "apple";
export type OAuthRole = "TRAVELER" | "AGENCY";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function parseOAuthRole(value: string | null | undefined): OAuthRole {
  return value === "AGENCY" ? "AGENCY" : "TRAVELER";
}

export function parseOAuthFrom(value: string | null | undefined): "login" | "signup" {
  return value === "signup" ? "signup" : "login";
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "apple";
}

export function oauthReturnPath(role: OAuthRole, from: "login" | "signup" = "login") {
  if (role === "AGENCY") return "/agency/login";
  return from === "signup" ? "/traveler/signup" : "/traveler/login";
}

export function oauthErrorCopy(code: string) {
  const messages: Record<string, string> = {
    google_not_configured:
      "Google sign-in is not live on this server yet. Use email, or ask TTN to set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    apple_not_configured:
      "Apple sign-in is not live on this server yet. Use email, or ask TTN to set the Apple Services ID and key.",
    denied: "Sign-in was cancelled. You can try again or use email.",
    invalid_state: "That sign-in link expired. Start again from the button.",
    missing_email:
      "The provider did not share an email. Share email on Google/Apple, or create an account with email.",
    role_mismatch: "This email is already registered under a different role. Use the matching portal.",
    suspended: "This account is suspended. Contact TTN support.",
    staff: "Staff sign in from the admin portal.",
    failed: "Could not finish Google or Apple sign-in. Try email, or try again.",
  };
  return messages[code] || messages.failed;
}
