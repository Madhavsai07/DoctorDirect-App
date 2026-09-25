import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PatientTabParamList } from './types';
import { colors, typography } from '../theme';
import { AppIcon } from '../components/common';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import PatientDoctorsScreen from '../screens/patient/PatientDoctorsScreen';
import PatientAppointmentsScreen from '../screens/patient/PatientAppointmentsScreen';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';

const Tab = createBottomTabNavigator<PatientTabParamList>();

export default function PatientNavigator() {
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
        name="Home"
        component={PatientHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <AppIcon name="home" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Doctors"
        component={PatientDoctorsScreen}
        options={{
          tabBarLabel: 'Doctors',
          tabBarIcon: ({ color }) => <AppIcon name="doctors" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={PatientAppointmentsScreen}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color }) => <AppIcon name="calendar" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PatientProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <AppIcon name="profile" color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
}
