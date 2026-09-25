import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { colors, spacing, typography } from '../../theme';
import {
  ScreenHeader,
  Card,
  Badge,
  Button,
  AppIcon,
} from '../../components/common';

export default function DoctorDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={`Dr. ${user?.firstName ?? 'Aditi'} ${user?.lastName ?? 'Sharma'}`}
        subtitle="Cardiology Practice • Clinical Workspace"
        badgeLabel="Doctor"
        badgeVariant="doctor"
      />

      {/* Daily Practice Summary Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>4</Text>
          <Text style={styles.metricLabel}>Scheduled</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: colors.secondary }]}>1</Text>
          <Text style={styles.metricLabel}>Waiting</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: colors.status.successText }]}>2</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>
      </View>

      {/* Next Up Patient in Queue */}
      <Card variant="elevated" padding="lg" style={styles.nextPatientCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardHeaderSmall}>NEXT CONSULTATION</Text>
          <Badge label="In Waiting Room" variant="success" size="sm" />
        </View>

        <View style={styles.patientRow}>
          <View style={styles.patientAvatar}>
            <Text style={styles.avatarInitials}>RV</Text>
          </View>
          <View style={styles.patientDetailsCol}>
            <Text style={styles.patientName}>Rahul Verma</Text>
            <Text style={styles.patientSubtext}>30 yrs • Male • Follow-up</Text>
          </View>
        </View>

        <View style={styles.consultationNoteBox}>
          <Text style={styles.noteTitle}>Reason for Visit:</Text>
          <Text style={styles.noteBody}>
            Follow-up on hypertension management and blood pressure medication review.
          </Text>
        </View>

        <View style={styles.timeRow}>
          <AppIcon name="clock" size={14} color={colors.secondary} />
          <Text style={styles.timeText}>10:30 AM (In 15 minutes)</Text>
        </View>

        <Button
          title="Start Teleconsultation"
          onPress={() => navigation.navigate('DoctorAppointments')}
          variant="secondary"
          size="md"
          style={styles.startCallBtn}
        />
      </Card>

      {/* Quick Navigation Cards */}
      <Text style={styles.sectionHeading}>Clinic Actions</Text>
      <View style={styles.cardList}>
        <Card
          variant="default"
          padding="lg"
          onPress={() => navigation.navigate('DoctorAppointments')}
          style={styles.actionCard}
        >
          <View style={styles.actionIconRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.doctorRole.badgeBg }]}>
              <AppIcon name="calendar" size={20} color={colors.secondary} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Consultation Queue</Text>
              <Text style={styles.actionSubtitle}>
                Review today's 4 patient appointments and medical histories
              </Text>
            </View>
            <AppIcon name="chevron" size={16} color={colors.text.muted} />
          </View>
        </Card>

        <Card
          variant="default"
          padding="lg"
          onPress={() => navigation.navigate('DoctorAvailability')}
          style={styles.actionCard}
        >
          <View style={styles.actionIconRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
              <AppIcon name="clock" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Availability & Slots</Text>
              <Text style={styles.actionSubtitle}>
                Manage weekly working hours and 30-min booking slots
              </Text>
            </View>
            <AppIcon name="chevron" size={16} color={colors.text.muted} />
          </View>
        </Card>
      </View>
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
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  nextPatientCard: {
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
  cardHeaderSmall: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.doctorRole.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarInitials: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  patientDetailsCol: {
    flex: 1,
  },
  patientName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  patientSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  consultationNoteBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.md,
  },
  noteTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  noteBody: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  timeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.secondary,
  },
  startCallBtn: {
    width: '100%',
  },
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  cardList: {
    gap: spacing.md,
  },
  actionCard: {
    marginBottom: spacing.xs,
  },
  actionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
