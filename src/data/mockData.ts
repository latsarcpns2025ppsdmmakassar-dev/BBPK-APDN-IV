import { User, Training, PresenceRecord, EvaluationTeacherRecord, EvaluationParticipantRecord, BeritaAcaraPelaksanaan } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    nip: '198205142008011003',
    name: 'Bambang Hermanto, S.Kom., M.T.I.',
    email: 'bambang.panitia@bpsdm.go.id',
    role: 'admin',
    instansi: 'Pusdiklat Aparatur / BPSDM',
    jabatan: 'Koordinator Penyelenggara & Analis Kebijakan Diklat',
    nomorHp: '081234567890'
  },
  {
    id: 'user-peserta-1',
    nip: '199208212019031005',
    name: 'Dr. Rian Pratama, S.Pd., M.Ed.',
    email: 'rian.ptp@kemdikbud.go.id',
    role: 'peserta',
    instansi: 'Balai Pengembangan Pembelajaran dan Penjaminan Mutu',
    jabatan: 'Pengembang Teknologi Pembelajaran (PTP) Ahli Muda',
    nomorHp: '085299887766'
  },
  {
    id: 'user-peserta-2',
    nip: '199504122020122011',
    name: 'Anisa Kusuma Wardani, S.Kom., M.Cs.',
    email: 'anisa.kw@kemenag.go.id',
    role: 'peserta',
    instansi: 'Pusat Riset & Teknologi Pembelajaran',
    jabatan: 'Pengembang Teknologi Pembelajaran (PTP) Ahli Pertama',
    nomorHp: '081377889900'
  },
  {
    id: 'user-peserta-3',
    nip: '199007152018011002',
    name: 'Faisal Akbar, S.STP., M.A.P.',
    email: 'faisal.akbar@lan.go.id',
    role: 'peserta',
    instansi: 'Badan Kepegawaian & Diklat Daerah',
    jabatan: 'Analis SDM Aparatur Ahli Muda',
    nomorHp: '081122334455'
  },
  {
    id: 'user-pengajar-1',
    nip: '196811251994032001',
    name: 'Dra. Hj. Siti Rahmah, M.M., C.HRM.',
    email: 'siti.rahmah@lan.go.id',
    role: 'pengajar',
    instansi: 'Lembaga Administrasi Negara (LAN RI)',
    jabatan: 'Widyaiswara Ahli Utama & Fasilitator Kepemimpinan',
    nomorHp: '081822334455'
  },
  {
    id: 'user-penguji-1',
    nip: '197003181996031002',
    name: 'Dr. Ir. Achmad Fauzi, M.Eng., IPU.',
    email: 'achmad.fauzi@bkn.go.id',
    role: 'penguji',
    instansi: 'Badan Kepegawaian Negara (BKN)',
    jabatan: 'Penguji Seminar Kelayakan & Evaluator Pelatihan ASN',
    nomorHp: '081933445566'
  }
];

