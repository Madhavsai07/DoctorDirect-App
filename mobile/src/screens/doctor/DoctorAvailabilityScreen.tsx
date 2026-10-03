import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { showAlert } from '../../utils/alert';
import {
  ScreenHeader,
  Card,
  Badge,
  Button,
  Input,
  LoadingIndicator,
  ErrorView,
  EmptyState,
  AppIcon,
} from '../../components/common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  loadMyAvailability,
  addAvailability,
  updateAvailability,
  removeAvailability,
  loadMySlots,
} from '../../store/slices/doctorSlice';
import { Availability, Slot, DAY_NAMES, formatTime } from '../../types/doctor';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const from = today.toISOString().split('T')[0];
  const to = new Date(today.getTime() + 6 * 86400000).toISOString().split('T')[0];
  return { fromDate: from, toDate: to };
}

// ── Add-window modal ──────────────────────────────────────────────────────────
interface AddWindowModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (dto: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }) => void;
  isSaving: boolean;
}

function AddWindowModal({ visible, onClose, onSave, isSaving }: AddWindowModalProps) {
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [duration, setDuration] = useState('30');

  const handleSave = () => {
    const d = Number(duration);
    if (!startTime || !endTime) { showAlert('Error', 'Please enter start and end times.'); return; }
    if (endTime <= startTime) { showAlert('Error', 'End time must be after start time.'); return; }
    if (!Number.isInteger(d) || d <= 0) { showAlert('Error', 'Duration must be a positive number.'); return; }
    onSave({ day_of_week: day, start_time: startTime + ':00', end_time: endTime + ':00', slot_duration_minutes: d });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Add Availability Window</Text>

          <Text style={modalStyles.label}>Day of Week</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.dayRow}>
            {DAY_ABBR.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[modalStyles.dayPill, day === i && modalStyles.dayPillActive]}
                onPress={() => setDay(i)}
              >
                <Text style={[modalStyles.dayPillText, day === i && modalStyles.dayPillActiveText]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input label="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} placeholder="09:00" containerStyle={modalStyles.input} />
          <Input label="End Time (HH:MM)" value={endTime} onChangeText={setEndTime} placeholder="12:00" containerStyle={modalStyles.input} />
          <Input
            label="Slot Duration (minutes)"
            value={duration}
            onChangeText={setDuration}
            placeholder="30"
            keyboardType="numeric"
            containerStyle={modalStyles.input}
          />

          <View style={modalStyles.actions}>
            <Button title="Cancel" onPress={onClose} variant="secondary" size="md" style={modalStyles.btn} />
            <Button title={isSaving ? 'Saving…' : 'Save'} onPress={handleSave} variant="primary" size="md" style={modalStyles.btn} disabled={isSaving} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text.primary, marginBottom: spacing.lg },
  label: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold, color: colors.text.secondary, marginBottom: spacing.xs },
  dayRow: { marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  dayPill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayPillText: { fontSize: 12, color: colors.text.secondary, fontWeight: typography.weights.medium },
  dayPillActiveText: { color: '#ffffff', fontWeight: typography.weights.bold },
  input: { marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  btn: { flex: 1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DoctorAvailabilityScreen() {
  const dispatch = useAppDispatch();
  const { myAvailability, mySlots, isLoadingAvailability, isLoadingSlots, error } =
    useAppSelector((s) => s.doctor);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(() => {
    dispatch(loadMyAvailability());
    const { fromDate, toDate } = getWeekRange();
    dispatch(loadMySlots({ fromDate, toDate }));
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (dto: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }) => {
    setIsSaving(true);
    const result = await dispatch(addAvailability({ ...dto, is_active: true }));
    setIsSaving(false);
    if (addAvailability.fulfilled.match(result)) {
      setAddModalVisible(false);
      load(); // Regenerate slots
      showAlert('Success', 'Availability window added and slots generated.');
    } else {
      showAlert('Error', String(result.payload ?? 'Failed to add availability'));
    }
  };

  const handleToggle = async (av: Availability) => {
    const result = await dispatch(updateAvailability({ id: av.id, dto: { is_active: !av.isActive } }));
    if (updateAvailability.fulfilled.match(result)) {
      load();
    } else {
      showAlert('Error', String(result.payload ?? 'Failed to update'));
    }
  };

  const handleRemove = (av: Availability) => {
    showAlert(
      'Remove Window',
      `Remove ${DAY_NAMES[av.dayOfWeek]} ${formatTime(av.startTime)} – ${formatTime(av.endTime)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await dispatch(removeAvailability(av.id));
            if (removeAvailability.fulfilled.match(result)) {
              load();
            } else {
              showAlert('Error', String(result.payload ?? 'Failed to remove'));
            }
          },
        },
      ]
    );
  };

  // Group availability by day
  const byDay: Record<number, Availability[]> = {};
  myAvailability.forEach((av) => {
    if (!byDay[av.dayOfWeek]) byDay[av.dayOfWeek] = [];
    byDay[av.dayOfWeek].push(av);
  });

  // Group this-week's slots by date for display
  const today = new Date();
  const slotsByDate: Record<string, Slot[]> = {};
  mySlots.forEach((slot) => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  });
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + i * 86400000);
    return d.toISOString().split('T')[0];
  });

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoadingAvailability} onRefresh={load} />
        }
      >
        <ScreenHeader
          title="Availability & Hours"
          subtitle="Configure weekly schedule and booking windows"
        />

        {/* Summary Card */}
        <Card variant="elevated" padding="lg" style={styles.summaryCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.summaryHeader}>CONSULTATION RULES</Text>
            <Badge
              label={myAvailability.filter((a) => a.isActive).length > 0 ? 'Published' : 'No Schedule'}
              variant={myAvailability.filter((a) => a.isActive).length > 0 ? 'success' : 'neutral'}
              size="sm"
            />
          </View>
          <View style={styles.ruleRow}>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Active Windows</Text>
              <Text style={styles.ruleValue}>
                {myAvailability.filter((a) => a.isActive).length}
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Slots This Week</Text>
              <Text style={styles.ruleValue}>
                {mySlots.filter((s) => s.status === 'available').length}
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Working Days</Text>
              <Text style={styles.ruleValue}>{Object.keys(byDay).length}</Text>
            </View>
          </View>
        </Card>

        {/* Weekly Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Weekly Working Hours</Text>
          <Button
            title="+ Add Window"
            onPress={() => setAddModalVisible(true)}
            variant="secondary"
            size="sm"
          />
        </View>

        {isLoadingAvailability && myAvailability.length === 0 ? (
          <LoadingIndicator message="Loading availability…" />
        ) : error ? (
          <ErrorView message={error} onRetry={load} />
        ) : myAvailability.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No Schedule Set"
            description="Add your first availability window to start accepting bookings"
          />
        ) : (
          <View style={styles.daysList}>
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
              const windows = byDay[dayIndex] ?? [];
              if (windows.length === 0) return null;
              return (
                <Card key={dayIndex} variant="default" padding="md" style={styles.dayCard}>
                  <Text style={styles.dayName}>{DAY_NAMES[dayIndex]}</Text>
                  {windows.map((av) => (
                    <View key={av.id} style={styles.windowRow}>
                      <View style={styles.windowInfo}>
                        <Text style={styles.windowTime}>
                          {formatTime(av.startTime)} – {formatTime(av.endTime)}
                        </Text>
                        <Text style={styles.windowMeta}>
                          {av.slotDurationMinutes} min slots
                        </Text>
                      </View>
                      <View style={styles.windowActions}>
                        <TouchableOpacity
                          style={[styles.toggleBtn, av.isActive && styles.toggleBtnActive]}
                          onPress={() => handleToggle(av)}
                        >
                          <Text style={[styles.toggleBtnText, av.isActive && styles.toggleBtnTextActive]}>
                            {av.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemove(av)} style={styles.removeBtn}>
                          <AppIcon name="close" size={14} color={colors.status.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </Card>
              );
            })}
          </View>
        )}

        {/* This Week's Slots Preview */}
        <Text style={styles.sectionHeading}>This Week's Slots</Text>

        {isLoadingSlots ? (
          <LoadingIndicator message="Loading slots…" />
        ) : (
          <View style={styles.weekGrid}>
            {weekDates.map((date) => {
              const daySlots = slotsByDate[date] ?? [];
              const available = daySlots.filter((s) => s.status === 'available').length;
              const dateObj = new Date(date + 'T12:00:00');
              return (
                <Card key={date} variant="default" padding="sm" style={styles.weekDayCard}>
                  <Text style={styles.weekDayName}>{DAY_ABBR[dateObj.getDay()]}</Text>
                  <Text style={styles.weekDayDate}>
                    {dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={[styles.weekDaySlots, available === 0 && styles.weekDaySlotsNone]}>
                    {available}
                  </Text>
                  <Text style={styles.weekDaySlotsLabel}>slots</Text>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <AddWindowModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAdd}
        isSaving={isSaving}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.section,
    paddingBottom: spacing.xxxl,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  summaryCard: { marginBottom: spacing.xl, borderLeftWidth: 4, borderLeftColor: colors.secondary },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  summaryHeader: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.text.muted, letterSpacing: 0.5 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  ruleItem: { alignItems: 'flex-start' },
  ruleLabel: { fontSize: 11, color: colors.text.secondary, marginBottom: 2 },
  ruleValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text.primary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionHeading: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text.primary, marginBottom: spacing.md },
  daysList: { gap: spacing.sm, marginBottom: spacing.xl },
  dayCard: { marginBottom: 0 },
  dayName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text.primary, marginBottom: spacing.sm },
  windowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  windowInfo: { flex: 1 },
  windowTime: { fontSize: typography.sizes.sm, color: colors.text.primary, fontWeight: typography.weights.semiBold },
  windowMeta: { fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: 2 },
  windowActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: spacing.borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  toggleBtnActive: { backgroundColor: colors.status.successBg, borderColor: colors.status.success },
  toggleBtnText: { fontSize: 11, color: colors.text.secondary, fontWeight: typography.weights.medium },
  toggleBtnTextActive: { color: colors.status.successText },
  removeBtn: { padding: 4 },
  weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  weekDayCard: { width: '13%', minWidth: 44, alignItems: 'center', padding: spacing.sm },
  weekDayName: { fontSize: 10, fontWeight: typography.weights.bold, color: colors.text.muted, textTransform: 'uppercase' },
  weekDayDate: { fontSize: 10, color: colors.text.secondary, marginTop: 1 },
  weekDaySlots: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary, marginTop: spacing.xs },
  weekDaySlotsNone: { color: colors.text.muted },
  weekDaySlotsLabel: { fontSize: 9, color: colors.text.muted },
});
