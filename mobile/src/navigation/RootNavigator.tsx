import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { RootStackParamList } from './types';

// Stacks / Screens
import LoginScreen from '../screens/auth/LoginScreen';
import PatientNavigator from './PatientNavigator';
import DoctorNavigator from './DoctorNavigator';
import VerificationPendingScreen from '../screens/doctor/VerificationPendingScreen';
import VerificationRejectedScreen from '../screens/doctor/VerificationRejectedScreen';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Navigator with Role-Based Protected Navigation Guards.
 *
 * Screens are conditionally mounted based on authentication status and role:
 * - Unauthenticated users can only access Auth screens.
 * - Authenticated Patients can only access Patient navigation stack.
 * - Authenticated Doctors can only access Doctor navigation stack when approved;
 *   otherwise they are directed to VerificationPending or VerificationRejected screens.
 * - Authenticated Admins can only access Admin navigation stack.
 */
export default function RootNavigator() {
  const { isAuthenticated, isInitialized, role, verificationStatus } = useAppSelector((state) => state.auth);

  if (!isInitialized) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // ── Auth Flow ────────────────────────────────────────────────────────
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : role === 'patient' ? (
        // ── Patient Flow ─────────────────────────────────────────────────────
        <Stack.Screen name="PatientApp" component={PatientNavigator} />
      ) : role === 'doctor' ? (
        // ── Doctor Flow ──────────────────────────────────────────────────────
        verificationStatus === 'pending' ? (
          <Stack.Screen name="DoctorVerificationPending" component={VerificationPendingScreen} />
        ) : verificationStatus === 'rejected' ? (
          <Stack.Screen name="DoctorVerificationRejected" component={VerificationRejectedScreen} />
        ) : verificationStatus === 'approved' ? (
          <Stack.Screen name="DoctorApp" component={DoctorNavigator} />
        ) : (
          <Stack.Screen name="DoctorVerificationPending" component={VerificationPendingScreen} />
        )
      ) : role === 'admin' ? (
        // ── Admin Flow ───────────────────────────────────────────────────────
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : (
        // Fallback for unhandled / invalid role
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