export const INITIAL_TRAININGS: Training[] = [
  {
    id: 'TRN-2026-PTP-01',
    code: 'PTP-DIGITAL-VII',
    title: 'Pelatihan Fungsional Pengembang Teknologi Pembelajaran (PTP) Berbasis AI',
    category: 'Pelatihan Fungsional',
    batch: 'Angkatan VII Tahun 2026',
    startDate: '2026-09-08',
    endDate: '2026-09-18',
    totalJp: 48,
    penyelenggara: 'Pusat Pendidikan dan Pelatihan Aparatur Sipil Negara',
    participantIds: ['user-peserta-1', 'user-peserta-2'],
    sessions: [
      {
        id: 'SES-01',
        trainingId: 'TRN-2026-PTP-01',
        trainingName: 'Pelatihan Fungsional PTP Berbasis AI',
        sessionType: 'pengajar', // Jadwal Pengajar
        sessionTitle: 'Pemanfaatan Generative AI dalam Pengembangan Multimedia Pembelajaran',
        date: '2026-09-11',
        startTime: '08:00',
        endTime: '11:30',
        jp: 4,
        mode: 'Luring',
        locationName: 'Auditorium Gd. Pusdiklat Lt. 3, Jakarta',
        targetLat: -6.2088,
        targetLng: 106.8456,
        maxRadiusMeters: 250, // 250 meter geofencing
        pengajarId: 'user-pengajar-1',
        pengajarName: 'Dra. Hj. Siti Rahmah, M.M., C.HRM.',
        pengujiId: 'user-penguji-1',
        pengujiName: 'Dr. Ir. Achmad Fauzi, M.Eng., IPU.',
        participantIds: ['user-peserta-1', 'user-peserta-2'],
        status: 'Sedang Berlangsung'
      },
      {
        id: 'SES-02',
        trainingId: 'TRN-2026-PTP-01',
        trainingName: 'Pelatihan Fungsional PTP Berbasis AI',
        sessionType: 'pengajar', // Jadwal Pengajar
        sessionTitle: 'Workshop Sinkronus: Perancangan Evaluasi Pembelajaran Digital Daring',
        date: '2026-09-12',
        startTime: '13:00',
        endTime: '16:00',
        jp: 3,
        mode: 'Daring',
        locationName: 'Virtual Room Zoom Cloud Meeting & LMS Terpadu',
        targetLat: -6.2088,
        targetLng: 106.8456,
        maxRadiusMeters: 50000,
        pengajarId: 'user-pengajar-1',
        pengajarName: 'Dra. Hj. Siti Rahmah, M.M., C.HRM.',
        pengujiId: 'user-penguji-1',
        pengujiName: 'Dr. Ir. Achmad Fauzi, M.Eng., IPU.',
        participantIds: ['user-peserta-1', 'user-peserta-2'],
        status: 'Akan Datang'
      },
      {
        id: 'SES-03',
        trainingId: 'TRN-2026-PTP-01',
        trainingName: 'Pelatihan Fungsional PTP Berbasis AI',
        sessionType: 'penguji', // Jadwal Penguji
        sessionTitle: 'Seminar Evaluasi Akhir & Uji Kompetensi Portofolio Media',
        date: '2026-09-15',
        startTime: '08:30',
        endTime: '15:30',
        jp: 6,
        mode: 'Luring',
        locationName: 'Ruang Uji Kompetensi BPSDM Gd. B Lt. 2',
        targetLat: -6.2088,
        targetLng: 106.8456,
        maxRadiusMeters: 300,
        pengajarId: 'user-pengajar-1',
        pengajarName: 'Dra. Hj. Siti Rahmah, M.M., C.HRM.',
        pengujiId: 'user-penguji-1',
        pengujiName: 'Dr. Ir. Achmad Fauzi, M.Eng., IPU.',
        participantIds: ['user-peserta-1', 'user-peserta-2'],
        status: 'Akan Datang'
      }
    ],
    attachments: [
      {
        id: 'ATT-PDF-01',
        trainingId: 'TRN-2026-PTP-01',
        fileName: 'Jadwal_Resmi_PTP_Angkatan_VII_2026.pdf',
        fileType: 'pdf',
        fileSize: '342 KB',
        uploadedAt: '2026-09-08 09:15',
        description: 'Surat Keputusan & Matriks Jadwal Pembelajaran Resmi Pusdiklat ASN (Format PDF Berstempel)'
      },
      {
        id: 'ATT-XLS-02',
        trainingId: 'TRN-2026-PTP-01',
        fileName: 'Matriks_Jadwal_Sesi_Pelatihan_Excel.xlsx',
        fileType: 'excel',
        fileSize: '128 KB',
        uploadedAt: '2026-09-08 09:20',
        description: 'Worksheet Excel Jadwal Sesi (Widyaiswara, Penguji, JP, Ruang & Mode Pembelajaran)',
        parsedSessionsCount: 3
      }
    ]
  },
  {
    id: 'TRN-2026-PKP-02',
    code: 'PKP-LAN-IV',
    title: 'Pelatihan Kepemimpinan Pengawas (PKP) - Manajemen Kinerja Pelayanan Publik',
    category: 'Pelatihan Kepemimpinan',
    batch: 'Gelombang II Angkatan IV 2026',
    startDate: '2026-09-01',
    endDate: '2026-10-15',
    totalJp: 104,
    penyelenggara: 'Lembaga Administrasi Negara Bekerjasama dengan BPSDM',
    participantIds: ['user-peserta-3'],
    sessions: [
      {
        id: 'SES-PKP-01',
        trainingId: 'TRN-2026-PKP-02',
        trainingName: 'Pelatihan Kepemimpinan Pengawas (PKP)',
        sessionType: 'pengajar', // Jadwal Pengajar
        sessionTitle: 'Diagnosis Kebutuhan Organisasi & Inovasi Pelayanan Publik',
        date: '2026-09-10',
        startTime: '08:00',
        endTime: '12:00',
        jp: 4,
        mode: 'Luring',
        locationName: 'Graha Krida LAN RI Kampus Pejompongan',
        targetLat: -6.2052,
        targetLng: 106.8041,
        maxRadiusMeters: 350,
        pengajarId: 'user-pengajar-1',
        pengajarName: 'Dra. Hj. Siti Rahmah, M.M., C.HRM.',
        pengujiId: 'user-penguji-1',
        pengujiName: 'Dr. Ir. Achmad Fauzi, M.Eng., IPU.',
        participantIds: ['user-peserta-3'],
        status: 'Sedang Berlangsung'
      },
      {
        id: 'SES-PKP-02',
        trainingId: 'TRN-2026-PKP-02',
        trainingName: 'Pelatihan Kepemimpinan Pengawas (PKP)',
        sessionType: 'penguji', // Jadwal Penguji
        sessionTitle: 'Seminar Rancangan Aksi Perubahan Kinerja Pelayanan Publik',
        date: '2026-09-18',
        startTime: '09:00',
        endTime: '15:00',
        jp: 6,
        mode: 'Luring',
        locationName: 'Ruang Sidang Utama LAN RI Pejompongan',
        targetLat: -6.2052,
        targetLng: 106.8041,
        maxRadiusMeters: 350,
        pengajarId: 'user-pengajar-1',
        pengajarName: 'Dra. Hj. Siti Rahmah, M.M., C.HRM.',
        pengujiId: 'user-penguji-1',
        pengujiName: 'Dr. Ir. Achmad Fauzi, M.Eng., IPU.',
        participantIds: ['user-peserta-3'],
        status: 'Akan Datang'
      }
    ]
  }
];

