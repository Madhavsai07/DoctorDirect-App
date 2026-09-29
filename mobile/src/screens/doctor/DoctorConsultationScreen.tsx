import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DoctorAppointmentStackParamList } from '../../navigation/types';
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
import {
  startOrGetConsultation,
  saveConsultationDraft,
  completeConsultation,
  clearConsultationError,
  clearSuccessMsg,
} from '../../store/slices/consultationSlice';
import { loadDoctorAppointments } from '../../store/slices/appointmentSlice';
import { DoctorPrescriptionEditor } from '../../components/prescription';

type Props = NativeStackScreenProps<DoctorAppointmentStackParamList, 'DoctorConsultation'>;

export default function DoctorConsultationScreen({ route, navigation }: Props) {
  const { appointmentId } = route.params;
  const dispatch = useAppDispatch();
  const {
    activeConsultation,
    isLoading,
    isSaving,
    isCompleting,
    error,
    successMsg,
  } = useAppSelector((s) => s.consultation);

  // Form state
  const [symptoms, setSymptoms] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescription, setPrescription] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(startOrGetConsultation(appointmentId));
  }, [dispatch, appointmentId]);

  // Sync form inputs when consultation loads
  useEffect(() => {
    if (activeConsultation) {
      setSymptoms(activeConsultation.symptoms || '');
      setClinicalNotes(activeConsultation.clinicalNotes || '');
      setDiagnosis(activeConsultation.diagnosis || '');
      setTreatmentPlan(activeConsultation.treatmentPlan || '');
      setPrescription(activeConsultation.prescription || '');
      setFollowUp(activeConsultation.followUpInstructions || '');
    }
  }, [activeConsultation]);

  const isCompleted = activeConsultation?.status === 'completed';

  const handleSaveDraft = async () => {
    if (!activeConsultation) return;
    setValidationError(null);
    await dispatch(
      saveConsultationDraft({
        id: activeConsultation.id,
        data: {
          symptoms,
          clinical_notes: clinicalNotes,
          diagnosis,
          treatment_plan: treatmentPlan,
          prescription,
          follow_up_instructions: followUp,
        },
      })
    );
  };

  const handleComplete = async () => {
    if (!activeConsultation) return;
    if (!diagnosis.trim()) {
      setValidationError('Please provide a Diagnosis before finalizing the consultation.');
      return;
    }
    setValidationError(null);
    const result = await dispatch(
      completeConsultation({
        id: activeConsultation.id,
        data: {
          symptoms,
          clinical_notes: clinicalNotes,
          diagnosis,
          treatment_plan: treatmentPlan,
          prescription,
          follow_up_instructions: followUp,
        },
      })
    );
    if (completeConsultation.fulfilled.match(result)) {
      // Refresh appointments list in store
      dispatch(loadDoctorAppointments('all'));
    }
  };

  if (isLoading && !activeConsultation) {
    return <LoadingIndicator fullScreen message="Loading consultation workspace…" />;
  }

  if (error && !activeConsultation) {
    return (
      <View style={styles.errorContainer}>
        <ErrorView
          message={error}
          onRetry={() => dispatch(startOrGetConsultation(appointmentId))}
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
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <AppIcon name="back" size={20} color={colors.text.primary} />
          <Text style={styles.backText}>Appointments</Text>
        </TouchableOpacity>
        <Badge
          label={isCompleted ? 'Finalized' : 'In Progress'}
          variant={isCompleted ? 'success' : 'info'}
          size="sm"
        />
      </View>

      <Text style={styles.screenTitle}>Clinical Consultation</Text>
      <Text style={styles.screenSubtitle}>
        {isCompleted
          ? 'This consultation is complete and archived as an official visit record.'
          : 'Record clinical observations, diagnosis, treatment, and prescription.'}
      </Text>

      {/* Error & Feedback Banners */}
      {(error || validationError) && (
        <View style={styles.errorBanner}>
          <AppIcon name="warning" size={16} color={colors.status.error} />
          <Text style={styles.errorBannerText}>{validationError || error}</Text>
          <TouchableOpacity
            onPress={() => {
              setValidationError(null);
              dispatch(clearConsultationError());
            }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {successMsg && (
        <View style={styles.feedbackBanner}>
          <AppIcon name="check" size={16} color={colors.status.success} />
          <Text style={styles.feedbackBannerText}>{successMsg}</Text>
          <TouchableOpacity onPress={() => dispatch(clearSuccessMsg())}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Patient Profile Card */}
      {activeConsultation && (
        <Card variant="elevated" padding="lg" style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <Text style={styles.avatarText}>
                {activeConsultation.patientFullName
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0] || '')
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{activeConsultation.patientFullName}</Text>
              <Text style={styles.patientMeta}>
                {activeConsultation.patientGender || 'Gender unspecified'}
                {activeConsultation.patientAge ? ` · ${activeConsultation.patientAge} yrs` : ''}
                {activeConsultation.patientBloodGroup ? ` · Blood: ${activeConsultation.patientBloodGroup}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <AppIcon name="calendar" size={14} color={colors.secondary} />
            <Text style={styles.infoLabel}>Scheduled:</Text>
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

          {activeConsultation.patientAllergies ? (
            <View style={styles.infoRow}>
              <AppIcon name="warning" size={14} color="#f59e0b" />
              <Text style={[styles.infoLabel, { color: '#b45309' }]}>Allergies:</Text>
              <Text style={[styles.infoValue, { color: '#b45309', fontWeight: '600' }]}>
                {activeConsultation.patientAllergies}
              </Text>
            </View>
          ) : null}

          {activeConsultation.patientMedicalHistory ? (
            <View style={styles.infoRow}>
              <AppIcon name="info" size={14} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>History:</Text>
              <Text style={styles.infoValue}>{activeConsultation.patientMedicalHistory}</Text>
            </View>
          ) : null}
        </Card>
      )}

      {/* Clinical Form */}
      <Card variant="default" padding="xl" style={styles.formCard}>
        {/* Symptoms */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Chief Complaints & Symptoms</Text>
          <TextInput
            style={[styles.textInput, isCompleted && styles.disabledInput]}
            placeholder="e.g. Chest tightness on exertion for 3 days, mild shortness of breath..."
            placeholderTextColor={colors.text.muted}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={3}
            editable={!isCompleted}
          />
        </View>

        {/* Diagnosis */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Diagnosis</Text>
            {!isCompleted && <Text style={styles.requiredMark}>*Required for completion</Text>}
          </View>
          <TextInput
            style={[styles.textInput, isCompleted && styles.disabledInput]}
            placeholder="e.g. Mild Exertional Angina, Stage 1 Essential Hypertension..."
            placeholderTextColor={colors.text.muted}
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
            numberOfLines={2}
            editable={!isCompleted}
          />
        </View>

        {/* Clinical Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Clinical Examination & Findings</Text>
          <TextInput
            style={[styles.textInput, isCompleted && styles.disabledInput]}
            placeholder="e.g. BP 138/88 mmHg, HR 74 bpm regular, S1/S2 heard, no murmurs..."
            placeholderTextColor={colors.text.muted}
            value={clinicalNotes}
            onChangeText={setClinicalNotes}
            multiline
            numberOfLines={4}
            editable={!isCompleted}
          />
        </View>

        {/* Treatment Plan & Advice */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Treatment & Medical Advice</Text>
          <TextInput
            style={[styles.textInput, isCompleted && styles.disabledInput]}
            placeholder="e.g. Low sodium diet, 30 min daily brisk walk, stress reduction..."
            placeholderTextColor={colors.text.muted}
            value={treatmentPlan}
            onChangeText={setTreatmentPlan}
            multiline
            numberOfLines={3}
            editable={!isCompleted}
          />
        </View>

        {/* Prescription */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Digital Prescription (Medicines & Dosage)</Text>
          <TextInput
            style={[styles.textInput, isCompleted && styles.disabledInput]}
            placeholder="e.g. 1. Tab Telmisartan 40mg - 1 tablet once daily morning (30 days)&#10;2. Tab Aspirin 75mg - 1 tablet after dinner (30 days)"
            placeholderTextColor={colors.text.muted}
            value={prescription}
            onChangeText={setPrescription}
            multiline
            numberOfLines={4}
            editable={!isCompleted}
          />
        </View>

        {/* Follow-up Instructions */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Follow-up Instructions</Text>
          <TextInput
            style={[styles.textInput, isCompleted && styles.disabledInput]}
            placeholder="e.g. Review after 2 weeks with fasting lipid profile and ECG report."
            placeholderTextColor={colors.text.muted}
            value={followUp}
            onChangeText={setFollowUp}
            multiline
            numberOfLines={2}
            editable={!isCompleted}
          />
        </View>

        {/* Actions */}
        {!isCompleted ? (
          <View style={styles.actionRow}>
            <Button
              title={isSaving ? 'Saving…' : 'Save Draft'}
              onPress={handleSaveDraft}
              variant="outline"
              size="md"
              style={{ flex: 1, marginRight: spacing.sm }}
              disabled={isSaving || isCompleting}
            />
            <Button
              title={isCompleting ? 'Completing…' : 'Complete Consultation'}
              onPress={handleComplete}
              variant="primary"
              size="md"
              style={{ flex: 1.5 }}
              disabled={isSaving || isCompleting}
            />
          </View>
        ) : (
          <View style={styles.completedNotice}>
            <AppIcon name="check" size={18} color={colors.status.success} />
            <Text style={styles.completedNoticeText}>
              Consultation finalized. Official medical record is archived.
            </Text>
          </View>
        )}
      </Card>

      {/* Prescription Management Workspace (Milestone 8) */}
      {activeConsultation && (
        <DoctorPrescriptionEditor
          consultationId={activeConsultation.id}
          defaultDiagnosis={diagnosis || activeConsultation.diagnosis || ''}
          isConsultationCompleted={isCompleted}
        />
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

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBg,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.status.errorText,
    fontWeight: typography.weights.medium,
  },
  dismissText: {
    fontSize: typography.sizes.sm,
    color: colors.status.errorText,
    fontWeight: 'bold',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  feedbackBannerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.status.successText,
    fontWeight: typography.weights.semiBold,
  },

  // Patient Card
  patientCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  patientAvatar: {
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
  patientName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  patientMeta: {
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
    width: 75,
  },
  infoValue: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    flex: 1,
  },

  // Form Card
  formCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  requiredMark: {
    fontSize: 10,
    color: colors.status.error,
    fontWeight: typography.weights.semiBold,
  },
  textInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 65,
  },
  disabledInput: {
    backgroundColor: colors.surfaceMuted,
    color: colors.text.secondary,
    borderColor: colors.borderLight,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.status.successBg,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    marginTop: spacing.md,
  },
  completedNoticeText: {
    fontSize: typography.sizes.xs,
    color: colors.status.successText,
    fontWeight: typography.weights.medium,
  },
});
