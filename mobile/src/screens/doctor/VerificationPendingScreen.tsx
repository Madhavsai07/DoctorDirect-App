import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser, refreshCurrentUser } from '../../store/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import { Card, Badge, Button, AppIcon } from '../../components/common';

export default function VerificationPendingScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cleanFirst = (user?.firstName ?? 'Doctor').replace(/^Dr\.?\s*/i, '');
  const doctorDisplayName = `Dr. ${cleanFirst} ${user?.lastName ?? ''}`.trim();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(refreshCurrentUser()).unwrap();
    } catch {
      // Ignored
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = () => {
    dispatch(logoutUser());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerArea}>
        <View style={styles.iconContainer}>
          <AppIcon name="clock" size={40} color={colors.status.warning} />
        </View>
        <Text style={styles.title}>Verification Pending</Text>
        <Text style={styles.subtitle}>
          Your doctor registration has been submitted and is currently awaiting administrative approval.
        </Text>
      </View>

      <Card variant="elevated" padding="lg" style={styles.card}>
        <View style={styles.statusBadgeRow}>
          <Badge label="Pending Review" variant="warning" size="md" />
        </View>

        <Text style={styles.sectionTitle}>Application Summary</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Applicant Name</Text>
          <Text style={styles.infoValue}>{doctorDisplayName}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Email</Text>
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
          <Text style={styles.infoLabel}>Access Scope</Text>
          <Text style={styles.infoValue}>Restricted until verified</Text>
        </View>
      </Card>

      <Card variant="default" padding="lg" style={styles.noticeCard}>
        <View style={styles.noticeRow}>
          <AppIcon name="info" size={20} color={colors.secondary} />
          <Text style={styles.noticeText}>
            Our medical board and administrators verify medical licenses and qualifications before granting clinical dashboard access. You will receive access as soon as your account is approved.
          </Text>
        </View>
      </Card>

      <View style={styles.buttonGroup}>
        <Button
          title={isRefreshing ? 'Checking Status...' : 'Check Approval Status'}
          onPress={handleRefresh}
          variant="primary"
          size="lg"
          isLoading={isRefreshing}
          disabled={isRefreshing}
          style={styles.refreshButton}
        />
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          size="md"
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
    backgroundColor: '#FEF3C7',
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
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  noticeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: '#0369A1',
    lineHeight: 18,
  },
  buttonGroup: {
    gap: spacing.md,
  },
  refreshButton: {
    width: '100%',
  },
  signOutButton: {
    width: '100%',
  },
});
