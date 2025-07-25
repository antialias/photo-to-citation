import { eq } from "drizzle-orm";
import { gravatarUrl } from "./gravatar";
import { orm } from "./orm";
import { users } from "./schema";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  socialLinks: string | null;
  address: string | null;
  cityStateZip: string | null;
  daytimePhone: string | null;
  driverLicenseNumber: string | null;
  driverLicenseState: string | null;
  language: string | null;
  profileStatus: string;
  profileReviewNotes: string | null;
  role: string;
}

export function getUser(id: string): UserRecord | null {
  const row = orm.select().from(users).where(eq(users.id, id)).get();
  if (!row) return null;
  const image = row.image?.trim()
    ? row.image
    : row.email
      ? gravatarUrl(row.email)
      : null;
  return { ...row, image };
}

export function getUserByEmail(email: string): UserRecord | null {
  const row = orm.select().from(users).where(eq(users.email, email)).get();
  if (!row) return null;
  const image = row.image?.trim()
    ? row.image
    : row.email
      ? gravatarUrl(row.email)
      : null;
  return { ...row, image };
}

export function updateUser(
  id: string,
  updates: Partial<
    Pick<
      UserRecord,
      | "name"
      | "image"
      | "bio"
      | "socialLinks"
      | "address"
      | "cityStateZip"
      | "daytimePhone"
      | "driverLicenseNumber"
      | "driverLicenseState"
      | "language"
      | "profileStatus"
      | "profileReviewNotes"
    >
  >,
): UserRecord | null {
  const data: Record<string, string | null> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.image !== undefined)
    data.image = updates.image?.trim() ? updates.image : null;
  if (updates.bio !== undefined) data.bio = updates.bio;
  if (updates.socialLinks !== undefined) data.socialLinks = updates.socialLinks;
  if (updates.address !== undefined) data.address = updates.address;
  if (updates.cityStateZip !== undefined)
    data.cityStateZip = updates.cityStateZip;
  if (updates.daytimePhone !== undefined)
    data.daytimePhone = updates.daytimePhone;
  if (updates.driverLicenseNumber !== undefined)
    data.driverLicenseNumber = updates.driverLicenseNumber;
  if (updates.driverLicenseState !== undefined)
    data.driverLicenseState = updates.driverLicenseState;
  if (updates.language !== undefined) data.language = updates.language;
  if (updates.profileStatus !== undefined)
    data.profileStatus = updates.profileStatus;
  if (updates.profileReviewNotes !== undefined)
    data.profileReviewNotes = updates.profileReviewNotes;
  if (Object.keys(data).length)
    orm.update(users).set(data).where(eq(users.id, id)).run();
  return getUser(id);
}

export function setProfileStatus(
  id: string,
  status: "under_review" | "published" | "hidden",
  notes?: string | null,
): void {
  orm
    .update(users)
    .set({ profileStatus: status, profileReviewNotes: notes ?? null })
    .where(eq(users.id, id))
    .run();
}
