export function buildRenderCreditReference(projectId: string, attempt: number): string {
  if (!Number.isInteger(attempt) || attempt < 0) throw new Error('invalid_render_attempt');
  const reference = attempt === 0 ? projectId : `${projectId}:render:${attempt}`;
  if (reference.length > 128) throw new Error('credit_reference_too_long');
  return reference;
}
