import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientAppointmentStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import {
  ScreenHeader,
  Card,
  Badge,
  Button,
  AppIcon,
  LoadingIndicator,
  EmptyState,
  ErrorView,
} from '../../components/common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  loadPatientAppointments,
  cancelAppointment,
  clearActionError,
} from '../../store/slices/appointmentSlice';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { formatFee } from '../../types/doctor';

type Props = NativeStackScreenProps<PatientAppointmentStackParamList, 'AppointmentList'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(date: string, startTime: string, endTime: string): string {
  const d = new Date(date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return `${dateStr} · ${fmt(startTime)} – ${fmt(endTime)}`;
}

function isUpcoming(date: string, startTime: string): boolean {
  const apptDate = new Date(`${date}T${startTime}`);
  return apptDate >= new Date();
}

type StatusVariant = 'success' | 'info' | 'warning' | 'neutral' | 'error';

function statusBadge(status: AppointmentStatus): { label: string; variant: StatusVariant } {
  switch (status) {
    case 'booked':      return { label: 'Pending', variant: 'warning' };
    case 'confirmed':   return { label: 'Confirmed', variant: 'success' };
    case 'in_progress': return { label: 'In Progress', variant: 'info' };
    case 'completed':   return { label: 'Completed', variant: 'neutral' };
    case 'cancelled':   return { label: 'Cancelled', variant: 'error' };
    case 'rescheduled': return { label: 'Rescheduled', variant: 'info' };
    case 'no_show':     return { label: 'No Show', variant: 'neutral' };
    default:            return { label: status, variant: 'neutral' };
  }
}

const CANCELLABLE: AppointmentStatus[] = ['booked', 'confirmed'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatientAppointmentsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { patientAppointments, isLoadingPatient, isActioning, actionError, error } =
    useAppSelector((s) => s.appointment);

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    dispatch(loadPatientAppointments('all'));
  }, [dispatch]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const upcomingAppointments = patientAppointments.filter((a) =>
    isUpcoming(a.date, a.startTime) && a.status !== 'cancelled' && a.status !== 'completed'
  );
  const pastAppointments = patientAppointments.filter(
    (a) => !isUpcoming(a.date, a.startTime) || a.status === 'cancelled' || a.status === 'completed'
  );
  const displayed = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const handleCancelPress = (appt: Appointment) => {
    setCancelTarget(appt);
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    const result = await dispatch(
      cancelAppointment({ appointmentId: cancelTarget.id, reason: cancelReason || undefined })
    );
    if (cancelAppointment.fulfilled.match(result)) {
      setCancelTarget(null);
      setFeedbackMsg('Your appointment has been cancelled and the slot freed.');
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  if (isLoadingPatient && patientAppointments.length === 0) {
    return <LoadingIndicator fullScreen message="Loading appointments…" />;
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase();

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoadingPatient} onRefresh={load} />}
      >
        <ScreenHeader
          title="Appointments"
          subtitle="Manage your upcoming and past consultations"
        />

        {/* Action Error Banner */}
        {actionError && (
          <View style={styles.errorBanner}>
            <AppIcon name="warning" size={16} color={colors.status.error} />
            <Text style={styles.errorBannerText}>{actionError}</Text>
            <TouchableOpacity onPress={() => dispatch(clearActionError())}>
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {error && <ErrorView message={error} onRetry={load} />}

        {/* Feedback Success Banner */}
        {feedbackMsg && (
          <View style={styles.feedbackBanner}>
            <AppIcon name="check" size={16} color={colors.status.success} />
            <Text style={styles.feedbackBannerText}>{feedbackMsg}</Text>
          </View>
        )}

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'upcoming' && styles.tabItemActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming ({upcomingAppointments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'past' && styles.tabItemActive]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
              Past ({pastAppointments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {displayed.length === 0 && error ? null : displayed.length === 0 ? (
        <EmptyState
            title={activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
            message={
              activeTab === 'upcoming'
                ? 'Browse doctors and book your first appointment.'
                : 'Your completed and cancelled appointments will appear here.'
            }
            icon="calendar"
          />
        ) : (
          <View style={styles.list}>
            {displayed.map((appt) => {
              const badge = statusBadge(appt.status);
              const avInitials = initials(appt.doctorFullName.replace('Dr. ', ''));
              const canCancel = CANCELLABLE.includes(appt.status);

              return (
                <Card key={appt.id} variant="default" padding="lg" style={styles.card}>
                  {/* Header row */}
                  <View style={styles.topRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{avInitials}</Text>
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={styles.doctorName}>{appt.doctorFullName}</Text>
                      <Text style={styles.specialty}>{appt.specializationName}</Text>
                    </View>
                    <Badge label={badge.label} variant={badge.variant} size="sm" />
                  </View>

                  {/* Details */}
                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <AppIcon name="calendar" size={14} color={colors.text.secondary} />
                      <Text style={styles.detailText}>
                        {formatDateTime(appt.date, appt.startTime, appt.endTime)}
                      </Text>
                    </View>
                    {appt.reasonForVisit && (
                      <View style={styles.detailRow}>
                        <AppIcon name="medical" size={14} color={colors.text.secondary} />
                        <Text style={styles.detailText}>{appt.reasonForVisit}</Text>
                      </View>
                    )}
                    {appt.cancellationReason && (
                      <View style={styles.detailRow}>
                        <AppIcon name="info" size={14} color="#ef4444" />
                        <Text style={[styles.detailText, { color: '#ef4444' }]}>
                          {appt.cancellationReason}
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <AppIcon name="card" size={14} color={colors.text.muted} />
                      <Text style={styles.detailText}>
                        {formatFee(appt.doctorConsultationFee)} consultation fee
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  {(canCancel || appt.status === 'completed' || appt.status === 'in_progress') && (
                    <View style={styles.actionRow}>
                      {canCancel && (
                        <Button
                          title="Cancel"
                          onPress={() => handleCancelPress(appt)}
                          variant="outline"
                          size="sm"
                          style={styles.actionBtn}
                        />
                      )}
                      {(appt.status === 'completed' || appt.status === 'in_progress') && (
                        <Button
                          title="View Summary"
                          onPress={() =>
                            navigation.navigate('PatientConsultation', {
                              appointmentId: appt.id,
                            })
                          }
                          variant="primary"
                          size="sm"
                          style={styles.actionBtn}
                        />
                      )}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Cancel Modal */}
      <Modal
        visible={!!cancelTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Cancel Appointment</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to cancel your appointment with{' '}
              <Text style={{ fontWeight: typography.weights.bold }}>
                {cancelTarget?.doctorFullName}
              </Text>
              ?
            </Text>

            <Text style={styles.reasonLabel}>Reason (optional)</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Schedule conflict, feeling better…"
              placeholderTextColor={colors.text.muted}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <Button
                title="Keep Appointment"
                onPress={() => setCancelTarget(null)}
                variant="outline"
                size="md"
                style={styles.modalBtn}
                disabled={isActioning}
              />
              <Button
                title={isActioning ? 'Cancelling…' : 'Yes, Cancel'}
                onPress={handleCancelConfirm}
                variant="primary"
                size="md"
                style={{ ...styles.modalBtn, backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                disabled={isActioning}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.section,
    paddingBottom: spacing.xxxl,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: spacing.borderRadius.sm,
  },
  tabItemActive: { backgroundColor: colors.primary },
  tabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.secondary,
  },
  tabTextActive: { color: '#ffffff' },
  list: { gap: spacing.md },
  card: { marginBottom: spacing.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  headerInfo: { flex: 1 },
  doctorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  specialty: { fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: 1 },
  detailsBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailText: { fontSize: typography.sizes.xs, color: colors.text.secondary, flex: 1 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  reasonLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    backgroundColor: colors.background,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  modalBtn: { flex: 1 },
  cancelConfirmBtn: { backgroundColor: '#ef4444', borderColor: '#ef4444' },

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
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
    color: '#991b1b',
    fontWeight: typography.weights.medium,
  },
  dismissText: { fontSize: typography.sizes.sm, color: '#991b1b', fontWeight: 'bold' },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
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
    color: '#166534',
    fontWeight: typography.weights.semiBold,
  },
});
