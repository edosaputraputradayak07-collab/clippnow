export function getPasswordInputType(visible: boolean): 'password' | 'text' {
  return visible ? 'text' : 'password';
}
