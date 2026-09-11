import React, { useState } from 'react';
import { 
  User, 
  Training, 
  TrainingSession, 
  PresenceRecord, 
  EvaluationParticipantRecord, 
  EvaluationTeacherRecord,
  ScheduleAttachment
} from '../types';
import { canDownloadBAP, canExportRecapData } from '../utils/gatekeeper';
import { 
  generateBAPPdf, 
  generatePresenceRecapPDF, 
  exportExcelRecap 
} from '../utils/exportHelper';
import { 
  BarChart3, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  Download,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  Check,
  X,
  Calendar,
  Layers
} from 'lucide-react';
import { ScheduleManager } from './ScheduleManager';

interface AdminDashboardProps {
  currentUser: User;
  trainings: Training[];
  presences: PresenceRecord[];
  allUsers: User[];
  evaluationsTeacher: EvaluationTeacherRecord[];
  evaluationsParticipant: EvaluationParticipantRecord[];
  onAddTraining?: (training: Training) => void;
  onAddSession?: (trainingId: string, session: TrainingSession) => void;
  onDeleteSession?: (trainingId: string, sessionId: string) => void;
  onUploadScheduleAttachment?: (trainingId: string, attachment: ScheduleAttachment) => void;
  onDeleteScheduleAttachment?: (trainingId: string, attachmentId: string) => void;
  onImportSessions?: (trainingId: string, sessions: TrainingSession[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  trainings,
  presences,
  allUsers,
  evaluationsTeacher,
  evaluationsParticipant,
  onAddTraining,
  onAddSession,
  onDeleteSession,
  onUploadScheduleAttachment,
  onDeleteScheduleAttachment,
  onImportSessions
}) => {
  // Subtab State: 'jadwal' | 'rekap'
  const [adminSubTab, setAdminSubTab] = useState<'jadwal' | 'rekap'>('jadwal');
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(trainings[0]?.id || '');
  const activeTraining = trainings.find((t) => t.id === selectedTrainingId) || trainings[0];

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activeTraining?.sessions[0]?.id || ''
  );
  const activeSession: TrainingSession | undefined = activeTraining?.sessions.find(
    (s) => s.id === selectedSessionId
  );

  // Search & Filter State
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'HADIR' | 'PENDING'>('all');
  const [previewProof, setPreviewProof] = useState<{ title: string; image: string } | null>(null);

  // Filter Presensi pada Sesi Terpilih
  const sessionPresences = presences.filter((p) => p.sessionId === selectedSessionId);
  const totalPeserta = allUsers.filter((u) => u.role === 'peserta').length;
  const hadirCount = sessionPresences.filter((p) => p.status === 'HADIR').length;
  const hadirPercentage = totalPeserta > 0 ? Math.round((hadirCount / totalPeserta) * 100) : 0;

  // Cek Gatekeeper untuk BAP
  const bapGatekeeper = activeSession
    ? canDownloadBAP(currentUser, activeSession, presences, evaluationsParticipant)
    : { allowed: false, reason: 'Sesi tidak ditemukan' };

