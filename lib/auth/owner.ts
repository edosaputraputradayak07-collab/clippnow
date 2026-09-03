type OwnerEnv = {
  CLIPPNOW_OWNER_EMAIL?: string;
};

export function isOwnerEmail(email: string | null | undefined, configuredOwnerEmail?: string): boolean {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedOwnerEmail = configuredOwnerEmail?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedOwnerEmail) return false;
  return normalizedEmail === normalizedOwnerEmail;
}

export function isOwnerUser(email: string | null | undefined, env: OwnerEnv = process.env): boolean {
  return isOwnerEmail(email, env.CLIPPNOW_OWNER_EMAIL);
}
