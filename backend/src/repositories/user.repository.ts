import { pool } from '../db/pool';

export interface DbUser {
  id: string;
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
}

export class UserRepository {
  async findById(id: string): Promise<DbUser | null> {
    const res = await pool.query<DbUser>(
      'SELECT id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<DbUser | null> {
    const res = await pool.query<DbUser>(
      'SELECT id, email, phone, role, first_name, last_name, avatar_url, is_active, created_at, updated_at FROM users WHERE email = $1',
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
