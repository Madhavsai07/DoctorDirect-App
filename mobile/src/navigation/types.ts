export type PatientTabParamList = {
  Home: undefined;
  Doctors: undefined;
  Appointments: undefined;
  Profile: undefined;
  Notifications: undefined;
};

/** Stack nested inside the Doctors tab for drill-down to a doctor profile */
export type PatientDoctorStackParamList = {
  DoctorList: undefined;
  DoctorDetail: { doctorId: string };
};

/** Stack nested inside the Patient Appointments tab for viewing consultation details */
export type PatientAppointmentStackParamList = {
  AppointmentList: undefined;
  PatientConsultation: { appointmentId: string };
};

export type DoctorTabParamList = {
  Dashboard: undefined;
  DoctorAppointments: undefined;
  DoctorAvailability: undefined;
  DoctorProfile: undefined;
  Notifications: undefined;
};

/** Stack nested inside the Doctor Appointments tab for consultation workspace */
export type DoctorAppointmentStackParamList = {
  DoctorAppointmentsList: undefined;
  DoctorConsultation: { appointmentId: string };
};

export type RootStackParamList = {
  Login: undefined;
  PatientApp: undefined;
  DoctorApp: undefined;
};
