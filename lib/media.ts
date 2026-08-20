import { cityImage, destinationImage } from "@/lib/destinations";

export function tripCoverImage(trip: {
  coverUrl?: string | null;
  toDestination: string;
  media?: { url: string; kind: string }[] | null;
}) {
  if (trip.coverUrl) return trip.coverUrl;
  const own = trip.media?.find((m) => m.kind === "COVER" || m.kind === "PHOTO");
  if (own?.url) return own.url;
  return destinationImage(trip.toDestination);
}

export function agencyAvatar(agency: {
  avatarUrl?: string | null;
  city: string;
  media?: { url: string; kind: string }[] | null;
}) {
  if (agency.avatarUrl) return agency.avatarUrl;
  const post = agency.media?.find((m) => m.kind === "PHOTO" || m.kind === "COVER");
  if (post?.url) return post.url;
  return cityImage(agency.city);
}

export function isProfilePost(media: {
  kind: string;
  tripId?: string | null;
  reviewId?: string | null;
  isPreviousTrip: boolean;
}) {
  if (media.tripId || media.reviewId) return false;
  if (media.kind !== "PHOTO" && media.kind !== "VIDEO") return false;
  return media.isPreviousTrip;
}
