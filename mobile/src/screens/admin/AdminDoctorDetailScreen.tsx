import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchDoctorDetail,
  approveDoctorAction,
  rejectDoctorAction,
  clearActionMessage,
} from '../../store/slices/adminSlice';
import { AdminStackParamList } from '../../navigation/types';
import { VerificationStatus } from '../../services/admin/adminService';
import { colors, spacing, typography } from '../../theme';
import { showAlert } from '../../utils/alert';
import {
  Card,
  Badge,
  Button,
  AppIcon,
  EmptyState,
  ErrorView,
  LoadingIndicator,
} from '../../components/common';

type RouteProps = RouteProp<AdminStackParamList, 'AdminDoctorDetail'>;
type NavProps = NativeStackNavigationProp<AdminStackParamList, 'AdminDoctorDetail'>;

export default function AdminDoctorDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const dispatch = useAppDispatch();
  const { doctorId } = route.params;

  const { selectedDoctor, isLoading, isActionLoading, error, actionSuccessMessage } =
    useAppSelector((state) => state.admin);

  const [actionInProgress, setActionInProgress] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    dispatch(fetchDoctorDetail(doctorId));
  }, [dispatch, doctorId]);

  const handleApprove = () => {
    if (!selectedDoctor) return;
    showAlert(
      'Approve Doctor Credentials',
      `Are you sure you want to approve Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}? They will be published to the patient doctor directory and permitted to receive bookings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setActionInProgress('approve');
            await dispatch(approveDoctorAction(selectedDoctor.doctor_id));
            setActionInProgress(null);
          },
        },
      ]
    );
  };

  const handleReject = () => {
    if (!selectedDoctor) return;
    showAlert(
      'Reject Doctor Application',
      `Are you sure you want to reject Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}? They will be blocked from patient booking and practice features.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress('reject');
            await dispatch(rejectDoctorAction(selectedDoctor.doctor_id));
            setActionInProgress(null);
          },
        },
      ]
    );
  };

  const formatTimestamp = (dateStr: string | null) => {
    if (!dateStr) return 'Not recorded';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return <Badge label="Verified & Approved" variant="success" size="md" />;
      case 'rejected':
        return <Badge label="Application Rejected" variant="error" size="md" />;
      case 'pending':
      default:
        return <Badge label="Pending Verification" variant="warning" size="md" />;
    }
  };

  if (isLoading && !selectedDoctor) {
    return (
      <View style={styles.centerContainer}>
        <LoadingIndicator message="Loading doctor file..." />
      </View>
    );
  }

  if (error && !selectedDoctor) {
    return (
      <View style={styles.centerContainer}>
        <ErrorView message={error} onRetry={() => dispatch(fetchDoctorDetail(doctorId))} />
      </View>
    );
  }

  if (!selectedDoctor) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          icon="doctors"
          title="Doctor Not Found"
          description="The requested doctor record could not be loaded."
        />
        <Button
          title="Return to Dashboard"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const doctor = selectedDoctor;
  const initials = `${doctor.first_name[0] || ''}${doctor.last_name[0] || ''}`.toUpperCase();

  return (
    <View style={styles.root}>
      {/* Top Header / Back Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <AppIcon name="back" size={18} color={colors.primary} />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Doctor Verification</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Success Alert Banner */}
        {actionSuccessMessage && (
          <View style={styles.successBanner}>
            <View style={styles.bannerRow}>
              <AppIcon name="check" size={16} color={colors.status.successText} />
              <Text style={styles.successBannerText}>{actionSuccessMessage}</Text>
            </View>
            <TouchableOpacity onPress={() => dispatch(clearActionMessage())}>
              <AppIcon name="close" size={14} color={colors.status.successText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Doctor Summary Identity Card */}
        <Card variant="elevated" padding="lg" style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initials}</Text>
            </View>
            <View style={styles.identityInfoCol}>
              <Text style={styles.doctorFullName}>
                Dr. {doctor.first_name} {doctor.last_name}
              </Text>
              <Text style={styles.specializationSubtext}>
                {doctor.specialization_name}
              </Text>
              <View style={{ marginTop: 6 }}>
                {getStatusBadge(doctor.verification_status)}
              </View>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card variant="default" padding="lg" style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>CONTACT INFORMATION</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <AppIcon name="profile" size={16} color={colors.text.secondary} />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoFieldLabel}>Email Address</Text>
              <Text style={styles.infoFieldValue}>{doctor.email || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <AppIcon name="phone" size={16} color={colors.text.secondary} />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoFieldLabel}>Contact Phone</Text>
              <Text style={styles.infoFieldValue}>{doctor.phone || 'Not provided'}</Text>
            </View>
          </View>
        </Card>

        {/* Clinical Qualifications & License */}
        <Card variant="default" padding="lg" style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>PRACTICE CREDENTIALS</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.infoFieldLabel}>Medical Specialty</Text>
              <Text style={styles.credentialHighlight}>{doctor.specialization_name}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.infoFieldLabel}>License Number</Text>
              <Text style={styles.credentialHighlight}>{doctor.license_number}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: spacing.md }]}>
            <View style={styles.gridCol}>
              <Text style={styles.infoFieldLabel}>Highest Qualification</Text>
              <Text style={styles.credentialHighlight}>
                {doctor.qualification || 'MBBS / Registered Practitioner'}
              </Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.infoFieldLabel}>Clinical Experience</Text>
              <Text style={styles.credentialHighlight}>{doctor.experience_years} Years</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: spacing.md }]}>
            <View style={styles.gridCol}>
              <Text style={styles.infoFieldLabel}>Consultation Fee</Text>
              <Text style={[styles.credentialHighlight, { color: colors.secondary }]}>
                ${doctor.consultation_fee} USD
              </Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.infoFieldLabel}>Directory Availability</Text>
              <Text style={styles.credentialHighlight}>
                {doctor.is_available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Professional Biography */}
        <Card variant="default" padding="lg" style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>PROFESSIONAL SUMMARY & BIO</Text>
          <Text style={styles.bioText}>
            {doctor.bio && doctor.bio.trim().length > 0
              ? doctor.bio
              : 'No biographical statement provided with this application.'}
          </Text>
        </Card>

        {/* Verification Audit Trail */}
        <Card variant="default" padding="lg" style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>VERIFICATION AUDIT HISTORY</Text>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Current Status:</Text>
            <Text style={styles.auditValue}>
              {doctor.verification_status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Verified Date:</Text>
            <Text style={styles.auditValue}>
              {doctor.verified_at ? formatTimestamp(doctor.verified_at) : 'Awaiting review'}
            </Text>
          </View>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Verified By Admin ID:</Text>
            <Text style={[styles.auditValue, { fontSize: 12, fontFamily: 'monospace' }]}>
              {doctor.verified_by || 'None'}
            </Text>
          </View>
        </Card>

        {/* Action Decision Area */}
        <View style={styles.actionContainer}>
          {doctor.verification_status === 'pending' ? (
            <View style={styles.pendingActionGrid}>
              <Button
                title={actionInProgress === 'reject' ? 'Rejecting...' : 'Reject Application'}
                variant="outline"
                onPress={handleReject}
                isLoading={actionInProgress === 'reject'}
                disabled={isActionLoading}
                style={styles.rejectFullBtn}
                textStyle={{ color: colors.status.error }}
              />

              <Button
                title={actionInProgress === 'approve' ? 'Approving...' : 'Approve Doctor'}
                variant="primary"
                onPress={handleApprove}
                isLoading={actionInProgress === 'approve'}
                disabled={isActionLoading}
                style={styles.approveFullBtn}
              />
            </View>
          ) : doctor.verification_status === 'approved' ? (
            <View>
              <View style={styles.statusNoticeSuccess}>
                <AppIcon name="check" size={16} color={colors.status.successText} />
                <Text style={styles.statusNoticeSuccessText}>
                  This doctor is verified and live in the patient directory.
                </Text>
              </View>
              <Button
                title="Revoke Verification (Reject)"
                variant="outline"
                onPress={handleReject}
                isLoading={actionInProgress === 'reject'}
                disabled={isActionLoading}
                style={{ borderColor: colors.status.error, marginTop: spacing.sm }}
                textStyle={{ color: colors.status.error }}
              />
            </View>
          ) : (
            <View>
              <View style={styles.statusNoticeError}>
                <AppIcon name="warning" size={16} color={colors.status.errorText} />
                <Text style={styles.statusNoticeErrorText}>
                  This doctor application is currently rejected.
                </Text>
              </View>
              <Button
                title="Re-approve Doctor Application"
                variant="primary"
                onPress={handleApprove}
                isLoading={actionInProgress === 'approve'}
                disabled={isActionLoading}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
    marginLeft: 4,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.status.successBg,
    padding: spacing.sm + 2,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  successBannerText: {
    fontSize: typography.sizes.sm,
    color: colors.status.successText,
    fontWeight: typography.weights.semiBold,
    marginLeft: spacing.xs,
  },
  identityCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySubtle,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarLargeText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.primary,
  },
  identityInfoCol: {
    flex: 1,
  },
  doctorFullName: {
    fontSize: 20,
    fontWeight: typography.weights.heavy,
    color: colors.text.primary,
  },
  specializationSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm + 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoTextCol: {
    flex: 1,
  },
  infoFieldLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  infoFieldValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridCol: {
    flex: 1,
  },
  credentialHighlight: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  bioText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  auditLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  auditValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  actionContainer: {
    marginTop: spacing.xs,
  },
  pendingActionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectFullBtn: {
    flex: 1,
    borderColor: colors.status.error,
  },
  approveFullBtn: {
    flex: 1.2,
    backgroundColor: colors.status.success,
  },
  statusNoticeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#86efac',
    gap: spacing.xs,
  },
  statusNoticeSuccessText: {
    fontSize: typography.sizes.sm,
    color: colors.status.successText,
    fontWeight: typography.weights.semiBold,
    flex: 1,
  },
  statusNoticeError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBg,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#fca5a5',
    gap: spacing.xs,
  },
  statusNoticeErrorText: {
    fontSize: typography.sizes.sm,
    color: colors.status.errorText,
    fontWeight: typography.weights.semiBold,
    flex: 1,
  },
});
