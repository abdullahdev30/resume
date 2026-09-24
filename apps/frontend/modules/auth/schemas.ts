export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function passwordsMatch(password: string, confirmation: string): boolean {
  return password === confirmation;
}

export function passwordRules(password: string) {
  return {
    length: password.length >= 8 && password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  return Object.values(passwordRules(password)).every(Boolean);
}