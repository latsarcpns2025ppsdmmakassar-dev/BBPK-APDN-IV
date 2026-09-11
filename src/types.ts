export type UserRole = 'admin' | 'peserta' | 'pengajar' | 'penguji';

export interface User {
  id: string;
  nip: string;
  name: string;
  email: string;
  role: UserRole;
  instansi: string;
  jabatan: string;
  avatarUrl?: string;
  nomorHp?: string;
  password?: string;
}

export interface TrainingSession {
  id: string;
  trainingId: string;
  trainingName: string;
  sessionType: 'pengajar' | 'penguji'; // Jadwal Pengajar (Materi/Fasilitator) vs Jadwal Penguji (Seminar/Ujian)
  sessionTitle: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  jp: number; // Jam Pelajaran (misal 2 JP, 4 JP)
  mode: 'Luring' | 'Daring' | 'Hybrid';
  locationName: string;
  targetLat: number;
  targetLng: number;
  maxRadiusMeters: number;
  pengajarId: string;
  pengajarName: string;
  pengujiId?: string;
  pengujiName?: string;
  participantIds: string[]; // Daftar ID Peserta yang mengikuti jadwal/sesi ini
  status: 'Akan Datang' | 'Sedang Berlangsung' | 'Selesai';
}

export interface ScheduleAttachment {
  id: string;
  trainingId: string;
  fileName: string;
  fileType: 'pdf' | 'excel';
  fileSize: string; // e.g. '245 KB'
  uploadedAt: string;
  dataUrl?: string; // Base64 or Blob url
  description?: string;
  parsedSessionsCount?: number;
}

export interface Training {
  id: string;
  code: string;
  title: string;
  category: 'Pelatihan Kepemimpinan' | 'Pelatihan Dasar CPNS' | 'Pelatihan Fungsional' | 'Pelatihan Teknis';
  batch: string; // Angkatan / Gelombang
  startDate: string;
  endDate: string;
  totalJp: number;
  penyelenggara: string;
  participantIds?: string[]; // ID peserta yang terdaftar pada pelatihan ini
  sessions: TrainingSession[];
  attachments?: ScheduleAttachment[];
}

export type PresenceMethod = 'Luring_Signature_GPS' | 'Daring_Live_Selfie';
export type PresenceStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'ALPA' | 'BELUM_HADIR';

export interface PresenceRecord {
  id: string;
  trainingId: string;
  sessionId: string;
  userId: string;
  userNip: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  method: PresenceMethod;
  status: PresenceStatus;
  gps?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    distanceFromVenueMeters: number;
    isInsideGeofence: boolean;
  };
  signatureDataUrl?: string; // Data URL Base64 PNG
  selfieDataUrl?: string; // Data URL Base64 JPG
  qrValidationToken?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface TeacherEvaluationItem {
  id: string;
  kategori: string;
  indikator: string;
  skor: number; // 1 - 5 Likert
}

// 1. Evaluasi Kinerja Pengajar/Penguji diisi oleh Peserta
export interface EvaluationTeacherRecord {
  id: string;
  trainingId: string;
  sessionId: string;
  pesertaId: string;
  pesertaName: string;
  targetEvaluatedId: string; // Pengajar atau Penguji
  targetEvaluatedName: string;
  targetRole: 'pengajar' | 'penguji';
  ratings: {
    penguasaanMateri: number; // 1-5
    metodePenyampaian: number; // 1-5
    pemanfaatanMediaPTP: number; // 1-5
    interaksiAndragogi: number; // 1-5
    ketepatanWaktu: number; // 1-5
  };
  overallAverage: number;
  catatanApresiasi: string;
  saranPerbaikan: string;
  submittedAt: string;
}

// 2. Evaluasi Sikap & Penilaian Peserta diisi oleh Pengajar/Penguji
export interface EvaluationParticipantRecord {
  id: string;
  trainingId: string;
  sessionId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: 'pengajar' | 'penguji';
  pesertaId: string;
  pesertaName: string;
  pesertaNip: string;
  scores: {
    integritasDisiplin: number; // 0-100
    keaktifanDiskusi: number; // 0-100
    penguasaanSubstansi: number; // 0-100
    tugasPraktik: number; // 0-100
  };
  finalScore: number; // Rata-rata terbobot
  predikat: 'Sangat Memuaskan' | 'Memuaskan' | 'Cukup' | 'Kurang';
  catatanKualitatif: string;
  rekomendasiTindakLanjut: string;
  submittedAt: string;
}

export interface BeritaAcaraPelaksanaan {
  id: string;
  bapNumber: string;
  trainingId: string;
  trainingName: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: 'pengajar' | 'penguji';
  totalPesertaTerdaftar: number;
  totalPesertaHadir: number;
  totalPesertaTidakHadir: number;
  evaluasiPesertaCompleted: boolean;
  materiDisampaikan: string;
  hambatanCatatan: string;
  signedAt: string;
  signatureDataUrl?: string;
  qrCodeVerification: string;
}
