import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PatientTabParamList,
  PatientDoctorStackParamList,
  PatientAppointmentStackParamList,
} from './types';
import { colors, typography } from '../theme';
import { AppIcon } from '../components/common';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import PatientDoctorsScreen from '../screens/patient/PatientDoctorsScreen';
import DoctorDetailScreen from '../screens/patient/DoctorDetailScreen';
import PatientAppointmentsScreen from '../screens/patient/PatientAppointmentsScreen';
import PatientConsultationScreen from '../screens/patient/PatientConsultationScreen';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import { useAppSelector } from '../store/hooks';
import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loadUnreadNotificationCount } from '../store/slices/notificationSlice';

const Tab = createBottomTabNavigator<PatientTabParamList>();
const DoctorStack = createNativeStackNavigator<PatientDoctorStackParamList>();
const AppointmentStack = createNativeStackNavigator<PatientAppointmentStackParamList>();

/**
 * Stack for Doctors tab — DoctorList → DoctorDetail drill-down
 */
function DoctorsStackNavigator() {
  return (
    <DoctorStack.Navigator screenOptions={{ headerShown: false }}>
      <DoctorStack.Screen name="DoctorList" component={PatientDoctorsScreen} />
      <DoctorStack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
    </DoctorStack.Navigator>
  );
}

/**
 * Stack for Appointments tab — AppointmentList → PatientConsultation (view-only summary)
 */
function PatientAppointmentStackNavigator() {
  return (
    <AppointmentStack.Navigator screenOptions={{ headerShown: false }}>
      <AppointmentStack.Screen name="AppointmentList" component={PatientAppointmentsScreen} />
      <AppointmentStack.Screen name="PatientConsultation" component={PatientConsultationScreen} />
    </AppointmentStack.Navigator>
  );
}

export default function PatientNavigator() {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((state) => state.notification.unreadCount);
  useEffect(() => { dispatch(loadUnreadNotificationCount()); }, [dispatch]);
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
        component={DoctorsStackNavigator}
        options={{
          tabBarLabel: 'Doctors',
          tabBarIcon: ({ color }) => <AppIcon name="doctors" color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={PatientAppointmentStackNavigator}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color }) => <AppIcon name="calendar" color={color} size={20} />,
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
