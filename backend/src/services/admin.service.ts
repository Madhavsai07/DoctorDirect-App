import { doctorRepository, DbDoctorListing } from '../repositories/doctor.repository';

/**
 * AdminService
 *
 * Business-logic layer for Milestone 10 admin operations.
 * Sits between controllers/routes and the repository.
 */
export const adminService = {

  /**
   * List doctors filtered by verification status.
   * Defaults to 'pending' if no status is given.
   */
  async listDoctorsByVerification(opts: {
    status?: 'pending' | 'approved' | 'rejected';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<DbDoctorListing[]> {
    return doctorRepository.listDoctors({
      search: opts.search,
      limit: opts.limit,
      offset: opts.offset,
      verificationStatus: opts.status ?? 'pending',
    });
  },

  /**
   * Get a single doctor's full profile (any verification status).
   */
  async getDoctorDetail(doctorId: string): Promise<DbDoctorListing> {
    const doc = await doctorRepository.findDoctorById(doctorId);
    if (!doc) {
      throw Object.assign(new Error('Doctor not found'), { status: 404 });
    }
    return doc;
  },

  /**
   * Approve a pending doctor.
   */
  async approveDoctor(doctorId: string, adminUserId: string): Promise<DbDoctorListing> {
    const current = await doctorRepository.getDoctorVerificationStatus(doctorId);
    if (current === null) {
      throw Object.assign(new Error('Doctor not found'), { status: 404 });
    }
    if (current === 'approved') {
      throw Object.assign(new Error('Doctor is already approved'), { status: 409 });
    }

    const updated = await doctorRepository.updateVerificationStatus(doctorId, 'approved', adminUserId);
    if (!updated) {
      throw Object.assign(new Error('Failed to update doctor verification status'), { status: 500 });
    }
    return updated;
  },

  /**
   * Reject a pending doctor.
   */
  async rejectDoctor(doctorId: string, adminUserId: string): Promise<DbDoctorListing> {
    const current = await doctorRepository.getDoctorVerificationStatus(doctorId);
    if (current === null) {
      throw Object.assign(new Error('Doctor not found'), { status: 404 });
    }
    if (current === 'rejected') {
      throw Object.assign(new Error('Doctor is already rejected'), { status: 409 });
    }

    const updated = await doctorRepository.updateVerificationStatus(doctorId, 'rejected', adminUserId);
    if (!updated) {
      throw Object.assign(new Error('Failed to update doctor verification status'), { status: 500 });
    }
    return updated;
  },
};
