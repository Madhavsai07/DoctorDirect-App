import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { patientNavigation } from '@/features/patient/navigation'
import { doctorNavigation } from '@/features/doctor/navigation'
import { adminNavigation } from '@/features/admin/navigation'
import { PublicLayout } from '@/layouts/PublicLayout'
import { RoleLayout } from '@/layouts/RoleLayout'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { LoadingIndicator } from '@/components/common/LoadingIndicator'
import {
  LandingPage,
  AuthPage,
  AdminDashboardPage,
  AdminDoctorVerificationPage,
  AdminDoctorsPage,
  DoctorAppointmentsPage,
  DoctorDashboardPage,
  DoctorPrescriptionsPage,
  DoctorSchedulePage,
  DoctorVerificationPage,
  NotificationsPage,
  PatientAppointmentsPage,
  PatientDashboardPage,
  PatientDoctorsPage,
  PatientPrescriptionsPage,
  ProfilePage,
} from '@/app/lazyPages'

function withRouteLoading(element: ReactNode) {
  return <Suspense fallback={<div className="route-loading"><LoadingIndicator label="Loading workspace" /></div>}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: withRouteLoading(<LandingPage />) },
      { path: '/login', element: withRouteLoading(<AuthPage title="Sign in to your care workspace" />) },
      { path: '/register/patient', element: withRouteLoading(<AuthPage title="Patient registration" />) },
      { path: '/register/doctor', element: withRouteLoading(<AuthPage title="Doctor registration" />) },
      { path: '/forgot-password', element: withRouteLoading(<AuthPage title="Reset your password" />) },
    ],
  },
  {
    element: <ProtectedRoute role="patient" />,
    children: [{
      path: '/patient',
      element: <RoleLayout roleLabel="Patient" items={patientNavigation} />,
      children: [
        { index: true, element: <Navigate to="/patient/dashboard" replace /> },
        { path: 'dashboard', element: withRouteLoading(<PatientDashboardPage />) },
        { path: 'doctors', element: withRouteLoading(<PatientDoctorsPage />) },
        { path: 'appointments', element: withRouteLoading(<PatientAppointmentsPage />) },
        { path: 'prescriptions', element: withRouteLoading(<PatientPrescriptionsPage />) },
        { path: 'profile', element: withRouteLoading(<ProfilePage kind="patient" />) },
        { path: 'notifications', element: withRouteLoading(<NotificationsPage />) },
      ],
    }],
  },
  {
    element: <ProtectedRoute role="doctor" />,
    children: [{
      path: '/doctor',
      element: <RoleLayout roleLabel="Doctor" items={doctorNavigation} />,
      children: [
        { index: true, element: <Navigate to="/doctor/dashboard" replace /> },
        { path: 'dashboard', element: withRouteLoading(<DoctorDashboardPage />) },
        { path: 'appointments', element: withRouteLoading(<DoctorAppointmentsPage />) },
        { path: 'schedule', element: withRouteLoading(<DoctorSchedulePage />) },
        { path: 'consultations', element: <Navigate to="/doctor/appointments" replace /> },
        { path: 'prescriptions', element: withRouteLoading(<DoctorPrescriptionsPage />) },
        { path: 'profile', element: withRouteLoading(<ProfilePage kind="doctor" />) },
        { path: 'notifications', element: withRouteLoading(<NotificationsPage />) },
      ],
    }],
  },
  {
    element: <ProtectedRoute role="admin" />,
    children: [{
      path: '/admin',
      element: <RoleLayout roleLabel="Admin" items={adminNavigation} />,
      children: [
        { index: true, element: <Navigate to="/admin/dashboard" replace /> },
        { path: 'dashboard', element: withRouteLoading(<AdminDashboardPage />) },
        { path: 'doctor-verification', element: withRouteLoading(<AdminDoctorVerificationPage />) },
        { path: 'doctors', element: withRouteLoading(<AdminDoctorsPage />) },
        { path: 'notifications', element: withRouteLoading(<NotificationsPage />) },
        { path: 'profile', element: withRouteLoading(<ProfilePage kind="admin" />) },
      ],
    }],
  },
  {
    element: <ProtectedRoute role="doctor" allowUnverified />,
    children: [{ path: '/doctor/verification', element: withRouteLoading(<DoctorVerificationPage />) }],
  },
  { path: '*', element: withRouteLoading(<AuthPage title="Page not found" />) },
])
