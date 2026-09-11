/**
 * SIPEKA - Export Helper (PDF via jsPDF & Excel via xlsx)
 * Format laporan resmi berstandar Administrasi Pemerintahan / Pusdiklat ASN
 */

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { User, Training, TrainingSession, PresenceRecord, EvaluationParticipantRecord, EvaluationTeacherRecord } from '../types';

/**
 * 1. Export Sertifikat Pelatihan ASN (Format PDF Resmi Landscape)
 */
export function generateCertificatePDF(
  peserta: User,
  training: Training,
  session: TrainingSession,
  presence: PresenceRecord
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4' // 297 x 210 mm
  });

  // Border & Frame Resmi
  doc.setDrawColor(20, 60, 120); // Navy Blue ASN
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 277, 190);

  doc.setDrawColor(212, 175, 55); // Gold Accent
  doc.setLineWidth(0.8);
  doc.rect(13, 13, 271, 184);

  // Kop Lembaga
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 40, 80);
  doc.text('KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI', 148.5, 26, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('PUSAT PENDIDIKAN DAN PELATIHAN APARATUR SIPIL NEGARA TERPADU', 148.5, 32, { align: 'center' });
  doc.text('Sistem Terintegrasi Presensi & Evaluasi Pelatihan Terpadu (SIPEKA)', 148.5, 37, { align: 'center' });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(25, 41, 272, 41);

  // Judul Sertifikat
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 30, 75);
  doc.text('SERTIFIKAT KELULUSAN', 148.5, 54, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const certNumber = `Nomor: B-${Math.floor(1000 + Math.random() * 9000)}/DL.02.01/PTP-ASN/${new Date().getFullYear()}`;
  doc.text(certNumber, 148.5, 60, { align: 'center' });

  // Diberikan kepada
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('Diberikan kepada:', 148.5, 72, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(10, 25, 65);
  doc.text(peserta.name.toUpperCase(), 148.5, 82, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text(`NIP: ${peserta.nip}  |  Instansi: ${peserta.instansi}`, 148.5, 89, { align: 'center' });

  // Isi Keterangan
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const textDesc = `Telah mengikuti dan dinyatakan MEMENUHI SYARAT presensi serta evaluasi kompetensi pada:`;
  doc.text(textDesc, 148.5, 102, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 50, 110);
  doc.text(training.title, 148.5, 111, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`${training.batch}  •  Durasi Total: ${training.totalJp} Jam Pelajaran (JP)`, 148.5, 118, { align: 'center' });
  doc.text(`Tanggal Pelaksanaan: ${training.startDate} s.d. ${training.endDate}`, 148.5, 124, { align: 'center' });

  // Status Validasi Gatekeeping
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(45, 133, 207, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(2, 99, 56);
  doc.text(`VALIDASI SIPEKA: STATUS PRESENSI [HADIR]  •  EVALUASI DUA ARAH SELESAI  •  TERVERIFIKASI SISTEM`, 148.5, 142, { align: 'center' });

  // Tanda Tangan & QR
  const signDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Jakarta, ${signDate}`, 215, 156, { align: 'center' });
  doc.text(`Kepala Pusat Pendidikan & Pelatihan ASN`, 215, 161, { align: 'center' });

  // Placeholder Stempel TTE
  doc.setDrawColor(20, 60, 120);
  doc.setLineWidth(0.3);
  doc.rect(190, 166, 50, 16);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(50, 70, 120);
  doc.text('[ Ditandatangani secara Elektronik (BSrE) ]', 215, 174, { align: 'center' });
  doc.text('Validasi QR Terverifikasi SIPEKA', 215, 179, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text('Prof. Dr. H. Mulyadi, M.Si.', 215, 189, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('NIP. 196508121990031001', 215, 193, { align: 'center' });

  // QR info box di kiri
  doc.setDrawColor(180, 180, 180);
  doc.rect(25, 155, 34, 34);
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Scan untuk Cek', 42, 170, { align: 'center' });
  doc.text('Keaslian Ijazah/Sertifikat', 42, 175, { align: 'center' });
  doc.text('ID: ' + presence.id, 42, 181, { align: 'center' });

  doc.save(`Sertifikat_${peserta.nip}_${training.code}.pdf`);
}

/**
 * 2. Export Berita Acara Pelaksanaan (BAP) PDF Resmi
 */
export function generateBAPPdf(
  evaluator: User,
  training: Training,
  session: TrainingSession,
  presences: PresenceRecord[],
  evaluations: EvaluationParticipantRecord[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // 210 x 297 mm
  });

  // Kop Resmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 30, 60);
  doc.text('LEMBAGA PENDIDIKAN DAN PELATIHAN APARATUR SIPIL NEGARA', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PUSAT PENGEMBANGAN TEKNOLOGI PEMBELAJARAN & KOMPETENSI ASN', 105, 23, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text('Sistem Presensi & Evaluasi Pelatihan Terpadu (SIPEKA) - Dokumen Berita Acara Resmi', 105, 27, { align: 'center' });

  doc.setLineWidth(0.6);
  doc.setDrawColor(40, 40, 40);
  doc.line(15, 30, 195, 30);
  doc.setLineWidth(0.2);
  doc.line(15, 31, 195, 31);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('BERITA ACARA PELAKSANAAN PELATIHAN (BAP)', 105, 40, { align: 'center' });

  const bapNumber = `BA.${Math.floor(100 + Math.random() * 900)}/BAP/${session.id}/${new Date().getFullYear()}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Nomor: ${bapNumber}`, 105, 45, { align: 'center' });

  // Pembukaan
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let y = 56;
  doc.setFontSize(10);
  doc.text(`Pada hari ini, ${todayStr}, telah diselenggarakan sesi pembelajaran pelatihan ASN dengan rincian:`, 15, y);

  y += 7;
  const details = [
    ['Program Pelatihan', `: ${training.title}`],
    ['Angkatan / Kode', `: ${training.batch} (${training.code})`],
    ['Judul Sesi Aktif', `: ${session.sessionTitle}`],
    ['Metode & Durasi', `: ${session.mode} | ${session.jp} Jam Pelajaran (JP)`],
    ['Waktu Pelaksanaan', `: ${session.date} (${session.startTime} - ${session.endTime} WIB)`],
    ['Lokasi / Media', `: ${session.locationName}`],
    ['Fasilitator / Pengajar', `: ${session.pengajarName}`],
    ['Penguji Evaluasi', `: ${session.pengujiName || '-'}`],
  ];

  details.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.text(val, 65, y);
    y += 5.5;
  });

  // Statistik Presensi
  y += 4;
  const hadirCount = presences.filter((p) => p.sessionId === session.id && p.status === 'HADIR').length;
  const izinCount = presences.filter((p) => p.sessionId === session.id && p.status === 'IZIN').length;
  const alpaCount = presences.filter((p) => p.sessionId === session.id && p.status === 'ALPA').length;

  doc.setFont('helvetica', 'bold');
  doc.text('I. REKAPITULASI PRESENSI PESERTA (TERVERIFIKASI GATEKEEPER)', 15, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`• Total Hadir: ${hadirCount} Orang   • Izin: ${izinCount} Orang   • Alpa: ${alpaCount} Orang`, 18, y);

  // Rekap Nilai Evaluasi
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('II. HASIL PENILAIAN KOMPETENSI & EVALUASI SIKAP PESERTA', 15, y);
  y += 6;

  // Table header
  doc.setFillColor(235, 240, 248);
  doc.rect(15, y, 180, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 30, 60);
  doc.text('No', 18, y + 5);
  doc.text('Nama Peserta', 27, y + 5);
  doc.text('NIP', 85, y + 5);
  doc.text('Skor Rata', 130, y + 5);
  doc.text('Predikat', 155, y + 5);
  y += 7;

  // Rows
  const sessionEvaluations = evaluations.filter((e) => e.sessionId === session.id);
  if (sessionEvaluations.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('(Belum ada catatan evaluasi untuk sesi ini)', 18, y + 5);
    y += 7;
  } else {
    sessionEvaluations.forEach((ev, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text(String(idx + 1), 18, y + 4.5);
      doc.text(ev.pesertaName.substring(0, 32), 27, y + 4.5);
      doc.text(ev.pesertaNip, 85, y + 4.5);
      doc.text(String(ev.finalScore.toFixed(1)), 133, y + 4.5);
      doc.text(ev.predikat, 155, y + 4.5);
      doc.setDrawColor(220, 220, 220);
      doc.line(15, y + 6, 195, y + 6);
      y += 6;
    });
  }

  // Pernyataan Pengajar/Penguji
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text('III. PERNYATAAN & PENGESAHAN DOKUMEN', 15, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Demikian Berita Acara ini dibuat dengan sebenarnya dan telah diverifikasi secara sistematis melalui modul Gatekeeping SIPEKA.', 15, y);

  // Tanda Tangan Pengajar & Panitia
  y += 14;
  doc.setFontSize(9);
  doc.text('Mengetahui / Menyetujui,', 25, y);
  doc.text('Fasilitator / Pengajar / Penguji,', 135, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Panitia Penyelenggara BPSDM', 25, y);
  doc.text(evaluator.jabatan.substring(0, 34), 135, y);

  y += 18;
  doc.text('Bambang Hermanto, S.Kom., M.T.I.', 25, y);
  doc.text(evaluator.name, 135, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('NIP. 198205142008011003', 25, y);
  doc.text(`NIP. ${evaluator.nip}`, 135, y);

  doc.save(`BAP_${session.id}_${evaluator.role}.pdf`);
}

/**
 * 3. Export Rekapitulasi Presensi Sesi (Format PDF Tabel Lengkap)
 */
export function generatePresenceRecapPDF(
  training: Training,
  session: TrainingSession,
  presences: PresenceRecord[]
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DAFTAR HADIR PESERTA & LOG VERIFIKASI SIPEKA', 148.5, 16, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${training.title} - ${session.sessionTitle}`, 148.5, 22, { align: 'center' });
  doc.text(`Tanggal: ${session.date} (${session.startTime} - ${session.endTime} WIB) | Mode: ${session.mode}`, 148.5, 27, { align: 'center' });

  doc.setLineWidth(0.4);
  doc.line(15, 31, 282, 31);

  // Table header
  let y = 38;
  doc.setFillColor(30, 58, 138); // Navy
  doc.rect(15, y, 267, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 18, y + 5.5);
  doc.text('Nama Peserta & Jabatan', 28, y + 5.5);
  doc.text('NIP', 98, y + 5.5);
  doc.text('Metode Presensi', 138, y + 5.5);
  doc.text('Waktu Log', 185, y + 5.5);
  doc.text('Jarak GPS / Geofence', 218, y + 5.5);
  doc.text('Status', 262, y + 5.5);

  y += 8;
  const sessionPresences = presences.filter((p) => p.sessionId === session.id);

  if (sessionPresences.length === 0) {
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'italic');
    doc.text('Belum ada data presensi yang masuk pada sesi ini.', 148.5, y + 10, { align: 'center' });
  } else {
    sessionPresences.forEach((p, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text(String(idx + 1), 18, y + 5);
      doc.text(p.userName.substring(0, 40), 28, y + 5);
      doc.text(p.userNip, 98, y + 5);
      doc.text(p.method === 'Luring_Signature_GPS' ? 'Luring (TTD+GPS)' : 'Daring (Live Selfie)', 138, y + 5);
      doc.text(p.timestamp.substring(11, 19) + ' WIB', 185, y + 5);

      const gpsText = p.gps ? `${p.gps.distanceFromVenueMeters}m (${p.gps.isInsideGeofence ? 'Dalam' : 'Luar'})` : 'N/A';
      doc.text(gpsText, 218, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(p.status === 'HADIR' ? 22 : 185, p.status === 'HADIR' ? 101 : 28, p.status === 'HADIR' ? 52 : 28);
      doc.text(p.status, 262, y + 5);

      doc.setDrawColor(220, 220, 220);
      doc.line(15, y + 7, 282, y + 7);
      y += 7;
    });
  }

  doc.save(`Rekap_Presensi_${session.id}.pdf`);
}

/**
 * 4. Export Rekapitulasi Pelatihan, Jam Pelajaran (JP), & Evaluasi ke EXCEL (.xlsx)
 */
export function exportExcelRecap(
  training: Training,
  sessions: TrainingSession[],
  presences: PresenceRecord[],
  evaluationsParticipant: EvaluationParticipantRecord[],
  evaluationsTeacher: EvaluationTeacherRecord[]
): void {
  // Sheet 1: Rekapitulasi Presensi & Kehadiran JP
  const presenceSheetData = presences.map((p, idx) => {
    const ses = sessions.find((s) => s.id === p.sessionId);
    return {
      'No': idx + 1,
      'Nama Peserta': p.userName,
      'NIP': p.userNip,
      'Kode Pelatihan': training.code,
      'Nama Pelatihan': training.title,
      'ID Sesi': p.sessionId,
      'Judul Sesi': ses?.sessionTitle || '-',
      'Tanggal Sesi': ses?.date || '-',
      'Jam Pelajaran (JP)': ses?.jp || 0,
      'Metode Presensi': p.method,
      'Waktu Presensi': p.timestamp,
      'Status Kehadiran': p.status,
      'Jarak GPS (Meter)': p.gps?.distanceFromVenueMeters ?? 'N/A',
      'Validasi Geofence': p.gps?.isInsideGeofence ? 'VALID' : 'OUT_OF_BOUNDS'
    };
  });

  // Sheet 2: Nilai Sikap & Kompetensi (Diisi Pengajar/Penguji)
  const evalParticipantSheetData = evaluationsParticipant.map((ep, idx) => {
    return {
      'No': idx + 1,
      'Nama Peserta': ep.pesertaName,
      'NIP Peserta': ep.pesertaNip,
      'ID Sesi': ep.sessionId,
      'Nama Penilai': ep.evaluatorName,
      'Peran Penilai': ep.evaluatorRole.toUpperCase(),
      'Skor Integritas & Disiplin': ep.scores.integritasDisiplin,
      'Skor Keaktifan Diskusi': ep.scores.keaktifanDiskusi,
      'Skor Penguasaan Substansi': ep.scores.penguasaanSubstansi,
      'Skor Tugas & Praktik': ep.scores.tugasPraktik,
      'Nilai Akhir (Rata-rata)': ep.finalScore,
      'Predikat': ep.predikat,
      'Catatan Kualitatif': ep.catatanKualitatif,
      'Rekomendasi Tindak Lanjut': ep.rekomendasiTindakLanjut,
      'Waktu Penilaian': ep.submittedAt
    };
  });

  // Sheet 3: Evaluasi Kinerja Pengajar (Diisi Peserta)
  const evalTeacherSheetData = evaluationsTeacher.map((et, idx) => {
    return {
      'No': idx + 1,
      'Nama Peserta Penilai': et.pesertaName,
      'ID Sesi': et.sessionId,
      'Pengajar Yang Dinilai': et.targetEvaluatedName,
      'Peran': et.targetRole.toUpperCase(),
      'Skor Penguasaan Materi': et.ratings.penguasaanMateri,
      'Skor Metode Penyampaian': et.ratings.metodePenyampaian,
      'Skor Pemanfaatan Media PTP': et.ratings.pemanfaatanMediaPTP,
      'Skor Interaksi Andragogi': et.ratings.interaksiAndragogi,
      'Skor Ketepatan Waktu': et.ratings.ketepatanWaktu,
      'Skor Rata-Rata (Skala 5)': et.overallAverage,
      'Catatan Apresiasi': et.catatanApresiasi,
      'Saran Perbaikan': et.saranPerbaikan,
      'Waktu Submit': et.submittedAt
    };
  });

  // Buat Workbook XLSX
  const workbook = XLSX.utils.book_new();

  const wsPresence = XLSX.utils.json_to_sheet(presenceSheetData);
  XLSX.utils.book_append_sheet(workbook, wsPresence, 'Rekap_Presensi_JP');

  const wsEvalPart = XLSX.utils.json_to_sheet(evalParticipantSheetData);
  XLSX.utils.book_append_sheet(workbook, wsEvalPart, 'Penilaian_Kompetensi');

  const wsEvalTeacher = XLSX.utils.json_to_sheet(evalTeacherSheetData);
  XLSX.utils.book_append_sheet(workbook, wsEvalTeacher, 'Evaluasi_Kinerja_Pengajar');

  // Trigger Download
  XLSX.writeFile(workbook, `SIPEKA_Rekapitulasi_Lengkap_${training.code}.xlsx`);
}

/**
 * 4. Download Template Excel Jadwal Pelatihan Resmi (Format XLSX)
 * Didesain khusus agar Admin dapat mengisi jadwal di Excel lalu menguploadnya kembali.
 */
export function downloadScheduleExcelTemplate(): void {
  const templateRows = [
    {
      'No': 1,
      'Judul Sesi / Mata Pelatihan': 'Pemanfaatan Generative AI dalam Pengembangan Multimedia Pembelajaran',
      'Jenis Jadwal (pengajar/penguji)': 'pengajar',
      'Tanggal (YYYY-MM-DD)': '2026-09-12',
      'Jam Mulai (HH:mm)': '08:00',
      'Jam Selesai (HH:mm)': '11:30',
      'JP': 4,
      'Nama Pengajar atau Penguji': 'Dra. Hj. Siti Rahmah, M.M.',
      'Ruangan / Lokasi': 'Auditorium Gd. Pusdiklat Lt. 3, Jakarta',
      'Mode (Luring/Daring)': 'Luring'
    },
    {
      'No': 2,
      'Judul Sesi / Mata Pelatihan': 'Workshop Sinkronus: Perancangan Evaluasi Pembelajaran Digital Daring',
      'Jenis Jadwal (pengajar/penguji)': 'pengajar',
      'Tanggal (YYYY-MM-DD)': '2026-09-13',
      'Jam Mulai (HH:mm)': '13:00',
      'Jam Selesai (HH:mm)': '16:00',
      'JP': 3,
      'Nama Pengajar atau Penguji': 'Dra. Hj. Siti Rahmah, M.M.',
      'Ruangan / Lokasi': 'Virtual Room Zoom Cloud Meeting & LMS Terpadu',
      'Mode (Luring/Daring)': 'Daring'
    },
    {
      'No': 3,
      'Judul Sesi / Mata Pelatihan': 'Seminar Evaluasi Akhir & Ujian Komprehensif Rancangan Proyek',
      'Jenis Jadwal (pengajar/penguji)': 'penguji',
      'Tanggal (YYYY-MM-DD)': '2026-09-15',
      'Jam Mulai (HH:mm)': '08:30',
      'Jam Selesai (HH:mm)': '15:30',
      'JP': 6,
      'Nama Pengajar atau Penguji': 'Dr. Ir. Achmad Fauzi, M.Eng.',
      'Ruangan / Lokasi': 'Ruang Uji Kompetensi BPSDM Gd. B Lt. 2',
      'Mode (Luring/Daring)': 'Luring'
    }
  ];

  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 50 }, // Judul Sesi
    { wch: 25 }, // Jenis
    { wch: 18 }, // Tanggal
    { wch: 16 }, // Jam Mulai
    { wch: 16 }, // Jam Selesai
    { wch: 8 },  // JP
    { wch: 30 }, // Pengajar/Penguji
    { wch: 40 }, // Ruangan
    { wch: 15 }  // Mode
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'Template_Jadwal_SIPEKA');
  XLSX.writeFile(workbook, 'Template_Jadwal_Pelatihan_SIPEKA.xlsx');
}

