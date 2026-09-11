import React, { useState } from 'react';
import { 
  User, 
  Training, 
  TrainingSession, 
  PresenceRecord, 
  EvaluationTeacherRecord, 
  EvaluationParticipantRecord 
} from '../types';
import { canPesertaFillEvaluation } from '../utils/gatekeeper';
import { 
  Star, 
  Award, 
  GraduationCap, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  UserCheck, 
  Send, 
  Lock,
  ArrowRight,
  User as UserIcon,
  Check,
  Building,
  FileCheck2,
  ThumbsUp
} from 'lucide-react';

interface EvaluationFormProps {
  currentUser: User;
  trainings: Training[];
  presences: PresenceRecord[];
  allUsers: User[];
  evaluationsTeacher: EvaluationTeacherRecord[];
  evaluationsParticipant: EvaluationParticipantRecord[];
  onSubmitTeacherEvaluation: (record: EvaluationTeacherRecord) => void;
  onSubmitParticipantEvaluation: (record: EvaluationParticipantRecord) => void;
  onNavigateToPresensi?: () => void;
  onNavigateToCertificate?: () => void;
  onNavigateToBAP?: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  currentUser,
  trainings,
  presences,
  allUsers,
  evaluationsTeacher,
  evaluationsParticipant,
  onSubmitTeacherEvaluation,
  onSubmitParticipantEvaluation,
  onNavigateToPresensi,
  onNavigateToCertificate,
  onNavigateToBAP
}) => {
  // Filter kegiatan yang diikuti oleh peserta (jika user role adalah peserta)
  const visibleTrainings = currentUser.role === 'peserta'
    ? trainings.filter((t) =>
        t.sessions.some((s) => s.participantIds?.includes(currentUser.id)) ||
        t.participantIds?.includes(currentUser.id)
      )
    : trainings;

  // Sesi Aktif Seleksi
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(visibleTrainings[0]?.id || '');
  const activeTraining = visibleTrainings.find((t) => t.id === selectedTrainingId) || visibleTrainings[0];

  const visibleSessions = activeTraining
    ? (currentUser.role === 'peserta'
        ? activeTraining.sessions.filter((s) => s.participantIds?.includes(currentUser.id))
        : activeTraining.sessions)
    : [];

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    visibleSessions[0]?.id || ''
  );
  const activeSession: TrainingSession | undefined = visibleSessions.find(
    (s) => s.id === selectedSessionId
  );

  // Sinkronisasi saat ganti user atau training
  React.useEffect(() => {
    if (visibleTrainings.length > 0) {
      const trainingExists = visibleTrainings.some((t) => t.id === selectedTrainingId);
      if (!trainingExists) {
        setSelectedTrainingId(visibleTrainings[0].id);
      }
    }
  }, [currentUser.id, visibleTrainings]);

  React.useEffect(() => {
    if (visibleSessions.length > 0) {
      const exists = visibleSessions.some((s) => s.id === selectedSessionId);
      if (!exists) {
        setSelectedSessionId(visibleSessions[0].id);
      }
    } else {
      setSelectedSessionId('');
    }
  }, [selectedTrainingId, activeTraining, currentUser.id]);

  // Tab Mode (Evaluasi Pengajar vs Evaluasi Peserta)
  const defaultMode = currentUser.role === 'peserta' ? 'evaluasiPengajar' : 'evaluasiPeserta';
  const [activeTabMode, setActiveTabMode] = useState<'evaluasiPengajar' | 'evaluasiPeserta'>(defaultMode);

  // Sync mode if currentUser changes
  React.useEffect(() => {
    if (currentUser.role === 'peserta') {
      setActiveTabMode('evaluasiPengajar');
    } else if (currentUser.role === 'pengajar' || currentUser.role === 'penguji') {
      setActiveTabMode('evaluasiPeserta');
    }
  }, [currentUser.role]);

  // ==========================================
  // 1. EVALUASI PENGAJAR OLEH PESERTA
  // ==========================================
  const [ratings, setRatings] = useState({
    penguasaanMateri: 5,
    metodePenyampaian: 5,
    pemanfaatanMediaPTP: 4,
    interaksiAndragogi: 5,
    ketepatanWaktu: 5
  });
  const [catatanApresiasi, setCatatanApresiasi] = useState<string>('');
  const [saranPerbaikan, setSaranPerbaikan] = useState<string>('');
  const [teacherEvalSuccess, setTeacherEvalSuccess] = useState<boolean>(false);

  // Cek apakah peserta sudah pernah evaluasi sesi ini
  const existingTeacherEval = evaluationsTeacher.find(
    (e) => e.sessionId === selectedSessionId && e.pesertaId === currentUser.id
  );

  // Gatekeeper check
  const gatekeeperResult = canPesertaFillEvaluation(
    currentUser,
    selectedSessionId,
    presences
  );

  const handleTeacherEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const avg =
      (ratings.penguasaanMateri +
        ratings.metodePenyampaian +
        ratings.pemanfaatanMediaPTP +
        ratings.interaksiAndragogi +
        ratings.ketepatanWaktu) /
      5;

    const isPenguji = activeSession.sessionType === 'penguji';
    const targetId = isPenguji ? (activeSession.pengujiId || activeSession.pengajarId) : activeSession.pengajarId;
    const targetName = isPenguji ? (activeSession.pengujiName || activeSession.pengajarName) : activeSession.pengajarName;
    const targetRole = isPenguji ? 'penguji' : 'pengajar';

    const newEval: EvaluationTeacherRecord = {
      id: `EVL-T-${Date.now().toString(36).toUpperCase()}`,
      trainingId: activeTraining.id,
      sessionId: activeSession.id,
      pesertaId: currentUser.id,
      pesertaName: currentUser.name,
      targetEvaluatedId: targetId,
      targetEvaluatedName: targetName,
      targetRole: targetRole,
      ratings: { ...ratings },
      overallAverage: Number(avg.toFixed(2)),
      catatanApresiasi: catatanApresiasi || (isPenguji ? 'Masukan dan evaluasi penguji sangat konstruktif dalam penyempurnaan portofolio.' : 'Penyampaian materi andragogi sangat aplikatif, relevan, dan komunikatif.'),
      saranPerbaikan: saranPerbaikan || 'Pertahankan ketepatan waktu dan sesi diskusi interaktif.',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onSubmitTeacherEvaluation(newEval);
    setTeacherEvalSuccess(true);
  };

  // Quick feedback template
  const applyTeacherPreset = (type: 'excellent' | 'interactive') => {
    if (type === 'excellent') {
      setRatings({
        penguasaanMateri: 5,
        metodePenyampaian: 5,
        pemanfaatanMediaPTP: 5,
        interaksiAndragogi: 5,
        ketepatanWaktu: 5
      });
      setCatatanApresiasi('Sangat memuaskan. Penguasaan materi teknologi pembelajaran dan studi kasus AI sangat kontekstual dengan tugas kami sebagai PTP.');
      setSaranPerbaikan('Waktu dan materi sudah sangat ideal, mohon materi presentasi dapat diakses secara berkala.');
    } else {
      setRatings({
        penguasaanMateri: 5,
        metodePenyampaian: 4,
        pemanfaatanMediaPTP: 5,
        interaksiAndragogi: 5,
        ketepatanWaktu: 4
      });
      setCatatanApresiasi('Fasilitator sangat mendorong partisipasi dua arah dan ruang diskusi aktif.');
      setSaranPerbaikan('Dapat ditambahkan lebih banyak waktu untuk simulasi tugas kelompok.');
    }
  };

  // ==========================================
  // 2. PENILAIAN PESERTA OLEH PENGAJAR/PENGUJI
  // ==========================================
  const attendedPesertaUsers = allUsers.filter((u) => {
    if (u.role !== 'peserta') return false;
    return presences.some((p) => p.sessionId === selectedSessionId && p.userId === u.id && p.status === 'HADIR');
  });

  const [selectedPesertaId, setSelectedPesertaId] = useState<string>(
    attendedPesertaUsers[0]?.id || ''
  );
  const selectedPeserta = allUsers.find((u) => u.id === selectedPesertaId) || attendedPesertaUsers[0];

  const [scores, setScores] = useState({
    integritasDisiplin: 92,
    keaktifanDiskusi: 90,
    penguasaanSubstansi: 94,
    tugasPraktik: 92
  });
  const [catatanKualitatif, setCatatanKualitatif] = useState<string>('');
  const [rekomendasiTindakLanjut, setRekomendasiTindakLanjut] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [participantEvalSuccess, setParticipantEvalSuccess] = useState<boolean>(false);

  // Perhitungan Nilai
  const finalScore = (scores.integritasDisiplin + scores.keaktifanDiskusi + scores.penguasaanSubstansi + scores.tugasPraktik) / 4;
  const getPredikat = (score: number) => {
    if (score >= 90) return 'Sangat Memuaskan';
    if (score >= 80) return 'Memuaskan';
    if (score >= 70) return 'Cukup';
    return 'Kurang';
  };

  // AI Generator
  const generateAiRecommendation = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const predikat = getPredikat(finalScore);
      const nama = selectedPeserta?.name || 'Peserta';
      if (predikat === 'Sangat Memuaskan') {
        setCatatanKualitatif(
          `${nama} menunjukkan etos kerja andragogi yang sangat baik, partisipatif aktif dalam bedah studi kasus, serta menunjukkan penguasaan teknologi pembelajaran digital yang inovatif.`
        );
        setRekomendasiTindakLanjut(
          `Direkomendasikan menjadi Fasilitator Internal (Lead PTP) dan diberikan penugasan strategis pada pengembangan platform e-learning instansi.`
        );
      } else {
        setCatatanKualitatif(
          `${nama} berpartisipasi baik dalam seluruh rangkaian materi dan menguasai dasar-dasar perancangan modul pembelajaran ASN.`
        );
        setRekomendasiTindakLanjut(
          `Disarankan penguatan berkelanjutan melalui praktik mandiri dan pendampingan di unit kerja asal.`
        );
      }
      setIsAiGenerating(false);
    }, 400);
  };

  const handleParticipantEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !selectedPeserta) return;

    const newEval: EvaluationParticipantRecord = {
      id: `EVL-P-${Date.now().toString(36).toUpperCase()}`,
      trainingId: activeTraining.id,
      sessionId: activeSession.id,
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.name,
      evaluatorRole: currentUser.role === 'penguji' ? 'penguji' : 'pengajar',
      pesertaId: selectedPeserta.id,
      pesertaName: selectedPeserta.name,
      pesertaNip: selectedPeserta.nip,
      scores: { ...scores },
      finalScore: Number(finalScore.toFixed(2)),
      predikat: getPredikat(finalScore),
      catatanKualitatif: catatanKualitatif || 'Menunjukkan kesungguhan belajar dan kedisiplinan prima.',
      rekomendasiTindakLanjut: rekomendasiTindakLanjut || 'Tingkatkan implementasi hasil pelatihan di unit kerja.',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onSubmitParticipantEvaluation(newEval);
    setParticipantEvalSuccess(true);
  };

  // Hitung jumlah yang sudah dinilai
  const evaluatedCount = attendedPesertaUsers.filter((u) =>
    evaluationsParticipant.some(
      (ep) => ep.sessionId === selectedSessionId && ep.pesertaId === u.id && ep.evaluatorId === currentUser.id
    )
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-xl ${
                currentUser.role === 'peserta' ? 'bg-emerald-100 text-emerald-800' :
                currentUser.role === 'pengajar' ? 'bg-indigo-100 text-indigo-800' :
                currentUser.role === 'penguji' ? 'bg-purple-100 text-purple-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                {currentUser.role === 'peserta' && 'Evaluasi Kinerja Widyaiswara / Pengajar'}
                {currentUser.role === 'pengajar' && 'Penilaian Sikap & Kinerja Peserta (Widyaiswara)'}
                {currentUser.role === 'penguji' && 'Penilaian Seminar & Ujian Peserta (Penguji)'}
                {currentUser.role === 'admin' && 'Supervisi Evaluasi Dua Arah Pelatihan'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {currentUser.role === 'peserta' && 'Beri penilaian objektif terhadap penguasaan materi dan metode fasilitator pada sesi yang Anda ikuti.'}
              {currentUser.role === 'pengajar' && 'Beri nilai sikap, keaktifan diskusi, dan tugas peserta untuk kelengkapan Berita Acara (BAP).'}
              {currentUser.role === 'penguji' && 'Beri nilai penguasaan substansi, argumentasi tanya jawab, dan catatan perbaikan bagi peserta seminar.'}
              {currentUser.role === 'admin' && 'Supervisi hasil penilaian pengajar oleh peserta dan nilai peserta oleh pengajar/penguji.'}
            </p>
          </div>

          {/* Mode Switcher Tabs HANYA untuk Admin */}
          {currentUser.role === 'admin' ? (
            <div className="flex bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 self-start">
              <button
                type="button"
                onClick={() => setActiveTabMode('evaluasiPengajar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTabMode === 'evaluasiPengajar'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Evaluasi Pengajar (Peserta)
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('evaluasiPeserta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTabMode === 'evaluasiPeserta'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Penilaian Peserta (Pengajar/Penguji)
              </button>
            </div>
          ) : (
            <div className={`text-xs px-3 py-1.5 rounded-xl font-bold border self-start ${
              currentUser.role === 'peserta' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              currentUser.role === 'pengajar' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
              'bg-purple-50 text-purple-800 border-purple-200'
            }`}>
              {currentUser.role === 'peserta' && 'Hak Akses: Peserta Pelatihan'}
              {currentUser.role === 'pengajar' && 'Hak Akses: Widyaiswara Penilai'}
              {currentUser.role === 'penguji' && 'Hak Akses: Penguji Evaluasi'}
            </div>
          )}
        </div>

        {/* Filter Sesi */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Pelatihan Aktif</label>
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
            >
              {visibleTrainings.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.code}] {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Sesi Pelatihan</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
            >
              {visibleSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sessionType === 'penguji' ? '🎓 [Jadwal Penguji]' : '📘 [Jadwal Pengajar]'} {s.sessionTitle} ({s.date} • {s.mode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. VIEW: EVALUASI KINERJA PENGAJAR (DIISI PESERTA) */}
      {/* ======================================================== */}
      {activeTabMode === 'evaluasiPengajar' && (
        <div>
          {/* Gatekeeper Check */}
          {!gatekeeperResult.allowed ? (
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-rose-900">
                Gatekeeping Aktif: Formulir Evaluasi Terkunci
              </h3>
              <p className="text-xs sm:text-sm text-rose-700 max-w-lg mx-auto">
                {gatekeeperResult.reason}
              </p>
              {onNavigateToPresensi && (
                <button
                  type="button"
                  onClick={onNavigateToPresensi}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Buka Halaman Presensi Mandiri Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleTeacherEvalSubmit}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6"
            >
              {/* Target Info */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-indigo-700">
                    {activeSession?.sessionType === 'penguji' ? 'Penguji Seminar / Ujian Dinilai:' : 'Widyaiswara / Fasilitator Dinilai:'}
                  </span>
                  <div className="text-sm font-bold text-indigo-950 mt-0.5">
                    {activeSession?.sessionType === 'penguji' 
                      ? (activeSession?.pengujiName || activeSession?.pengajarName) 
                      : activeSession?.pengajarName}
                  </div>
                  <div className="text-xs text-indigo-800 mt-0.5">
                    {activeSession?.sessionType === 'penguji' ? 'Topik Seminar: ' : 'Mata Pelatihan: '}
                    {activeSession?.sessionTitle}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Presensi HADIR Terverifikasi
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold text-slate-700">Templat Jawaban Cepat (Simulasi):</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyTeacherPreset('excellent')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    ⭐ Sangat Memuaskan (Full 5★)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTeacherPreset('interactive')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    💡 Interaktif & Andragogi
                  </button>
                </div>
              </div>

              {/* Likert Scale Questions */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Instrumen Evaluasi Kinerja Fasilitator (Skala Likert 1 - 5)
                </h3>

                {[
                  { key: 'penguasaanMateri', label: '1. Penguasaan Materi Substansi & Keilmuan' },
                  { key: 'metodePenyampaian', label: '2. Sistematika Penyampaian & Ketepatan Metode Ajar' },
                  { key: 'pemanfaatanMediaPTP', label: '3. Pemanfaatan Media Pembelajaran Digital / PTP Modern' },
                  { key: 'interaksiAndragogi', label: '4. Interaksi Pembelajaran Orang Dewasa & Tanya Jawab' },
                  { key: 'ketepatanWaktu', label: '5. Ketepatan Waktu Mulai & Efektivitas Jam Pelajaran (JP)' }
                ].map(({ key, label }) => {
                  const currentValue = (ratings as any)[key];
                  const labels = ['', 'Sangat Kurang', 'Kurang', 'Cukup', 'Baik', 'Sangat Baik'];

                  return (
                    <div
                      key={key}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <span className="text-xs font-semibold text-slate-800 max-w-md">{label}</span>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatings({ ...ratings, [key]: star })}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                                currentValue >= star
                                  ? 'bg-amber-400 text-slate-950 shadow-2xs'
                                  : 'bg-white text-slate-300 border border-slate-200 hover:bg-slate-100'
                              }`}
                              title={`${star} - ${labels[star]}`}
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 min-w-[80px] text-right">
                          {currentValue}/5 ({labels[currentValue]})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Catatan Apresiasi & Saran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Apresiasi & Keunggulan Sesi
                  </label>
                  <textarea
                    rows={3}
                    value={catatanApresiasi}
                    onChange={(e) => setCatatanApresiasi(e.target.value)}
                    placeholder="Contoh: Sangat interaktif, contoh kasus AI sangat kontekstual dengan tugas PTP."
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Saran Perbaikan / Masukan Konstruktif
                  </label>
                  <textarea
                    rows={3}
                    value={saranPerbaikan}
                    onChange={(e) => setSaranPerbaikan(e.target.value)}
                    placeholder="Contoh: Mohon alokasi waktu tanya jawab diperbanyak pada sesi praktikum."
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {teacherEvalSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Evaluasi berhasil disimpan! Seluruh syarat penerbitan sertifikat telah terpenuhi.</span>
                  </div>
                  {onNavigateToCertificate && (
                    <button
                      type="button"
                      onClick={onNavigateToCertificate}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer shrink-0"
                    >
                      Buka Sertifikat Saya →
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                  Data evaluasi dijamin kerahasiaannya dan digunakan untuk evaluasi mutu diklat.
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Kirim Evaluasi Pengajar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. VIEW: PENILAIAN PESERTA (DIISI PENGAJAR / PENGUJI) */}
      {/* ======================================================== */}
      {activeTabMode === 'evaluasiPeserta' && (
        <form
          onSubmit={handleParticipantEvalSubmit}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6"
        >
          {/* Header Status & Progress BAP */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-indigo-700">Fasilitator / Evaluator Aktif:</span>
              <div className="text-sm font-bold text-indigo-950 mt-0.5">{currentUser.name}</div>
              <div className="text-xs text-indigo-800">
                Peran: {currentUser.role.toUpperCase()} • Sesi: {activeSession?.sessionTitle}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">
                Progress: {evaluatedCount} dari {attendedPesertaUsers.length} Peserta Dinilai
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {attendedPesertaUsers.length > 0 && evaluatedCount >= attendedPesertaUsers.length
                  ? '✓ Syarat Unduh BAP Terpenuhi!'
                  : 'Selesaikan penilaian untuk membuka BAP'}
              </div>
            </div>
          </div>

          {/* Grid Peserta Hadir (Kartu Seleksi Interaktif) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pilih Peserta Hadir untuk Diberi Nilai:
            </label>

            {attendedPesertaUsers.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                Belum ada peserta yang berstatus HADIR pada sesi ini. Evaluasi peserta hanya dapat dilakukan kepada peserta yang telah presensi.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {attendedPesertaUsers.map((u) => {
                  const isSelected = u.id === selectedPeserta?.id;
                  const isEvaluated = evaluationsParticipant.some(
                    (ep) => ep.sessionId === selectedSessionId && ep.pesertaId === u.id
                  );
                  const evalData = evaluationsParticipant.find(
                    (ep) => ep.sessionId === selectedSessionId && ep.pesertaId === u.id
                  );

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedPesertaId(u.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-800 text-white font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        {isEvaluated ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ {evalData?.finalScore}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Belum Dinilai
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-900 line-clamp-1">{u.name}</div>
                      <div className="text-[11px] text-slate-500">NIP: {u.nip}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rubrik Penilaian Nilai Kompetensi */}
          {selectedPeserta && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Rubrik Penilaian Kompetensi Peserta (Skala 0 - 100)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Menilai: <strong>{selectedPeserta.name}</strong> ({selectedPeserta.jabatan})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Nilai Akhir:</span>
                  <span className="text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    {finalScore.toFixed(1)} • {getPredikat(finalScore)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {[
                  { key: 'integritasDisiplin', label: 'Integritas & Kedisiplinan Waktu' },
                  { key: 'keaktifanDiskusi', label: 'Keaktifan Diskusi & Kolaborasi' },
                  { key: 'penguasaanSubstansi', label: 'Penguasaan Substansi Materi' },
                  { key: 'tugasPraktik', label: 'Capaian Tugas / Praktikum Portofolio' }
                ].map(({ key, label }) => (
                  <div key={key} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{label}</span>
                      <span className="font-mono text-sm text-indigo-700">{(scores as any)[key]}</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="100"
                      value={(scores as any)[key]}
                      onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                      className="w-full accent-indigo-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>60 (Cukup)</span>
                      <span>80 (Memuaskan)</span>
                      <span>100 (Sangat Baik)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Narasi Button & Textareas */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Catatan Kualitatif & Rekomendasi Pengembangan Kompetensi
                  </label>
                  <button
                    type="button"
                    onClick={generateAiRecommendation}
                    disabled={isAiGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs font-bold shadow-xs hover:from-blue-800 hover:to-indigo-800 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    {isAiGenerating ? 'Memproses Narasi AI...' : 'Gemini AI: Buat Narasi Otomatis'}
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={catatanKualitatif}
                  onChange={(e) => setCatatanKualitatif(e.target.value)}
                  placeholder="Catatan sikap perilaku dan capaian belajar peserta..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />

                <textarea
                  rows={2}
                  value={rekomendasiTindakLanjut}
                  onChange={(e) => setRekomendasiTindakLanjut(e.target.value)}
                  placeholder="Rekomendasi rencana aksi atau tindak lanjut bagi unit kerja peserta..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {participantEvalSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Penilaian untuk {selectedPeserta.name} berhasil disimpan ke basis data BAP!</span>
                  </div>
                  {onNavigateToBAP && (
                    <button
                      type="button"
                      onClick={onNavigateToBAP}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer shrink-0"
                    >
                      Buka Lembar BAP →
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                  Menilai seluruh peserta akan langsung membuka opsi cetak Berita Acara Pelaksanaan (BAP).
                </div>
                <button
                  type="submit"
                  disabled={attendedPesertaUsers.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  Simpan Nilai Peserta
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
