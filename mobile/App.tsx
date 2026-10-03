import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
import { initializeAuth, refreshCurrentUser, sessionEnded } from './src/store/slices/authSlice';
import { clearDoctorState } from './src/store/slices/doctorSlice';
import { clearAppointmentState } from './src/store/slices/appointmentSlice';
import { clearConsultationState } from './src/store/slices/consultationSlice';
import { clearPrescriptionState } from './src/store/slices/prescriptionSlice';
import { clearNotifications } from './src/store/slices/notificationSlice';
import { supabase } from './src/services/auth/supabaseClient';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * DoctorDirect App Root
 *
 * Wraps the app with:
 * 1. Redux Provider (central state store)
 * 2. SafeAreaProvider (mobile device insets)
 * 3. NavigationContainer (role-protected navigation stacks)
 */
export default function App() {
  useEffect(() => {
    store.dispatch(initializeAuth());
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void supabase?.auth.startAutoRefresh();
      else void supabase?.auth.stopAutoRefresh();
    });
    const authSubscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        store.dispatch(sessionEnded());
        store.dispatch(clearDoctorState());
        store.dispatch(clearAppointmentState());
        store.dispatch(clearConsultationState());
        store.dispatch(clearPrescriptionState());
        store.dispatch(clearNotifications());
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setTimeout(() => store.dispatch(refreshCurrentUser()), 0);
      }
    });
    return () => {
      appStateSubscription.remove();
      authSubscription?.data.subscription.unsubscribe();
    };
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
