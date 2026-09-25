import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { RootStackParamList } from './types';

// Stacks / Screens
import LoginScreen from '../screens/auth/LoginScreen';
import PatientNavigator from './PatientNavigator';
import DoctorNavigator from './DoctorNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Navigator with Role-Based Protected Navigation Guards.
 *
 * Screens are conditionally mounted based on authentication status and role:
 * - Unauthenticated users can only access Auth screens.
 * - Authenticated Patients can only access Patient navigation stack.
 * - Authenticated Doctors can only access Doctor navigation stack.
 */
export default function RootNavigator() {
  const { isAuthenticated, role } = useAppSelector((state) => state.auth);

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
        <Stack.Screen name="DoctorApp" component={DoctorNavigator} />
      ) : (
        // Fallback for unhandled / invalid role
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
