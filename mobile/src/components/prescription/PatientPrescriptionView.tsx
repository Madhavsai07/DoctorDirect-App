/**
 * DoctorDirect – Patient Prescription View (Milestone 8)
 *
 * Displays official finalized medical prescription for a patient.
 * Strictly read-only, shows doctor credentials, diagnosis, medicines, and advice.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Card, Badge, AppIcon, LoadingIndicator } from '../common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { loadPrescriptionByConsultation } from '../../store/slices/prescriptionSlice';
import type { Prescription } from '../../types/prescription';

interface Props {
  consultationId?: string;
  prescription?: Prescription | null;
}

export default function PatientPrescriptionView({
  consultationId,
  prescription: propPrescription,
}: Props) {
  const dispatch = useAppDispatch();
  const { activePrescription, isLoading } = useAppSelector((s) => s.prescription);

  useEffect(() => {
    if (consultationId && !propPrescription) {
      dispatch(loadPrescriptionByConsultation(consultationId));
    }
  }, [dispatch, consultationId, propPrescription]);

  const prescription = propPrescription ?? activePrescription;

  if (isLoading && !prescription) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator message="Checking for digital prescription…" />
      </View>
    );
  }

  if (!prescription) {
    return (
      <Card variant="default" padding="lg" style={styles.card}>
        <View style={styles.emptyContainer}>
          <AppIcon name="medical" size={24} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No Prescription Available</Text>
          <Text style={styles.emptySubtitle}>
            Your doctor has not issued a prescription for this visit.
          </Text>
        </View>
      </Card>
    );
  }

  // If doctor created draft but has not finalized yet
  if (!prescription.isSigned) {
    return (
      <Card variant="default" padding="lg" style={styles.card}>
        <View style={styles.pendingContainer}>
          <AppIcon name="clock" size={22} color={colors.status.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>Prescription Pending</Text>
            <Text style={styles.pendingSubtitle}>
              {prescription.doctorFullName} is currently preparing your digital prescription. It will be available here once finalized.
            </Text>
          </View>
          <Badge label="In Progress" variant="warning" size="sm" />
        </View>
      </Card>
    );
  }

  // Finalized Official Prescription
  return (
    <Card variant="elevated" padding="lg" style={styles.card}>
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.rxBadge}>
          <Text style={styles.rxSymbol}>℞</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Digital Prescription</Text>
          <Text style={styles.cardSubtitle}>Official Medical Record (Read-Only)</Text>
        </View>
        <Badge label="Digitally Signed" variant="success" size="sm" />
      </View>

      <View style={styles.divider} />

      {/* Doctor & Date Header */}
      <View style={styles.doctorInfoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorName}>{prescription.doctorFullName}</Text>
          <Text style={styles.doctorMeta}>
            {prescription.specializationName}
            {prescription.doctorQualification
              ? ` • ${prescription.doctorQualification}`
              : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.dateLabel}>Consultation Date</Text>
          <Text style={styles.dateValue}>
            {prescription.slotDate || new Date(prescription.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Diagnosis */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DIAGNOSIS</Text>
        <Text style={styles.diagnosisValue}>{prescription.diagnosis}</Text>
      </View>

      {/* Medicines */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          PRESCRIBED MEDICINES ({prescription.medicines.length})
        </Text>
        {prescription.medicines.map((med, index) => (
          <View key={index} style={styles.medicineCard}>
            <View style={styles.medTopRow}>
              <Text style={styles.medicineName}>
                {index + 1}. {med.name}
              </Text>
              {med.duration ? (
                <Badge label={med.duration} variant="neutral" size="sm" />
              ) : null}
            </View>

            <View style={styles.medSpecsRow}>
              <View style={styles.specBadge}>
                <Text style={styles.specLabel}>Dosage:</Text>
                <Text style={styles.specVal}>{med.dosage}</Text>
              </View>
              <View style={styles.specBadge}>
                <Text style={styles.specLabel}>Frequency:</Text>
                <Text style={styles.specVal}>{med.frequency}</Text>
              </View>
            </View>

            {med.instructions ? (
              <View style={styles.instructionsRow}>
                <AppIcon name="info" size={13} color={colors.secondary} />
                <Text style={styles.instructionsText}>{med.instructions}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {/* General Advice */}
      {prescription.generalAdvice ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DOCTOR'S ADVICE & INSTRUCTIONS</Text>
          <Text style={styles.adviceValue}>{prescription.generalAdvice}</Text>
        </View>
      ) : null}

      {/* Security & Verification Footer */}
      <View style={styles.footer}>
        <View style={styles.verifiedRow}>
          <AppIcon name="check" size={14} color={colors.status.success} />
          <Text style={styles.verifiedText}>
            Verified by DoctorDirect • Signed on{' '}
            {prescription.signedAt
              ? new Date(prescription.signedAt).toLocaleString()
              : new Date(prescription.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  emptyTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pendingTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pendingSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rxBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rxSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  doctorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  doctorMeta: {
    fontSize: typography.sizes.xs,
    color: colors.secondary,
    marginTop: 2,
  },
  dateLabel: {
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  diagnosisValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    lineHeight: 20,
  },
  medicineCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  medTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  medSpecsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  specVal: {
    fontSize: 11,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  instructionsText: {
    fontSize: typography.sizes.xs,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  adviceValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 11,
    color: colors.text.muted,
    flex: 1,
  },
});
