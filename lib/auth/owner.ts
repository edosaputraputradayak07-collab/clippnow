type OwnerConfig = {
  ownerEmail?: string;
};

export function isOwnerEmail(email: string | null | undefined, configuredOwnerEmail?: string): boolean {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedOwnerEmail = configuredOwnerEmail?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedOwnerEmail) return false;
  return normalizedEmail === normalizedOwnerEmail;
}

export function getOwnerConfig(env: OwnerConfig = process.env): OwnerConfig {
  return {
    ownerEmail: env.ownerEmail?.trim() || undefined,
  };
}
