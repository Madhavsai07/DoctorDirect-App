/**
 * Form Validation Utilities for DoctorDirect Patient & Doctor Registration
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;
export const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
export const LICENSE_REGEX = /^[a-zA-Z0-9\-\/]{3,50}$/;

export function sanitizePhoneInput(raw: string): string {
  // Retain leading + if present, and keep only numeric digits
  const hasLeadingPlus = raw.startsWith('+');
  const digitsOnly = raw.replace(/\D/g, '');
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

export function sanitizeDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function sanitizeDecimalInput(raw: string): string {
  // Allow numbers and at most one decimal point
  const clean = raw.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  return clean;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }
  if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 255) {
    return 'Enter a valid email address (e.g. name@example.com).';
  }
  return null;
}

export function validatePassword(password: string, isRegistering = false): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (isRegistering && password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}

export function validateName(name: string, label = 'Name', isRequired = true): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return isRequired ? `${label} is required.` : null;
  }
  if (trimmed.length > 100) {
    return `${label} cannot exceed 100 characters.`;
  }
  if (!NAME_REGEX.test(trimmed)) {
    return `${label} can only contain letters, spaces, hyphens, and apostrophes.`;
  }
  return null;
}

export function validatePhone(phone: string, isRequired = false, label = 'Phone number'): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return isRequired ? `${label} is required.` : null;
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return `${label} must contain 7 to 15 numeric digits (letters are not allowed).`;
  }
  return null;
}

export function validateDateOfBirth(dob: string, isRequired = false): string | null {
  const trimmed = dob.trim();
  if (!trimmed) {
    return isRequired ? 'Date of birth is required.' : null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return 'Date of birth must use YYYY-MM-DD format.';
  }
  const [y, m, d] = trimmed.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d) {
    return 'Invalid calendar date.';
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    return 'Date of birth cannot be in the future.';
  }
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 130);
  if (parsed < minDate) {
    return 'Date of birth must be a realistic date within the last 130 years.';
  }
  return null;
}

export function validateSpecialization(spec: string): string | null {
  const trimmed = spec.trim();
  if (!trimmed) {
    return 'Specialization is required.';
  }
  if (trimmed.length < 2 || trimmed.length > 100) {
    return 'Specialization must be between 2 and 100 characters.';
  }
  if (!NAME_REGEX.test(trimmed)) {
    return 'Specialization can only contain letters, spaces, and hyphens.';
  }
  return null;
}

export function validateLicenseNumber(license: string): string | null {
  const trimmed = license.trim();
  if (!trimmed) {
    return 'Medical license number is required.';
  }
  if (trimmed.length < 3 || trimmed.length > 50) {
    return 'License number must be between 3 and 50 characters.';
  }
  if (!LICENSE_REGEX.test(trimmed)) {
    return 'License number must be alphanumeric (e.g. MED-12345).';
  }
  return null;
}

export function validateExperienceYears(exp: string): string | null {
  const trimmed = exp.trim();
  if (!trimmed) {
    return 'Years of experience is required.';
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'Years of experience must be a whole number (0-70).';
  }
  const num = Number(trimmed);
  if (num < 0 || num > 70) {
    return 'Years of experience must be between 0 and 70.';
  }
  return null;
}

export function validateConsultationFee(fee: string): string | null {
  const trimmed = fee.trim();
  if (!trimmed) {
    return 'Consultation fee is required.';
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return 'Enter a valid fee (e.g. 50 or 75.50).';
  }
  const num = Number(trimmed);
  if (num < 0 || num > 100000) {
    return 'Consultation fee must be a positive amount.';
  }
  return null;
}

export function validateQualification(qual: string): string | null {
  const trimmed = qual.trim();
  if (!trimmed) {
    return 'Medical qualification is required (e.g. MBBS, MD).';
  }
  if (trimmed.length < 2 || trimmed.length > 255) {
    return 'Qualification must be between 2 and 255 characters.';
  }
  return null;
}
