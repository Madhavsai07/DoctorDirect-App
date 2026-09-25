import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import apiClient from '../../services/api/apiClient';

export default function PatientDashboardScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [rbacTestStatus, setRbacTestStatus] = useState<string | null>(null);
  const [isTestingRbac, setIsTestingRbac] = useState(false);

  const handleTestBackendRbac = async () => {
    setIsTestingRbac(true);
    setRbacTestStatus(null);
    try {
      // 1. Authorized call for Patient
      const patientRes = await apiClient.get('/patient/me');
      
      // 2. Unauthorized call: Patient trying to access Doctor route
      let doctorAccessBlocked = false;
      try {
        await apiClient.get('/doctor/me');
      } catch (err: any) {
        if (err.response?.status === 403) {
          doctorAccessBlocked = true;
        }
      }

      if (patientRes.status === 200 && doctorAccessBlocked) {
        setRbacTestStatus('✅ Backend RBAC Verified: Patient access granted (200), Doctor route strictly forbidden (403).');
      } else {
        setRbacTestStatus('⚠️ Unexpected RBAC response from server.');
      }
    } catch (err: any) {
      setRbacTestStatus(`❌ RBAC test error: ${err.message}`);
    } finally {
      setIsTestingRbac(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PATIENT PORTAL</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      {/* Backend RBAC Verification Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Role Enforcement Test</Text>
        <Text style={styles.cardDescription}>
          Verify that backend API checks reject unauthorized doctor endpoints even if called directly by a patient.
        </Text>
        <TouchableOpacity
          style={styles.rbacButton}
          onPress={handleTestBackendRbac}
          disabled={isTestingRbac}
        >
          {isTestingRbac ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.rbacButtonText}>Verify Backend RBAC Security →</Text>
          )}
        </TouchableOpacity>
        {rbacTestStatus && (
          <View style={styles.rbacResult}>
            <Text style={styles.rbacResultText}>{rbacTestStatus}</Text>
          </View>
        )}
      </View>

      {/* Future Milestone Feature Placeholders */}
      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🩺</Text>
          <Text style={styles.featureTitle}>Find Doctors</Text>
          <Text style={styles.featureSubtitle}>Cardiology, Pediatrics, General (Milestone 5)</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📅</Text>
          <Text style={styles.featureTitle}>My Appointments</Text>
          <Text style={styles.featureSubtitle}>Slot reservation & history (Milestone 5)</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>💊</Text>
          <Text style={styles.featureTitle}>Prescriptions & Sync</Text>
          <Text style={styles.featureSubtitle}>Offline SQLite records (Milestone 6/8)</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => dispatch(logoutUser())}
      >
        <Text style={styles.logoutButtonText}>Log Out of Patient Portal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 15,
    color: '#64748b',
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  emailText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 18,
  },
  rbacButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  rbacButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  rbacResult: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  rbacResultText: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 16,
  },
  featureGrid: {
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
});
