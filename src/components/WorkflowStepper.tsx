import React from 'react';
import { User, PresenceRecord, EvaluationTeacherRecord, EvaluationParticipantRecord, TrainingSession } from '../types';
import { CheckCircle2, Circle, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface WorkflowStepperProps {
  currentUser: User;
  activeSession?: TrainingSession;
  presences: PresenceRecord[];
  evaluationsTeacher: EvaluationTeacherRecord[];
  evaluationsParticipant: EvaluationParticipantRecord[];
  onNavigateTab: (tab: 'presensi' | 'evaluasi' | 'dashboard' | 'sertifikat') => void;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentUser,
  activeSession,
  presences,
  evaluationsTeacher,
  evaluationsParticipant,
  onNavigateTab
}) => {
  // Logic untuk Peserta
  if (currentUser.role === 'peserta') {
    const isPresent = presences.some(
      (p) => p.sessionId === activeSession?.id && p.userId === currentUser.id && p.status === 'HADIR'
    );
    const hasEvaluated = evaluationsTeacher.some(
      (e) => e.sessionId === activeSession?.id && e.pesertaId === currentUser.id
    );

    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Alur Gatekeeping Peserta: Tahapan Wajib Pelatihan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem secara otomatis membuka fitur berikutnya setelah syarat pada tahap sebelumnya terpenuhi.
            </p>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 self-start md:self-auto">
            Progress: {isPresent ? (hasEvaluated ? '3/3 Siap Unduh Sertifikat' : '2/3 Menunggu Evaluasi') : '1/3 Menunggu Presensi'}
          </div>
        </div>

        {/* Stepper Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: Presensi */}
          <div
            onClick={() => onNavigateTab('presensi')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              isPresent
                ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50'
                : 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tahap 1</span>
              {isPresent ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                  Sedang Aktif
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-slate-900">1. Presensi Mandiri Sesi</div>
            <div className="text-[11px] text-slate-600 mt-1">
              {isPresent ? '✓ Terverifikasi HADIR' : 'Wajib submit TTD/Selfie'}
            </div>
          </div>

          {/* Step 2: Evaluasi Pengajar */}
          <div
            onClick={() => isPresent && onNavigateTab('evaluasi')}
            className={`p-3.5 rounded-xl border transition-all ${
              !isPresent
                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                : hasEvaluated
                ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50 cursor-pointer'
                : 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tahap 2</span>
              {!isPresent ? (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              ) : hasEvaluated ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                  Terbuka (Silakan Isi)
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-slate-900">2. Evaluasi Widyaiswara</div>
            <div className="text-[11px] text-slate-600 mt-1">
              {!isPresent
                ? 'Terkunci (Perlu Presensi HADIR)'
                : hasEvaluated
                ? '✓ Evaluasi Selesai Diisi'
                : 'Beri penilaian kinerja fasilitator'}
            </div>
          </div>

          {/* Step 3: Sertifikat */}
          <div
            onClick={() => isPresent && hasEvaluated && onNavigateTab('sertifikat')}
            className={`p-3.5 rounded-xl border transition-all ${
              !(isPresent && hasEvaluated)
                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                : 'bg-amber-50/70 border-amber-300 hover:bg-amber-50 cursor-pointer ring-2 ring-amber-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tahap 3</span>
              {isPresent && hasEvaluated ? (
                <Sparkles className="w-4 h-4 text-amber-500" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="text-xs font-bold text-slate-900">3. Sertifikat Kelulusan</div>
            <div className="text-[11px] text-slate-600 mt-1">
              {isPresent && hasEvaluated ? '✓ Siap Diunduh (PDF Resmi)' : 'Terkunci (Selesaikan Tahap 1 & 2)'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logic untuk Pengajar / Penguji
  if (currentUser.role === 'pengajar' || currentUser.role === 'penguji') {
    const sessionPresences = presences.filter(
      (p) => p.sessionId === activeSession?.id && p.status === 'HADIR'
    );
    const totalHadir = sessionPresences.length;
    const evaluatedCount = sessionPresences.filter((p) =>
      evaluationsParticipant.some(
        (ev) => ev.sessionId === activeSession?.id && ev.pesertaId === p.userId && ev.evaluatorId === currentUser.id
      )
    ).length;
    const isBAPUnlocked = totalHadir > 0 && evaluatedCount >= totalHadir;

    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              Alur Pengajar / Penguji: Penilaian Peserta & Penerbitan BAP
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selesaikan evaluasi seluruh peserta yang hadir untuk membuka pengesahan dan unduhan Berita Acara Pelaksanaan (BAP).
            </p>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 self-start md:self-auto">
            Progress Penilaian: {evaluatedCount} dari {totalHadir} Peserta Selesai
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onClick={() => onNavigateTab('dashboard')}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Langkah 1</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-bold text-slate-900">Daftar Kehadiran Sesi</div>
            <div className="text-[11px] text-slate-600 mt-1">{totalHadir} Peserta Terkonfirmasi HADIR</div>
          </div>

          <div
            onClick={() => onNavigateTab('evaluasi')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              isBAPUnlocked
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Langkah 2</span>
              {isBAPUnlocked ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                  {totalHadir - evaluatedCount} Belum Dinilai
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-slate-900">Penilaian Sikap Peserta</div>
            <div className="text-[11px] text-slate-600 mt-1">
              {isBAPUnlocked ? '✓ Seluruh Peserta Sudah Dinilai' : 'Lengkapi penilaian di form evaluasi'}
            </div>
          </div>

          <div
            onClick={() => isBAPUnlocked && onNavigateTab('dashboard')}
            className={`p-3.5 rounded-xl border transition-all ${
              !isBAPUnlocked
                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                : 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100 cursor-pointer ring-2 ring-emerald-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Langkah 3</span>
              {isBAPUnlocked ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="text-xs font-bold text-slate-900">Unduh BAP Resmi (PDF)</div>
            <div className="text-[11px] text-slate-600 mt-1">
              {isBAPUnlocked ? '✓ Siap Diunduh & Dicetak' : 'Terkunci (Selesaikan nilai peserta)'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
