import React, { useState } from 'react';
import { User, Training, PresenceRecord, EvaluationTeacherRecord, EvaluationParticipantRecord } from '../types';
import { canPesertaDownloadCertificate } from '../utils/gatekeeper';
import { generateCertificatePDF } from '../utils/exportHelper';
import { Award, Download, CheckCircle2, Lock, ArrowRight, Check, X, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CertificateModalProps {
  currentUser: User;
  trainings: Training[];
  presences: PresenceRecord[];
  evaluationsTeacher: EvaluationTeacherRecord[];
  evaluationsParticipant: EvaluationParticipantRecord[];
  onAddParticipantEvaluation?: (record: EvaluationParticipantRecord) => void;
  onNavigateToPresensi?: () => void;
  onNavigateToEvaluation?: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  currentUser,
  trainings,
  presences,
  evaluationsTeacher,
  evaluationsParticipant,
  onAddParticipantEvaluation,
  onNavigateToPresensi,
  onNavigateToEvaluation
}) => {
  // Filter kegiatan yang diikuti oleh peserta
  const visibleTrainings = currentUser.role === 'peserta'
    ? trainings.filter((t) =>
        t.sessions.some((s) => s.participantIds?.includes(currentUser.id)) ||
        t.participantIds?.includes(currentUser.id)
      )
    : trainings;

  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(visibleTrainings[0]?.id || '');
  const activeTraining = visibleTrainings.find((t) => t.id === selectedTrainingId) || visibleTrainings[0];
  const activeSession = activeTraining?.sessions[0];

  React.useEffect(() => {
    if (visibleTrainings.length > 0 && !visibleTrainings.some((t) => t.id === selectedTrainingId)) {
      setSelectedTrainingId(visibleTrainings[0].id);
    }
  }, [currentUser.id, visibleTrainings]);

  if (!activeTraining) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 text-center">
        <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Belum Ada Pelatihan yang Diikuti</h3>
        <p className="text-xs text-slate-500 mt-1">Anda saat ini belum terdaftar pada jadwal kegiatan pelatihan manapun.</p>
      </div>
    );
  }

  // 1. Syarat Presensi
  const userPresence = presences.find(
    (p) => p.trainingId === activeTraining.id && p.userId === currentUser.id && p.status === 'HADIR'
  );

  // 2. Syarat Evaluasi oleh Peserta
  const hasEvaluated = evaluationsTeacher.some(
    (e) => e.trainingId === activeTraining.id && e.pesertaId === currentUser.id
  );

  // 3. Syarat Seluruh Nilai telah diinput oleh Pengajar/Penguji
  const participantScoreRecord = evaluationsParticipant.find(
    (ep) => ep.trainingId === activeTraining.id && ep.pesertaId === currentUser.id
  );
  const hasAllScores = !!participantScoreRecord;

  // Gatekeeper check dengan 3 syarat lengkap
  const gatekeeper = canPesertaDownloadCertificate(
    currentUser,
    activeTraining.id,
    presences,
    evaluationsTeacher,
    evaluationsParticipant
  );

  const handleDownload = () => {
    if (!gatekeeper.allowed || !activeSession || !userPresence) {
      alert(gatekeeper.reason || 'Sertifikat belum memenuhi syarat gatekeeping.');
      return;
    }

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });

    generateCertificatePDF(currentUser, activeTraining, activeSession, userPresence);
  };

  // Helper simulasi cepat input nilai untuk pengujian peserta
  const handleQuickSimulateGrade = () => {
    if (!activeSession || !onAddParticipantEvaluation) return;
    const simRecord: EvaluationParticipantRecord = {
      id: `EVL-P-SIM-${Date.now().toString(36).toUpperCase()}`,
      trainingId: activeTraining.id,
      sessionId: activeSession.id,
      evaluatorId: activeSession.pengajarId || 'user-pengajar-1',
      evaluatorName: activeSession.pengajarName || 'Dra. Hj. Siti Rahmah, M.M.',
      evaluatorRole: 'pengajar',
      pesertaId: currentUser.id,
      pesertaName: currentUser.name,
      pesertaNip: currentUser.nip,
      scores: {
        integritasDisiplin: 92,
        keaktifanDiskusi: 94,
        penguasaanSubstansi: 90,
        tugasPraktik: 95
      },
      finalScore: 92.75,
      predikat: 'Sangat Memuaskan',
      catatanKualitatif: 'Memenuhi seluruh kriteria kompetensi andragogi dan portofolio pelatihan dengan sangat memuaskan.',
      rekomendasiTindakLanjut: 'Direkomendasikan melanjutkan implementasi proyek perubahan di instansi.',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    onAddParticipantEvaluation(simRecord);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Training Selector */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Sertifikat Kelulusan & Jam Pelajaran (JP) ASN
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penerbitan sertifikat digital resmi: Terbit hanya setelah presensi HADIR, evaluasi peserta selesai, dan seluruh nilai telah diinput oleh Pengajar/Penguji.
          </p>
        </div>

        {gatekeeper.allowed && (
          <button
            type="button"
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            Unduh Sertifikat PDF Resmi
          </button>
        )}
      </div>

      {/* Program Selector if multiple enrolled */}
      {visibleTrainings.length > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Pilih Kegiatan yang Anda Ikuti:
          </label>
          <select
            value={selectedTrainingId}
            onChange={(e) => setSelectedTrainingId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {visibleTrainings.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.code}] {t.title} ({t.batch})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Syarat Gatekeeping: 3 Tahap Wajib */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Verifikasi Kelayakan Penerbitan Sertifikat (3 Syarat Mutlak):
          </h3>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            gatekeeper.allowed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {gatekeeper.allowed ? '✓ Syarat Lengkap' : 'Belum Memenuhi Syarat'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Syarat 1: Presensi HADIR */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            userPresence ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {userPresence ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div className="font-bold text-slate-900">1. Presensi HADIR</div>
              </div>
              <div className="text-[11px] text-slate-600">
                {userPresence ? '✓ Kehadiran terverifikasi' : 'Belum melakukan presensi'}
              </div>
            </div>
            {!userPresence && onNavigateToPresensi && (
              <button
                type="button"
                onClick={onNavigateToPresensi}
                className="mt-2 text-xs text-blue-700 font-bold hover:underline self-start cursor-pointer"
              >
                Isi Presensi →
              </button>
            )}
          </div>

          {/* Syarat 2: Evaluasi Peserta */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            hasEvaluated ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {hasEvaluated ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div className="font-bold text-slate-900">2. Evaluasi Sesi</div>
              </div>
              <div className="text-[11px] text-slate-600">
                {hasEvaluated ? '✓ Evaluasi pengajar diisi' : 'Wajib isi evaluasi pengajar/penguji'}
              </div>
            </div>
            {!hasEvaluated && onNavigateToEvaluation && (
              <button
                type="button"
                onClick={onNavigateToEvaluation}
                className="mt-2 text-xs text-blue-700 font-bold hover:underline self-start cursor-pointer"
              >
                Isi Evaluasi →
              </button>
            )}
          </div>

          {/* Syarat 3: Penilaian Pengajar & Penguji */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            hasAllScores ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/80 border-amber-300'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {hasAllScores ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div className="font-bold text-slate-900">3. Nilai Pengajar & Penguji</div>
              </div>
              <div className="text-[11px] text-slate-600">
                {hasAllScores 
                  ? `✓ Nilai: ${participantScoreRecord.finalScore} (${participantScoreRecord.predikat})` 
                  : 'Menunggu input nilai dari Pengajar/Penguji'}
              </div>
            </div>
            {!hasAllScores && onAddParticipantEvaluation && (
              <button
                type="button"
                onClick={handleQuickSimulateGrade}
                className="mt-2 text-[11px] bg-amber-200/80 hover:bg-amber-300/80 text-amber-900 font-bold px-2 py-1 rounded-md self-start cursor-pointer transition-colors"
                title="Klik untuk mensimulasikan pengajar menginput nilai peserta ini"
              >
                ⚡ Simulasi Input Nilai
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gatekeeping Status Check Card */}
      {!gatekeeper.allowed ? (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-950">
              Sertifikat Masih Terkunci oleh Gatekeeper SIPEKA
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 max-w-md mx-auto mt-1">
              {gatekeeper.reason}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {!userPresence && onNavigateToPresensi && (
              <button
                type="button"
                onClick={onNavigateToPresensi}
                className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                1. Buka Halaman Presensi Mandiri
              </button>
            )}
            {!hasEvaluated && onNavigateToEvaluation && (
              <button
                type="button"
                onClick={onNavigateToEvaluation}
                className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                2. Buka Halaman Evaluasi Pengajar
              </button>
            )}
            {!hasAllScores && onAddParticipantEvaluation && (
              <button
                type="button"
                onClick={handleQuickSimulateGrade}
                className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                3. Simulasikan Nilai dari Pengajar
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Certificate Visual Preview */
        <div className="bg-white rounded-2xl border-4 border-double border-amber-500/40 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Watermark Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Award className="w-96 h-96 text-slate-800" />
          </div>

          <div className="relative z-10 text-center space-y-5">
            {/* Header Instansi */}
            <div className="space-y-1">
              <div className="text-xs font-bold tracking-widest text-slate-700 uppercase">
                Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Pusat Pendidikan dan Pelatihan Pegawai Aparatur Sipil Negara
              </div>
              <div className="w-32 h-0.5 bg-amber-500 mx-auto mt-2"></div>
            </div>

            {/* Title */}
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-wide">
                SERTIFIKAT KELULUSAN
              </h2>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Nomor: B-8924/DL.02.01/PTP-ASN/2026
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-1 pt-2">
              <div className="text-xs text-slate-500 italic">Diberikan Kepada:</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentUser.name}
              </div>
              <div className="text-xs text-slate-600 font-mono">
                NIP: {currentUser.nip} • {currentUser.instansi}
              </div>
            </div>

            {/* Description */}
            <div className="max-w-xl mx-auto text-xs text-slate-600 leading-relaxed pt-2">
              Telah menyelesaikan seluruh rangkaian kegiatan pembelajaran, presensi terverifikasi digital,
              serta memperoleh evaluasi kelulusan dari Tim Pengajar/Penguji pada:
              <div className="font-bold text-slate-900 text-sm mt-1">
                {activeTraining.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {activeTraining.batch} • Beban Pelatihan: {activeTraining.totalJp} Jam Pelajaran (JP)
              </div>
              {participantScoreRecord && (
                <div className="mt-2 font-bold text-xs text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg py-1 px-3 inline-block">
                  Nilai Akhir: {participantScoreRecord.finalScore.toFixed(1)} / 100 ({participantScoreRecord.predikat})
                </div>
              )}
            </div>

            {/* Validation Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              TERVERIFIKASI GATEKEEPER: PRESENSI, EVALUASI & NILAI LENGKAP
            </div>

            {/* Footer Signatures */}
            <div className="pt-6 flex items-center justify-between text-left text-xs text-slate-600 border-t border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400">Verifikasi QR Code:</div>
                <div className="w-16 h-16 border border-slate-300 rounded-lg p-1 mt-1 flex flex-col items-center justify-center bg-slate-50 text-[8px] font-mono text-center">
                  <span>[ QR TTE ]</span>
                  <span className="text-[7px] text-blue-700">Valid SIPEKA</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px]">Jakarta, 11 September 2026</div>
                <div className="text-[11px] font-medium text-slate-500">Kepala Pusdiklat Pegawai ASN,</div>
                <div className="my-2 h-8 flex items-center justify-end">
                  <span className="text-[10px] text-indigo-700 italic border border-indigo-200 rounded px-2 py-0.5 bg-indigo-50">
                    [ Tanda Tangan Elektronik Sah ]
                  </span>
                </div>
                <div className="font-bold text-slate-900">Prof. Dr. H. Mulyadi, M.Si.</div>
                <div className="text-[10px] text-slate-500">NIP. 196508121990031001</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
