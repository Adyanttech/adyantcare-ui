// Small pure helpers, kept apart from the components so they are easy to test.

/** Fills {patient}, {doctor}, {hospital}, {date} and {time} in a reminder message. Unknown placeholders are left as they are. */
export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? values[key]! : whole));
}

export const TEMPLATE_PLACEHOLDERS = ['patient', 'doctor', 'hospital', 'date', 'time'] as const;

/** Placeholders in the text that the server will not accept. */
export function unknownPlaceholders(template: string): string[] {
  const found = [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  return [...new Set(found.filter((k) => !(TEMPLATE_PLACEHOLDERS as readonly string[]).includes(k)))];
}

/** True when the digits typed look like a full mobile number (10 digits, with or without the country code). */
export function looksLikePhone(country: 'IN' | 'US', raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  const code = country === 'US' ? '1' : '91';
  return digits.length === 10 || (digits.length === 10 + code.length && digits.startsWith(code));
}

/** True when the text has the digit count of an Aadhaar (12) or SSN (9). The server does the real validation. */
export function looksLikeNationalId(country: 'IN' | 'US', raw: string): boolean {
  return raw.replace(/\D/g, '').length === (country === 'US' ? 9 : 12);
}
