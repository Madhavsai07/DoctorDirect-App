import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loadNotifications, loadUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '../../store/slices/notificationSlice';
import type { Notification } from '../../types/notification';
import { colors, spacing, typography } from '../../theme';
import { AppIcon, EmptyState, LoadingIndicator, ScreenHeader } from '../../components/common';

function formatTime(value: string): string {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { items, unreadCount, isLoading } = useAppSelector((state) => state.notification);
  const role = useAppSelector((state) => state.auth.role);

  const refresh = useCallback(() => {
    dispatch(loadNotifications());
    dispatch(loadUnreadNotificationCount());
  }, [dispatch]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const openNotification = (item: Notification) => {
    if (!item.isRead) dispatch(markNotificationRead(item.id));
    if (!item.appointmentId) return;

    // Appointment updates are created before a consultation exists. Opening the
    // consultation screen for those notifications results in a "not found" error.
    // Only clinical-record notifications carry a consultation id and belong there.
    const opensConsultation = Boolean(item.consultationId) && [
      'consultation_started',
      'consultation_completed',
      'prescription_finalized',
    ].includes(item.type);

    if (role === 'doctor') {
      navigation.navigate('DoctorAppointments', {
        screen: opensConsultation ? 'DoctorConsultation' : 'DoctorAppointmentsList',
        ...(opensConsultation ? { params: { appointmentId: item.appointmentId } } : {}),
      });
    } else if (role === 'patient') {
      navigation.navigate('Appointments', {
        screen: opensConsultation ? 'PatientConsultation' : 'AppointmentList',
        ...(opensConsultation ? { params: { appointmentId: item.appointmentId } } : {}),
      });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => openNotification(item)}
      style={[styles.item, !item.isRead && styles.unreadItem]}
      accessibilityRole="button"
    >
      <View style={[styles.icon, !item.isRead && styles.unreadIcon]}>
        <AppIcon name={item.type.includes('consultation') ? 'medical' : 'calendar'} size={18} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
          {!item.isRead && <View style={styles.dot} />}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" subtitle={unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up'} />
      {unreadCount > 0 && (
        <Pressable onPress={() => dispatch(markAllNotificationsRead())} style={styles.readAll}>
          <Text style={styles.readAllText}>Mark all as read</Text>
        </Pressable>
      )}
      {isLoading && items.length === 0 ? <LoadingIndicator message="Loading notifications…" /> : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onRefresh={refresh}
          refreshing={isLoading}
          contentContainerStyle={items.length ? styles.list : styles.emptyList}
          ListEmptyComponent={<EmptyState title="No notifications yet" message="Appointment and consultation updates will appear here." icon="info" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.section },
  readAll: { alignSelf: 'flex-end', marginRight: spacing.xl, marginBottom: spacing.sm, padding: spacing.xs },
  readAllText: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  emptyList: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  item: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, marginBottom: spacing.sm, borderRadius: spacing.borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  unreadItem: { backgroundColor: colors.primarySubtle, borderColor: '#b9d9f5' },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  unreadIcon: { backgroundColor: '#dbeafe' },
  body: { flex: 1 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { flex: 1, fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold, color: colors.text.primary },
  unreadTitle: { fontWeight: typography.weights.bold },
  message: { fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 18, marginTop: 3 },
  time: { fontSize: 11, color: colors.text.muted, marginTop: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
