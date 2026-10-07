import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchAdminDoctors,
  setSelectedFilter,
  setSearchQuery,
  approveDoctorAction,
  rejectDoctorAction,
  clearActionMessage,
} from '../../store/slices/adminSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { AdminStackParamList } from '../../navigation/types';
import { VerificationStatus, AdminDoctor } from '../../services/admin/adminService';
import { colors, spacing, typography } from '../../theme';
import { showAlert } from '../../utils/alert';
import {
  ScreenHeader,
  Card,
  Badge,
  Button,
  AppIcon,
  EmptyState,
  ErrorView,
  LoadingIndicator,
} from '../../components/common';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const {
    doctors,
    selectedFilter,
    searchQuery,
    counts,
    isLoading,
    isActionLoading,
    error,
    actionSuccessMessage,
  } = useAppSelector((state) => state.admin);

  const [refreshing, setRefreshing] = useState(false);
  const [processingDoctorId, setProcessingDoctorId] = useState<string | null>(null);

  const loadData = useCallback(
    async (filter = selectedFilter, query = searchQuery) => {
      dispatch(fetchAdminDoctors({ status: filter, search: query }));
    },
    [dispatch, selectedFilter, searchQuery]
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFilterChange = (filter: VerificationStatus | 'all') => {
    dispatch(setSelectedFilter(filter));
    dispatch(fetchAdminDoctors({ status: filter, search: searchQuery }));
  };

  const handleSearchChange = (text: string) => {
    dispatch(setSearchQuery(text));
    dispatch(fetchAdminDoctors({ status: selectedFilter, search: text }));
  };

  const handleApprove = (doctor: AdminDoctor) => {
    showAlert(
      'Approve Doctor',
      `Are you sure you want to approve Dr. ${doctor.first_name} ${doctor.last_name}? They will be able to practice and receive patient bookings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setProcessingDoctorId(doctor.doctor_id);
            await dispatch(approveDoctorAction(doctor.doctor_id));
            setProcessingDoctorId(null);
          },
        },
      ]
    );
  };

  const handleReject = (doctor: AdminDoctor) => {
    showAlert(
      'Reject Doctor',
      `Are you sure you want to reject Dr. ${doctor.first_name} ${doctor.last_name}'s verification?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingDoctorId(doctor.doctor_id);
            await dispatch(rejectDoctorAction(doctor.doctor_id));
            setProcessingDoctorId(null);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out of the Admin Portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logoutUser()) },
    ]);
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return <Badge label="Approved" variant="success" size="sm" />;
      case 'rejected':
        return <Badge label="Rejected" variant="error" size="sm" />;
      case 'pending':
      default:
        return <Badge label="Pending" variant="warning" size="sm" />;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Header with Portal Branding & Sign Out */}
      <View style={styles.topBar}>
        <View style={styles.headerTextCol}>
          <View style={styles.portalBadge}>
            <View style={styles.portalDot} />
            <Text style={styles.portalBadgeText}>ADMIN CONSOLE</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            Doctor Credentialing
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
            {user?.email}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <AppIcon name="profile" size={16} color={colors.status.error} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <View style={styles.successBanner}>
          <View style={styles.bannerRow}>
            <AppIcon name="check" size={16} color={colors.status.successText} />
            <Text style={styles.successBannerText}>{actionSuccessMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => dispatch(clearActionMessage())}>
            <AppIcon name="close" size={14} color={colors.status.successText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Verification Status Metric Cards / Filter Chips */}
      <View style={styles.metricsContainer}>
        <TouchableOpacity
          style={[
            styles.metricCard,
            selectedFilter === 'pending' && styles.metricCardActivePending,
          ]}
          onPress={() => handleFilterChange('pending')}
          activeOpacity={0.7}
        >
          <View style={styles.metricHeaderRow}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.status.warning }]} />
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
          <Text style={[styles.metricNumber, { color: colors.status.warningText }]}>
            {counts.pending}
          </Text>
          <Text style={styles.metricSubtext}>Requires action</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.metricCard,
            selectedFilter === 'approved' && styles.metricCardActiveApproved,
          ]}
          onPress={() => handleFilterChange('approved')}
          activeOpacity={0.7}
        >
          <View style={styles.metricHeaderRow}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.status.success }]} />
            <Text style={styles.metricLabel}>Approved</Text>
          </View>
          <Text style={[styles.metricNumber, { color: colors.status.successText }]}>
            {counts.approved}
          </Text>
          <Text style={styles.metricSubtext}>Active in directory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.metricCard,
            selectedFilter === 'rejected' && styles.metricCardActiveRejected,
          ]}
          onPress={() => handleFilterChange('rejected')}
          activeOpacity={0.7}
        >
          <View style={styles.metricHeaderRow}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.status.error }]} />
            <Text style={styles.metricLabel}>Rejected</Text>
          </View>
          <Text style={[styles.metricNumber, { color: colors.status.errorText }]}>
            {counts.rejected}
          </Text>
          <Text style={styles.metricSubtext}>Blocked</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.metricCard,
            selectedFilter === 'all' && styles.metricCardActiveAll,
          ]}
          onPress={() => handleFilterChange('all')}
          activeOpacity={0.7}
        >
          <View style={styles.metricHeaderRow}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.primary }]} />
            <Text style={styles.metricLabel}>Total</Text>
          </View>
          <Text style={[styles.metricNumber, { color: colors.primary }]}>{counts.total}</Text>
          <Text style={styles.metricSubtext}>All records</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <AppIcon name="search" size={18} color={colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialization, or license..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <AppIcon name="close" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Category Header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listSectionTitle}>
          {selectedFilter === 'pending'
            ? 'Doctors Awaiting Verification'
            : selectedFilter === 'approved'
            ? 'Approved Practitioners'
            : selectedFilter === 'rejected'
            ? 'Rejected Applications'
            : 'All Doctor Applications'}
        </Text>
        <Badge
          label={`${doctors.length} ${doctors.length === 1 ? 'doctor' : 'doctors'}`}
          variant="neutral"
          size="sm"
        />
      </View>

      {/* Doctors List / States */}
      {isLoading && doctors.length === 0 ? (
        <LoadingIndicator message="Loading verification records..." />
      ) : error ? (
        <ErrorView message={error} onRetry={() => loadData()} />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon="doctors"
          title={`No ${selectedFilter === 'all' ? '' : selectedFilter} doctors found`}
          description={
            searchQuery.trim().length > 0
              ? `No results match "${searchQuery}". Try a different keyword.`
              : selectedFilter === 'pending'
              ? 'All submitted doctor applications have been processed.'
              : `There are currently no ${selectedFilter} doctor records.`
          }
        />
      ) : (
        <View style={styles.doctorList}>
          {doctors.map((doctor) => {
            const isProcessing = processingDoctorId === doctor.doctor_id;
            const initials = `${doctor.first_name[0] || ''}${doctor.last_name[0] || ''}`.toUpperCase();

            return (
              <Card
                key={doctor.doctor_id}
                variant="elevated"
                padding="md"
                style={styles.doctorCard}
                onPress={() =>
                  navigation.navigate('AdminDoctorDetail', { doctorId: doctor.doctor_id })
                }
              >
                {/* Doctor Top Row: Avatar, Name, Status */}
                <View style={styles.doctorHeaderRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>

                  <View style={styles.doctorInfoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.doctorName} numberOfLines={1} ellipsizeMode="tail">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </Text>
                      {getStatusBadge(doctor.verification_status)}
                    </View>

                    <Text style={styles.doctorSpecialization} numberOfLines={1} ellipsizeMode="tail">
                      {doctor.specialization_name} • {doctor.experience_years} yrs exp
                    </Text>
                  </View>
                </View>

                {/* Details Breakdown */}
                <View style={styles.doctorDetailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>License:</Text>
                    <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                      {doctor.license_number}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Fee:</Text>
                    <Text style={styles.detailValue}>${doctor.consultation_fee}</Text>
                  </View>
                  {doctor.email && (
                    <View style={[styles.detailItem, styles.detailItemEmail]}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                        {doctor.email}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Card Action Footer */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.viewDetailLink}
                    onPress={() =>
                      navigation.navigate('AdminDoctorDetail', { doctorId: doctor.doctor_id })
                    }
                  >
                    <Text style={styles.viewDetailLinkText}>View Full File →</Text>
                  </TouchableOpacity>

                  {/* Contextual Quick Actions */}
                  {doctor.verification_status === 'pending' ? (
                    <View style={styles.actionButtonsCluster}>
                      <TouchableOpacity
                        style={[styles.quickRejectBtn, isProcessing && styles.buttonDisabled]}
                        onPress={() => handleReject(doctor)}
                        disabled={isProcessing || isActionLoading}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color={colors.status.error} />
                        ) : (
                          <Text style={styles.quickRejectBtnText}>Reject</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.quickApproveBtn, isProcessing && styles.buttonDisabled]}
                        onPress={() => handleApprove(doctor)}
                        disabled={isProcessing || isActionLoading}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.quickApproveBtnText}>Approve</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : doctor.verification_status === 'rejected' ? (
                    <TouchableOpacity
                      style={[styles.quickReApproveBtn, isProcessing && styles.buttonDisabled]}
                      onPress={() => handleApprove(doctor)}
                      disabled={isProcessing || isActionLoading}
                    >
                      <Text style={styles.quickReApproveBtnText}>Approve Doctor</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>
      )}
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  headerTextCol: {
    flex: 1,
    marginRight: spacing.xs,
  },
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.borderRadius.xs,
    marginBottom: spacing.xs,
  },
  portalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  portalBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    color: colors.text.primary,
    fontWeight: typography.weights.heavy,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#fca5a5',
    flexShrink: 0,
  },
  logoutButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.status.errorText,
    marginLeft: 6,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.status.successBg,
    padding: spacing.sm + 2,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#86efac',
    marginBottom: spacing.md,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  successBannerText: {
    fontSize: typography.sizes.sm,
    color: colors.status.successText,
    fontWeight: typography.weights.semiBold,
    marginLeft: spacing.xs,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricCardActivePending: {
    borderColor: colors.status.warning,
    backgroundColor: '#fffbeb',
  },
  metricCardActiveApproved: {
    borderColor: colors.status.success,
    backgroundColor: '#f0fdf4',
  },
  metricCardActiveRejected: {
    borderColor: colors.status.error,
    backgroundColor: '#fef2f2',
  },
  metricCardActiveAll: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.semiBold,
  },
  metricNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    marginVertical: 2,
  },
  metricSubtext: {
    fontSize: 11,
    color: colors.text.muted,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    height: 44,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    paddingVertical: 0,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  doctorList: {
    gap: spacing.sm,
  },
  doctorCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  doctorInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  doctorName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.xs,
  },
  doctorSpecialization: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  doctorDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.xs,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  detailItemEmail: {
    flexShrink: 1,
    maxWidth: '100%',
  },
  detailLabel: {
    color: colors.text.muted,
    marginRight: 4,
    fontSize: 11,
  },
  detailValue: {
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    fontSize: 11,
    flexShrink: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  viewDetailLink: {
    paddingVertical: 4,
  },
  viewDetailLinkText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
  },
  actionButtonsCluster: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickRejectBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: spacing.borderRadius.xs,
    backgroundColor: colors.status.errorBg,
    borderWidth: 1,
    borderColor: '#fca5a5',
    minWidth: 64,
    alignItems: 'center',
  },
  quickRejectBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.status.errorText,
    fontWeight: typography.weights.bold,
  },
  quickApproveBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: spacing.borderRadius.xs,
    backgroundColor: colors.status.success,
    minWidth: 70,
    alignItems: 'center',
  },
  quickApproveBtnText: {
    fontSize: typography.sizes.xs,
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
  quickReApproveBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: spacing.borderRadius.xs,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  quickReApproveBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.semiBold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
