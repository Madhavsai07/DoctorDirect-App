import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import { showAlert } from '../../utils/alert';
import {
  ScreenHeader,
  Card,
  Badge,
  Button,
  AppIcon,
} from '../../components/common';
import apiClient from '../../services/api/apiClient';

export default function AdminProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [fullProfile, setFullProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.user) {
        setFullProfile(res.data.user);
      }
    } catch {
      // Silently use auth user state
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out of the Administrator Console?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
          },
        },
      ]
    );
  };

  const activeUser = fullProfile || user;
  const firstName = activeUser?.firstName ?? activeUser?.first_name ?? '';
  const lastName = activeUser?.lastName ?? activeUser?.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || (activeUser?.email ? activeUser.email.split('@')[0] : 'Administrator');
  const email = activeUser?.email ?? '';
  const phone = activeUser?.phone || null;
  const isActive = activeUser?.is_active !== false;

  const initials = (firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`
    : displayName.substring(0, 2)
  ).toUpperCase();

  const formatAccountCreated = (dateStr?: string) => {
    if (!dateStr) return 'Verified';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader
        title="Admin Profile"
        subtitle="System management, credentials & security"
        badgeLabel="Administrator"
        badgeVariant="primary"
      />

      {/* Identity Card */}
      <Card variant="elevated" padding="lg" style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {displayName}
        </Text>
        <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
          {email}
        </Text>
        <View style={styles.badgeRow}>
          <Badge label="System Administrator" variant="primary" />
          <Badge
            label={isActive ? 'Active Status' : 'Inactive'}
            variant={isActive ? 'success' : 'error'}
          />
        </View>
      </Card>

      {/* Account Details & Role Permissions */}
      <Text style={styles.sectionTitle}>Account & Permissions</Text>
      <Card variant="default" padding="lg" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {displayName}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>System Role</Text>
          <Text style={styles.infoValue}>Administrator (Root Access)</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.status.success }]} />
            <Text style={styles.infoValue}>Active & Verified</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contact Email</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {email}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contact Phone</Text>
          <Text style={styles.infoValue}>{phone || 'Not configured'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {formatAccountCreated(activeUser?.created_at)}
          </Text>
        </View>
      </Card>

      {/* Sign Out Action Button */}
      <Button
        title="Sign Out of Admin Console"
        onPress={handleSignOut}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  identityCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  avatarText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
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
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: -spacing.xs,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  infoCol: {
    paddingVertical: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    flexShrink: 1,
    textAlign: 'right',
  },
  monoValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text.primary,
    marginTop: 4,
  },
  logoutButton: {
    marginTop: spacing.xs,
  },
});
