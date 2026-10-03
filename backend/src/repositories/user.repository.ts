import { pool } from '../db/pool';

export interface DbUser {
  id: string;
  auth_user_id?: string | null;
  email: string;
  phone: string | null;
  role: 'patient' | 'doctor' | 'admin';
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DbPatientProfile {
  id: string;
  user_id: string;
  date_of_birth: Date | null;
  gender: string | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_history: string | null;
  allergies: string | null;
}

export interface DbDoctorProfile {
  id: string;
  user_id: string;
  specialization_id: string;
  specialization_name: string;
  license_number: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
  qualification: string | null;
  is_available: boolean;
  rating: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_at: Date | null;
  verified_by: string | null;
}

export class UserRepository {
  async findById(id: string): Promise<DbUser | null> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }
    const res = await pool.query<DbUser>(
      'SELECT id, auth_user_id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] ?? null;
  }

  async findByAuthUserId(authUserId: string): Promise<DbUser | null> {
    const res = await pool.query<DbUser>(
      'SELECT id, auth_user_id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at FROM users WHERE auth_user_id = $1',
      [authUserId]
    );
    return res.rows[0] ?? null;
  }

  async linkAuthUserByVerifiedEmail(authUserId: string, email: string): Promise<DbUser | null> {
    const res = await pool.query<DbUser>(
      `UPDATE users SET auth_user_id = $1
       WHERE LOWER(email) = LOWER($2) AND auth_user_id IS NULL
       RETURNING id, auth_user_id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at`,
      [authUserId, email]
    );
    return res.rows[0] ?? null;
  }

  async registerPatient(input: {
    authUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  }): Promise<DbUser> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.authUserId]);
      const existing = await client.query<DbUser>(
        'SELECT id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at FROM users WHERE auth_user_id = $1 FOR UPDATE',
        [input.authUserId]
      );
      if (existing.rows[0]) {
        await client.query('COMMIT');
        return existing.rows[0];
      }

      const created = await client.query<DbUser>(
        `INSERT INTO users (auth_user_id, email, phone, role, first_name, last_name)
         VALUES ($1, $2, $3, 'patient', $4, $5)
         RETURNING id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at`,
        [input.authUserId, input.email, input.phone, input.firstName, input.lastName]
      );
      await client.query(
        `INSERT INTO patients (user_id, date_of_birth, gender, emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5)`,
        [created.rows[0].id, input.dateOfBirth, input.gender, input.emergencyContactName, input.emergencyContactPhone]
      );
      await client.query('COMMIT');
      return created.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async registerDoctor(input: {
    authUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    specializationName: string;
    licenseNumber: string;
    experienceYears: number;
    consultationFee: number;
    qualification: string;
    bio: string | null;
  }): Promise<DbUser> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.authUserId]);
      const existing = await client.query<DbUser>(
        'SELECT id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at FROM users WHERE auth_user_id = $1 FOR UPDATE',
        [input.authUserId]
      );
      if (existing.rows[0]) {
        await client.query('COMMIT');
        return existing.rows[0];
      }

      const specialization = await client.query<{ id: string }>(
        'SELECT id FROM specializations WHERE LOWER(name) = LOWER($1)',
        [input.specializationName]
      );
      if (!specialization.rows[0]) {
        throw Object.assign(new Error('Choose a listed medical specialization.'), { status: 422 });
      }

      const created = await client.query<DbUser>(
        `INSERT INTO users (auth_user_id, email, phone, role, first_name, last_name)
         VALUES ($1, $2, $3, 'doctor', $4, $5)
         RETURNING id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at`,
        [input.authUserId, input.email, input.phone, input.firstName, input.lastName]
      );
      const docResult = await client.query<{ id: string }>(
        `INSERT INTO doctors (user_id, specialization_id, license_number, experience_years, consultation_fee, qualification, bio, is_available, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, 'pending')
         RETURNING id`,
        [created.rows[0].id, specialization.rows[0].id, input.licenseNumber, input.experienceYears, input.consultationFee, input.qualification, input.bio]
      );

      const doctorId = docResult.rows[0].id;

      // Create admin notifications for new doctor verification
      const admins = await client.query<{ id: string }>(
        "SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE"
      );
      for (const admin of admins.rows) {
        await client.query(
          `INSERT INTO notifications (recipient_user_id, type, title, message, doctor_id, event_key, is_read)
           VALUES ($1, 'doctor_verification_alert', 'New Doctor Verification Required', $2, $3, $4, FALSE)
           ON CONFLICT (event_key) DO NOTHING`,
          [
            admin.id,
            `Dr. ${input.firstName} ${input.lastName} (${input.specializationName}) has registered and submitted credentials for review.`,
            doctorId,
            `doc_reg_${doctorId}_${admin.id}`,
          ]
        );
      }

      await client.query('COMMIT');
      return created.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findByEmail(email: string): Promise<DbUser | null> {
    const res = await pool.query<DbUser>(
      'SELECT id, auth_user_id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return res.rows[0] ?? null;
  }

  async getPatientProfile(userId: string): Promise<DbPatientProfile | null> {
    const res = await pool.query<DbPatientProfile>(
      'SELECT * FROM patients WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] ?? null;
  }

  async getDoctorProfile(userId: string): Promise<DbDoctorProfile | null> {
    const res = await pool.query<DbDoctorProfile>(
      `SELECT d.*, s.name as specialization_name 
       FROM doctors d 
       JOIN specializations s ON d.specialization_id = s.id 
       WHERE d.user_id = $1`,
      [userId]
    );
    return res.rows[0] ?? null;
  }
}

export const userRepository = new UserRepository();
