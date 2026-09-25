import React from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import {
  ScreenHeader,
  Card,
  Badge,
  Button,
  AppIcon,
} from '../../components/common';

export default function DoctorAppointmentsScreen() {
  const queuePatients = [
    {
      id: '1',
      name: 'Rahul Verma',
      ageGender: '30 yrs • Male',
      time: '10:30 AM (In 15 mins)',
      type: 'Follow-up • Hypertension Review',
      status: 'In Waiting Room',
      statusVariant: 'success' as const,
      initials: 'RV',
      isNext: true,
    },
    {
      id: '2',
      name: 'Priya Nair',
      ageGender: '45 yrs • Female',
      time: '11:15 AM',
      type: 'New Consultation • Chest Tightness',
      status: 'Confirmed',
      statusVariant: 'info' as const,
      initials: 'PN',
      isNext: false,
    },
    {
      id: '3',
      name: 'Amit Patel',
      ageGender: '52 yrs • Male',
      time: '02:00 PM',
      type: 'Routine Review • Post-Angioplasty Check',
      status: 'Confirmed',
      statusVariant: 'info' as const,
      initials: 'AP',
      isNext: false,
    },
  ];

  const handleStartCall = (patientName: string) => {
    Alert.alert(
      'Start Consultation',
      `Launching secure teleconsultation room for ${patientName}. WebRTC video and clinical note scribe will initialize.`
    );
  };

  const handleReviewHistory = (patientName: string) => {
    Alert.alert(
      'Patient History',
      `Opening prior medical records and past prescriptions for ${patientName}.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Consultation Queue"
        subtitle="Today's scheduled patient consultations and intake"
      />

      <View style={styles.queueHeaderRow}>
        <Text style={styles.queueCountText}>3 PATIENTS SCHEDULED TODAY</Text>
      </View>

      <View style={styles.queueList}>
        {queuePatients.map((patient) => (
          <Card
            key={patient.id}
            variant="default"
            padding="lg"
            style={[styles.patientCard, patient.isNext && styles.nextPatientCard]}
          >
            <View style={styles.topRow}>
              <View
                style={[
                  styles.avatar,
                  patient.isNext && { backgroundColor: colors.doctorRole.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    patient.isNext && { color: colors.secondary },
                  ]}
                >
                  {patient.initials}
                </Text>
              </View>

              <View style={styles.patientInfoCol}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientDemographics}>{patient.ageGender}</Text>
              </View>

              <Badge label={patient.status} variant={patient.statusVariant} size="sm" />
            </View>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <AppIcon name="clock" size={14} color={colors.secondary} />
                <Text style={styles.detailTextBold}>{patient.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <AppIcon name="medical" size={14} color={colors.text.secondary} />
                <Text style={styles.detailText}>{patient.type}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              {patient.isNext ? (
                <Button
                  title="Start Video Consult"
                  onPress={() => handleStartCall(patient.name)}
                  variant="secondary"
                  size="sm"
                  style={styles.actionBtn}
                />
              ) : (
                <Button
                  title="Review History"
                  onPress={() => handleReviewHistory(patient.name)}
                  variant="outline"
                  size="sm"
                  style={styles.actionBtn}
                />
              )}
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
  queueHeaderRow: {
    marginBottom: spacing.md,
  },
  queueCountText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  queueList: {
    gap: spacing.md,
  },
  patientCard: {
    marginBottom: spacing.xs,
  },
  nextPatientCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
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
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
  },
  patientInfoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  patientDemographics: {
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
  detailTextBold: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
  },
});
