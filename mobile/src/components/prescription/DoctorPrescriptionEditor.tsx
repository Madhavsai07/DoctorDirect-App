/**
 * DoctorDirect – Doctor Prescription Editor & Finalizer (Milestone 8)
 *
 * Integrated into the Doctor Consultation workspace.
 * Allows doctor to:
 * 1. Create prescription draft for completed consultation.
 * 2. Add multiple medicines (name, dosage, frequency, duration, instructions).
 * 3. Edit draft.
 * 4. Review prescription before signing.
 * 5. Finalize & sign prescription (locks into read-only immutable state).
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Card, Badge, Button, AppIcon } from '../common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  createPrescription,
  loadPrescriptionByConsultation,
  savePrescriptionDraft,
  finalizePrescription,
  clearPrescriptionError,
  clearPrescriptionSuccessMsg,
} from '../../store/slices/prescriptionSlice';
import type { MedicineItem } from '../../types/prescription';

interface Props {
  consultationId: string;
  defaultDiagnosis?: string;
  isConsultationCompleted: boolean;
}

const emptyMedicine = (): MedicineItem => ({
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

export default function DoctorPrescriptionEditor({
  consultationId,
  defaultDiagnosis = '',
  isConsultationCompleted,
}: Props) {
  const dispatch = useAppDispatch();
  const {
    activePrescription,
    isLoading,
    isSaving,
    isFinalizing,
    error,
    successMsg,
  } = useAppSelector((s) => s.prescription);

  const [mode, setMode] = useState<'edit' | 'review'>('edit');
  const [diagnosis, setDiagnosis] = useState('');
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [medicines, setMedicines] = useState<MedicineItem[]>([emptyMedicine()]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load prescription for this consultation
  useEffect(() => {
    if (consultationId) {
      dispatch(loadPrescriptionByConsultation(consultationId));
    }
  }, [dispatch, consultationId]);

  // Sync state when activePrescription loads
  useEffect(() => {
    if (activePrescription) {
      setDiagnosis(activePrescription.diagnosis || '');
      setGeneralAdvice(activePrescription.generalAdvice || '');
      if (activePrescription.medicines && activePrescription.medicines.length > 0) {
        setMedicines(activePrescription.medicines);
      } else {
        setMedicines([emptyMedicine()]);
      }
    } else {
      setDiagnosis(defaultDiagnosis);
    }
  }, [activePrescription, defaultDiagnosis]);

  const handleAddMedicine = () => {
    setMedicines([...medicines, emptyMedicine()]);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length <= 1) {
      setMedicines([emptyMedicine()]);
      return;
    }
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  const handleMedicineChange = (
    index: number,
    field: keyof MedicineItem,
    value: string
  ) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const validate = (): boolean => {
    if (!diagnosis.trim()) {
      setValidationError('Diagnosis is required for the prescription.');
      return false;
    }
    const filledMedicines = medicines.filter((m) => m.name.trim().length > 0);
    if (filledMedicines.length === 0) {
      setValidationError('Please add at least one medicine with a name.');
      return false;
    }
    for (let i = 0; i < filledMedicines.length; i++) {
      const m = filledMedicines[i];
      if (!m.dosage.trim()) {
        setValidationError(`Please specify the dosage for ${m.name}.`);
        return false;
      }
      if (!m.frequency.trim()) {
        setValidationError(`Please specify the frequency for ${m.name}.`);
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const handleCreateDraft = async () => {
    if (!isConsultationCompleted) {
      setValidationError(
        'The consultation must be marked as completed before creating an official prescription.'
      );
      return;
    }
    const filledMedicines = medicines.filter((m) => m.name.trim().length > 0);
    const validMeds =
      filledMedicines.length > 0
        ? filledMedicines
        : [
            {
              name: 'Paracetamol 500mg',
              dosage: '1 tablet',
              frequency: 'Twice daily',
              duration: '3 days',
              instructions: 'After meals',
            },
          ];

    dispatch(
      createPrescription({
        consultationId,
        diagnosis: diagnosis.trim() || defaultDiagnosis || 'Clinical Diagnosis',
        medicines: validMeds,
        generalAdvice: generalAdvice.trim() || undefined,
      })
    );
  };

  const handleSaveDraft = async () => {
    if (!activePrescription) return;
    setValidationError(null);
    const validMeds = medicines.filter((m) => m.name.trim().length > 0);
    dispatch(
      savePrescriptionDraft({
        id: activePrescription.id,
        data: {
          diagnosis: diagnosis.trim(),
          medicines: validMeds,
          generalAdvice: generalAdvice.trim() || undefined,
        },
      })
    );
  };

  const handleFinalize = async () => {
    if (!activePrescription) return;
    if (!validate()) return;

    // First save the latest draft changes to ensure synced data
    const validMeds = medicines.filter((m) => m.name.trim().length > 0);
    await dispatch(
      savePrescriptionDraft({
        id: activePrescription.id,
        data: {
          diagnosis: diagnosis.trim(),
          medicines: validMeds,
          generalAdvice: generalAdvice.trim() || undefined,
        },
      })
    );

    // Then finalize to lock it permanently
    dispatch(finalizePrescription(activePrescription.id));
  };

  const isFinalized = activePrescription?.isSigned === true;

  return (
    <Card variant="elevated" padding="lg" style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.rxBadge}>
            <Text style={styles.rxSymbol}>℞</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>Medical Prescription</Text>
            <Text style={styles.cardSubtitle}>
              {isFinalized
                ? 'Official Digitally Signed Document'
                : 'Digital Prescription Management'}
            </Text>
          </View>
        </View>
        <Badge
          label={
            isFinalized
              ? 'Finalized (Read-Only)'
              : activePrescription
              ? 'Draft'
              : 'Not Created'
          }
          variant={isFinalized ? 'success' : activePrescription ? 'warning' : 'neutral'}
          size="sm"
        />
      </View>

      {/* Notifications / Alerts */}
      {(error || validationError) && (
        <View style={styles.errorBanner}>
          <AppIcon name="warning" size={16} color={colors.status.error} />
          <Text style={styles.errorBannerText}>{validationError || error}</Text>
          <TouchableOpacity
            onPress={() => {
              setValidationError(null);
              dispatch(clearPrescriptionError());
            }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {successMsg && (
        <View style={styles.successBanner}>
          <AppIcon name="check" size={16} color={colors.status.success} />
          <Text style={styles.successBannerText}>{successMsg}</Text>
          <TouchableOpacity onPress={() => dispatch(clearPrescriptionSuccessMsg())}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CASE 1: No prescription exists yet */}
      {!activePrescription && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyNotice}>
            {isConsultationCompleted
              ? 'No prescription has been created for this completed visit yet.'
              : 'Complete the consultation first to create the official digital prescription.'}
          </Text>
          {isConsultationCompleted && (
            <Button
              title={isSaving ? 'Creating Draft…' : '+ Create Digital Prescription'}
              onPress={handleCreateDraft}
              variant="primary"
              size="md"
              disabled={isSaving}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>
      )}

      {/* CASE 2: Draft Mode - Edit */}
      {activePrescription && !isFinalized && mode === 'edit' && (
        <View style={styles.formContainer}>
          {/* Diagnosis */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Prescription Diagnosis *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acute Pharyngitis, Type 2 Diabetes"
              placeholderTextColor={colors.text.muted}
              value={diagnosis}
              onChangeText={setDiagnosis}
            />
          </View>

          {/* Medicines List */}
          <View style={styles.medicinesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Prescribed Medicines ({medicines.length})
              </Text>
              <TouchableOpacity
                onPress={handleAddMedicine}
                style={styles.addMedicineBtn}
              >
                <Text style={styles.addMedicineBtnText}>+ Add Medicine</Text>
              </TouchableOpacity>
            </View>

            {medicines.map((med, index) => (
              <View key={index} style={styles.medicineCard}>
                <View style={styles.medHeaderRow}>
                  <Text style={styles.medNumber}>Medicine #{index + 1}</Text>
                  {medicines.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMedicine(index)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Medicine Name */}
                <View style={styles.innerFieldGroup}>
                  <Text style={styles.innerLabel}>Medicine Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Tab Amoxicillin 500mg"
                    placeholderTextColor={colors.text.muted}
                    value={med.name}
                    onChangeText={(val) =>
                      handleMedicineChange(index, 'name', val)
                    }
                  />
                </View>

                {/* Dosage & Frequency */}
                <View style={styles.row}>
                  <View style={[styles.innerFieldGroup, { flex: 1, marginRight: spacing.sm }]}>
                    <Text style={styles.innerLabel}>Dosage *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1 tablet / 5ml"
                      placeholderTextColor={colors.text.muted}
                      value={med.dosage}
                      onChangeText={(val) =>
                        handleMedicineChange(index, 'dosage', val)
                      }
                    />
                  </View>
                  <View style={[styles.innerFieldGroup, { flex: 1 }]}>
                    <Text style={styles.innerLabel}>Frequency *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Twice daily / 1-0-1"
                      placeholderTextColor={colors.text.muted}
                      value={med.frequency}
                      onChangeText={(val) =>
                        handleMedicineChange(index, 'frequency', val)
                      }
                    />
                  </View>
                </View>

                {/* Duration & Instructions */}
                <View style={styles.row}>
                  <View style={[styles.innerFieldGroup, { flex: 1, marginRight: spacing.sm }]}>
                    <Text style={styles.innerLabel}>Duration</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 5 days / 1 month"
                      placeholderTextColor={colors.text.muted}
                      value={med.duration}
                      onChangeText={(val) =>
                        handleMedicineChange(index, 'duration', val)
                      }
                    />
                  </View>
                  <View style={[styles.innerFieldGroup, { flex: 1 }]}>
                    <Text style={styles.innerLabel}>Instructions</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. After meals with water"
                      placeholderTextColor={colors.text.muted}
                      value={med.instructions}
                      onChangeText={(val) =>
                        handleMedicineChange(index, 'instructions', val)
                      }
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* General Advice */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>General Advice / Lifestyle Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Drink 2-3 liters of warm water daily, adequate rest, avoid spicy food..."
              placeholderTextColor={colors.text.muted}
              value={generalAdvice}
              onChangeText={setGeneralAdvice}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              title={isSaving ? 'Saving…' : 'Save Draft'}
              onPress={handleSaveDraft}
              variant="outline"
              size="md"
              disabled={isSaving || isFinalizing}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="Review Prescription"
              onPress={() => {
                if (validate()) {
                  setMode('review');
                }
              }}
              variant="secondary"
              size="md"
              disabled={isSaving || isFinalizing}
              style={{ flex: 1.2 }}
            />
          </View>
        </View>
      )}

      {/* CASE 3: Review Mode */}
      {activePrescription && !isFinalized && mode === 'review' && (
        <View style={styles.reviewContainer}>
          <View style={styles.reviewBanner}>
            <AppIcon name="info" size={16} color={colors.secondary} />
            <Text style={styles.reviewBannerText}>
              Review the prescription details below. Once finalized, it will become an immutable, signed legal medical record.
            </Text>
          </View>

          <View style={styles.docPreview}>
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Diagnosis</Text>
              <Text style={styles.previewValue}>{diagnosis}</Text>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Medicines</Text>
              {medicines
                .filter((m) => m.name.trim().length > 0)
                .map((m, i) => (
                  <View key={i} style={styles.previewMedItem}>
                    <Text style={styles.previewMedName}>
                      {i + 1}. {m.name}
                    </Text>
                    <Text style={styles.previewMedDetail}>
                      {m.dosage} • {m.frequency} • {m.duration || 'As directed'}
                    </Text>
                    {m.instructions ? (
                      <Text style={styles.previewMedInstr}>
                        Note: {m.instructions}
                      </Text>
                    ) : null}
                  </View>
                ))}
            </View>

            {generalAdvice ? (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>General Advice</Text>
                <Text style={styles.previewValue}>{generalAdvice}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <Button
              title="Back to Edit"
              onPress={() => setMode('edit')}
              variant="outline"
              size="md"
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title={isFinalizing ? 'Finalizing…' : 'Finalize & Sign (Lock)'}
              onPress={handleFinalize}
              variant="primary"
              size="md"
              disabled={isFinalizing}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      )}

      {/* CASE 4: Finalized Mode - Read Only */}
      {isFinalized && (
        <View style={styles.finalizedContainer}>
          <View style={styles.verifiedStamp}>
            <AppIcon name="check" size={16} color={colors.status.success} />
            <Text style={styles.verifiedStampText}>
              Digitally Signed & Finalized
              {activePrescription.signedAt
                ? ` on ${new Date(activePrescription.signedAt).toLocaleDateString()}`
                : ''}
            </Text>
          </View>

          {/* Doctor & Patient Info */}
          <View style={styles.rxHeaderBox}>
            <View>
              <Text style={styles.docName}>{activePrescription.doctorFullName}</Text>
              <Text style={styles.docSpec}>
                {activePrescription.specializationName}
                {activePrescription.doctorQualification
                  ? ` • ${activePrescription.doctorQualification}`
                  : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rxDateLabel}>Consultation Date</Text>
              <Text style={styles.rxDateValue}>
                {activePrescription.slotDate || new Date(activePrescription.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Diagnosis */}
          <View style={styles.fieldDisplay}>
            <Text style={styles.displayLabel}>DIAGNOSIS</Text>
            <Text style={styles.displayDiagnosis}>{activePrescription.diagnosis}</Text>
          </View>

          {/* Medicines Table */}
          <View style={styles.fieldDisplay}>
            <Text style={styles.displayLabel}>RX - MEDICINES & DOSAGE</Text>
            {activePrescription.medicines.map((m, idx) => (
              <View key={idx} style={styles.finalMedCard}>
                <View style={styles.finalMedRow}>
                  <Text style={styles.finalMedName}>
                    {idx + 1}. {m.name}
                  </Text>
                  <Badge label={m.duration || 'As directed'} variant="neutral" size="sm" />
                </View>
                <Text style={styles.finalMedSchedule}>
                  Dosage: {m.dosage} | Frequency: {m.frequency}
                </Text>
                {m.instructions ? (
                  <Text style={styles.finalMedInstructions}>
                    Instructions: {m.instructions}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* General Advice */}
          {activePrescription.generalAdvice ? (
            <View style={styles.fieldDisplay}>
              <Text style={styles.displayLabel}>ADVICE & LIFESTYLE RECOMMENDATIONS</Text>
              <Text style={styles.displayAdvice}>{activePrescription.generalAdvice}</Text>
            </View>
          ) : null}

          {/* Read-Only Notice */}
          <View style={styles.readOnlyFooter}>
            <AppIcon name="info" size={14} color={colors.text.muted} />
            <Text style={styles.readOnlyFooterText}>
              This prescription is locked and read-only. It serves as an official medical record.
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rxBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rxSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
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

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBg,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorBannerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.status.errorText,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  successBannerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.status.successText,
  },
  dismissText: {
    fontSize: typography.sizes.sm,
    fontWeight: 'bold',
    color: colors.text.secondary,
    paddingHorizontal: 4,
  },

  // Empty state
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: spacing.borderRadius.md,
  },
  emptyNotice: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Form
  formContainer: {
    marginTop: spacing.sm,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },

  medicinesSection: {
    marginVertical: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  addMedicineBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primarySubtle,
    borderRadius: spacing.borderRadius.sm,
  },
  addMedicineBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
  },

  medicineCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  medNumber: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  removeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.status.error,
    fontWeight: typography.weights.semiBold,
  },
  innerFieldGroup: {
    marginBottom: spacing.xs,
  },
  innerLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },

  // Review Mode
  reviewContainer: {
    marginTop: spacing.sm,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondarySubtle,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  reviewBannerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.secondary,
    fontWeight: typography.weights.medium,
  },
  docPreview: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  previewSection: {
    marginBottom: spacing.md,
  },
  previewLabel: {
    fontSize: 11,
    color: colors.text.muted,
    textTransform: 'uppercase',
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 20,
  },
  previewMedItem: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewMedName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  previewMedDetail: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  previewMedInstr: {
    fontSize: typography.sizes.xs,
    color: colors.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Finalized View
  finalizedContainer: {
    marginTop: spacing.xs,
  },
  verifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.sm,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: spacing.md,
  },
  verifiedStampText: {
    fontSize: typography.sizes.xs,
    color: colors.status.successText,
    fontWeight: typography.weights.semiBold,
  },
  rxHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  docName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  docSpec: {
    fontSize: typography.sizes.xs,
    color: colors.secondary,
    marginTop: 2,
  },
  rxDateLabel: {
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  rxDateValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  fieldDisplay: {
    marginBottom: spacing.md,
  },
  displayLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  displayDiagnosis: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  finalMedCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  finalMedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalMedName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  finalMedSchedule: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 4,
  },
  finalMedInstructions: {
    fontSize: typography.sizes.xs,
    color: colors.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  displayAdvice: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  readOnlyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  readOnlyFooterText: {
    fontSize: 11,
    color: colors.text.muted,
    flex: 1,
  },
});
