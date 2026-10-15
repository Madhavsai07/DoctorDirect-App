import { createNavigationContainerRef } from '@react-navigation/native';
import type { Notification } from '../types/notification';

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Routes the user to the destination screen corresponding to a notification item.
 * Supports Doctor, Patient, and Admin navigation hierarchies.
 */
export function navigateFromNotification(notification: Notification, role?: string | null) {
  if (!navigationRef.isReady()) return;

  const opensConsultation =
    Boolean(notification.consultationId) &&
    [
      'consultation_started',
      'consultation_completed',
      'prescription_finalized',
    ].includes(notification.type);

  if (role === 'doctor') {
    if (opensConsultation && notification.appointmentId) {
      navigationRef.navigate('DoctorApp', {
        screen: 'DoctorAppointments',
        params: {
          screen: 'DoctorConsultation',
          params: { appointmentId: notification.appointmentId },
        },
      });
    } else if (notification.appointmentId) {
      navigationRef.navigate('DoctorApp', {
        screen: 'DoctorAppointments',
        params: {
          screen: 'DoctorAppointmentsList',
        },
      });
    } else {
      navigationRef.navigate('DoctorApp', {
        screen: 'Notifications',
      });
    }
  } else if (role === 'patient') {
    if (opensConsultation && notification.appointmentId) {
      navigationRef.navigate('PatientApp', {
        screen: 'Appointments',
        params: {
          screen: 'PatientConsultation',
          params: { appointmentId: notification.appointmentId },
        },
      });
    } else if (notification.appointmentId) {
      navigationRef.navigate('PatientApp', {
        screen: 'Appointments',
        params: {
          screen: 'AppointmentList',
        },
      });
    } else {
      navigationRef.navigate('PatientApp', {
        screen: 'Notifications',
      });
    }
  } else if (role === 'admin') {
    navigationRef.navigate('AdminApp', {
      screen: 'Notifications',
    });
  }
}
