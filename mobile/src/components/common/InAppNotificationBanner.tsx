import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  dismissNotificationBanner,
  markNotificationRead,
} from '../../store/slices/notificationSlice';
import { navigateFromNotification } from '../../navigation/navigationRef';
import { AppIcon, IconName } from './AppIcon';
import { colors, spacing, typography } from '../../theme';
import type { Notification } from '../../types/notification';

const AUTO_DISMISS_MS = 5500;

function getNotificationVisuals(notification: Notification): {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  badgeLabel: string;
} {
  const type = notification.type;

  if (type.includes('consultation') || type.includes('prescription')) {
    return {
      icon: 'medical',
      iconBg: colors.secondarySubtle,
      iconColor: colors.secondary,
      badgeLabel: 'Consultation',
    };
  }

  if (type.includes('doctor') || type.includes('verification')) {
    return {
      icon: 'check',
      iconBg: colors.doctorRole.badgeBg,
      iconColor: colors.doctorRole.badgeText,
      badgeLabel: 'Doctor Credentialing',
    };
  }

  if (type.includes('reminder')) {
    return {
      icon: 'clock',
      iconBg: colors.status.warningBg,
      iconColor: colors.status.warningText,
      badgeLabel: 'Reminder',
    };
  }

  return {
    icon: 'calendar',
    iconBg: colors.primarySubtle,
    iconColor: colors.primary,
    badgeLabel: 'Appointment',
  };
}

export const InAppNotificationBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const activeBanner = useAppSelector((state) => state.notification.activeBanner);
  const role = useAppSelector((state) => state.auth.role);

  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dispatch(dismissNotificationBanner());
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30 || gestureState.vy < -0.5) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (activeBanner) {
      translateY.setValue(-150);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
          speed: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dismiss();
      }, AUTO_DISMISS_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeBanner?.id]);

  if (!activeBanner) return null;

  const visuals = getNotificationVisuals(activeBanner);
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 12 : 16);

  const handlePress = () => {
    const item = activeBanner;
    dismiss();
    if (!item.isRead) {
      dispatch(markNotificationRead(item.id));
    }
    navigateFromNotification(item, role);
  };

  return (
    <View
      style={[styles.overlay, { top: topPadding }]}
      pointerEvents="box-none"
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
          accessibilityRole="button"
          accessibilityLabel={`${activeBanner.title}: ${activeBanner.message}`}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: visuals.iconBg }]}>
                <AppIcon name={visuals.icon} size={15} color={visuals.iconColor} />
              </View>
              <Text style={styles.appName}>DoctorDirect</Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.badgeLabel}>{visuals.badgeLabel}</Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.timeLabel}>Just now</Text>
              <Pressable
                onPress={dismiss}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close notification"
              >
                <AppIcon name="close" size={14} color={colors.text.muted} />
              </Pressable>
            </View>
          </View>

          {/* Body Content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {activeBanner.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {activeBanner.message}
            </Text>
          </View>

          {/* Drag indicator / subtle bottom bar */}
          <View style={styles.dragPillWrapper}>
            <View style={styles.dragPill} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 520,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    ...spacing.shadows.lg,
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  pressedCard: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.muted,
    marginHorizontal: 2,
  },
  badgeLabel: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.text.muted,
  },
  closeButton: {
    padding: 2,
    marginLeft: 2,
  },
  content: {
    marginTop: 2,
    paddingLeft: 2,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: typography.sizes.xs + 0.5,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  dragPillWrapper: {
    alignItems: 'center',
    marginTop: 6,
  },
  dragPill: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
});
