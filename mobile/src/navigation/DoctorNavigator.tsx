import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DoctorTabParamList } from './types';
import { colors, typography } from '../theme';
import { AppIcon } from '../components/common';

// Doctor Screens
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorAvailabilityScreen from '../screens/doctor/DoctorAvailabilityScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';

const Tab = createBottomTabNavigator<DoctorTabParamList>();

export default function DoctorNavigator() {
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
        component={DoctorAppointmentsScreen}
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
