import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { colors, spacing, typography } from '../../theme';
import {
  ScreenHeader,
  Card,
  Badge,
  AppIcon,
} from '../../components/common';

export default function PatientHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={`Hello, ${user?.firstName ?? 'Rahul'}`}
        subtitle="Manage your personal health and upcoming consultations"
        badgeLabel="Patient"
        badgeVariant="patient"
      />

      {/* Next Upcoming Consultation Card */}
      <Card variant="elevated" padding="lg" style={styles.upcomingCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardHeaderSmall}>UPCOMING CONSULTATION</Text>
          <Badge label="Confirmed" variant="success" size="sm" />
        </View>

        <View style={styles.doctorInfoRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>AS</Text>
          </View>
          <View style={styles.doctorTextCol}>
            <Text style={styles.doctorName}>Dr. Aditi Sharma</Text>
            <Text style={styles.doctorSpecialty}>Cardiologist • Video Visit</Text>
          </View>
        </View>

        <View style={styles.timeBadgeContainer}>
          <AppIcon name="clock" size={14} color={colors.primary} />
          <Text style={styles.timeText}>Tomorrow at 10:30 AM</Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardActionRow}>
          <Text
            style={styles.cardActionLink}
            onPress={() => navigation.navigate('Appointments')}
          >
            View Appointment Details
          </Text>
          <AppIcon name="chevron" size={14} color={colors.primary} />
        </View>
      </Card>

      {/* Quick Action Navigation Grid */}
      <Text style={styles.sectionHeading}>Quick Services</Text>

      <View style={styles.servicesGrid}>
        <Card
          variant="default"
          padding="lg"
          onPress={() => navigation.navigate('Doctors')}
          style={styles.serviceCard}
        >
          <View style={styles.iconCircle}>
            <AppIcon name="doctors" size={20} color={colors.primary} />
          </View>
          <Text style={styles.serviceTitle}>Find Doctors</Text>
          <Text style={styles.serviceDesc}>
            Search verified specialists and check fees
          </Text>
        </Card>

        <Card
          variant="default"
          padding="lg"
          onPress={() => navigation.navigate('Appointments')}
          style={styles.serviceCard}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.doctorRole.badgeBg }]}>
            <AppIcon name="calendar" size={20} color={colors.secondary} />
          </View>
          <Text style={styles.serviceTitle}>My Visits</Text>
          <Text style={styles.serviceDesc}>
            Scheduled teleconsultations and records
          </Text>
        </Card>
      </View>

      {/* Quick Medical Summary Card */}
      <Text style={styles.sectionHeading}>Medical Record Overview</Text>

      <Card variant="default" padding="lg" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Blood Group</Text>
          <Text style={styles.summaryValue}>O+ Positive</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Allergies</Text>
          <Text style={styles.summaryValue}>Penicillin</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Emergency Contact</Text>
          <Text style={styles.summaryValue}>Pooja Verma (+91 98765 43212)</Text>
        </View>
      </Card>
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
  upcomingCard: {
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarInitials: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  doctorTextCol: {
    flex: 1,
  },
  doctorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  doctorSpecialty: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.sm,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActionLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
  },
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  serviceCard: {
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  summaryCard: {
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
});
