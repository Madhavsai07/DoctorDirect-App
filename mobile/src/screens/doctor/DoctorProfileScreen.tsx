import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { clearNotifications } from '../../store/slices/notificationSlice';
import { colors, spacing, typography } from '../../theme';
import { ScreenHeader, Card, Badge, Button, ErrorView } from '../../components/common';
import apiClient from '../../services/api/apiClient';

interface DoctorProfile {
  specialization_name: string;
  qualification: string | null;
  license_number: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  experience_years: number;
  consultation_fee: number;
  is_available: boolean;
}

export default function DoctorProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiClient.get('/doctor/me');
      setProfile(res.data.doctorProfile ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const firstName = (user?.firstName ?? '').replace(/^Dr\.?\s*/i, '').trim();
  const lastName = user?.lastName ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const doctorDisplayName = fullName ? `Dr. ${fullName}` : user?.email ?? 'Physician';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}` || 'DR';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Physician Profile"
        subtitle="Review your credentials and verification status"
      />

      <Card variant="elevated" padding="lg" style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {doctorDisplayName}
        </Text>
        <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
          {user?.email}
        </Text>
        <View style={styles.badgeRow}>
          {profile?.specialization_name && (
            <Badge label={profile.specialization_name} variant="doctor" />
          )}
          {profile?.qualification && (
            <Badge label={profile.qualification} variant="neutral" />
          )}
        </View>
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.profileState} />
      ) : error ? (
        <ErrorView
          message="Your profile could not be loaded. Check your connection and try again."
          onRetry={() => void loadProfile()}
        />
      ) : profile ? (
        <>
          <Text style={styles.sectionTitle}>Practice Credentials</Text>
          <Card variant="default" padding="lg" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Medical License</Text>
              <View style={styles.verifiedRow}>
                <Text style={styles.infoValue}>{profile.license_number}</Text>
                <Badge
                  label={profile.verification_status}
                  variant={profile.verification_status === 'approved' ? 'success' : 'warning'}
                  size="sm"
                />
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Clinical Experience</Text>
              <Text style={styles.infoValue}>{profile.experience_years} Years</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Consultation Rate</Text>
              <Text style={styles.infoFee}>${profile.consultation_fee} / session</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Directory Status</Text>
              <Text style={styles.infoValue}>{profile.is_available ? 'Listed' : 'Not listed'}</Text>
            </View>
          </Card>
        </>
      ) : (
        <ErrorView message="No doctor profile is linked to this account. Contact support for help." />
      )}

      <Button
        title="Sign Out of Doctor Workspace"
        onPress={() => {
          dispatch(clearNotifications());
          dispatch(logoutUser());
        }}
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
  profileState: {
    marginVertical: spacing.xl,
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
    gap: spacing.sm,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
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
    flexShrink: 1,
    textAlign: 'right',
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
