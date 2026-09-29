import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientDoctorStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import {
  Card,
  Badge,
  LoadingIndicator,
  ErrorView,
  AppIcon,
  Button,
} from '../../components/common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  clearSelectedDoctor,
  loadDoctorProfile,
  loadDoctorSlots,
} from '../../store/slices/doctorSlice';
import { bookSlot, clearActionError } from '../../store/slices/appointmentSlice';
import { formatTime, formatFee, DAY_NAMES, Slot } from '../../types/doctor';

type Props = NativeStackScreenProps<PatientDoctorStackParamList, 'DoctorDetail'>;

function getNextTwoWeeks(): { fromDate: string; toDate: string } {
  const today = new Date();
  const from = today.toISOString().split('T')[0];
  const to = new Date(today.getTime() + 13 * 86400000).toISOString().split('T')[0];
  return { fromDate: from, toDate: to };
}

export default function DoctorDetailScreen({ route, navigation }: Props) {
  const { doctorId } = route.params;
  const dispatch = useAppDispatch();

  const { selectedDoctor, doctorSlots, isLoadingProfile, isLoadingSlots, error } =
    useAppSelector((s) => s.doctor);
  const { isBooking, actionError } = useAppSelector((s) => s.appointment);

  // Booking modal state
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState('');

  const load = useCallback(() => {
    dispatch(loadDoctorProfile(doctorId));
    const { fromDate, toDate } = getNextTwoWeeks();
    dispatch(loadDoctorSlots({ doctorId, fromDate, toDate }));
  }, [dispatch, doctorId]);

  useEffect(() => {
    load();
    return () => {
      dispatch(clearSelectedDoctor());
    };
  }, [load, dispatch]);

  // Show actionError in alert when it appears
  useEffect(() => {
    if (actionError) {
      Alert.alert('Booking Failed', actionError, [
        { text: 'OK', onPress: () => dispatch(clearActionError()) },
      ]);
    }
  }, [actionError, dispatch]);

  const openBookingModal = (slot: Slot) => {
    setSelectedSlot(slot);
    setReasonForVisit('');
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    const result = await dispatch(
      bookSlot({ slot_id: selectedSlot.id, reason_for_visit: reasonForVisit || undefined })
    );
    if (bookSlot.fulfilled.match(result)) {
      setBookingModalVisible(false);
      setSelectedSlot(null);
      // Refresh slots to mark this one as booked
      const { fromDate, toDate } = getNextTwoWeeks();
      dispatch(loadDoctorSlots({ doctorId, fromDate, toDate }));
      Alert.alert(
        '✅ Appointment Booked!',
        `Your appointment with ${selectedDoctor?.fullName} is confirmed.\n\nYou can view it in the Appointments tab.`,
        [{ text: 'Great!' }]
      );
    }
  };

  if (isLoadingProfile && !selectedDoctor) {
    return <LoadingIndicator fullScreen message="Loading doctor profile…" />;
  }
  if (error && !selectedDoctor) {
    return <ErrorView message={error} onRetry={load} />;
  }
  if (!selectedDoctor) return null;

  const doc = selectedDoctor;
  const firstInitial = (doc.firstName || '')[0] || 'D';
  const lastInitial = (doc.lastName || '')[0] || '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();
  const availableSlots = doctorSlots.filter((s) => s.status === 'available');

  // Group by date
  const slotsByDate: Record<string, typeof doctorSlots> = {};
  availableSlots.forEach((slot) => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  });
  const sortedDates = Object.keys(slotsByDate).sort().slice(0, 7);

  // Slot chip for the modal header
  const selectedSlotLabel = selectedSlot
    ? `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}`
    : '';
  const selectedSlotDate = selectedSlot
    ? (() => {
        const d = new Date(selectedSlot.date + 'T12:00:00');
        return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
      })()
    : '';

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoadingProfile} onRefresh={load} />}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Find Doctors</Text>
        </TouchableOpacity>

        {/* Doctor Card */}
        <Card variant="elevated" padding="lg" style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.doctorName}>{doc.fullName}</Text>
              <Text style={styles.specialization}>{doc.specializationName}</Text>
              {doc.qualification && (
                <Text style={styles.qualification}>{doc.qualification}</Text>
              )}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AppIcon name="star" size={14} color="#f59e0b" />
              <Text style={styles.statValue}>{Number(doc.rating || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AppIcon name="clock" size={14} color={colors.secondary} />
              <Text style={styles.statValue}>{doc.experienceYears}</Text>
              <Text style={styles.statLabel}>Years Exp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AppIcon name="rupee" size={14} color={colors.primary} />
              <Text style={styles.statValue}>{formatFee(doc.consultationFee)}</Text>
              <Text style={styles.statLabel}>Per Visit</Text>
            </View>
          </View>

          <Badge
            label={doc.isAvailable ? 'Available for Consultation' : 'Currently Unavailable'}
            variant={doc.isAvailable ? 'success' : 'neutral'}
            size="sm"
          />
        </Card>

        {/* About */}
        {doc.bio && (
          <Card variant="default" padding="lg" style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{doc.bio}</Text>
          </Card>
        )}

        {/* Available Slots */}
        <Text style={styles.sectionHeading}>Available Slots</Text>

        {isLoadingSlots ? (
          <LoadingIndicator message="Loading slots…" />
        ) : sortedDates.length === 0 ? (
          <Card variant="default" padding="lg" style={styles.emptySlots}>
            <AppIcon name="calendar" size={32} color={colors.text.muted} />
            <Text style={styles.emptyText}>No available slots in the next 2 weeks</Text>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const dateObj = new Date(date + 'T12:00:00');
            const dayLabel = DAY_NAMES[dateObj.getDay()];
            const dateLabel = dateObj.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <Card key={date} variant="default" padding="md" style={styles.dayCard}>
                <Text style={styles.dayLabel}>
                  {dayLabel} · {dateLabel}
                </Text>
                <View style={styles.slotsRow}>
                  {slotsByDate[date].map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={styles.slotChip}
                      onPress={() => openBookingModal(slot)}
                    >
                      <Text style={styles.slotText}>{formatTime(slot.startTime)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            );
          })
        )}

        {sortedDates.length > 0 && (
          <View style={styles.bookingNotice}>
            <AppIcon name="info" size={14} color={colors.text.muted} />
            <Text style={styles.bookingNoticeText}>
              Tap a time slot to book an appointment.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Booking Confirmation Modal ── */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Confirm Appointment</Text>

            {/* Doctor + Slot info */}
            <View style={styles.modalInfoBox}>
              <View style={styles.modalInfoRow}>
                <AppIcon name="person" size={16} color={colors.primary} />
                <Text style={styles.modalInfoText}>{doc.fullName}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <AppIcon name="medical" size={16} color={colors.secondary} />
                <Text style={styles.modalInfoText}>{doc.specializationName}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <AppIcon name="calendar" size={16} color={colors.text.secondary} />
                <Text style={styles.modalInfoText}>{selectedSlotDate}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <AppIcon name="clock" size={16} color={colors.text.secondary} />
                <Text style={styles.modalInfoText}>{selectedSlotLabel}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <AppIcon name="rupee" size={16} color={colors.text.secondary} />
                <Text style={styles.modalInfoText}>₹{formatFee(doc.consultationFee)}</Text>
              </View>
            </View>

            {/* Reason */}
            <Text style={styles.reasonLabel}>Reason for Visit (optional)</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Fever, follow-up, routine checkup…"
              placeholderTextColor={colors.text.muted}
              value={reasonForVisit}
              onChangeText={setReasonForVisit}
              multiline
              numberOfLines={3}
              maxLength={300}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setBookingModalVisible(false)}
                variant="outline"
                size="md"
                style={styles.modalBtn}
                disabled={isBooking}
              />
              <Button
                title={isBooking ? 'Booking…' : 'Confirm Booking'}
                onPress={handleConfirmBooking}
                variant="primary"
                size="md"
                style={styles.modalBtn}
                disabled={isBooking}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  backText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
  },
  profileCard: { marginBottom: spacing.xl },
  profileTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  profileInfo: { flex: 1 },
  doctorName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  specialization: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
    marginTop: 2,
  },
  qualification: { fontSize: typography.sizes.xs, color: colors.text.secondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bioText: { fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 20 },
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptySlots: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  emptyText: { fontSize: typography.sizes.sm, color: colors.text.muted, textAlign: 'center' },
  dayCard: { marginBottom: spacing.md },
  dayLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  slotChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
  },
  bookingNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  bookingNoticeText: { fontSize: typography.sizes.xs, color: colors.text.muted, flex: 1 },

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
    marginBottom: spacing.lg,
  },
  modalInfoBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalInfoText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
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
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
});