// Initial mock presence list
export const INITIAL_PRESENCES: PresenceRecord[] = [
  {
    id: 'PRES-001',
    trainingId: 'TRN-2026-PTP-01',
    sessionId: 'SES-01',
    userId: 'user-peserta-2',
    userNip: '199504122020122011',
    userName: 'Anisa Kusuma Wardani, S.Kom., M.Cs.',
    userRole: 'peserta',
    timestamp: '2026-09-11 07:48:22',
    method: 'Luring_Signature_GPS',
    status: 'HADIR',
    gps: {
      latitude: -6.20875,
      longitude: 106.84562,
      accuracyMeters: 8,
      distanceFromVenueMeters: 14,
      isInsideGeofence: true
    },
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10,25 Q30,5 60,20 T110,15" stroke="%231e3a8a" fill="none" stroke-width="2"/></svg>',
    deviceInfo: 'Chrome on macOS (Geolocated)',
    ipAddress: '180.252.12.98'
  },
  {
    id: 'PRES-002',
    trainingId: 'TRN-2026-PTP-01',
    sessionId: 'SES-01',
    userId: 'user-peserta-3',
    userNip: '199007152018011002',
    userName: 'Faisal Akbar, S.STP., M.A.P.',
    userRole: 'peserta',
    timestamp: '2026-09-11 08:04:11',
    method: 'Luring_Signature_GPS',
    status: 'HADIR',
    gps: {
      latitude: -6.20892,
      longitude: 106.84545,
      accuracyMeters: 12,
      distanceFromVenueMeters: 22,
      isInsideGeofence: true
    },
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M15,28 Q45,2 75,25 T105,18" stroke="%23047857" fill="none" stroke-width="2"/></svg>',
    deviceInfo: 'Chrome on Android Mobile',
    ipAddress: '180.252.12.99'
  }
  // Note: user-peserta-1 (Dr. Rian Pratama) initially has NO presence on SES-01 so user can test the gatekeeping lock!
];

export const INITIAL_TEACHER_EVALUATIONS: EvaluationTeacherRecord[] = [
  {
    id: 'EVL-T-001',
    trainingId: 'TRN-2026-PTP-01',
    sessionId: 'SES-01',
    pesertaId: 'user-peserta-2',
    pesertaName: 'Anisa Kusuma Wardani, S.Kom., M.Cs.',
    targetEvaluatedId: 'user-pengajar-1',
    targetEvaluatedName: 'Dra. Hj. Siti Rahmah, M.M., C.HRM.',
    targetRole: 'pengajar',
    ratings: {
      penguasaanMateri: 5,
      metodePenyampaian: 5,
      pemanfaatanMediaPTP: 4,
      interaksiAndragogi: 5,
      ketepatanWaktu: 4
    },
    overallAverage: 4.6,
    catatanApresiasi: 'Penyampaian sangat komunikatif dan menginspirasi implementasi AI pada instansi.',
    saranPerbaikan: 'Waktu praktik perancangan prompt AI ditambah agar peserta dapat simulasi lebih mendalam.',
    submittedAt: '2026-09-11 11:35:10'
  }
];

export const INITIAL_PARTICIPANT_EVALUATIONS: EvaluationParticipantRecord[] = [
  {
    id: 'EVL-P-001',
    trainingId: 'TRN-2026-PTP-01',
    sessionId: 'SES-01',
    evaluatorId: 'user-pengajar-1',
    evaluatorName: 'Dra. Hj. Siti Rahmah, M.M., C.HRM.',
    evaluatorRole: 'pengajar',
    pesertaId: 'user-peserta-2',
    pesertaName: 'Anisa Kusuma Wardani, S.Kom., M.Cs.',
    pesertaNip: '199504122020122011',
    scores: {
      integritasDisiplin: 92,
      keaktifanDiskusi: 95,
      penguasaanSubstansi: 90,
      tugasPraktik: 94
    },
    finalScore: 92.75,
    predikat: 'Sangat Memuaskan',
    catatanKualitatif: 'Memperlihatkan kompetensi analitis yang unggul dalam mengintegrasikan media PTP.',
    rekomendasiTindakLanjut: 'Direkomendasikan menjadi Fasilitator Internal Pembelajaran Digital di Kemenag.',
    submittedAt: '2026-09-11 12:15:00'
  }
  // Note: user-peserta-1 and user-peserta-3 are pending evaluation so pengajar can test completing evaluations to unlock BAP!
];

export const INITIAL_BAP: BeritaAcaraPelaksanaan[] = [];
