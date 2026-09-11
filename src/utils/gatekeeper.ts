/**
 * SIPEKA - Gatekeeper Access Control & Validation Logic
 * Modul aturan validasi hak akses berjenjang (Role-Based Access Control)
 * Memastikan integritas presensi, evaluasi dua arah, dan penerbitan berkas resmi ASN.
 */

import { User, PresenceRecord, EvaluationTeacherRecord, EvaluationParticipantRecord, TrainingSession } from '../types';

export interface GatekeeperCheckResult {
  allowed: boolean;
  reason?: string;
  statusCode: 'AUTHORIZED' | 'PRESENCE_REQUIRED' | 'EVALUATION_INCOMPLETE' | 'ROLE_UNAUTHORIZED' | 'SESSION_INACTIVE';
}

/**
 * 1. Haversine Formula: Menghitung jarak akurat (dalam meter) antara 2 titik koordinat GPS
 */
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * 2. Validasi Geofencing Presensi Luring
 */
export function validateGeofence(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  maxRadiusMeters: number = 250
): { isInside: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistanceInMeters(userLat, userLng, targetLat, targetLng);
  return {
    isInside: distanceMeters <= maxRadiusMeters,
    distanceMeters
  };
}

/**
 * 3. Gatekeeper: Validasi Hak Pengisian Evaluasi Kinerja Pengajar oleh Peserta
 * Syarat: Status presensi peserta pada sesi tersebut WAJIB 'HADIR'
 */
export function canPesertaFillEvaluation(
  user: User,
  sessionId: string,
  presences: PresenceRecord[]
): GatekeeperCheckResult {
  if (user.role !== 'peserta') {
    return {
      allowed: false,
      reason: 'Hanya Peserta terdaftar yang memiliki hak mengisi evaluasi pengajar.',
      statusCode: 'ROLE_UNAUTHORIZED'
    };
  }

  const userPresence = presences.find(
    (p) => p.sessionId === sessionId && p.userId === user.id
  );

  if (!userPresence) {
    return {
      allowed: false,
      reason: 'Gatekeeping: Anda belum melakukan presensi pada sesi ini. Harap submit presensi terlebih dahulu!',
      statusCode: 'PRESENCE_REQUIRED'
    };
  }

  if (userPresence.status !== 'HADIR') {
    return {
      allowed: false,
      reason: `Gatekeeping: Status presensi Anda adalah "${userPresence.status}". Evaluasi hanya dapat diisi jika berstatus HADIR.`,
      statusCode: 'PRESENCE_REQUIRED'
    };
  }

  return {
    allowed: true,
    statusCode: 'AUTHORIZED'
  };
}

/**
 * 4. Gatekeeper: Validasi Hak Unduh Sertifikat oleh Peserta
 * Syarat: 
 * 1. Peserta berstatus HADIR pada kegiatan yang diikuti
 * 2. Peserta telah mengisi evaluasi pengajar/penguji
 * 3. Seluruh nilai peserta telah terinput oleh Tim Pengajar/Penguji
 */
export function canPesertaDownloadCertificate(
  user: User,
  trainingId: string,
  presences: PresenceRecord[],
  evaluationsTeacher: EvaluationTeacherRecord[],
  evaluationsParticipant: EvaluationParticipantRecord[] = []
): GatekeeperCheckResult {
  if (user.role === 'admin') {
    return { allowed: true, statusCode: 'AUTHORIZED' }; // Admin super-access
  }

  if (user.role !== 'peserta') {
    return {
      allowed: false,
      reason: 'Sertifikat kelulusan hanya diterbitkan untuk akun Peserta.',
      statusCode: 'ROLE_UNAUTHORIZED'
    };
  }

  // 1. Cek apakah ada kehadiran HADIR di pelatihan yang diikuti
  const hadirPresences = presences.filter(
    (p) => p.trainingId === trainingId && p.userId === user.id && p.status === 'HADIR'
  );

  if (hadirPresences.length === 0) {
    return {
      allowed: false,
      reason: 'Gatekeeping Sertifikat: Anda belum memiliki catatan presensi HADIR pada kegiatan ini.',
      statusCode: 'PRESENCE_REQUIRED'
    };
  }

  // 2. Cek apakah peserta sudah mengisi evaluasi pengajar/penguji
  const hasEvaluated = evaluationsTeacher.some(
    (e) => e.trainingId === trainingId && e.pesertaId === user.id
  );

  if (!hasEvaluated) {
    return {
      allowed: false,
      reason: 'Gatekeeping Sertifikat: Wajib menyelesaikan Evaluasi Kinerja Pengajar/Penguji terlebih dahulu.',
      statusCode: 'EVALUATION_INCOMPLETE'
    };
  }

  // 3. Cek apakah SEMUA NILAI dari Pengajar/Penguji sudah terinput ke sistem BAP
  const userScores = evaluationsParticipant.filter(
    (ep) => ep.trainingId === trainingId && ep.pesertaId === user.id
  );

  if (userScores.length === 0) {
    return {
      allowed: false,
      reason: 'Gatekeeping Sertifikat: Nilai kelulusan belum terinput oleh Pengajar/Penguji. Menunggu penginputan nilai ke sistem.',
      statusCode: 'EVALUATION_INCOMPLETE'
    };
  }

  return {
    allowed: true,
    statusCode: 'AUTHORIZED'
  };
}

