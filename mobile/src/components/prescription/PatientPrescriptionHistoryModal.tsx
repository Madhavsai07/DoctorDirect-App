/**
 * DoctorDirect – Patient Prescription History Modal (Milestone 8)
 *
 * Displays all past finalized prescriptions for the logged-in patient.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Card, Badge, AppIcon, LoadingIndicator } from '../common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { loadPatientPrescriptions } from '../../store/slices/prescriptionSlice';
import PatientPrescriptionView from './PatientPrescriptionView';
import type { Prescription } from '../../types/prescription';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PatientPrescriptionHistoryModal({
  visible,
  onClose,
}: Props) {
  const dispatch = useAppDispatch();
  const { patientPrescriptions, isLoading } = useAppSelector(
    (s) => s.prescription
  );

  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);

  useEffect(() => {
    if (visible) {
      dispatch(loadPatientPrescriptions());
      setSelectedPrescription(null);
    }
  }, [visible, dispatch]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => {
              if (selectedPrescription) {
                setSelectedPrescription(null);
              } else {
                onClose();
              }
            }}
            style={styles.backBtn}
          >
            <AppIcon name="back" size={20} color={colors.text.primary} />
            <Text style={styles.backText}>
              {selectedPrescription ? 'All Prescriptions' : 'Close'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            {selectedPrescription ? 'Prescription Detail' : 'Prescription History'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {selectedPrescription ? (
            <PatientPrescriptionView prescription={selectedPrescription} />
          ) : (
            <>
              <Text style={styles.screenTitle}>My Prescriptions (Rx)</Text>
              <Text style={styles.screenSubtitle}>
                Access all official digital prescriptions issued by your doctors.
              </Text>

              {isLoading && patientPrescriptions.length === 0 ? (
                <LoadingIndicator message="Loading prescription records…" />
              ) : patientPrescriptions.length === 0 ? (
                <Card variant="default" padding="xl" style={styles.emptyCard}>
                  <AppIcon name="medical" size={32} color={colors.text.muted} />
                  <Text style={styles.emptyTitle}>No Prescriptions Found</Text>
                  <Text style={styles.emptySubtitle}>
                    When doctors prescribe medications for completed consultations, your digital prescriptions will appear here.
                  </Text>
                </Card>
              ) : (
                patientPrescriptions.map((pres) => (
                  <TouchableOpacity
                    key={pres.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPrescription(pres)}
                  >
                    <Card variant="default" padding="lg" style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemRx}>
                          <Text style={styles.itemRxText}>℞</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.doctorName}>{pres.doctorFullName}</Text>
                          <Text style={styles.doctorSpecialty}>
                            {pres.specializationName}
                          </Text>
                        </View>
                        <Badge label="Signed" variant="success" size="sm" />
                      </View>

                      <View style={styles.itemDivider} />

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Diagnosis:</Text>
                        <Text style={styles.infoValue}>{pres.diagnosis}</Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Medicines:</Text>
                        <Text style={styles.infoValue}>
                          {pres.medicines.map((m) => m.name).join(', ')}
                        </Text>
                      </View>

                      <View style={styles.itemFooter}>
                        <Text style={styles.dateText}>
                          Date: {pres.slotDate || new Date(pres.createdAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.viewLink}>View Details →</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  navTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
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
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  itemCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemRx: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRxText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  doctorName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  doctorSpecialty: {
    fontSize: typography.sizes.xs,
    color: colors.secondary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.medium,
  },
  infoValue: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: 11,
    color: colors.text.muted,
  },
  viewLink: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
});
