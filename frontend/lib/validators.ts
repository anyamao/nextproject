// lib/validators.ts

export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,30}$/.test(username);
}

export function validatePassword(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  return strength;
}

export function getPasswordStrengthLabel(strength: number): string {
  switch (strength) {
    case 0:
      return "Очень слабый";
    case 1:
      return "Слабый";
    case 2:
      return "Средний";
    case 3:
      return "Надежный";
    case 4:
      return "Очень надежный";
    default:
      return "";
  }
}