/**
 * 5. Export Jadwal Sesi Pelatihan ke Excel (Format XLSX)
 */
export function exportScheduleExcel(training: Training): void {
  const rows = training.sessions.map((ses, idx) => ({
    'No': idx + 1,
    'ID Sesi': ses.id,
    'Judul Sesi / Mata Pelatihan': ses.sessionTitle,
    'Jenis Jadwal': ses.sessionType === 'pengajar' ? 'Jadwal Pengajar (Materi)' : 'Jadwal Penguji (Seminar/Ujian)',
    'Tanggal Pelaksanaan': ses.date,
    'Waktu': `${ses.startTime} - ${ses.endTime} WIB`,
    'Alokasi JP': ses.jp,
    'Nama Pengajar / Penguji': ses.sessionType === 'pengajar' ? ses.pengajarName : (ses.pengujiName || ses.pengajarName),
    'Lokasi / Ruangan': ses.locationName,
    'Mode': ses.mode,
    'Status': ses.status,
    'Jumlah Peserta Ditugaskan': ses.participantIds?.length || 0
  }));

  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // ID Sesi
    { wch: 45 }, // Judul
    { wch: 28 }, // Jenis
    { wch: 16 }, // Tanggal
    { wch: 18 }, // Waktu
    { wch: 10 }, // JP
    { wch: 30 }, // Pengajar
    { wch: 35 }, // Lokasi
    { wch: 12 }, // Mode
    { wch: 18 }, // Status
    { wch: 22 }  // Peserta
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'Jadwal_Pelatihan');
  XLSX.writeFile(workbook, `Jadwal_${training.code}_${training.title.replace(/\s+/g, '_').substring(0, 30)}.xlsx`);
}

