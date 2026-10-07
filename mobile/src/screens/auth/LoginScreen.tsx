import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, Text, View, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, registerUser } from '../../store/slices/authSlice';
import { DoctorRegistration, PatientRegistration, RegistrationPayload } from '../../types/auth';
import { colors, spacing, typography } from '../../theme';
import {
  Button,
  Card,
  ScreenHeader,
  ErrorView,
  Input,
  AppIcon,
} from '../../components/common';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateSpecialization,
  validateLicenseNumber,
  validateExperienceYears,
  validateConsultationFee,
  validateQualification,
  sanitizePhoneInput,
  sanitizeDigitsOnly,
  sanitizeDecimalInput,
} from '../../utils/validation';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const { isLoading, error: authError } = useAppSelector((state) => state.auth);

  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  // Form field state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [specializationName, setSpecializationName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [qualification, setQualification] = useState('');
  const [bio, setBio] = useState('');
  const [idCardUri, setIdCardUri] = useState<string | null>(null);
  const [idCardError, setIdCardError] = useState<string | null>(null);

  // Field error state
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const clearErrors = () => {
    setErrors({});
    setHasSubmitted(false);
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string | null> = {};

    // Common fields
    newErrors.email = validateEmail(email);
    newErrors.password = validatePassword(password, isRegistering);

    if (isRegistering) {
      newErrors.firstName = validateName(firstName, 'First name', true);
      newErrors.lastName = validateName(lastName, 'Last name', true);
      newErrors.phone = validatePhone(phone, false, 'Phone number');

      if (role === 'doctor') {
        newErrors.specializationName = validateSpecialization(specializationName);
        newErrors.licenseNumber = validateLicenseNumber(licenseNumber);
        newErrors.experienceYears = validateExperienceYears(experienceYears);
        newErrors.consultationFee = validateConsultationFee(consultationFee);
        newErrors.qualification = validateQualification(qualification);
        // ID card is required for doctors
        if (!idCardUri) {
          setIdCardError('Please upload your government-issued ID card.');
          newErrors.idCard = 'ID card required';
        }
      }
    }

    setErrors(newErrors);
    const hasAnyError = Object.values(newErrors).some((err) => err !== null);
    return !hasAnyError;
  };

  const handlePickIdCard = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload an ID card.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setIdCardUri(result.assets[0].uri);
      setIdCardError(null);
    }
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);
    const isValid = validateAllFields();

    if (!isValid) {
      Alert.alert('Validation Error', 'Please fix the highlighted errors before continuing.');
      return;
    }

    if (!isRegistering) {
      dispatch(loginUser({ email: email.trim(), password }));
      return;
    }

    let registration: RegistrationPayload;
    if (role === 'patient') {
      const profile: PatientRegistration = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      };
      registration = { role, profile };
    } else {
      const profile: DoctorRegistration = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        specializationName: specializationName.trim(),
        licenseNumber: licenseNumber.trim(),
        experienceYears: Number(experienceYears),
        consultationFee: Number(consultationFee),
        qualification: qualification.trim(),
        bio: bio.trim() || undefined,
      };
      registration = { role, profile };
    }

    try {
      const result = await dispatch(registerUser({ registration, credentials: { email: email.trim(), password } })).unwrap();
      if (result.confirmationRequired) {
        Alert.alert('Confirm Your Email', 'Check your email, confirm your address, then sign in here to finish setting up your profile.');
        setIsRegistering(false);
      }
    } catch {
      // The Redux auth error is rendered in ErrorView
    }
  };

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    clearErrors();
  };

  const handleRoleChange = (newRole: 'patient' | 'doctor') => {
    setRole(newRole);
    clearErrors();
  };

  const renderRoleSelector = () => (
    <View style={styles.segmentedContainer}>
      {(['patient', 'doctor'] as const).map((option) => (
        <TouchableOpacity
          key={option}
          activeOpacity={0.85}
          style={[
            styles.segmentOption,
            role === option && styles.segmentOptionActive,
          ]}
          onPress={() => handleRoleChange(option)}
        >
          <Text
            style={[
              styles.segmentOptionText,
              role === option && styles.segmentOptionTextActive,
            ]}
          >
            {option === 'patient' ? 'Patient' : 'Doctor'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="DoctorDirect"
        subtitle="Telemedicine & Digital Clinical Care"
      />

      {authError && (
        <ErrorView
          title="Authentication Failed"
          message={authError}
        />
      )}

      <Card variant="default" padding="xl" style={styles.formCard}>
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>{isRegistering ? 'Create account' : 'Welcome back'}</Text>
          <Text style={styles.sectionHeading}>{isRegistering ? 'Set up your profile' : 'Sign in to your account'}</Text>
          <Text style={styles.subtext}>
            {isRegistering
              ? 'Create a secure patient or doctor profile to continue.'
              : 'Access your care dashboard and clinical records.'}
          </Text>
        </View>

        {isRegistering && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Account type</Text>
            {renderRoleSelector()}

            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Input
              label="First name *"
              placeholder="e.g. Jane"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (hasSubmitted) setErrors((prev) => ({ ...prev, firstName: validateName(text, 'First name', true) }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, firstName: validateName(firstName, 'First name', true) }))}
              error={errors.firstName}
              autoCapitalize="words"
            />

            <Input
              label="Last name *"
              placeholder="e.g. Doe"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (hasSubmitted) setErrors((prev) => ({ ...prev, lastName: validateName(text, 'Last name', true) }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, lastName: validateName(lastName, 'Last name', true) }))}
              error={errors.lastName}
              autoCapitalize="words"
            />

            <Input
              label="Phone number (optional)"
              placeholder="e.g. +1234567890 (7-15 digits)"
              value={phone}
              onChangeText={(text) => {
                const clean = sanitizePhoneInput(text);
                setPhone(clean);
                if (hasSubmitted) setErrors((prev) => ({ ...prev, phone: validatePhone(clean, false, 'Phone number') }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, phone: validatePhone(phone, false, 'Phone number') }))}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            {role !== 'patient' ? (
              <>
                <Text style={styles.sectionTitle}>Professional Information</Text>

                <Input
                  label="Medical specialization *"
                  placeholder="e.g. Cardiology, Pediatrics"
                  value={specializationName}
                  onChangeText={(text) => {
                    setSpecializationName(text);
                    if (hasSubmitted) setErrors((prev) => ({ ...prev, specializationName: validateSpecialization(text) }));
                  }}
                  onBlur={() => setErrors((prev) => ({ ...prev, specializationName: validateSpecialization(specializationName) }))}
                  error={errors.specializationName}
                  autoCapitalize="words"
                />

                <Input
                  label="Medical license number *"
                  placeholder="e.g. MED-84729"
                  value={licenseNumber}
                  onChangeText={(text) => {
                    setLicenseNumber(text);
                    if (hasSubmitted) setErrors((prev) => ({ ...prev, licenseNumber: validateLicenseNumber(text) }));
                  }}
                  onBlur={() => setErrors((prev) => ({ ...prev, licenseNumber: validateLicenseNumber(licenseNumber) }))}
                  error={errors.licenseNumber}
                  autoCapitalize="characters"
                />

                <Input
                  label="Years of experience *"
                  placeholder="e.g. 8"
                  value={experienceYears}
                  onChangeText={(text) => {
                    const clean = sanitizeDigitsOnly(text);
                    setExperienceYears(clean);
                    if (hasSubmitted) setErrors((prev) => ({ ...prev, experienceYears: validateExperienceYears(clean) }));
                  }}
                  onBlur={() => setErrors((prev) => ({ ...prev, experienceYears: validateExperienceYears(experienceYears) }))}
                  error={errors.experienceYears}
                  keyboardType="number-pad"
                />

                <Input
                  label="Consultation fee (₹) *"
                  placeholder="e.g. 500 or 1200.00"
                  value={consultationFee}
                  onChangeText={(text) => {
                    const clean = sanitizeDecimalInput(text);
                    setConsultationFee(clean);
                    if (hasSubmitted) setErrors((prev) => ({ ...prev, consultationFee: validateConsultationFee(clean) }));
                  }}
                  onBlur={() => setErrors((prev) => ({ ...prev, consultationFee: validateConsultationFee(consultationFee) }))}
                  error={errors.consultationFee}
                  keyboardType="decimal-pad"
                />

                <Input
                  label="Qualification *"
                  placeholder="e.g. MBBS, MD (Internal Medicine)"
                  value={qualification}
                  onChangeText={(text) => {
                    setQualification(text);
                    if (hasSubmitted) setErrors((prev) => ({ ...prev, qualification: validateQualification(text) }));
                  }}
                  onBlur={() => setErrors((prev) => ({ ...prev, qualification: validateQualification(qualification) }))}
                  error={errors.qualification}
                />

                <Input
                  label="Professional bio (optional)"
                  placeholder="Short background, clinical interests, or clinic introduction..."
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                />

                {/* Doctor ID Card Upload */}
                <View style={styles.idCardSection}>
                  <Text style={styles.idCardLabel}>Government ID Card *</Text>
                  <Text style={styles.idCardHint}>Upload a clear photo of your Aadhaar, PAN, Passport, or Driving Licence</Text>

                  <TouchableOpacity
                    style={[styles.idCardUploadBox, idCardUri && styles.idCardUploadBoxFilled, idCardError ? styles.idCardUploadBoxError : null]}
                    onPress={handlePickIdCard}
                    activeOpacity={0.7}
                  >
                    {idCardUri ? (
                      <>
                        <Image source={{ uri: idCardUri }} style={styles.idCardPreview} resizeMode="cover" />
                        <View style={styles.idCardOverlay}>
                          <AppIcon name="check" size={20} color="#ffffff" />
                          <Text style={styles.idCardOverlayText}>Tap to change</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.idCardUploadIcon}>
                          <AppIcon name="profile" size={28} color={colors.primary} />
                        </View>
                        <Text style={styles.idCardUploadTitle}>Tap to upload ID card</Text>
                        <Text style={styles.idCardUploadSub}>JPG or PNG, max 10 MB</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {idCardError && (
                    <Text style={styles.idCardErrorText}>{idCardError}</Text>
                  )}
                </View>
              </>
            ) : null}
          </View>
        )}

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Account Credentials</Text>
          <Input
            label="Email Address *"
            placeholder="name@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (hasSubmitted) setErrors((prev) => ({ ...prev, email: validateEmail(text) }));
            }}
            onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password *"
            placeholder={isRegistering ? 'At least 8 characters' : 'Enter your password'}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (hasSubmitted) setErrors((prev) => ({ ...prev, password: validatePassword(text, isRegistering) }));
            }}
            onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(password, isRegistering) }))}
            error={errors.password}
            secureTextEntry
          />
        </View>

        <Button
          title={isRegistering ? 'Create Account' : 'Sign In'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={styles.primaryButton}
        />
        <Button
          title={isRegistering ? 'Already have an account? Sign in' : 'Need an account? Create one'}
          onPress={handleToggleMode}
          variant="outline"
          size="md"
          style={styles.secondaryButton}
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.section,
    paddingBottom: spacing.xxxl,
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  headerBlock: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  sectionHeading: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.lineHeights.loose,
  },
  subtext: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.relaxed,
    marginTop: spacing.xs,
  },
  sectionWrap: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: spacing.borderRadius.xl,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius.lg,
  },
  segmentOptionActive: {
    backgroundColor: colors.surface,
    ...spacing.shadows.sm,
  },
  segmentOptionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold,
    color: colors.text.secondary,
  },
  segmentOptionTextActive: {
    color: colors.primary,
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
  // Doctor ID card upload
  idCardSection: {
    marginTop: spacing.md,
  },
  idCardLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  idCardHint: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  idCardUploadBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: spacing.borderRadius.md,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  idCardUploadBoxFilled: {
    borderStyle: 'solid',
    borderColor: colors.status.success,
  },
  idCardUploadBoxError: {
    borderColor: colors.status.error,
    backgroundColor: colors.status.errorBg,
  },
  idCardPreview: {
    width: '100%',
    height: '100%',
  },
  idCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  idCardOverlayText: {
    color: '#ffffff',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
  },
  idCardUploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  idCardUploadTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  idCardUploadSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  idCardErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.status.error,
    marginTop: spacing.xs,
  },
});
