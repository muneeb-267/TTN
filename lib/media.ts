export function isPublicTripMedia(kind: string, isPreviousTrip: boolean) {
  return isPreviousTrip && (kind === "PHOTO" || kind === "VIDEO");
}
