import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ScreenHeader, Card, Badge, Button, Input, AppIcon } from '../../components/common';

export default function PatientDoctorsScreen() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const specialties = ['All', 'Cardiology', 'General Medicine', 'Pediatrics', 'Dermatology'];

  const doctors = [
    {
      id: '1',
      name: 'Dr. Aditi Sharma',
      specialty: 'Cardiology',
      experience: '9 Years',
      rating: '4.9',
      reviews: '124',
      fee: '₹750',
      availability: 'Available Today',
      isAvailableToday: true,
      bio: 'Senior Cardiologist specializing in preventive heart health and digital cardiology.',
      initials: 'AS',
    },
    {
      id: '2',
      name: 'Dr. Vikram Sethi',
      specialty: 'General Medicine',
      experience: '12 Years',
      rating: '4.8',
      reviews: '98',
      fee: '₹500',
      availability: 'Available Tomorrow',
      isAvailableToday: false,
      bio: 'Family physician with extensive experience in chronic disease management and telehealth.',
      initials: 'VS',
    },
  ];

  const handleBookPress = (doctorName: string) => {
    Alert.alert(
      'Schedule Consultation',
      `Booking appointment with ${doctorName}. Slot scheduling and payment will be available in the booking module.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Find Doctors"
        subtitle="Search verified specialists and schedule teleconsultations"
      />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by doctor or specialization..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Specialty Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillContainer}
      >
        {specialties.map((item) => {
          const isSelected = selectedSpecialty === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => setSelectedSpecialty(item)}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Doctors List */}
      <Text style={styles.sectionHeading}>Verified Specialists</Text>

      <View style={styles.doctorList}>
        {doctors.map((doc) => (
          <Card key={doc.id} variant="default" padding="lg" style={styles.doctorCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{doc.initials}</Text>
              </View>

              <View style={styles.doctorHeaderCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.doctorName}>{doc.name}</Text>
                </View>
                <Text style={styles.specialtyText}>{doc.specialty}</Text>

                <View style={styles.ratingRow}>
                  <AppIcon name="star" size={13} color="#f59e0b" />
                  <Text style={styles.ratingText}>
                    {doc.rating} ({doc.reviews} reviews) • {doc.experience} exp
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.bioText}>{doc.bio}</Text>

            <View style={styles.cardDivider} />

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.feeLabel}>Consultation Fee</Text>
                <Text style={styles.feeAmount}>{doc.fee}</Text>
              </View>

              <Button
                title="Book Visit"
                onPress={() => handleBookPress(doc.name)}
                variant="primary"
                size="sm"
                style={styles.bookButton}
              />
            </View>
          </Card>
        ))}
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
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  doctorList: {
    gap: spacing.lg,
  },
  doctorCard: {
    marginBottom: spacing.xs,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  doctorHeaderCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  specialtyText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semiBold,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  bioText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feeAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  bookButton: {
    paddingHorizontal: spacing.lg,
  },
});
