import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import { ScreenHeader, Card, Badge, Button, AppIcon } from '../../components/common';

export default function DoctorProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Physician Profile"
        subtitle="Manage credentials, clinical rates, and clinic settings"
      />

      {/* Identity Card */}
      <Card variant="elevated" padding="lg" style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0) ?? 'A'}
            {user?.lastName?.charAt(0) ?? 'S'}
          </Text>
        </View>
        <Text style={styles.name}>Dr. {user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badgeRow}>
          <Badge label="Cardiology Specialist" variant="doctor" />
          <Badge label="MBBS, MD" variant="neutral" />
        </View>
      </Card>

      {/* Professional Practice Details */}
      <Text style={styles.sectionTitle}>Practice Credentials</Text>
      <Card variant="default" padding="lg" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Medical Registration</Text>
          <View style={styles.verifiedRow}>
            <Text style={styles.infoValue}>MCI-2015-87654</Text>
            <Badge label="Verified" variant="success" size="sm" />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Clinical Experience</Text>
          <Text style={styles.infoValue}>9 Years</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Consultation Rate</Text>
          <Text style={styles.infoFee}>₹750.00 / session</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Patient Satisfaction</Text>
          <Text style={styles.infoValue}>4.90 / 5.00 (124 reviews)</Text>
        </View>
      </Card>

      {/* Telemedicine & Clinic Settings */}
      <Text style={styles.sectionTitle}>Telehealth Workspace</Text>
      <Card variant="default" padding="lg" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>WebRTC Camera & Audio</Text>
          <Badge label="Ready" variant="success" size="sm" />
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Clinical Scribe Assistant</Text>
          <Badge label="Active" variant="info" size="sm" />
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Digital Prescription Pad</Text>
          <Text style={styles.infoValue}>Configured</Text>
        </View>
      </Card>

      {/* Logout Action */}
      <Button
        title="Sign Out of Doctor Workspace"
        onPress={() => dispatch(logoutUser())}
        variant="danger"
        size="md"
        style={styles.logoutButton}
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
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.doctorRole.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  name: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  email: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoCard: {
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  infoFee: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  logoutButton: {
    marginTop: spacing.xs,
  },
});
