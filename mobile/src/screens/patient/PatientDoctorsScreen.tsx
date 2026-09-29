import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientDoctorStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import {
  ScreenHeader,
  Card,
  Badge,
  Button,
  Input,
  AppIcon,
  LoadingIndicator,
  ErrorView,
  EmptyState,
} from '../../components/common';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { loadDoctors, loadSpecializations } from '../../store/slices/doctorSlice';
import { Doctor, formatFee } from '../../types/doctor';

type NavProp = NativeStackNavigationProp<PatientDoctorStackParamList, 'DoctorList'>;

export default function PatientDoctorsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavProp>();
  const { doctors, specializations, isLoadingList, error } = useAppSelector((s) => s.doctor);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecId, setSelectedSpecId] = useState<string | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchData = useCallback(() => {
    dispatch(loadSpecializations());
    dispatch(
      loadDoctors({
        search: debouncedSearch || undefined,
        specialization_id: selectedSpecId,
      })
    );
  }, [dispatch, debouncedSearch, selectedSpecId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderDoctor = ({ item }: { item: Doctor }) => {
    const firstInitial = (item.firstName || '')[0] || 'D';
    const lastInitial = (item.lastName || '')[0] || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    const ratingDisplay = Number(item.rating || 0).toFixed(1);
    const expDisplay = Number(item.experienceYears || 0);

    return (
      <Card key={item.doctorId} variant="default" padding="lg" style={styles.doctorCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.doctorHeaderCol}>
            <Text style={styles.doctorName}>{item.fullName}</Text>
            <Text style={styles.specialtyText}>{item.specializationName}</Text>
            <View style={styles.ratingRow}>
              <AppIcon name="star" size={13} color="#f59e0b" />
              <Text style={styles.ratingText}>
                {ratingDisplay} • {expDisplay} yr exp
              </Text>
            </View>
          </View>
          <Badge
            label={item.isAvailable ? 'Available' : 'Unavailable'}
            variant={item.isAvailable ? 'success' : 'neutral'}
            size="sm"
          />
        </View>

        {item.bio ? (
          <Text style={styles.bioText} numberOfLines={2}>{item.bio}</Text>
        ) : null}

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeAmount}>{formatFee(item.consultationFee)}</Text>
          </View>
          <Button
            title="View Profile"
            onPress={() => navigation.navigate('DoctorDetail', { doctorId: item.doctorId })}
            variant="primary"
            size="sm"
            style={styles.bookButton}
          />
        </View>
      </Card>
    );
  };

  const allSpecLabel = 'All';

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <ScreenHeader
          title="Find Doctors"
          subtitle="Search verified specialists for teleconsultations"
          containerStyle={styles.header}
        />

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search by name or specialization…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.searchInput}
          />
        </View>

        {/* Specialization Filter Pills */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillContainer}
            style={styles.pillScroll}
          >
            <TouchableOpacity
              style={[styles.pill, !selectedSpecId && styles.pillActive]}
              onPress={() => setSelectedSpecId(undefined)}
              activeOpacity={0.7}
            >
              {!selectedSpecId && <View style={styles.activeDot} />}
              <Text style={[styles.pillText, !selectedSpecId && styles.pillTextActive]}>
                {allSpecLabel}
              </Text>
            </TouchableOpacity>

            {specializations.map((spec) => {
              const isSelected = selectedSpecId === spec.id;
              return (
                <TouchableOpacity
                  key={spec.id}
                  style={[styles.pill, isSelected && styles.pillActive]}
                  onPress={() => setSelectedSpecId(isSelected ? undefined : spec.id)}
                  activeOpacity={0.7}
                >
                  {isSelected && <View style={styles.activeDot} />}
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                    {spec.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Count & Active Filter Indicator */}
        {!isLoadingList && doctors.length > 0 && (
          <View style={styles.resultsMetaRow}>
            <Text style={styles.resultsCount}>
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available
            </Text>
            {selectedSpecId && (
              <TouchableOpacity
                onPress={() => setSelectedSpecId(undefined)}
                style={styles.clearFilterBtn}
              >
                <Text style={styles.clearFilterText}>Reset filter ✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* List */}
        {isLoadingList && doctors.length === 0 ? (
          <LoadingIndicator message="Loading doctors…" />
        ) : error ? (
          <ErrorView message={error} onRetry={fetchData} />
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={(d) => d.doctorId}
            renderItem={renderDoctor}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isLoadingList} onRefresh={fetchData} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="doctors"
                title="No Doctors Found"
                description={
                  searchQuery || selectedSpecId
                    ? 'Try adjusting your search or filter'
                    : 'No doctors available at the moment'
                }
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 0,
    marginBottom: spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  pillScroll: {
    flexGrow: 0,
    height: 44,
    maxHeight: 44,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: 2,
  },
  pill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  resultsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  resultsCount: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.muted,
  },
  clearFilterBtn: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
  },
  list: {
    padding: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  doctorCard: {
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.lg,
    backgroundColor: colors.surface,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  doctorHeaderCol: { flex: 1 },
  doctorName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  specialtyText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
    marginTop: 2,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: typography.sizes.xs, color: colors.text.secondary },
  bioText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  cardDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 10, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  feeAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text.primary },
  bookButton: { minWidth: 110 },
});
