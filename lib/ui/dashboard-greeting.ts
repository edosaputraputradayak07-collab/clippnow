export function getDashboardGreeting(fullName: string | null | undefined, _email?: string | null): string {
  return fullName?.trim() || 'Creator';
}
