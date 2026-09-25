import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { devLogin } from '../../store/slices/authSlice';
import { isDevBypassAllowed } from '../../services/auth';
import { colors, spacing, typography } from '../../theme';
import {
  Button,
  Card,
  ScreenHeader,
  ErrorView,
  Input,
} from '../../components/common';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDevLogin = async (role: 'patient' | 'doctor') => {
    if (!isDevBypassAllowed()) {
      Alert.alert(
        'Access Notice',
        'Development login is restricted to development builds.'
      );
      return;
    }
    dispatch(devLogin(role));
  };

  const handleCredentialsSubmit = () => {
    if (!email || !password) {
      Alert.alert('Sign In', 'Please enter your email and password, or use the quick development sign-in options below.');
      return;
    }
    Alert.alert(
      'Account Sign In',
      'Production authentication will connect to the clinical auth provider. For local testing, please use the quick sign-in buttons below.'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="DoctorDirect"
        subtitle="Telemedicine & Digital Clinical Care"
      />

      {error && (
        <ErrorView
          title="Authentication Failed"
          message={error}
        />
      )}

      {/* Account Login Form */}
      <Card variant="default" padding="xl" style={styles.formCard}>
        <Text style={styles.sectionHeading}>Sign In to Your Account</Text>

        <Input
          label="Email Address"
          placeholder="name@hospital.org or patient@mail.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title="Sign In"
          onPress={handleCredentialsSubmit}
          variant="primary"
          size="lg"
          style={styles.signInButton}
        />
      </Card>

      {/* Temporary Development Login Section */}
      <Card variant="subtle" padding="lg" style={styles.devCard}>
        <Text style={styles.devTitle}>Development Quick Access</Text>
        <Text style={styles.devSubtitle}>
          Sign in immediately with pre-configured development profiles:
        </Text>

        <Button
          title="Sign in as Patient (Rahul Verma)"
          onPress={() => handleDevLogin('patient')}
          variant="outline"
          size="md"
          isLoading={isLoading}
          style={styles.devButton}
        />

        <Button
          title="Sign in as Doctor (Dr. Aditi Sharma)"
          onPress={() => handleDevLogin('doctor')}
          variant="outline"
          size="md"
          isLoading={isLoading}
          style={styles.devButton}
        />
      </Card>
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
  formCard: {
    marginBottom: spacing.xl,
  },
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  signInButton: {
    marginTop: spacing.sm,
  },
  devCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  devTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  devSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeights.normal,
  },
  devButton: {
    marginVertical: spacing.xs,
  },
});