  // Filtered List
  const filteredPresences = sessionPresences.filter((p) => {
    const matchesSearch =
      p.userName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.userNip.includes(searchKeyword);
    const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handler Downloads
  const handleDownloadBAP = () => {
    if (!activeSession) return;
    if (!bapGatekeeper.allowed) {
      alert(bapGatekeeper.reason);
      return;
    }
    generateBAPPdf(
      currentUser,
      activeTraining,
      activeSession,
      presences,
      evaluationsParticipant
    );
  };

  const handleDownloadPresencePDF = () => {
    if (!activeSession) return;
    generatePresenceRecapPDF(activeTraining, activeSession, presences);
  };

  const handleDownloadExcel = () => {
    exportExcelRecap(
      activeTraining,
      activeTraining.sessions,
      presences,
      evaluationsParticipant,
      evaluationsTeacher
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Subtab Switcher: Kelola Jadwal vs Rekap Presensi & BAP */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAdminSubTab('jadwal')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              adminSubTab === 'jadwal'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            1. Kelola Jadwal Pelatihan (Pengajar & Penguji)
          </button>
          <button
            type="button"
            onClick={() => setAdminSubTab('rekap')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              adminSubTab === 'rekap'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            2. Rekap Presensi & Berita Acara (BAP)
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-3 hidden md:block">
          Modul Administrator Pusdiklat ASN • SIPEKA
        </div>
      </div>

      {adminSubTab === 'jadwal' ? (
        /* Modul 1: Kelola Jadwal Pelatihan */
        <ScheduleManager
          trainings={trainings}
          allUsers={allUsers}
          onAddTraining={onAddTraining}
          onAddSession={onAddSession}
          onDeleteSession={onDeleteSession}
          onUploadScheduleAttachment={onUploadScheduleAttachment}
          onDeleteScheduleAttachment={onDeleteScheduleAttachment}
          onImportSessions={onImportSessions}
        />
      ) : (
        /* Modul 2: Rekap Presensi Real-Time & Pengesahan BAP */
        <div className="space-y-6 animate-fadeIn">
          {/* Top Banner Control */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-800">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900">
                  Pusat Rekapitulasi & Berita Acara (SIPEKA)
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pemantauan presensi real-time, evaluasi dua arah, dan pengesahan Berita Acara Pelaksanaan (BAP).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={handleDownloadPresencePDF}
                className="px-3.5 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                PDF Rekap Presensi
              </button>
            </div>
          </div>

      {/* Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Peserta Terdaftar</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalPeserta}</div>
          <div className="text-[11px] text-slate-400 mt-1">Peserta Terkonfirmasi SK Diklat</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Kehadiran Sesi Terpilih</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{hadirCount} / {totalPeserta}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">{hadirPercentage}% Tingkat Partisipasi</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Evaluasi Pengajar Masuk</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">
            {evaluationsTeacher.filter((e) => e.sessionId === selectedSessionId).length} Form
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Umpan Balik Peserta</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Status Berita Acara (BAP)</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold">
            {bapGatekeeper.allowed ? (
              <span className="text-emerald-700 flex items-center gap-1">
                ✓ Siap Disahkan
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <Lock className="w-4 h-4" /> Terkunci
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {bapGatekeeper.allowed ? 'Evaluasi peserta lengkap' : 'Lengkapi nilai peserta'}
          </div>
        </div>
      </div>

      {/* Sesi Filter & BAP Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Program Pelatihan</label>
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 font-medium"
            >
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.code}] {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Sesi Pembelajaran</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 font-medium"
            >
              {activeTraining?.sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sessionTitle} ({s.mode} • {s.jp} JP)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* BAP Gatekeeping Download Card */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4 min-w-[280px]">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-800" />
              Berita Acara Sesi (BAP)
            </div>
            <div className="text-[11px] text-slate-500">
              {bapGatekeeper.allowed ? 'Gatekeeper Valid' : 'Gatekeeper Pending'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadBAP}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
              bapGatekeeper.allowed
                ? 'bg-blue-800 hover:bg-blue-900 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {bapGatekeeper.allowed ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            Unduh BAP PDF
          </button>
        </div>
      </div>

      {/* Tabel Log Presensi Real-Time with Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Presensi Peserta Sesi ({filteredPresences.length} Log Masuk)
            </h3>
          </div>

          {/* Quick Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Cari Nama / NIP..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-48 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="HADIR">Hanya HADIR</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Peserta & NIP</th>
                <th className="py-3 px-4">Waktu Presensi</th>
                <th className="py-3 px-4">Metode & Bukti</th>
                <th className="py-3 px-4">Verifikasi Geofence GPS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Evaluasi Pengajar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPresences.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada catatan presensi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredPresences.map((p, idx) => {
                  const hasTeacherEval = evaluationsTeacher.some(
                    (e) => e.sessionId === selectedSessionId && e.pesertaId === p.userId
                  );

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.userName}</div>
                        <div className="text-[11px] text-slate-500">NIP: {p.userNip}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.timestamp.substring(11, 19)} WIB
                      </td>
                      <td className="py-3 px-4">
                        {p.method === 'Luring_Signature_GPS' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-medium border border-blue-200">
                              Luring (TTD)
                            </span>
                            {p.signatureDataUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewProof({
                                    title: `Tanda Tangan: ${p.userName}`,
                                    image: p.signatureDataUrl!
                                  })
                                }
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                title="Klik untuk perbesar"
                              >
                                <img
                                  src={p.signatureDataUrl}
                                  alt="TTD"
                                  className="h-6 w-14 object-contain border border-slate-200 rounded bg-white p-0.5"
                                />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                              Daring (Selfie)
                            </span>
                            {p.selfieDataUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewProof({
                                    title: `Swafoto Presensi: ${p.userName}`,
                                    image: p.selfieDataUrl!
                                  })
                                }
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                title="Klik untuk perbesar"
                              >
                                <img
                                  src={p.selfieDataUrl}
                                  alt="Selfie"
                                  className="w-7 h-7 rounded-full object-cover border border-slate-300 shadow-2xs"
                                />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.gps ? (
                          <div>
                            <span
                              className={`font-semibold ${
                                p.gps.isInsideGeofence ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {p.gps.distanceFromVenueMeters}m dari Venue
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {p.gps.latitude.toFixed(4)}, {p.gps.longitude.toFixed(4)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {hasTeacherEval ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Belum Mengisi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Lightbox Modal */}
      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">{previewProof.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-center border border-slate-200">
              <img
                src={previewProof.image}
                alt="Bukti Presensi"
                className="max-h-72 object-contain rounded-lg shadow-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setPreviewProof(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