/**
 * 5. Gatekeeper: Validasi Hak Pengunduhan Berita Acara Pelaksanaan (BAP) oleh Pengajar / Penguji
 * Syarat: Pengajar/Penguji WAJIB menyelesaikan evaluasi seluruh peserta yang hadir di sesi tersebut
 */
export function canDownloadBAP(
  user: User,
  session: TrainingSession,
  presences: PresenceRecord[],
  evaluationsParticipant: EvaluationParticipantRecord[]
): GatekeeperCheckResult {
  // Admin memiliki super-access bypass untuk monitoring
  if (user.role === 'admin') {
    return {
      allowed: true,
      statusCode: 'AUTHORIZED',
      reason: 'Admin Super-Access: Berita Acara dapat diunduh untuk kebutuhan arsip dinas.'
    };
  }

  if (user.role !== 'pengajar' && user.role !== 'penguji') {
    return {
      allowed: false,
      reason: 'Hanya Pengajar, Penguji, atau Panitia Admin yang berhak mengunduh BAP.',
      statusCode: 'ROLE_UNAUTHORIZED'
    };
  }

  // Dapatkan daftar peserta yang hadir pada sesi ini
  const attendingParticipants = presences.filter(
    (p) => p.sessionId === session.id && p.status === 'HADIR'
  );

  if (attendingParticipants.length === 0) {
    return {
      allowed: false,
      reason: 'Belum ada peserta yang berstatus HADIR pada sesi ini.',
      statusCode: 'PRESENCE_REQUIRED'
    };
  }

  // Hitung berapa peserta hadir yang SUDAH dinilai oleh user ini
  const evaluatedCount = attendingParticipants.filter((p) =>
    evaluationsParticipant.some(
      (ev) => ev.sessionId === session.id && ev.pesertaId === p.userId && ev.evaluatorId === user.id
    )
  ).length;

  const remaining = attendingParticipants.length - evaluatedCount;

  if (remaining > 0) {
    return {
      allowed: false,
      reason: `Gatekeeping BAP Terkunci: Anda masih memiliki ${remaining} peserta hadir yang belum dievaluasi/dinilai. Lengkapi evaluasi seluruh peserta untuk membuka unduhan BAP.`,
      statusCode: 'EVALUATION_INCOMPLETE'
    };
  }

  return {
    allowed: true,
    statusCode: 'AUTHORIZED'
  };
}

/**
 * 6. Gatekeeper: Validasi Hak Export Rekapitulasi Data (Excel/PDF)
 * Admin memiliki akses penuh, Pengajar/Penguji hanya untuk sesi miliknya
 */
export function canExportRecapData(
  user: User,
  session?: TrainingSession
): GatekeeperCheckResult {
  if (user.role === 'admin') {
    return { allowed: true, statusCode: 'AUTHORIZED' };
  }

  if (user.role === 'pengajar' || user.role === 'penguji') {
    if (session && (session.pengajarId === user.id || session.pengujiId === user.id)) {
      return { allowed: true, statusCode: 'AUTHORIZED' };
    }
    return {
      allowed: false,
      reason: 'Pengajar/Penguji hanya berhak mengekspor data pada sesi yang diampunya.',
      statusCode: 'ROLE_UNAUTHORIZED'
    };
  }

  return {
    allowed: false,
    reason: 'Peserta tidak memiliki izin akses ekspor rekapitulasi data.',
    statusCode: 'ROLE_UNAUTHORIZED'
  };
}
