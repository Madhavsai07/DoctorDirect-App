import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Badge, BadgeProps } from './Badge';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  badgeVariant?: BadgeProps['variant'];
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  badgeLabel,
  badgeVariant = 'primary',
  rightAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        {badgeLabel && (
          <Badge label={badgeLabel} variant={badgeVariant} style={styles.badge} />
        )}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  titleContainer: {
    flex: 1,
  },
  badge: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.heavy,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  rightAction: {
    marginLeft: spacing.md,
  },
});
