export const PASSWORD_POLICY_MESSAGE = 'Password must be 12345678 or include at least 8 characters with one letter, one number, and one special character.';

export function isAllowedPassword(password: string) {
  const value = password.trim();
  if (value === '12345678') return true;
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}
