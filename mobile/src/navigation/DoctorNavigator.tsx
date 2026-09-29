import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DoctorTabParamList, DoctorAppointmentStackParamList } from './types';
import { colors, typography } from '../theme';
import { AppIcon } from '../components/common';

// Doctor Screens
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorConsultationScreen from '../screens/doctor/DoctorConsultationScreen';
import DoctorAvailabilityScreen from '../screens/doctor/DoctorAvailabilityScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useEffect } from 'react';
import { loadUnreadNotificationCount } from '../store/slices/notificationSlice';

const Tab = createBottomTabNavigator<DoctorTabParamList>();
const AppointmentStack = createNativeStackNavigator<DoctorAppointmentStackParamList>();

function DoctorAppointmentsStackNavigator() {
  return (
    <AppointmentStack.Navigator screenOptions={{ headerShown: false }}>
      <AppointmentStack.Screen
        name="DoctorAppointmentsList"
        component={DoctorAppointmentsScreen}
      />
      <AppointmentStack.Screen
        name="DoctorConsultation"
        component={DoctorConsultationScreen}
      />
    </AppointmentStack.Navigator>
  );
}

export default function DoctorNavigator() {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((state) => state.notification.unreadCount);
  useEffect(() => { dispatch(loadUnreadNotificationCount()); }, [dispatch]);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
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
        component={DoctorDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <AppIcon name="dashboard" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="DoctorAppointments"
        component={DoctorAppointmentsStackNavigator}
        options={{
          tabBarLabel: 'Queue',
          tabBarIcon: ({ color }) => <AppIcon name="calendar" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="DoctorAvailability"
        component={DoctorAvailabilityScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color }) => <AppIcon name="clock" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Updates',
          tabBarBadge: unreadCount || undefined,
          tabBarIcon: ({ color }) => <AppIcon name="info" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="DoctorProfile"
        component={DoctorProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <AppIcon name="profile" color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
}
