import React from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ScreenHeader, Card, Badge, Button, AppIcon } from '../../components/common';

export default function DoctorAvailabilityScreen() {
  const weeklySchedule = [
    { day: 'Monday', hours: '09:00 AM – 01:00 PM, 02:00 PM – 05:00 PM', status: 'Active', variant: 'success' as const },
    { day: 'Tuesday', hours: '09:00 AM – 01:00 PM, 02:00 PM – 05:00 PM', status: 'Active', variant: 'success' as const },
    { day: 'Wednesday', hours: '09:00 AM – 01:00 PM (Morning Only)', status: 'Half-Day', variant: 'info' as const },
    { day: 'Thursday', hours: '09:00 AM – 01:00 PM, 02:00 PM – 05:00 PM', status: 'Active', variant: 'success' as const },
    { day: 'Friday', hours: '09:00 AM – 01:00 PM, 02:00 PM – 05:00 PM', status: 'Active', variant: 'success' as const },
    { day: 'Saturday & Sunday', hours: 'Clinic Closed', status: 'Off', variant: 'neutral' as const },
  ];

  const handleSave = () => {
    Alert.alert(
      'Schedule Updated',
      'Your consultation availability has been published. Available booking slots will update on the patient booking directory.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Availability & Hours"
        subtitle="Configure weekly telehealth schedule and booking intervals"
      />

      {/* Schedule Settings Summary */}
      <Card variant="elevated" padding="lg" style={styles.summaryCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.summaryHeader}>TELEHEALTH CONSULTATION RULES</Text>
          <Badge label="Published" variant="success" size="sm" />
        </View>

        <View style={styles.ruleRow}>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Slot Duration</Text>
            <Text style={styles.ruleValue}>30 Minutes</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Buffer Time</Text>
            <Text style={styles.ruleValue}>10 Minutes</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Max Advance</Text>
            <Text style={styles.ruleValue}>14 Days</Text>
          </View>
        </View>
      </Card>

      {/* Weekly Working Days */}
      <Text style={styles.sectionHeading}>Weekly Working Hours</Text>

      <View style={styles.daysList}>
        {weeklySchedule.map((item) => (
          <Card key={item.day} variant="default" padding="md" style={styles.dayCard}>
            <View style={styles.rowBetween}>
              <View style={styles.dayInfoCol}>
                <Text style={styles.dayName}>{item.day}</Text>
                <Text style={styles.hoursText}>{item.hours}</Text>
              </View>
              <Badge label={item.status} variant={item.variant} size="sm" />
            </View>
          </Card>
        ))}
      </View>

      <Button
        title="Edit Working Hours"
        onPress={handleSave}
        variant="secondary"
        size="md"
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.section,
    paddingBottom: spacing.xxxl,
  },
  summaryCard: {
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  ruleItem: {
    alignItems: 'flex-start',
  },
  ruleLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  ruleValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  daysList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dayCard: {
    marginBottom: 0,
  },
  dayInfoCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  dayName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  hoursText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  saveButton: {
    marginTop: spacing.xs,
  },
});
