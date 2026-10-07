import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { colors, spacing, typography } from '../../theme';
import {
  ScreenHeader,
  Card,
  AppIcon,
} from '../../components/common';
import { PatientPrescriptionHistoryModal } from '../../components/prescription';

export default function PatientHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={`Hello, ${user?.firstName ?? 'there'}`}
        subtitle="Manage your personal health and upcoming consultations"
        badgeLabel="Patient"
        badgeVariant="patient"
      />

      {/* Quick Action Navigation Grid */}
      <Text style={styles.sectionHeading}>Quick Services</Text>

      <View style={styles.servicesGrid}>
        <Card
          variant="default"
          padding="lg"
          onPress={() => navigation.navigate('Doctors')}
          style={styles.serviceCard}
        >
          <View style={styles.iconCircle}>
            <AppIcon name="doctors" size={20} color={colors.primary} />
          </View>
          <Text style={styles.serviceTitle}>Find Doctors</Text>
          <Text style={styles.serviceDesc}>
            Search verified specialists and check fees
          </Text>
        </Card>

        <Card
          variant="default"
          padding="lg"
          onPress={() => navigation.navigate('Appointments')}
          style={styles.serviceCard}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.doctorRole.badgeBg }]}>
            <AppIcon name="calendar" size={20} color={colors.secondary} />
          </View>
          <Text style={styles.serviceTitle}>My Visits</Text>
          <Text style={styles.serviceDesc}>
            Scheduled teleconsultations and records
          </Text>
        </Card>
      </View>

      {/* Prescriptions Quick Access */}
      <Card
        variant="elevated"
        padding="lg"
        onPress={() => setPrescriptionModalVisible(true)}
        style={styles.prescriptionCard}
      >
        <View style={styles.prescriptionCardInner}>
          <View style={[styles.iconCircle, styles.rxIconCircle]}>
            <Text style={styles.rxSymbolLarge}>℞</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prescriptionCardTitle}>My Prescriptions</Text>
            <Text style={styles.prescriptionCardDesc}>
              View all official digital prescriptions from your doctors
            </Text>
          </View>
          <AppIcon name="chevron" size={16} color={colors.primary} />
        </View>
      </Card>

      {/* Prescription History Modal */}
      <PatientPrescriptionHistoryModal
        visible={prescriptionModalVisible}
        onClose={() => setPrescriptionModalVisible(false)}
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
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  serviceCard: {
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  // Prescription quick-access card
  prescriptionCard: {
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  prescriptionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rxIconCircle: {
    backgroundColor: colors.primarySubtle,
  },
  rxSymbolLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  prescriptionCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  prescriptionCardDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
