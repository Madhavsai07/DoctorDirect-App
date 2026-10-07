import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireSupabaseAuth } from '../middleware/auth.middleware';
import { userRepository } from '../repositories/user.repository';

const authRouter = Router();

function validateEmail(email: unknown): string {
  if (typeof email !== 'string' || !email.trim()) {
    throw Object.assign(new Error('Email address is required.'), { status: 422 });
  }
  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed) || trimmed.length > 255) {
    throw Object.assign(new Error('Please enter a valid email address (e.g. name@example.com).'), { status: 422 });
  }
  return trimmed;
}

function validateName(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${label} is required.`), { status: 422 });
  }
  const trimmed = value.trim();
  if (trimmed.length > 100) {
    throw Object.assign(new Error(`${label} cannot exceed 100 characters.`), { status: 422 });
  }
  // Accepts standard human name characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    throw Object.assign(new Error(`${label} may only contain letters, spaces, hyphens, and apostrophes.`), { status: 422 });
  }
  return trimmed;
}

function optionalName(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  return validateName(value, label);
}

function validatePhone(value: unknown, isRequired = false, label = 'Phone number'): string | null {
  if (value === undefined || value === null || value === '') {
    if (isRequired) throw Object.assign(new Error(`${label} is required.`), { status: 422 });
    return null;
  }
  if (typeof value !== 'string') {
    throw Object.assign(new Error(`${label} must be a valid numeric phone string.`), { status: 422 });
  }
  const trimmed = value.trim();
  // Allow optional leading +, then digits only; length between 7 and 15 digits
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (!phoneRegex.test(trimmed)) {
    throw Object.assign(new Error(`${label} must contain only digits (7 to 15 numbers).`), { status: 422 });
  }
  return trimmed;
}

function validateDateOfBirth(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw Object.assign(new Error('Date of birth must be in YYYY-MM-DD format.'), { status: 422 });
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw Object.assign(new Error('Date of birth must use YYYY-MM-DD format.'), { status: 422 });
  }

  const [y, m, d] = trimmed.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d) {
    throw Object.assign(new Error('Date of birth is not a valid calendar date.'), { status: 422 });
  }

  // Prevent future dates
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    throw Object.assign(new Error('Date of birth cannot be in the future.'), { status: 422 });
  }

  // Prevent dates older than 130 years ago
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 130);
  if (parsed < minDate) {
    throw Object.assign(new Error('Date of birth must be a realistic date within the last 130 years.'), { status: 422 });
  }

  return trimmed;
}

function validateLicenseNumber(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error('Medical license number is required.'), { status: 422 });
  }
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 50) {
    throw Object.assign(new Error('Medical license number must be between 3 and 50 characters.'), { status: 422 });
  }
  const licenseRegex = /^[a-zA-Z0-9\-\/]+$/;
  if (!licenseRegex.test(trimmed)) {
    throw Object.assign(new Error('Medical license number must be alphanumeric (letters, numbers, hyphens, slashes).'), { status: 422 });
  }
  return trimmed;
}

function validateSpecialization(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error('Specialization is required.'), { status: 422 });
  }
  const trimmed = value.trim();
  if (trimmed.length > 100) {
    throw Object.assign(new Error('Specialization name cannot exceed 100 characters.'), { status: 422 });
  }
  return trimmed;
}

function validateQualification(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error('Qualification is required.'), { status: 422 });
  }
  const trimmed = value.trim();
  if (trimmed.length > 255) {
    throw Object.assign(new Error('Qualification cannot exceed 255 characters.'), { status: 422 });
  }
  return trimmed;
}

function optionalText(value: unknown, maxLength = 4000): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw Object.assign(new Error('Text field is invalid or exceeds maximum length.'), { status: 422 });
  }
  return value.trim();
}

authRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const profile = user.role === 'patient'
      ? await userRepository.getPatientProfile(user.id)
      : user.role === 'doctor'
        ? await userRepository.getDoctorProfile(user.id)
        : null;
    res.json({ user, profile });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register/patient', requireSupabaseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identity = req.authIdentity!;
    const validatedEmail = validateEmail(identity.email);

    const existing = await userRepository.findByAuthUserId(identity.id);
    if (existing) {
      if (existing.role !== 'patient') {
        res.status(409).json({ error: 'This account already has a different application role.' });
        return;
      }
      res.status(200).json({ user: existing });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const user = await userRepository.registerPatient({
      authUserId: identity.id,
      email: validatedEmail,
      firstName: validateName(body.firstName, 'First name'),
      lastName: validateName(body.lastName, 'Last name'),
      phone: validatePhone(body.phone, false, 'Phone number'),
      dateOfBirth: validateDateOfBirth(body.dateOfBirth),
      gender: optionalText(body.gender, 20),
      emergencyContactName: optionalName(body.emergencyContactName, 'Emergency contact name'),
      emergencyContactPhone: validatePhone(body.emergencyContactPhone, false, 'Emergency contact phone'),
    });
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register/doctor', requireSupabaseAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identity = req.authIdentity!;
    const validatedEmail = validateEmail(identity.email);

    const existing = await userRepository.findByAuthUserId(identity.id);
    if (existing) {
      if (existing.role !== 'doctor') {
        res.status(409).json({ error: 'This account already has a different application role.' });
        return;
      }
      res.status(200).json({ user: existing });
      return;
    }

    const body = req.body as Record<string, unknown>;

    // Experience validation
    const rawExp = body.experienceYears;
    const experienceYears = Number(rawExp);
    if (rawExp === undefined || rawExp === null || rawExp === '' || !Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 70) {
      res.status(422).json({ error: 'Years of experience must be a whole non-negative number (0-70).' });
      return;
    }

    // Fee validation
    const rawFee = body.consultationFee;
    const consultationFee = Number(rawFee);
    if (rawFee === undefined || rawFee === null || rawFee === '' || !Number.isFinite(consultationFee) || consultationFee < 0 || consultationFee > 100000) {
      res.status(422).json({ error: 'Consultation fee must be a valid non-negative number.' });
      return;
    }

    const idCardUrl = body.idCardUrl;
    if (
      typeof idCardUrl !== 'string' ||
      !idCardUrl.startsWith(`${identity.id}/`) ||
      idCardUrl.length > 1024
    ) {
      res.status(422).json({ error: 'Upload a government ID card before submitting your doctor application.' });
      return;
    }

    const user = await userRepository.registerDoctor({
      authUserId: identity.id,
      email: validatedEmail,
      firstName: validateName(body.firstName, 'First name'),
      lastName: validateName(body.lastName, 'Last name'),
      phone: validatePhone(body.phone, false, 'Phone number'),
      specializationName: validateSpecialization(body.specializationName),
      licenseNumber: validateLicenseNumber(body.licenseNumber),
      experienceYears,
      consultationFee,
      qualification: validateQualification(body.qualification),
      bio: optionalText(body.bio, 4000),
      idCardUrl,
    });
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

export default authRouter;