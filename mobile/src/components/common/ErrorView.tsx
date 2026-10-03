import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Button } from './Button';

export interface ErrorViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  style?: ViewStyle;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  title = 'Unable to Load Data',
  message,
  onRetry,
  retryText = 'Retry',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>!</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title={retryText}
          onPress={onRetry}
          variant="outline"
          size="sm"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.errorBg,
    borderRadius: spacing.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginVertical: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.status.errorText,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.status.errorText,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.status.errorText,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.lineHeights.normal,
  },
  retryButton: {
    marginTop: spacing.lg,
  },
});
