import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Button } from './Button';
import { AppIcon, IconName } from './AppIcon';

export interface EmptyStateProps {
  icon?: IconName | React.ReactNode;
  title: string;
  message?: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'calendar',
  title,
  message,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  const displayMessage = message ?? description ?? '';
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        {typeof icon === 'string' ? (
          <AppIcon name={icon as IconName} size={28} color={colors.primary} />
        ) : (
          icon
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.lineHeights.normal,
  },
  actionButton: {
    marginTop: spacing.lg,
  },
});
