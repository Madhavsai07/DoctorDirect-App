import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
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
