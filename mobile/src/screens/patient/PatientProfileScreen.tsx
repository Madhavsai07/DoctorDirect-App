import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import { ScreenHeader, Card, Badge, Button, AppIcon } from '../../components/common';

export default function PatientProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Patient Profile"
        subtitle="Manage personal health details and preferences"
      />

      {/* Identity Card */}
      <Card variant="elevated" padding="lg" style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0) ?? 'R'}
            {user?.lastName?.charAt(0) ?? 'V'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Badge label="Verified Patient" variant="patient" style={styles.roleBadge} />
      </Card>

      {/* Medical Profile Summary */}
      <Text style={styles.sectionTitle}>Medical Information</Text>
      <Card variant="default" padding="lg" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Blood Group</Text>
          <Text style={styles.infoValue}>O+ Positive</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Known Allergies</Text>
          <Text style={styles.infoValue}>Penicillin</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Medical History</Text>
          <Text style={styles.infoValue}>Mild asthma in childhood</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Emergency Contact</Text>
          <Text style={styles.infoValue}>Pooja Verma (+91 98765 43212)</Text>
        </View>
      </Card>

      {/* Account Settings */}
      <Text style={styles.sectionTitle}>Care Settings</Text>
      <Card variant="default" padding="lg" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Consultation Mode</Text>
          <Text style={styles.infoValue}>Telehealth Video / Audio</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Language</Text>
          <Text style={styles.infoValue}>English</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Notifications</Text>
          <Text style={styles.infoValue}>Enabled</Text>
        </View>
      </Card>

      {/* Logout Action */}
      <Button
        title="Sign Out"
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
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.primary,
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
  roleBadge: {
    marginTop: spacing.sm,
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
  logoutButton: {
    marginTop: spacing.xs,
  },
});
