import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ScreenHeader, Card, Badge, Button, AppIcon, EmptyState } from '../../components/common';

export default function PatientAppointmentsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const handleJoinCall = (doctorName: string) => {
    Alert.alert(
      'Join Video Call',
      `Connecting to secure telehealth room with ${doctorName}. Video call will become active 10 minutes before the scheduled time.`
    );
  };

  const handleViewPrescription = (doctorName: string) => {
    Alert.alert(
      'Clinical Prescription',
      `Prescription from ${doctorName} is digitally signed and saved to your health record.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Appointments"
        subtitle="Manage upcoming teleconsultations and medical visits"
      />

      {/* Segmented Filter Control */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'upcoming' && styles.tabItemActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming (1)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'past' && styles.tabItemActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past Visits (1)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Consultations */}
      {activeTab === 'upcoming' && (
        <View style={styles.listContainer}>
          <Card variant="default" padding="lg" style={styles.appointmentCard}>
            <View style={styles.topRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AS</Text>
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.doctorName}>Dr. Aditi Sharma</Text>
                <Text style={styles.specialty}>Cardiology</Text>
              </View>

              <Badge label="Confirmed" variant="success" size="sm" />
            </View>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <AppIcon name="calendar" size={14} color={colors.text.secondary} />
                <Text style={styles.detailText}>Tomorrow, 10:30 AM – 11:00 AM</Text>
              </View>
              <View style={styles.detailRow}>
                <AppIcon name="video" size={14} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.primary, fontWeight: '600' }]}>
                  High-Definition Telehealth Video Call
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Button
                title="Join Video Call"
                onPress={() => handleJoinCall('Dr. Aditi Sharma')}
                variant="primary"
                size="sm"
                style={styles.actionBtn}
              />
              <Button
                title="Reschedule"
                onPress={() =>
                  Alert.alert('Reschedule', 'Please choose a new time slot from the doctor calendar.')
                }
                variant="outline"
                size="sm"
                style={styles.actionBtn}
              />
            </View>
          </Card>
        </View>
      )}

      {/* Past Consultations */}
      {activeTab === 'past' && (
        <View style={styles.listContainer}>
          <Card variant="default" padding="lg" style={styles.appointmentCard}>
            <View style={styles.topRow}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.avatarText, { color: colors.text.secondary }]}>RK</Text>
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.doctorName}>Dr. Rajesh Kumar</Text>
                <Text style={styles.specialty}>General Medicine</Text>
              </View>

              <Badge label="Completed" variant="neutral" size="sm" />
            </View>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <AppIcon name="calendar" size={14} color={colors.text.secondary} />
                <Text style={styles.detailText}>14 Oct 2025 • 04:00 PM</Text>
              </View>
              <View style={styles.detailRow}>
                <AppIcon name="medical" size={14} color={colors.secondary} />
                <Text style={styles.detailText}>Consultation Summary & Prescription Saved</Text>
              </View>
            </View>

            <Button
              title="View Prescription & Summary"
              onPress={() => handleViewPrescription('Dr. Rajesh Kumar')}
              variant="outline"
              size="sm"
              style={{ marginTop: spacing.sm }}
            />
          </Card>
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
    padding: spacing.xl,
    paddingTop: spacing.section,
    paddingBottom: spacing.xxxl,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: spacing.borderRadius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    gap: spacing.md,
  },
  appointmentCard: {
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  headerInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  specialty: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },
  detailsBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
