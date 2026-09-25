import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'patient' | 'doctor' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: spacing.borderRadius.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Variants
  primary: {
    backgroundColor: colors.primarySubtle,
  },
  success: {
    backgroundColor: colors.status.successBg,
  },
  warning: {
    backgroundColor: colors.status.warningBg,
  },
  error: {
    backgroundColor: colors.status.errorBg,
  },
  info: {
    backgroundColor: colors.status.infoBg,
  },
  patient: {
    backgroundColor: colors.patientRole.badgeBg,
  },
  doctor: {
    backgroundColor: colors.doctorRole.badgeBg,
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  // Text
  text: {
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  text_primary: {
    color: colors.primary,
  },
  text_success: {
    color: colors.status.successText,
  },
  text_warning: {
    color: colors.status.warningText,
  },
  text_error: {
    color: colors.status.errorText,
  },
  text_info: {
    color: colors.status.infoText,
  },
  text_patient: {
    color: colors.patientRole.badgeText,
  },
  text_doctor: {
    color: colors.doctorRole.badgeText,
  },
  text_neutral: {
    color: colors.text.secondary,
  },

  textSize_sm: {
    fontSize: typography.sizes.xs - 1,
  },
  textSize_md: {
    fontSize: typography.sizes.xs,
  },
});
