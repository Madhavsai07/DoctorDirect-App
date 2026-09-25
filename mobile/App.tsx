import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Milestone 1 — Project Foundation
 *
 * This is the temporary root component that proves the Expo application
 * starts correctly. DoctorDirect screens, navigation, and business logic
 * will be introduced in later milestones.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DoctorDirect</Text>
      <Text style={styles.subtitle}>Project Foundation Running</Text>
      <Text style={styles.milestone}>Milestone 1 · Environment Setup</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a237e',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#3949ab',
    marginTop: 8,
  },
  milestone: {
    fontSize: 13,
    color: '#9e9e9e',
    marginTop: 16,
    letterSpacing: 0.5,
  },
});
