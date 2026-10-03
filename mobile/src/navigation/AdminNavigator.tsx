import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminTabParamList, AdminStackParamList } from './types';
import { colors, typography } from '../theme';
import { AppIcon } from '../components/common';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadUnreadNotificationCount } from '../store/slices/notificationSlice';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminDoctorDetailScreen from '../screens/admin/AdminDoctorDetailScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminDashboardStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminDoctorDetail" component={AdminDoctorDetailScreen} />
    </Stack.Navigator>
  );
}

/**
 * Admin Navigator
 *
 * Dedicated tab navigation stack for system administrators:
 * - Dashboard (Doctor Credentialing & Verification queue)
 * - Notifications (System alerts and verification events)
 * - Profile (Administrator security, credentials, and sign out)
 */
export default function AdminNavigator() {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((state) => state.notification.unreadCount);

  useEffect(() => {
    dispatch(loadUnreadNotificationCount());
  }, [dispatch]);

  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 54 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: typography.weights.semiBold,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <AppIcon name="dashboard" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color }) => <AppIcon name="info" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <AppIcon name="profile" color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
}
