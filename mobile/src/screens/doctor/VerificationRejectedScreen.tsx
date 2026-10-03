import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import { Card, Badge, Button, AppIcon } from '../../components/common';

export default function VerificationRejectedScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const cleanFirst = (user?.firstName ?? 'Doctor').replace(/^Dr\.?\s*/i, '');
  const doctorDisplayName = `Dr. ${cleanFirst} ${user?.lastName ?? ''}`.trim();

  const handleSignOut = () => {
    dispatch(logoutUser());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerArea}>
        <View style={styles.iconContainer}>
          <AppIcon name="warning" size={40} color={colors.status.error} />
        </View>
        <Text style={styles.title}>Verification Not Approved</Text>
        <Text style={styles.subtitle}>
          Your physician account verification could not be approved by an administrator at this time.
        </Text>
      </View>

      <Card variant="elevated" padding="lg" style={styles.card}>
        <View style={styles.statusBadgeRow}>
          <Badge label="Verification Rejected" variant="error" size="md" />
        </View>

        <Text style={styles.sectionTitle}>Application Details</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Applicant</Text>
          <Text style={styles.infoValue}>{doctorDisplayName}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.divider} />

        {user?.specialization && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specialization</Text>
              <Text style={styles.infoValue}>{user.specialization}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Status</Text>
          <Text style={[styles.infoValue, { color: colors.status.error }]}>Access Denied</Text>
        </View>
      </Card>

      <Card variant="default" padding="lg" style={styles.noticeCard}>
        <View style={styles.noticeRow}>
          <AppIcon name="info" size={20} color={colors.status.error} />
          <Text style={styles.noticeText}>
            If you believe this was an error or wish to submit updated credentials (such as medical license, certifications, or identity documentation), please contact DoctorDirect administrator support.
          </Text>
        </View>
      </Card>

      <View style={styles.buttonGroup}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          size="lg"
          style={styles.signOutButton}
        />
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
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  statusBadgeRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  noticeCard: {
    marginBottom: spacing.xl,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  noticeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: '#991B1B',
    lineHeight: 18,
  },
  buttonGroup: {
    gap: spacing.md,
  },
  signOutButton: {
    width: '100%',
  },
});