/**
 * 6. Generate Dokumen Jadwal Resmi (Format PDF)
 */
export function generateSchedulePDF(training: Training): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // 210 x 297 mm
  });

  // Border & Header
  doc.setDrawColor(20, 60, 120);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, 190, 277);

  // Kop Lembaga
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 40, 80);
  doc.text('KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI', 105, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('PUSAT PENDIDIKAN DAN PELATIHAN APARATUR SIPIL NEGARA TERPADU', 105, 23, { align: 'center' });
  doc.text(training.penyelenggara || 'Sekretariat Penyelenggaraan Pelatihan Aparatur Sipil Negara', 105, 27, { align: 'center' });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(15, 30, 195, 30);

  // Judul Jadwal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 30, 75);
  doc.text('MATRIKS JADWAL PEMBELAJARAN & UJIAN PELATIHAN ASN', 105, 37, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Kode Program: ${training.code} • ${training.batch}`, 105, 42, { align: 'center' });
  doc.text(`Program: ${training.title}`, 105, 47, { align: 'center' });

  // Tabel Sesi
  let currentY = 54;
  doc.setFillColor(240, 244, 250);
  doc.rect(14, currentY, 182, 7, 'F');
  doc.setDrawColor(160, 180, 210);
  doc.setLineWidth(0.3);
  doc.rect(14, currentY, 182, 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 40, 80);
  doc.text('No', 16, currentY + 4.5);
  doc.text('Mata Pelatihan / Sesi', 24, currentY + 4.5);
  doc.text('Jenis', 92, currentY + 4.5);
  doc.text('Tanggal & Waktu', 112, currentY + 4.5);
  doc.text('JP', 148, currentY + 4.5);
  doc.text('Fasilitator / Penguji', 156, currentY + 4.5);

  currentY += 7;

  training.sessions.forEach((ses, idx) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(14, currentY, 182, 12, 'F');
    doc.rect(14, currentY, 182, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);

    doc.text(String(idx + 1), 16, currentY + 5);

    // Judul (potong jika terlalu panjang)
    const titleLines = doc.splitTextToSize(ses.sessionTitle, 65);
    doc.text(titleLines[0] || ses.sessionTitle, 24, currentY + 4.5);
    if (titleLines[1]) {
      doc.setFontSize(6.5);
      doc.setTextColor(100, 100, 100);
      doc.text(titleLines[1], 24, currentY + 8.5);
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
    }

    // Jenis
    const isPengajar = ses.sessionType === 'pengajar';
    doc.setTextColor(isPengajar ? 30 : 120, isPengajar ? 80 : 40, isPengajar ? 160 : 150);
    doc.text(isPengajar ? 'Pengajar' : 'Penguji', 92, currentY + 5);

    doc.setTextColor(30, 30, 30);
    doc.text(`${ses.date}`, 112, currentY + 4.5);
    doc.setFontSize(6.5);
    doc.text(`${ses.startTime} - ${ses.endTime}`, 112, currentY + 8.5);
    doc.setFontSize(7.5);

    // JP
    doc.text(`${ses.jp} JP`, 148, currentY + 5);

    // Pengajar
    const personName = isPengajar ? ses.pengajarName : (ses.pengujiName || ses.pengajarName);
    const personLines = doc.splitTextToSize(personName, 38);
    doc.text(personLines[0] || personName, 156, currentY + 4.5);
    if (personLines[1]) {
      doc.setFontSize(6.5);
      doc.text(personLines[1], 156, currentY + 8.5);
    }

    currentY += 12;
  });

  // Tanda Tangan Penyelenggara di Bawah
  const signY = Math.max(currentY + 10, 230);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Mengetahui / Mengesahkan,', 140, signY);
  doc.text('Koordinator Penyelenggara Diklat ASN', 140, signY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 40, 80);
  doc.text('Bambang Hermanto, S.Kom., M.T.I.', 140, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 198205142008011003', 140, signY + 28);

  // Timestamp
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(`Dicetak melalui SIPEKA Sistem Diklat Terpadu • ${new Date().toLocaleString('id-ID')}`, 15, 282);

  doc.save(`Jadwal_Resmi_${training.code}.pdf`);
}

/**
 * 7. Parse File Excel (.xlsx / .xls / .csv) menjadi data Sesi Pelatihan
 */
export async function parseExcelScheduleFile(file: File): Promise<{
  sessions: Partial<TrainingSession>[];
  rawRowsCount: number;
  sheetName: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error('Lembar kerja (worksheet) Excel tidak ditemukan.');
        }

        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          throw new Error('Berkas Excel kosong atau tidak memiliki baris data.');
        }

        const parsedSessions: Partial<TrainingSession>[] = jsonData.map((row, index) => {
          // Cari kolom secara fleksibel (case-insensitive & matching keywords)
          const findVal = (...keywords: string[]): string => {
            for (const key of Object.keys(row)) {
              const lower = key.toLowerCase();
              if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
                return String(row[key]).trim();
              }
            }
            return '';
          };

          const title = findVal('judul', 'mata pelatihan', 'materi', 'sesi', 'topik') || `Sesi Pembelajaran Ke-${index + 1}`;
          const typeStr = findVal('jenis', 'tipe', 'peran', 'kategori').toLowerCase();
          const sessionType: 'pengajar' | 'penguji' = typeStr.includes('uji') ? 'penguji' : 'pengajar';
          
          let dateStr = findVal('tanggal', 'tgl', 'date') || '2026-09-12';
          // Convert excel serial date if detected
          if (!isNaN(Number(dateStr)) && Number(dateStr) > 40000) {
            const dateObj = new Date(Math.round((Number(dateStr) - 25569) * 86400 * 1000));
            dateStr = dateObj.toISOString().split('T')[0];
          }

          const startTime = findVal('mulai', 'jam mulai', 'start', 'waktu mulai') || '08:00';
          const endTime = findVal('selesai', 'jam selesai', 'end', 'waktu selesai') || '11:30';
          const jpRaw = findVal('jp', 'jam pelajaran', 'jam');
          const jp = Number(jpRaw) && !isNaN(Number(jpRaw)) ? Number(jpRaw) : 4;
          const teacher = findVal('pengajar', 'widyaiswara', 'penguji', 'nama', 'fasilitator') || 'Dra. Hj. Siti Rahmah, M.M.';
          const location = findVal('ruang', 'lokasi', 'tempat', 'venue') || 'Gedung BPSDM Lt. 3, Ruang Pusdiklat 1';
          const modeStr = findVal('mode', 'metode').toLowerCase();
          const mode: 'Luring' | 'Daring' = modeStr.includes('daring') || modeStr.includes('zoom') || modeStr.includes('online') ? 'Daring' : 'Luring';

          return {
            id: `SES-IMP-${Date.now().toString(36)}-${index + 1}`,
            sessionTitle: title,
            sessionType,
            date: dateStr,
            startTime,
            endTime,
            jp,
            pengajarName: teacher,
            pengujiName: sessionType === 'penguji' ? teacher : undefined,
            locationName: location,
            mode,
            status: 'Akan Datang'
          };
        });

        resolve({
          sessions: parsedSessions,
          rawRowsCount: jsonData.length,
          sheetName: firstSheetName
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal membaca berkas Excel. Pastikan format valid.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas yang diunggah.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
