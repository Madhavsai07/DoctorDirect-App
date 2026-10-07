import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { colors, spacing, typography } from '../../theme';
import {
  ScreenHeader,
  Card,
  AppIcon,
} from '../../components/common';

export default function DoctorDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);

  const rawFirst = user?.firstName ?? 'Doctor';
  const rawLast = user?.lastName ?? '';
  const cleanFirst = rawFirst.replace(/^Dr\.?\s*/i, '');
  const doctorDisplayName = `Dr. ${cleanFirst} ${rawLast}`.trim();

  const specialtySubtitle = user?.specialization
    ? `${user.specialization} • Clinical Workspace`
    : 'Clinical Workspace';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={doctorDisplayName}
        subtitle={specialtySubtitle}
        badgeLabel="Doctor"
        badgeVariant="doctor"
      />

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
                Review and manage your patient appointments
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
