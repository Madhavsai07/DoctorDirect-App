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
  loadMyScheduleOverrides,
  saveScheduleOverride,
  clearScheduleOverride,
  changeMySlot,
} from '../../store/slices/doctorSlice';
import {
  Availability,
  Slot,
  DAY_NAMES,
  formatTime,
  ScheduleOverride,
} from '../../types/doctor';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getHorizonRange(days: number): { fromDate: string; toDate: string } {
  const today = new Date();
  const from = localDateKey(today);
  const end = new Date(today);
  end.setDate(end.getDate() + days - 1);
  return { fromDate: from, toDate: localDateKey(end) };
}

// ── Add-window modal ──────────────────────────────────────────────────────────
interface AddWindowModalProps {
  visible: boolean;
  onClose: () => void;
  initialWindow?: Availability | null;
  onSave: (dto: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }) => void;
  isSaving: boolean;
}

function AddWindowModal({ visible, onClose, onSave, isSaving, initialWindow }: AddWindowModalProps) {
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (!visible) return;
    setDay(initialWindow?.dayOfWeek ?? 1);
    setStartTime(initialWindow?.startTime.slice(0, 5) ?? '09:00');
    setEndTime(initialWindow?.endTime.slice(0, 5) ?? '12:00');
    setDuration(initialWindow?.slotDurationMinutes ?? 30);
  }, [visible, initialWindow]);

  const handleSave = () => {
    if (!startTime || !endTime) { showAlert('Error', 'Please enter start and end times.'); return; }
    if (endTime <= startTime) { showAlert('Error', 'End time must be after start time.'); return; }
    onSave({ day_of_week: day, start_time: startTime + ':00', end_time: endTime + ':00', slot_duration_minutes: duration });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>{initialWindow ? 'Edit Weekly Window' : 'Add Availability Window'}</Text>

          <Text style={modalStyles.label}>Day of Week</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={modalStyles.dayRow}
            contentContainerStyle={modalStyles.dayRowContent}
          >
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
          <Text style={modalStyles.label}>Slot Duration</Text>
          <View style={modalStyles.durationRow}>
            {[15, 30, 45, 60].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                onPress={() => setDuration(minutes)}
                style={[modalStyles.durationPill, duration === minutes && modalStyles.dayPillActive]}
              >
                <Text style={[modalStyles.dayPillText, duration === minutes && modalStyles.dayPillActiveText]}>
                  {minutes} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
  dayRow: { marginBottom: spacing.lg },
  dayRowContent: { flexDirection: 'row', alignItems: 'center' },
  durationRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  durationPill: { borderRadius: 16, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 8 },
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

interface DateOverrideModalProps {
  visible: boolean;
  date: string;
  existing: ScheduleOverride | undefined;
  isSaving: boolean;
  onClose: () => void;
  onSave: (windows: Array<{ start_time: string; end_time: string; slot_duration_minutes: number }>) => void;
}

function DateOverrideModal({
  visible,
  date,
  existing,
  isSaving,
  onClose,
  onSave,
}: DateOverrideModalProps) {
  const [windows, setWindows] = useState<Array<{ start_time: string; end_time: string; slot_duration_minutes: number }>>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (visible) {
      setWindows(existing?.windows.map(({ start_time, end_time, slot_duration_minutes }) => ({
        start_time: start_time.slice(0, 5),
        end_time: end_time.slice(0, 5),
        slot_duration_minutes,
      })) ?? []);
      setStartTime('09:00');
      setEndTime('12:00');
      setDuration(30);
    }
  }, [visible, existing]);

  const addWindow = () => {
    if (endTime <= startTime) {
      showAlert('Invalid time window', 'End time must be after start time.');
      return;
    }
    const candidate = { start_time: `${startTime}:00`, end_time: `${endTime}:00`, slot_duration_minutes: duration };
    if (windows.some((window) => window.start_time < candidate.end_time && window.end_time > candidate.start_time)) {
      showAlert('Overlapping windows', 'Date-specific working windows cannot overlap.');
      return;
    }
    setWindows([...windows, candidate].sort((a, b) => a.start_time.localeCompare(b.start_time)));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Custom hours · {date}</Text>
          <Text style={modalStyles.label}>These hours apply only to this date.</Text>
          {windows.map((window, index) => (
            <View key={`${window.start_time}-${index}`} style={styles.windowRow}>
              <Text style={styles.windowTime}>
                {formatTime(window.start_time)} – {formatTime(window.end_time)} · {window.slot_duration_minutes} min
              </Text>
              <TouchableOpacity onPress={() => setWindows(windows.filter((_, itemIndex) => itemIndex !== index))}>
                <AppIcon name="close" size={14} color={colors.status.error} />
              </TouchableOpacity>
            </View>
          ))}
          <Input label="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} containerStyle={modalStyles.input} />
          <Input label="End Time (HH:MM)" value={endTime} onChangeText={setEndTime} containerStyle={modalStyles.input} />
          <Text style={modalStyles.label}>Slot Duration</Text>
          <View style={modalStyles.durationRow}>
            {[15, 30, 45, 60].map((minutes) => (
              <TouchableOpacity key={minutes} onPress={() => setDuration(minutes)}
                style={[modalStyles.durationPill, duration === minutes && modalStyles.dayPillActive]}>
                <Text style={[modalStyles.dayPillText, duration === minutes && modalStyles.dayPillActiveText]}>
                  {minutes} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button title="Add time window" onPress={addWindow} variant="secondary" size="sm" />
          <View style={modalStyles.actions}>
            <Button title="Cancel" onPress={onClose} variant="secondary" size="md" style={modalStyles.btn} />
            <Button title={isSaving ? 'Saving…' : 'Save hours'} onPress={() => onSave(windows)}
              variant="primary" size="md" style={modalStyles.btn} disabled={isSaving || windows.length === 0} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DoctorAvailabilityScreen() {
  const dispatch = useAppDispatch();
  const { myAvailability, mySlots, myScheduleOverrides, isLoadingAvailability, isLoadingSlots, error } =
    useAppSelector((s) => s.doctor);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingWindow, setEditingWindow] = useState<Availability | null>(null);
  const [overrideModalVisible, setOverrideModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('09:30');
  const [horizonDays, setHorizonDays] = useState(14);
  const [selectedDate, setSelectedDate] = useState(localDateKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [isSaving, setIsSaving] = useState(false);

  const { fromDate, toDate } = getHorizonRange(horizonDays);
  const load = useCallback(() => {
    dispatch(loadMyAvailability());
    dispatch(loadMySlots({ fromDate, toDate }));
    dispatch(loadMyScheduleOverrides({ fromDate, toDate }));
  }, [dispatch, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const handleSaveWeeklyWindow = async (dto: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }) => {
    setIsSaving(true);
    const result = editingWindow
      ? await dispatch(updateAvailability({ id: editingWindow.id, dto }))
      : await dispatch(addAvailability({ ...dto, is_active: true }));
    setIsSaving(false);
    if (addAvailability.fulfilled.match(result) || updateAvailability.fulfilled.match(result)) {
      setAddModalVisible(false);
      setEditingWindow(null);
      load();
      showAlert('Success', 'Weekly availability saved. Future slots will follow this rule.');
    } else {
      showAlert('Error', String(result.payload ?? 'Failed to save availability'));
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

  const selectedOverride = myScheduleOverrides.find((item) => item.override_date === selectedDate);
  const selectedSlots = mySlots.filter(
    (slot) => slot.date === selectedDate && slot.status !== 'cancelled'
  );
  const selectedBookedCount = selectedSlots.filter(
    (slot) => (slot.status === 'booked' || slot.status === 'reserved') &&
      new Date(`${slot.date}T${slot.startTime}`).getTime() > Date.now()
  ).length;
  const selectedWeeklyWindows = myAvailability.filter(
    (item) => item.dayOfWeek === new Date(`${selectedDate}T12:00:00`).getDay() && item.isActive
  );
  const daysInCalendarMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();
  const calendarMonthStart = localDateKey(calendarMonth);
  const calendarMonthEnd = localDateKey(
    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), daysInCalendarMonth)
  );
  const hasPreviousCalendarMonth = calendarMonthStart > fromDate;
  const hasNextCalendarMonth = calendarMonthEnd < toDate;

  const refreshSelectedDate = () => {
    dispatch(loadMySlots({ fromDate, toDate }));
    dispatch(loadMyScheduleOverrides({ fromDate, toDate }));
  };

  const chooseHorizon = (days: number) => {
    const range = getHorizonRange(days);
    if (selectedDate < range.fromDate || selectedDate > range.toDate) {
      setSelectedDate(range.fromDate);
    }
    const visibleDate = selectedDate < range.fromDate || selectedDate > range.toDate
      ? range.fromDate
      : selectedDate;
    const parsed = new Date(`${visibleDate}T12:00:00`);
    setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    setHorizonDays(days);
  };

  const changeCalendarMonth = (offset: number) => {
    const nextMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + offset,
      1
    );
    setCalendarMonth(nextMonth);
    const nextMonthStart = localDateKey(nextMonth);
    const nextMonthEnd = localDateKey(
      new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0)
    );
    if (selectedDate < nextMonthStart || selectedDate > nextMonthEnd) {
      const nextSelection = nextMonthStart < fromDate ? fromDate : nextMonthStart;
      setSelectedDate(nextSelection);
    }
  };

  const saveDateOverride = async (windows: Array<{ start_time: string; end_time: string; slot_duration_minutes: number }>) => {
    setIsSaving(true);
    const result = await dispatch(saveScheduleOverride({ date: selectedDate, is_blocked: false, windows }));
    setIsSaving(false);
    if (saveScheduleOverride.fulfilled.match(result)) {
      setOverrideModalVisible(false);
      refreshSelectedDate();
    } else {
      showAlert('Error', String(result.payload ?? 'Failed to save date-specific hours'));
    }
  };

  const blockSelectedDate = () => {
    const bookingWarning = selectedBookedCount
      ? ` This will cancel ${selectedBookedCount} booked appointment${selectedBookedCount === 1 ? '' : 's'} and notify the patient(s) to book another slot.`
      : ' If there are booked appointments, they will be cancelled and patients will be told to book another slot.';
    showAlert('Block date', `Block all availability on ${selectedDate}?${bookingWarning}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block date',
        style: 'destructive',
        onPress: async () => {
          const result = await dispatch(saveScheduleOverride({
            date: selectedDate,
            is_blocked: true,
            windows: [],
            expected_booked_count: selectedBookedCount,
          }));
          if (saveScheduleOverride.fulfilled.match(result)) {
            refreshSelectedDate();
            showAlert(
              'Date blocked',
              selectedBookedCount
                ? `${selectedBookedCount} appointment${selectedBookedCount === 1 ? '' : 's'} cancelled. The patient(s) have been notified to rebook.`
                : 'The date is now blocked.'
            );
          } else {
            refreshSelectedDate();
            showAlert('Unable to block date', String(result.payload ?? 'Failed to block date'));
          }
        },
      },
    ]);
  };

  const blockSlot = async (slot: Slot) => {
    const expectedBookedCount = slot.status === 'booked' || slot.status === 'reserved' ? 1 : 0;
    const applyBlock = async () => {
      const result = await dispatch(changeMySlot({
        slotId: slot.id,
        action: 'block',
        expected_booked_count: expectedBookedCount,
      }));
      if (changeMySlot.fulfilled.match(result)) {
        refreshSelectedDate();
        if (expectedBookedCount) {
          showAlert('Slot blocked', 'The appointment was cancelled and the patient was notified to book another slot.');
        }
      } else {
        refreshSelectedDate();
        showAlert('Unable to block slot', String(result.payload ?? 'The slot could not be blocked.'));
      }
    };

    if (expectedBookedCount) {
      showAlert(
        'Cancel booked appointment?',
        `Blocking ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)} will cancel the appointment and notify the patient to book another slot.`,
        [
          { text: 'Keep appointment', style: 'cancel' },
          { text: 'Block & cancel', style: 'destructive', onPress: applyBlock },
        ]
      );
    } else {
      await applyBlock();
    }
  };

  const restoreWeeklySchedule = async () => {
    const result = await dispatch(clearScheduleOverride(selectedDate));
    if (clearScheduleOverride.fulfilled.match(result)) refreshSelectedDate();
    else showAlert('Error', String(result.payload ?? 'Failed to remove date override'));
  };

  const saveSlotEdit = async () => {
    if (!editingSlot) return;
    if (slotEnd <= slotStart) {
      showAlert('Invalid time', 'Slot end time must be after its start time.');
      return;
    }
    const result = await dispatch(changeMySlot({
      slotId: editingSlot.id,
      action: 'edit',
      start_time: `${slotStart}:00`,
      end_time: `${slotEnd}:00`,
    }));
    if (changeMySlot.fulfilled.match(result)) {
      setEditingSlot(null);
      refreshSelectedDate();
    } else showAlert('Unable to edit slot', String(result.payload ?? 'The slot could not be changed.'));
  };

  // Group availability by day
  const byDay: Record<number, Availability[]> = {};
  myAvailability.forEach((av) => {
    if (!byDay[av.dayOfWeek]) byDay[av.dayOfWeek] = [];
    byDay[av.dayOfWeek].push(av);
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
              <Text style={styles.ruleLabel}>Available in Horizon</Text>
              <Text style={styles.ruleValue}>
                {mySlots.filter((slot) =>
                  slot.status === 'available' &&
                  !myScheduleOverrides.some((override) =>
                    override.override_date === slot.date && override.is_blocked
                  )
                ).length}
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Working Days</Text>
              <Text style={styles.ruleValue}>{Object.keys(byDay).length}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Scheduling Calendar</Text>
        </View>
        <View style={styles.horizonRow}>
          {[7, 14, 21, 30].map((days) => (
            <TouchableOpacity
              key={days}
              onPress={() => chooseHorizon(days)}
              style={[styles.horizonPill, horizonDays === days && styles.horizonPillActive]}
            >
              <Text style={[styles.horizonText, horizonDays === days && styles.horizonTextActive]}>
                {days === 30 ? '1 month' : `${days / 7} week${days === 7 ? '' : 's'}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.calendarRange}>Showing {fromDate} through {toDate}</Text>

        <Card variant="default" padding="md" style={styles.calendarCard}>
          <View style={styles.calendarMonthHeader}>
            <TouchableOpacity
              disabled={!hasPreviousCalendarMonth}
              onPress={() => changeCalendarMonth(-1)}
              style={styles.calendarMonthButton}
            >
              <Text style={[styles.calendarMonthButtonText, !hasPreviousCalendarMonth && styles.calendarDateDisabled]}>
                ‹
              </Text>
            </TouchableOpacity>
            <Text style={styles.dayName}>
              {calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity
              disabled={!hasNextCalendarMonth}
              onPress={() => changeCalendarMonth(1)}
              style={styles.calendarMonthButton}
            >
              <Text style={[styles.calendarMonthButtonText, !hasNextCalendarMonth && styles.calendarDateDisabled]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calendarGrid}>
            {DAY_ABBR.map((day) => <Text key={day} style={styles.calendarWeekday}>{day}</Text>)}
            {Array.from(
              { length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() },
              (_, index) => <View key={`empty-${index}`} style={styles.calendarCell} />
            )}
            {Array.from({ length: daysInCalendarMonth }, (_, index) => {
              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1);
              const key = localDateKey(date);
              const enabled = key >= fromDate && key <= toDate;
              const active = key === selectedDate;
              const override = myScheduleOverrides.find((item) => item.override_date === key);
              const available = mySlots.some((slot) => slot.date === key && slot.status === 'available');
              return (
                <TouchableOpacity
                  key={key}
                  disabled={!enabled}
                  onPress={() => {
                    setSelectedDate(key);
                    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                  }}
                  style={[
                    styles.calendarCell,
                    enabled && styles.calendarCellEnabled,
                    active && styles.calendarCellSelected,
                  ]}
                >
                  <Text style={[
                    styles.calendarDateText,
                    !enabled && styles.calendarDateDisabled,
                    active && styles.calendarDateSelected,
                  ]}>{index + 1}</Text>
                  {override?.is_blocked
                    ? <View style={styles.blockedDot} />
                    : available ? <View style={styles.availableDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card variant="elevated" padding="md" style={styles.selectedDateCard}>
          <Text style={styles.dayName}>
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Text>
          <Text style={styles.windowMeta}>
            {selectedOverride?.is_blocked
              ? 'Blocked for leave / holiday'
              : selectedOverride
                ? 'Date-specific hours override the weekly schedule'
                : 'Following the recurring weekly schedule'}
          </Text>
          <View style={styles.dateActions}>
            <Button title="Custom hours" onPress={() => setOverrideModalVisible(true)} variant="secondary" size="sm" />
            <Button
              title={selectedOverride?.is_blocked ? 'Date blocked' : 'Block day'}
              onPress={blockSelectedDate}
              variant="outline"
              size="sm"
              disabled={selectedOverride?.is_blocked}
            />
            {selectedOverride && (
              <Button title="Use weekly hours" onPress={restoreWeeklySchedule} variant="outline" size="sm" />
            )}
          </View>
          <Text style={styles.sectionHeading}>
            {selectedOverride && !selectedOverride.is_blocked ? 'Custom hours' : 'Weekly hours'}
          </Text>
          {(selectedOverride && !selectedOverride.is_blocked
            ? selectedOverride.windows.map((window) => ({
                id: window.id,
                startTime: window.start_time,
                endTime: window.end_time,
                slotDurationMinutes: window.slot_duration_minutes,
              }))
            : selectedWeeklyWindows
          ).map((window) => (
            <Text key={window.id} style={styles.windowTime}>
              {formatTime(window.startTime)} – {formatTime(window.endTime)} · {window.slotDurationMinutes} min slots
            </Text>
          ))}
          {selectedOverride?.is_blocked && <Text style={styles.windowMeta}>No slots can be booked on this date.</Text>}
        </Card>

        <Text style={styles.sectionHeading}>Slots for {selectedDate}</Text>
        {isLoadingSlots ? <LoadingIndicator message="Loading slots…" /> : selectedSlots.length === 0 ? (
          <EmptyState icon="calendar" title="No slots for this date" description="Add weekly hours or create date-specific hours." />
        ) : (
          <View style={styles.daysList}>
            {selectedSlots.map((slot) => {
              const effectivelyBlocked = selectedOverride?.is_blocked && slot.status === 'available';
              const isBooked = slot.status === 'booked' || slot.status === 'reserved';
              return (
                <Card key={slot.id} variant="default" padding="md" style={styles.slotCard}>
                  <View style={styles.windowInfo}>
                    <Text style={styles.windowTime}>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</Text>
                    <Text style={styles.windowMeta}>
                      {effectivelyBlocked ? 'Blocked for this date' : isBooked ? 'Booked · locked' :
                        slot.status === 'blocked' ? 'Blocked' : slot.status === 'cancelled' ? 'Removed from schedule' : 'Available'}
                    </Text>
                  </View>
                  {!effectivelyBlocked && (slot.status === 'available' || isBooked) && (
                    <View style={styles.windowActions}>
                      {!isBooked && (
                        <TouchableOpacity onPress={() => {
                          setEditingSlot(slot);
                          setSlotStart(slot.startTime.slice(0, 5));
                          setSlotEnd(slot.endTime.slice(0, 5));
                        }} style={styles.slotAction}>
                          <Text style={styles.slotActionText}>Edit time</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={async () => {
                        await blockSlot(slot);
                      }} style={styles.slotAction}>
                        <Text style={[styles.slotActionText, isBooked && styles.dangerSlotActionText]}>
                          {isBooked ? 'Block & cancel' : 'Block'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {!isBooked && !effectivelyBlocked && slot.status === 'blocked' && (
                    <TouchableOpacity onPress={async () => {
                      const result = await dispatch(changeMySlot({ slotId: slot.id, action: 'restore' }));
                      if (changeMySlot.fulfilled.match(result)) refreshSelectedDate();
                      else showAlert('Unable to restore slot', String(result.payload ?? 'The slot could not be restored.'));
                    }} style={styles.slotAction}>
                      <Text style={styles.slotActionText}>Restore</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {/* Weekly Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Weekly Working Hours</Text>
          <Button
            title="+ Add Window"
            onPress={() => { setEditingWindow(null); setAddModalVisible(true); }}
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
                        <TouchableOpacity
                          onPress={() => { setEditingWindow(av); setAddModalVisible(true); }}
                          style={styles.slotAction}
                        >
                          <Text style={styles.slotActionText}>Edit</Text>
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

      </ScrollView>

      <AddWindowModal
        visible={addModalVisible}
        initialWindow={editingWindow}
        onClose={() => { setAddModalVisible(false); setEditingWindow(null); }}
        onSave={handleSaveWeeklyWindow}
        isSaving={isSaving}
      />
      <DateOverrideModal
        visible={overrideModalVisible}
        date={selectedDate}
        existing={selectedOverride}
        isSaving={isSaving}
        onClose={() => setOverrideModalVisible(false)}
        onSave={saveDateOverride}
      />
      <Modal visible={editingSlot !== null} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>Edit slot time</Text>
            <Text style={modalStyles.label}>Only unbooked slots can be changed.</Text>
            <Input label="Start Time (HH:MM)" value={slotStart} onChangeText={setSlotStart} containerStyle={modalStyles.input} />
            <Input label="End Time (HH:MM)" value={slotEnd} onChangeText={setSlotEnd} containerStyle={modalStyles.input} />
            <View style={modalStyles.actions}>
              <Button title="Cancel" onPress={() => setEditingSlot(null)} variant="secondary" size="md" style={modalStyles.btn} />
              <Button title="Save" onPress={saveSlotEdit} variant="primary" size="md" style={modalStyles.btn} />
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
  horizonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  horizonPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface },
  horizonPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  horizonText: { color: colors.text.secondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold },
  horizonTextActive: { color: colors.surface },
  calendarRange: { color: colors.text.muted, fontSize: typography.sizes.xs, marginBottom: spacing.md },
  calendarCard: { marginBottom: spacing.md },
  calendarMonthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  calendarMonthButton: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: spacing.borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  calendarMonthButtonText: { color: colors.primary, fontSize: 25, lineHeight: 28, fontWeight: typography.weights.bold },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarWeekday: { width: '14.285%', textAlign: 'center', color: colors.text.muted, fontSize: 10, fontWeight: typography.weights.bold, paddingVertical: spacing.xs },
  calendarCell: { width: '14.285%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  calendarCellEnabled: { backgroundColor: colors.surface },
  calendarCellSelected: { backgroundColor: colors.primary },
  calendarDateText: { color: colors.text.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold },
  calendarDateDisabled: { color: colors.text.muted, opacity: 0.45 },
  calendarDateSelected: { color: colors.surface },
  availableDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.status.success, marginTop: 2 },
  blockedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.status.error, marginTop: 2 },
  selectedDateCard: { marginVertical: spacing.sm, borderLeftWidth: 4, borderLeftColor: colors.primary },
  dateActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.md },
  slotCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  slotAction: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: spacing.borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  slotActionText: { color: colors.primary, fontSize: 11, fontWeight: typography.weights.semiBold },
  dangerSlotActionText: { color: colors.status.error },
  weekDayCard: { width: '13%', minWidth: 44, alignItems: 'center', padding: spacing.sm },
  weekDayName: { fontSize: 10, fontWeight: typography.weights.bold, color: colors.text.muted, textTransform: 'uppercase' },
  weekDayDate: { fontSize: 10, color: colors.text.secondary, marginTop: 1 },
  weekDaySlots: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary, marginTop: spacing.xs },
  weekDaySlotsNone: { color: colors.text.muted },
  weekDaySlotsLabel: { fontSize: 9, color: colors.text.muted },
});
