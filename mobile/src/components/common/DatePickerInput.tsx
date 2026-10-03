import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { AppIcon } from './AppIcon';
import { Button } from './Button';

export interface DatePickerInputProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  onChangeDate: (date: string) => void;
  error?: string | null;
  hint?: string;
  placeholder?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  maxDate?: Date; // Defaults to today
  minDate?: Date; // Defaults to 120 years ago
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed, 1).getDay();
}

function formatYYYYMMDD(year: number, monthZeroIndexed: number, day: number): string {
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const monthName = MONTHS[m - 1] || '';
  return `${monthName} ${d}, ${y} (${dateStr})`;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChangeDate,
  error,
  hint,
  placeholder = 'Select date of birth (YYYY-MM-DD)',
  containerStyle,
  labelStyle,
  maxDate = new Date(),
  minDate = new Date(new Date().getFullYear() - 120, 0, 1),
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'calendar' | 'year' | 'month'>('calendar');

  const today = new Date();
  const initialDate = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(today.getFullYear() - 25, 0, 1); // Default to ~25 yrs ago for quick selection

  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());

  const openPicker = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setSelectedYear(y);
      setSelectedMonth(m - 1);
      setSelectedDay(d);
    } else {
      setSelectedYear(today.getFullYear() - 25);
      setSelectedMonth(0);
      setSelectedDay(1);
    }
    setSelectorMode('calendar');
    setModalVisible(true);
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfWeek = getFirstDayOfWeek(selectedYear, selectedMonth);

  const isFutureDate = (day: number) => {
    const testDate = new Date(selectedYear, selectedMonth, day, 23, 59, 59);
    return testDate > maxDate;
  };

  const isTooOldDate = (day: number) => {
    const testDate = new Date(selectedYear, selectedMonth, day, 0, 0, 0);
    return testDate < minDate;
  };

  const handleConfirm = () => {
    const safeDay = Math.min(selectedDay, daysInMonth);
    const dateFormatted = formatYYYYMMDD(selectedYear, selectedMonth, safeDay);
    onChangeDate(dateFormatted);
    setModalVisible(false);
  };

  const handleClear = () => {
    onChangeDate('');
    setModalVisible(false);
  };

  // Build calendar matrix
  const matrix: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    matrix.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    matrix.push(day);
  }

  // Generate years list
  const currentYear = today.getFullYear();
  const minYear = minDate.getFullYear();
  const yearsList: number[] = [];
  for (let y = currentYear; y >= minYear; y--) {
    yearsList.push(y);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={openPicker}
        style={[
          styles.inputTrigger,
          error ? styles.inputError : undefined,
        ]}
      >
        <Text style={[styles.inputText, !value && styles.inputPlaceholder]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <AppIcon name="calendar" size={18} color={value ? colors.primary : colors.text.muted} />
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderSubtitle}>SELECT DATE OF BIRTH</Text>
                <Text style={styles.modalHeaderTitle}>
                  {MONTHS[selectedMonth]} {selectedDay}, {selectedYear}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <AppIcon name="close" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Navigation / Mode Toggle Bar */}
            <View style={styles.selectorBar}>
              <TouchableOpacity
                style={[styles.selectorChip, selectorMode === 'month' && styles.selectorChipActive]}
                onPress={() => setSelectorMode(selectorMode === 'month' ? 'calendar' : 'month')}
              >
                <Text style={[styles.selectorChipText, selectorMode === 'month' && styles.selectorChipTextActive]}>
                  {MONTHS[selectedMonth]} ▾
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectorChip, selectorMode === 'year' && styles.selectorChipActive]}
                onPress={() => setSelectorMode(selectorMode === 'year' ? 'calendar' : 'year')}
              >
                <Text style={[styles.selectorChipText, selectorMode === 'year' && styles.selectorChipTextActive]}>
                  {selectedYear} ▾
                </Text>
              </TouchableOpacity>
            </View>

            {/* Year Selector View */}
            {selectorMode === 'year' && (
              <ScrollView style={styles.yearScroll} contentContainerStyle={styles.yearGrid}>
                {yearsList.map((year) => {
                  const isSelected = year === selectedYear;
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[styles.yearItem, isSelected && styles.yearItemActive]}
                      onPress={() => {
                        setSelectedYear(year);
                        setSelectorMode('calendar');
                      }}
                    >
                      <Text style={[styles.yearText, isSelected && styles.yearTextActive]}>{year}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Month Selector View */}
            {selectorMode === 'month' && (
              <View style={styles.monthGrid}>
                {MONTHS.map((monthName, idx) => {
                  const isSelected = idx === selectedMonth;
                  const isFutureMonth = selectedYear === currentYear && idx > today.getMonth();
                  return (
                    <TouchableOpacity
                      key={monthName}
                      disabled={isFutureMonth}
                      style={[
                        styles.monthItem,
                        isSelected && styles.monthItemActive,
                        isFutureMonth && styles.dayDisabled,
                      ]}
                      onPress={() => {
                        setSelectedMonth(idx);
                        setSelectorMode('calendar');
                      }}
                    >
                      <Text
                        style={[
                          styles.monthText,
                          isSelected && styles.monthTextActive,
                          isFutureMonth && styles.dayDisabledText,
                        ]}
                      >
                        {monthName.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Calendar Grid View */}
            {selectorMode === 'calendar' && (
              <View style={styles.calendarContainer}>
                {/* Days of week header */}
                <View style={styles.daysOfWeekRow}>
                  {DAYS_OF_WEEK.map((d) => (
                    <Text key={d} style={styles.dayOfWeekText}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Day numbers grid */}
                <View style={styles.daysGrid}>
                  {matrix.map((day, i) => {
                    if (day === null) {
                      return <View key={`empty-${i}`} style={styles.dayCell} />;
                    }
                    const isSelected = day === selectedDay;
                    const isDisabled = isFutureDate(day) || isTooOldDate(day);

                    return (
                      <TouchableOpacity
                        key={`day-${day}`}
                        disabled={isDisabled}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellActive,
                          isDisabled && styles.dayDisabled,
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.dayTextActive,
                            isDisabled && styles.dayDisabledText,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Actions Bar */}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>

              <View style={styles.actionButtonsRight}>
                <Button
                  title="Cancel"
                  onPress={() => setModalVisible(false)}
                  variant="ghost"
                  size="sm"
                />
                <Button
                  title="Set Date"
                  onPress={handleConfirm}
                  variant="primary"
                  size="sm"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputTrigger: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...spacing.shadows.sm,
  },
  inputText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    flex: 1,
  },
  inputPlaceholder: {
    color: colors.text.muted,
  },
  inputError: {
    borderColor: colors.status.error,
    backgroundColor: '#fff5f5',
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.status.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.xl,
    padding: spacing.lg,
    ...spacing.shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalHeaderSubtitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  modalHeaderTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  selectorBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: spacing.borderRadius.md,
  },
  selectorChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: spacing.borderRadius.sm,
  },
  selectorChipActive: {
    backgroundColor: colors.surface,
    ...spacing.shadows.sm,
  },
  selectorChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.secondary,
  },
  selectorChipTextActive: {
    color: colors.primary,
  },
  calendarContainer: {
    marginBottom: spacing.md,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xs,
  },
  dayOfWeekText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    marginVertical: 2,
  },
  dayCellActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  dayTextActive: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
  dayDisabled: {
    opacity: 0.25,
  },
  dayDisabledText: {
    color: colors.text.muted,
  },
  yearScroll: {
    maxHeight: 220,
    marginBottom: spacing.md,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  yearItem: {
    width: '30%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  yearItemActive: {
    backgroundColor: colors.primary,
  },
  yearText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  yearTextActive: {
    color: '#ffffff',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthItem: {
    width: '31%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.surfaceMuted,
    marginVertical: 2,
  },
  monthItemActive: {
    backgroundColor: colors.primary,
  },
  monthText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  monthTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  clearButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.status.error,
    fontWeight: typography.weights.semiBold,
  },
  actionButtonsRight: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
