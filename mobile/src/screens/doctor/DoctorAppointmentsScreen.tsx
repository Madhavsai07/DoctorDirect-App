import React, { useCallback, useEffect, useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DoctorAppointmentStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import {
  ScreenHeader,
  Card,
  Badge,
  Button,
  AppIcon,
  LoadingIndicator,
  EmptyState,
} from '../../components/common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  loadDoctorAppointments,
  confirmAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  clearActionError,
} from '../../store/slices/appointmentSlice';
import { Appointment, AppointmentStatus } from '../../types/appointment';

type Props = NativeStackScreenProps<DoctorAppointmentStackParamList, 'DoctorAppointmentsList'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(date: string): string {
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isToday(date: string): boolean {
  return date === new Date().toISOString().split('T')[0];
}

function isUpcoming(date: string, startTime: string): boolean {
  return new Date(`${date}T${startTime}`) >= new Date();
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

// ─── Component ────────────────────────────────────────────────────────────────

type TabKey = 'today' | 'upcoming' | 'past';

export default function DoctorAppointmentsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { doctorAppointments, isLoadingDoctor, isActioning, actionError } =
    useAppSelector((s) => s.appointment);

  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(() => {
    dispatch(loadDoctorAppointments('all'));
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  // Partition
  const todayAppts = doctorAppointments.filter(
    (a) => isToday(a.date) && a.status !== 'cancelled'
  );
  const upcomingAppts = doctorAppointments.filter(
    (a) => !isToday(a.date) && isUpcoming(a.date, a.startTime) && a.status !== 'cancelled'
  );
  const pastAppts = doctorAppointments.filter(
    (a) => !isUpcoming(a.date, a.startTime) || a.status === 'cancelled' || a.status === 'completed'
  );

  const displayed: Appointment[] =
    activeTab === 'today' ? todayAppts :
    activeTab === 'upcoming' ? upcomingAppts :
    pastAppts;

  const handleConfirm = async (appt: Appointment) => {
    setActioningId(appt.id);
    const result = await dispatch(confirmAppointment(appt.id));
    setActioningId(null);
    if (confirmAppointment.fulfilled.match(result)) {
      setFeedbackMsg(`Appointment with ${appt.patientFullName} confirmed!`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleMarkInProgress = async (appt: Appointment) => {
    setActioningId(appt.id);
    const result = await dispatch(
      updateAppointmentStatus({ appointmentId: appt.id, status: 'in_progress' })
    );
    setActioningId(null);
    if (updateAppointmentStatus.fulfilled.match(result)) {
      setFeedbackMsg(`Consultation started with ${appt.patientFullName}!`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleMarkCompleted = async (appt: Appointment) => {
    setActioningId(appt.id);
    const result = await dispatch(
      updateAppointmentStatus({ appointmentId: appt.id, status: 'completed' })
    );
    setActioningId(null);
    if (updateAppointmentStatus.fulfilled.match(result)) {
      setFeedbackMsg(`Consultation completed for ${appt.patientFullName}!`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleMarkNoShow = async (appt: Appointment) => {
    setActioningId(appt.id);
    const result = await dispatch(
      updateAppointmentStatus({ appointmentId: appt.id, status: 'no_show' })
    );
    setActioningId(null);
    if (updateAppointmentStatus.fulfilled.match(result)) {
      setFeedbackMsg(`Marked ${appt.patientFullName} as no-show.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setActioningId(cancelTarget.id);
    const result = await dispatch(
      cancelAppointment({
        appointmentId: cancelTarget.id,
        reason: cancelReason ? `Cancelled by Doctor: ${cancelReason}` : 'Cancelled by Doctor',
      })
    );
    setActioningId(null);
    if (cancelAppointment.fulfilled.match(result)) {
      setCancelTarget(null);
      setCancelReason('');
      setFeedbackMsg('Appointment cancelled.');
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  if (isLoadingDoctor && doctorAppointments.length === 0) {
    return <LoadingIndicator fullScreen message="Loading appointments…" />;
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoadingDoctor} onRefresh={load} />}
      >
        <ScreenHeader
          title="Appointments"
          subtitle="Manage patient consultations and status"
        />

        {/* Action Error Banner */}
        {actionError && (
          <View style={styles.errorBanner}>
            <AppIcon name="warning" size={16} color={colors.status.error} />
            <Text style={styles.errorBannerText}>{actionError}</Text>
            <TouchableOpacity onPress={() => dispatch(clearActionError())} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback Success Banner */}
        {feedbackMsg && (
          <View style={styles.feedbackBanner}>
            <AppIcon name="check" size={16} color={colors.status.success} />
            <Text style={styles.feedbackBannerText}>{feedbackMsg}</Text>
          </View>
        )}

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(['today', 'upcoming', 'past'] as TabKey[]).map((tab) => {
            const count =
              tab === 'today' ? todayAppts.length :
              tab === 'upcoming' ? upcomingAppts.length :
              pastAppts.length;
            const label =
              tab === 'today' ? `Today (${count})` :
              tab === 'upcoming' ? `Upcoming (${count})` :
              `Past (${count})`;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Count header */}
        {displayed.length > 0 && (
          <Text style={styles.countLabel}>
            {displayed.length} {displayed.length === 1 ? 'APPOINTMENT' : 'APPOINTMENTS'}
          </Text>
        )}

        {/* List */}
        {displayed.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'today' ? 'No Appointments Today' :
              activeTab === 'upcoming' ? 'No Upcoming Appointments' :
              'No Past Appointments'
            }
            message="Appointment records will appear here."
            icon="calendar"
          />
        ) : (
          <View style={styles.list}>
            {displayed.map((appt) => {
              const badge = statusBadge(appt.status);
              const avInitials = (appt.patientFullName || '--')
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0] || '')
                .join('')
                .toUpperCase();

              return (
                <Card
                  key={appt.id}
                  variant="default"
                  padding="lg"
                  style={[
                    styles.card,
                    appt.status === 'in_progress' && styles.inProgressCard,
                  ]}
                >
                  {/* Top row */}
                  <View style={styles.topRow}>
                    <View
                      style={[
                        styles.avatar,
                        appt.status === 'in_progress' && { backgroundColor: colors.doctorRole?.badgeBg || colors.primarySubtle },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          appt.status === 'in_progress' && { color: colors.secondary },
                        ]}
                      >
                        {avInitials}
                      </Text>
                    </View>
                    <View style={styles.patientInfoCol}>
                      <Text style={styles.patientName}>{appt.patientFullName}</Text>
                      {appt.patientGender && appt.patientDateOfBirth ? (
                        <Text style={styles.demographics}>
                          {appt.patientGender} ·{' '}
                          {new Date().getFullYear() -
                            new Date(appt.patientDateOfBirth).getFullYear()}{' '}
                          yrs
                        </Text>
                      ) : (
                        <Text style={styles.demographics}>{appt.patientEmail}</Text>
                      )}
                    </View>
                    <Badge label={badge.label} variant={badge.variant} size="sm" />
                  </View>

                  {/* Details */}
                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <AppIcon name="clock" size={14} color={colors.secondary} />
                      <Text style={styles.detailTextBold}>
                        {formatDate(appt.date)} · {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                      </Text>
                    </View>
                    {appt.reasonForVisit && (
                      <View style={styles.detailRow}>
                        <AppIcon name="medical" size={14} color={colors.text.secondary} />
                        <Text style={styles.detailText}>{appt.reasonForVisit}</Text>
                      </View>
                    )}
                    {appt.patientBloodGroup && (
                      <View style={styles.detailRow}>
                        <AppIcon name="info" size={14} color={colors.text.secondary} />
                        <Text style={styles.detailText}>
                          Blood Group: {appt.patientBloodGroup}
                        </Text>
                      </View>
                    )}
                    {appt.patientAllergies && (
                      <View style={styles.detailRow}>
                        <AppIcon name="warning" size={14} color="#f59e0b" />
                        <Text style={[styles.detailText, { color: '#92400e' }]}>
                          Allergies: {appt.patientAllergies}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action buttons based on status */}
                  <View style={styles.actionRow}>
                    {appt.status === 'booked' && (
                      <>
                        <Button
                          title={actioningId === appt.id ? 'Confirming…' : 'Confirm'}
                          onPress={() => handleConfirm(appt)}
                          variant="primary"
                          size="sm"
                          style={styles.actionBtn}
                          disabled={isActioning}
                        />
                        <Button
                          title="Cancel"
                          onPress={() => {
                            setCancelTarget(appt);
                            setCancelReason('');
                          }}
                          variant="outline"
                          size="sm"
                          style={styles.actionBtn}
                          disabled={isActioning}
                        />
                      </>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        <Button
                          title={actioningId === appt.id ? 'Starting…' : 'Start Consult'}
                          onPress={() => handleMarkInProgress(appt)}
                          variant="secondary"
                          size="sm"
                          style={styles.actionBtn}
                          disabled={isActioning}
                        />
                        <Button
                          title="No Show"
                          onPress={() => handleMarkNoShow(appt)}
                          variant="outline"
                          size="sm"
                          style={styles.actionBtn}
                          disabled={isActioning}
                        />
                        <Button
                          title="Cancel"
                          onPress={() => {
                            setCancelTarget(appt);
                            setCancelReason('');
                          }}
                          variant="outline"
                          size="sm"
                          style={styles.actionBtn}
                          disabled={isActioning}
                        />
                      </>
                    )}
                    {appt.status === 'in_progress' && (
                      <>
                        <Button
                          title="Open Consultation"
                          onPress={() =>
                            navigation.navigate('DoctorConsultation', {
                              appointmentId: appt.id,
                            })
                          }
                          variant="secondary"
                          size="sm"
                          style={styles.actionBtn}
                          disabled={isActioning}
                        />
                        <Button
                          title={actioningId === appt.id ? 'Completing…' : 'Complete'}
                          onPress={() => handleMarkCompleted(appt)}
                          variant="outline"
                          size="sm"
                          style={styles.actionBtn}
                          disabled={isActioning}
                        />
                      </>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Cancel Appointment Modal */}
      <Modal
        visible={cancelTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="xl" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppIcon name="warning" size={24} color={colors.status.error} />
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
            </View>

            <Text style={styles.modalBody}>
              Are you sure you want to cancel the appointment with{' '}
              <Text style={{ fontWeight: '700' }}>
                {cancelTarget?.patientFullName}
              </Text>
              ? The reserved slot will be freed for booking.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for cancellation (optional)"
              placeholderTextColor={colors.text.secondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Keep"
                onPress={() => setCancelTarget(null)}
                variant="outline"
                size="md"
                style={{ flex: 1, marginRight: spacing.sm }}
                disabled={isActioning}
              />
              <Button
                title={isActioning ? 'Cancelling…' : 'Confirm Cancel'}
                onPress={handleCancelConfirm}
                variant="danger"
                size="md"
                style={{ flex: 1 }}
                disabled={isActioning}
              />
            </View>
          </Card>
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
  tabItemActive: { backgroundColor: colors.secondary || colors.primary },
  tabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.secondary,
  },
  tabTextActive: { color: '#ffffff' },
  countLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  list: { gap: spacing.md },
  card: { marginBottom: spacing.xs },
  inProgressCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary || colors.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
  },
  patientInfoCol: { flex: 1 },
  patientName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  demographics: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },
  detailsBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  detailText: { fontSize: typography.sizes.xs, color: colors.text.secondary, flex: 1 },
  detailTextBold: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    flex: 1,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1 },

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
  dismissBtn: { padding: 4 },
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modalBody: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  reasonInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
