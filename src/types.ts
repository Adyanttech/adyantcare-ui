// Shapes returned by the AdyantCare API (JSON is camelCase).

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'FRONT_DESK' | 'LAB_TECH' | 'PATIENT';
export type CountryCode = 'IN' | 'US';

export interface HospitalInfo {
  id: string; name: string; city: string; currency: 'INR' | 'USD'; code: string;
  tagline: string | null; brandColor: string | null;
}
export interface Branding {
  name: string; city: string; tagline: string | null; brandColor: string | null;
  logoData: string | null; coverData: string | null;
}

export interface ReportPoint { date: string; value: number }
export interface ReportLabel { label: string; value: number }
export interface Report {
  days: number; currency: string;
  totals: {
    appointments: number; completed: number; cancelled: number; newPatients: number;
    collected: number; pending: number; labsOrdered: number; labsCompleted: number;
  };
  appointmentsByDay: ReportPoint[]; revenueByDay: ReportPoint[];
  status: ReportLabel[]; diagnoses: ReportLabel[]; weekdays: ReportLabel[];
  gender: ReportLabel[]; ageBands: ReportLabel[];
  doctors: { name: string; specialty: string | null; appointments: number; completed: number; revenue: number }[];
}
export interface User {
  id: string; name: string; role: Role; phone: string; specialty: string | null;
  mustChangePassword: boolean; hospital: HospitalInfo | null; email?: string | null;
}
export interface AuthResponse { token: string; user: User }

export interface Hospital {
  id: string; name: string; code: string; city: string; country: CountryCode; currency: string;
  active: boolean; userCount: number; patientCount: number; appointmentCount: number;
}
export interface Staff { id: string; name: string; phone: string; role: Role; specialty: string | null; active: boolean; email?: string | null; idLabel?: string | null }
export interface Doctor { id: string; name: string; specialty: string | null }
export interface Patient {
  id: string; mrn: string; fullName: string; phone: string; gender: string | null; dob: string | null; hospitalCount: number; email?: string | null; idLabel?: string | null;
}
export interface RegisterResult { id: string; mrn: string | null; created: boolean; linkedExisting: boolean }

export interface AppointmentRow {
  id: string; scheduledAt: string; status: string; reason: string | null;
  patientName: string; mrn: string; doctorName: string;
}
export interface ConsultDetail {
  appointment: {
    id: string; scheduledAt: string; status: string; reason: string | null; patientId: string;
    patientName: string; gender: string | null; dob: string | null; mrn: string;
  };
  history: { scheduledAt: string; diagnosis: string | null }[];
  labs: { test: string; status: string; result: string | null }[];
}

export interface LabOrder {
  id: string; test: string; status: string; result: string | null; createdAt: string;
  completedAt: string | null; patientName: string; mrn: string;
}
export interface Invoice { id: string; amount: number; status: string; createdAt: string; patientName: string; mrn: string }

export interface PortalRecord {
  person: { id: string; fullName: string; shareConsent: boolean; idLabel?: string | null };
  hospitals: { name: string; city: string; mrn: string }[];
  appointments: { id: string; scheduledAt: string; status: string; reason: string | null; diagnosis: string | null; doctorName: string; hospitalName: string }[];
  prescriptions: { id: string; items: string[]; createdAt: string; hospitalName: string }[];
  labs: { id: string; test: string; status: string; result: string | null; createdAt: string; hospitalName: string }[];
}

export interface Dashboard { kind: Role; stats: Record<string, number> }
export interface Insights {
  totals: { people: number; multiHospital: number; optedIn: number };
  byHospital: { id: string; name: string; currency: string; patients: number; appointments: number; revenue: number }[];
  diagnoses: { label: string; value: number }[];
  minGroup: number;
}
