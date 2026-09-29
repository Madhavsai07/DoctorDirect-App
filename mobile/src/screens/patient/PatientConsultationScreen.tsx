import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientAppointmentStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import {
  Card,
  Badge,
  Button,
  AppIcon,
  LoadingIndicator,
  ErrorView,
} from '../../components/common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { loadConsultationByAppointment } from '../../store/slices/consultationSlice';
import { PatientPrescriptionView } from '../../components/prescription';

type Props = NativeStackScreenProps<PatientAppointmentStackParamList, 'PatientConsultation'>;

export default function PatientConsultationScreen({ route, navigation }: Props) {
  const { appointmentId } = route.params;
  const dispatch = useAppDispatch();
  const { activeConsultation, isLoading, error } = useAppSelector((s) => s.consultation);

  useEffect(() => {
    dispatch(loadConsultationByAppointment(appointmentId));
  }, [dispatch, appointmentId]);

  if (isLoading && !activeConsultation) {
    return <LoadingIndicator fullScreen message="Loading consultation summary…" />;
  }

  if (error && !activeConsultation) {
    return (
      <View style={styles.errorContainer}>
        <ErrorView
          message={error}
          onRetry={() => dispatch(loadConsultationByAppointment(appointmentId))}
        />
        <Button
          title="Back to Appointments"
          onPress={() => navigation.goBack()}
          variant="outline"
          size="md"
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <AppIcon name="back" size={20} color={colors.text.primary} />
          <Text style={styles.backText}>Appointments</Text>
        </TouchableOpacity>
        <Badge
          label={activeConsultation?.status === 'completed' ? 'Completed Visit' : 'In Progress'}
          variant={activeConsultation?.status === 'completed' ? 'success' : 'info'}
          size="sm"
        />
      </View>

      <Text style={styles.screenTitle}>Consultation Summary</Text>
      <Text style={styles.screenSubtitle}>
        Official clinical notes and prescription from your consultation.
      </Text>

      {/* Doctor & Appointment Header Card */}
      {activeConsultation && (
        <Card variant="elevated" padding="lg" style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.avatarText}>
                {activeConsultation.doctorFullName
                  .replace('Dr. ', '')
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0] || '')
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>{activeConsultation.doctorFullName}</Text>
              <Text style={styles.doctorSpecialization}>
                {activeConsultation.specializationName}
                {activeConsultation.doctorQualification ? ` · ${activeConsultation.doctorQualification}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <AppIcon name="calendar" size={14} color={colors.primary} />
            <Text style={styles.infoLabel}>Date & Time:</Text>
            <Text style={styles.infoValue}>
              {activeConsultation.slotDate} ({activeConsultation.slotStartTime.slice(0, 5)} - {activeConsultation.slotEndTime.slice(0, 5)})
            </Text>
          </View>

          {activeConsultation.reasonForVisit ? (
            <View style={styles.infoRow}>
              <AppIcon name="medical" size={14} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Reason:</Text>
              <Text style={styles.infoValue}>{activeConsultation.reasonForVisit}</Text>
            </View>
          ) : null}
        </Card>
      )}

      {/* Clinical Summary Sections */}
      {activeConsultation && (
        <View style={styles.sectionList}>
          {/* Diagnosis Highlight */}
          {activeConsultation.diagnosis ? (
            <Card variant="default" padding="lg" style={styles.diagnosisCard}>
              <View style={styles.sectionHeader}>
                <AppIcon name="check" size={16} color={colors.primary} />
                <Text style={styles.diagnosisTitle}>Diagnosis</Text>
              </View>
              <Text style={styles.diagnosisBody}>{activeConsultation.diagnosis}</Text>
            </Card>
          ) : null}

          {/* Symptoms */}
          {activeConsultation.symptoms ? (
            <Card variant="default" padding="lg" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Reported Symptoms & Complaints</Text>
              <Text style={styles.sectionBody}>{activeConsultation.symptoms}</Text>
            </Card>
          ) : null}

          {/* Clinical Notes */}
          {activeConsultation.clinicalNotes ? (
            <Card variant="default" padding="lg" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Doctor Examination & Notes</Text>
              <Text style={styles.sectionBody}>{activeConsultation.clinicalNotes}</Text>
            </Card>
          ) : null}

          {/* Treatment Plan & Advice */}
          {activeConsultation.treatmentPlan ? (
            <Card variant="default" padding="lg" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Treatment Plan & Medical Advice</Text>
              <Text style={styles.sectionBody}>{activeConsultation.treatmentPlan}</Text>
            </Card>
          ) : null}

          {/* Prescription */}
          {activeConsultation.prescription ? (
            <Card variant="default" padding="lg" style={styles.prescriptionCard}>
              <View style={styles.sectionHeader}>
                <AppIcon name="medical" size={16} color={colors.secondary} />
                <Text style={styles.prescriptionTitle}>Prescription</Text>
              </View>
              <Text style={styles.prescriptionBody}>{activeConsultation.prescription}</Text>
            </Card>
          ) : null}

          {/* Follow-up Instructions */}
          {activeConsultation.followUpInstructions ? (
            <Card variant="default" padding="lg" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Follow-up Instructions</Text>
              <Text style={styles.sectionBody}>{activeConsultation.followUpInstructions}</Text>
            </Card>
          ) : null}

          {/* Official Digital Prescription (Milestone 8) */}
          <PatientPrescriptionView consultationId={activeConsultation.id} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  errorContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  screenTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },

  doctorCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  doctorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  doctorSpecialization: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.secondary,
    width: 80,
  },
  infoValue: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    flex: 1,
  },

  sectionList: {
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 22,
  },

  diagnosisCard: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  diagnosisTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diagnosisBody: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    lineHeight: 22,
  },

  prescriptionCard: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  prescriptionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prescriptionBody: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
});
