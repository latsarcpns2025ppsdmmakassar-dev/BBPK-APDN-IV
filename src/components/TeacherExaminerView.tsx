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
import { 
  Calendar, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Award, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Eye, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  FileSpreadsheet,
  Building2,
  CalendarCheck
} from 'lucide-react';
import { canDownloadBAP } from '../utils/gatekeeper';
import { generateBAPPdf, generatePresenceRecapPDF } from '../utils/exportHelper';

interface TeacherExaminerViewProps {
  currentUser: User; // 'pengajar' | 'penguji'
  trainings: Training[];
  presences: PresenceRecord[];
  allUsers: User[];
  evaluationsTeacher: EvaluationTeacherRecord[];
  evaluationsParticipant: EvaluationParticipantRecord[];
  onNavigateToEvaluation: (sessionId?: string) => void;
  activeSubView?: 'jadwal' | 'bap';
  onSubViewChange?: (view: 'jadwal' | 'bap') => void;
}

export const TeacherExaminerView: React.FC<TeacherExaminerViewProps> = ({
  currentUser,
  trainings,
  presences,
  allUsers,
  evaluationsTeacher,
  evaluationsParticipant,
  onNavigateToEvaluation,
  activeSubView = 'jadwal',
  onSubViewChange
}) => {
  const [internalSubView, setInternalSubView] = useState<'jadwal' | 'bap'>(activeSubView);
  const currentSubView = onSubViewChange ? activeSubView : internalSubView;
  const setSubView = (v: 'jadwal' | 'bap') => {
    if (onSubViewChange) {
      onSubViewChange(v);
    } else {
      setInternalSubView(v);
    }
  };

  const isPenguji = currentUser.role === 'penguji';

  // Saring sesi yang diampu atau diuji oleh user ini
  // (atau jika tidak ada yang cocok dengan ID persis, sertakan sesi dengan peran yang sesuai)
  const allSessions: { session: TrainingSession; training: Training }[] = [];
  trainings.forEach((t) => {
    t.sessions.forEach((s) => {
      const matchesPengajar = !isPenguji && (s.pengajarId === currentUser.id || s.pengajarName.includes(currentUser.name.split(',')[0]));
      const matchesPenguji = isPenguji && (s.pengujiId === currentUser.id || (s.pengujiName && s.pengujiName.includes(currentUser.name.split(',')[0])) || s.sessionType === 'penguji');
      
      if (matchesPengajar || matchesPenguji) {
        allSessions.push({ session: s, training: t });
      }
    });
  });

  // Jika tidak ada yang cocok secara nama/ID, fallback ke semua sesi bertipe sesuai perannya di training pertama
  if (allSessions.length === 0 && trainings[0]) {
    trainings[0].sessions.forEach((s) => {
      if ((isPenguji && s.sessionType === 'penguji') || (!isPenguji && s.sessionType !== 'penguji')) {
        allSessions.push({ session: s, training: trainings[0] });
      }
    });
  }

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    allSessions[0]?.session.id || trainings[0]?.sessions[0]?.id || ''
  );

  const activeEntry = allSessions.find((item) => item.session.id === selectedSessionId) || allSessions[0];
  const activeSession = activeEntry?.session;
  const activeTraining = activeEntry?.training || trainings[0];

  // Presensi pada sesi ini
  const sessionPresences = presences.filter((p) => p.sessionId === activeSession?.id);
  const hadirPresences = sessionPresences.filter((p) => p.status === 'HADIR');

  // Daftar peserta di sesi ini
  const sessionParticipantIds = activeSession?.participantIds || [];
  const enrolledParticipants = allUsers.filter(
    (u) => u.role === 'peserta' && (sessionParticipantIds.length === 0 || sessionParticipantIds.includes(u.id))
  );

  // Evaluasi gatekeeper check
  const bapGatekeeper = activeSession
    ? canDownloadBAP(currentUser, activeSession, presences, evaluationsParticipant)
    : { allowed: false, reason: 'Sesi tidak ditemukan' };

  // Handlers Cetak BAP & Presensi
  const handleDownloadBAP = () => {
    if (!activeSession || !activeTraining) return;
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
    if (!activeSession || !activeTraining) return;
    generatePresenceRecapPDF(activeTraining, activeSession, presences);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Role Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`p-2.5 rounded-xl ${isPenguji ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
              {isPenguji ? <Award className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {isPenguji ? 'Portal Penguji Seminar & Evaluasi' : 'Portal Widyaiswara & Pengajar'}
                </h1>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                  isPenguji ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {isPenguji ? 'Penguji ASN' : 'Widyaiswara'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {isPenguji 
                  ? 'Kelola jadwal pengujian seminar rancangan aksi perubahan, beri nilai ujian, dan unduh BAP resmi.'
                  : 'Pantau jadwal mengajar, kehadiran peserta, nilai sikap & kompetensi, serta terbitkan BAP resmi.'}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setSubView('jadwal')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              currentSubView === 'jadwal'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{isPenguji ? 'Jadwal Ujian Saya' : 'Jadwal Mengajar Saya'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('bap')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              currentSubView === 'bap'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Berita Acara (BAP)</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SUBVIEW 1: JADWAL SAYA & PESERTA SESI                      */}
      {/* ========================================================== */}
      {currentSubView === 'jadwal' && (
        <div className="space-y-6">
          {/* Sesi Selector Tabs */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <span>Daftar Sesi yang Anda {isPenguji ? 'Uji' : 'Ampu'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSessions.map(({ session, training }) => {
                const isSelected = session.id === selectedSessionId;
                const hadirCount = presences.filter((p) => p.sessionId === session.id && p.status === 'HADIR').length;
                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? isPenguji 
                          ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                          : 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        session.mode === 'Daring' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {session.mode} • {session.jp} JP
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">{session.date}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 line-clamp-2">
                      {session.sessionTitle}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {training.title}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {session.startTime} - {session.endTime} WIB
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {hadirCount} Hadir
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sesi Detail & Peserta Aktif */}
          {activeSession && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {activeTraining.title}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {activeSession.date} ({activeSession.startTime} - {activeSession.endTime} WIB)
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {activeSession.sessionTitle}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {activeSession.locationName}
                    </span>
                    <span>•</span>
                    <span>Beban: {activeSession.jp} Jam Pelajaran (JP)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToEvaluation(activeSession.id)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Beri Nilai Peserta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView('bap')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lihat Berita Acara (BAP)</span>
                  </button>
                </div>
              </div>

              {/* Berkas Lampiran Jadwal (PDF/Excel) yang diunggah Admin */}
              {activeTraining.attachments && activeTraining.attachments.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Dokumen Lampiran Jadwal Resmi (Penyelenggara)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeTraining.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs flex items-center gap-2 shadow-2xs"
                      >
                        {att.fileType === 'pdf' ? (
                          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800 truncate max-w-[200px]">{att.fileName}</div>
                          <div className="text-[10px] text-slate-400">{att.fileSize} • {att.uploadedAt}</div>
                        </div>
                        {att.dataUrl && (
                          <a
                            href={att.dataUrl}
                            download={att.fileName}
                            className="ml-2 text-blue-700 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="Unduh Berkas"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daftar Peserta di Kelas Ini */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Daftar Peserta Pelatihan ({enrolledParticipants.length} ASN)</span>
                  </h3>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {hadirPresences.length} dari {enrolledParticipants.length} Hadir Terverifikasi
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">No</th>
                        <th className="px-3.5 py-2.5">Nama Peserta</th>
                        <th className="px-3.5 py-2.5">NIP</th>
                        <th className="px-3.5 py-2.5">Instansi / Unit Kerja</th>
                        <th className="px-3.5 py-2.5 text-center">Status Presensi</th>
                        <th className="px-3.5 py-2.5 text-center">Status Penilaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrolledParticipants.map((p, idx) => {
                        const presence = sessionPresences.find((pr) => pr.userId === p.id);
                        const isHadir = presence?.status === 'HADIR';
                        const isEvaluated = evaluationsParticipant.some(
                          (ev) => ev.sessionId === activeSession.id && ev.pesertaId === p.id && ev.evaluatorId === currentUser.id
                        );

                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-3.5 py-2.5 text-slate-500">{idx + 1}</td>
                            <td className="px-3.5 py-2.5 font-bold text-slate-900">{p.name}</td>
                            <td className="px-3.5 py-2.5 text-slate-600 font-mono">{p.nip}</td>
                            <td className="px-3.5 py-2.5 text-slate-600">{p.instansi}</td>
                            <td className="px-3.5 py-2.5 text-center">
                              {isHadir ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> HADIR
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                                  Belum Presensi
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              {isEvaluated ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  ✓ Sudah Dinilai
                                </span>
                              ) : isHadir ? (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToEvaluation(activeSession.id)}
                                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-md border border-indigo-200 cursor-pointer"
                                >
                                  Beri Nilai →
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* SUBVIEW 2: BERITA ACARA (BAP) KHUSUS PENGAJAR / PENGUJI   */}
      {/* ========================================================== */}
      {currentSubView === 'bap' && activeSession && (
        <div className="space-y-6">
          {/* Info Banner BAP */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pengesahan Dokumen Resmi Sesi
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Berita Acara {isPenguji ? 'Seminar / Ujian' : 'Pembelajaran'} (BAP)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sesi: <span className="font-semibold text-slate-800">{activeSession.sessionTitle}</span> ({activeSession.date})
                </p>
              </div>

              {/* Status Gatekeeper */}
              <div className="flex items-center gap-3">
                {bapGatekeeper.allowed ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div>Gatekeeping Terpenuhi</div>
                      <div className="text-[11px] font-normal text-emerald-700">
                        Seluruh peserta hadir telah dinilai. BAP siap disahkan.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-bold">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div>Gatekeeping Aktif</div>
                      <div className="text-[11px] font-normal text-amber-800">
                        {bapGatekeeper.reason}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistik Kehadiran Sesi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-bold uppercase">Total Peserta Kelas</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{enrolledParticipants.length} ASN</div>
              </div>
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                <div className="text-[11px] text-emerald-700 font-bold uppercase">Peserta HADIR Terverifikasi</div>
                <div className="text-xl font-extrabold text-emerald-900 mt-0.5">{hadirPresences.length} Orang</div>
              </div>
              <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200">
                <div className="text-[11px] text-indigo-700 font-bold uppercase">Nilai Sikap Tersimpan</div>
                <div className="text-xl font-extrabold text-indigo-900 mt-0.5">
                  {evaluationsParticipant.filter((ev) => ev.sessionId === activeSession.id).length} Selesai
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadBAP}
                disabled={!bapGatekeeper.allowed}
                className={`px-5 py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  bapGatekeeper.allowed
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Cetak & Unduh BAP Resmi (PDF ber-QR Code)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPresencePDF}
                className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Unduh Lembar Presensi Sesi (PDF)</span>
              </button>

              {!bapGatekeeper.allowed && (
                <button
                  type="button"
                  onClick={() => onNavigateToEvaluation(activeSession.id)}
                  className="px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Lengkapi Penilaian Peserta Sekarang →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
