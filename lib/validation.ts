/**
 * Shared form-validation helpers — plain regex, no external library, used by
 * both the React form components (client) and the API routes that persist the
 * data (server). The server check is the boundary that actually matters, since
 * a direct fetch/curl bypasses every client-side guard.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS_RE = /^\+?[0-9\s\-()]+$/;
// Latin letters + spaces/apostrophes/periods/hyphens. Widen for non-Latin names.
const NAME_RE = /^[A-Za-z\s'.-]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Indian mobile: 10 digits beginning 6-9, ignoring a +91 / 0 prefix and any
 * spaces/dashes/brackets. Adjust the digit rule for other locales.
 */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_CHARS_RE.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "").replace(/^(91|0)/, "");
  return /^[6-9]\d{9}$/.test(digits);
}

export function isValidName(value: string): boolean {
  return NAME_RE.test(value.trim());
}

/** Live-typing filter: keeps phone chars and caps the raw digit count at 12
 *  (10 national digits + a possible 91/0 prefix). */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^0-9\s\-+()]/g, "");
  let digitCount = 0;
  let result = "";
  for (const char of cleaned) {
    if (/[0-9]/.test(char)) {
      digitCount += 1;
      if (digitCount > 12) continue;
    }
    result += char;
  }
  return result;
}

/** Live-typing filter: letters, spaces, apostrophes, periods, hyphens only. */
export function sanitizeNameInput(value: string): string {
  return value.replace(/[^A-Za-z\s'.-]/g, "");
}
