import React, { useState, useRef } from 'react';
import { Training, TrainingSession, User, ScheduleAttachment } from '../types';
import { 
  downloadScheduleExcelTemplate, 
  exportScheduleExcel, 
  generateSchedulePDF, 
  parseExcelScheduleFile 
} from '../utils/exportHelper';
import { 
  Calendar, 
  Clock, 
  Plus, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Check, 
  Trash2, 
  MapPin, 
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  X,
  FileUp,
  ArrowRight,
  HelpCircle,
  Info
} from 'lucide-react';

interface ScheduleManagerProps {
  trainings: Training[];
  allUsers: User[];
  onAddTraining?: (training: Training) => void;
  onAddSession?: (trainingId: string, session: TrainingSession) => void;
  onDeleteSession?: (trainingId: string, sessionId: string) => void;
  onUploadScheduleAttachment?: (trainingId: string, attachment: ScheduleAttachment) => void;
  onDeleteScheduleAttachment?: (trainingId: string, attachmentId: string) => void;
  onImportSessions?: (trainingId: string, sessions: TrainingSession[]) => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  trainings,
  allUsers,
  onAddTraining,
  onAddSession,
  onDeleteSession,
  onUploadScheduleAttachment,
  onDeleteScheduleAttachment,
  onImportSessions
}) => {
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(trainings[0]?.id || '');
  const activeTraining = trainings.find((t) => t.id === selectedTrainingId) || trainings[0];

  // Filter view: all | pengajar | penguji
  const [filterType, setFilterType] = useState<'all' | 'pengajar' | 'penguji'>('all');

  // Form Accordion State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isNewProgramModalOpen, setIsNewProgramModalOpen] = useState<boolean>(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'excel' | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileDescription, setFileDescription] = useState<string>('');
  const [parsedExcelSessions, setParsedExcelSessions] = useState<Partial<TrainingSession>[] | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');

  // PDF Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState<ScheduleAttachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State untuk Tambah Sesi Manual
  const [sessionType, setSessionType] = useState<'pengajar' | 'penguji'>('pengajar');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [customTeacherName, setCustomTeacherName] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>('2026-09-12');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('11:30');
  const [jp, setJp] = useState<number>(4);
  const [mode, setMode] = useState<'Luring' | 'Daring'>('Luring');
  const [locationName, setLocationName] = useState<string>('Gedung BPSDM Lt. 3, Ruang Pusdiklat 1');

  // Peserta terdaftar
  const pesertaList = allUsers.filter((u) => u.role === 'peserta');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    pesertaList.map((p) => p.id) // Default semua peserta terpilih
  );

  // Filter daftar pengajar & penguji
  const pengajarList = allUsers.filter((u) => u.role === 'pengajar');
  const pengujiList = allUsers.filter((u) => u.role === 'penguji');

  // New Program Form State
  const [newProgramTitle, setNewProgramTitle] = useState<string>('');
  const [newProgramCode, setNewProgramCode] = useState<string>('PTP-2026-02');
  const [newProgramBatch, setNewProgramBatch] = useState<string>('Angkatan II (Tahun 2026)');

  // Quick preset title generator
  const applyPresetTitle = (title: string, type: 'pengajar' | 'penguji', defaultJp: number) => {
    setSessionTitle(title);
    setSessionType(type);
    setJp(defaultJp);
  };

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllParticipants = () => {
    setSelectedParticipantIds(pesertaList.map((p) => p.id));
  };

  const handleClearParticipants = () => {
    setSelectedParticipantIds([]);
  };

  // Submit Tambah Sesi Manual
  const handleSubmitSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTraining || !sessionTitle.trim()) {
      alert('Mohon lengkapi judul sesi pelatihan.');
      return;
    }

    if (selectedParticipantIds.length === 0) {
      alert('Pilih minimal 1 orang peserta untuk mengikuti sesi ini.');
      return;
    }

    let teacherName = customTeacherName;
    let teacherId = selectedTeacherId;

    if (sessionType === 'pengajar') {
      const found = pengajarList.find((p) => p.id === selectedTeacherId);
      if (found) {
        teacherName = found.name;
        teacherId = found.id;
      } else if (!teacherName) {
        teacherName = 'Dra. Hj. Siti Rahmah, M.M.';
        teacherId = 'user-pengajar-1';
      }
    } else {
      const found = pengujiList.find((p) => p.id === selectedTeacherId);
      if (found) {
        teacherName = found.name;
        teacherId = found.id;
      } else if (!teacherName) {
        teacherName = 'Dr. Ir. Achmad Fauzi, M.Eng.';
        teacherId = 'user-penguji-1';
      }
    }

    const newSession: TrainingSession = {
      id: `SES-${Date.now().toString(36).toUpperCase()}`,
      trainingId: activeTraining.id,
      trainingName: activeTraining.title,
      sessionTitle: sessionTitle.trim(),
      sessionType: sessionType,
      date: sessionDate,
      startTime,
      endTime,
      jp,
      mode,
      pengajarId: teacherId || 'user-pengajar-1',
      pengajarName: teacherName || 'Dra. Hj. Siti Rahmah, M.M.',
      pengujiId: sessionType === 'penguji' ? teacherId : undefined,
      pengujiName: sessionType === 'penguji' ? teacherName : undefined,
      locationName,
      participantIds: selectedParticipantIds,
      targetLat: -6.2088,
      targetLng: 106.8456,
      maxRadiusMeters: 200,
      status: 'Akan Datang'
    };

    if (onAddSession) {
      onAddSession(activeTraining.id, newSession);
    }

    // Reset Form
    setSessionTitle('');
    setIsFormOpen(false);
  };

  // Submit Program Baru
  const handleCreateNewProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramTitle.trim()) return;

    const newProg: Training = {
      id: `TRN-${Date.now().toString(36).toUpperCase()}`,
      title: newProgramTitle.trim(),
      code: newProgramCode.trim() || `TRN-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Pelatihan Fungsional',
      batch: newProgramBatch.trim(),
      startDate: '2026-09-15',
      endDate: '2026-09-20',
      totalJp: 12,
      penyelenggara: 'Pusdiklat Pegawai ASN Kemendikbudristek',
      participantIds: pesertaList.map((p) => p.id),
      sessions: [],
      attachments: []
    };

    if (onAddTraining) {
      onAddTraining(newProg);
    }

    setSelectedTrainingId(newProg.id);
    setIsNewProgramModalOpen(false);
    setNewProgramTitle('');
    setIsFormOpen(true);
  };

  // Process Selected File (PDF or Excel)
  const processFile = async (file: File) => {
    setParseError('');
    setSelectedFile(file);
    setParsedExcelSessions(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isExcel = 
      file.name.toLowerCase().endsWith('.xlsx') || 
      file.name.toLowerCase().endsWith('.xls') || 
      file.name.toLowerCase().endsWith('.csv') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel');

    if (!isPdf && !isExcel) {
      setParseError('Format file tidak didukung. Mohon unggah file berekstensi PDF (.pdf) atau Excel (.xlsx, .xls, .csv).');
      setSelectedFile(null);
      setFileType(null);
      return;
    }

    const detectedType = isPdf ? 'pdf' : 'excel';
    setFileType(detectedType);

    // Read Data URL for preview / storage
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // If Excel, parse table rows
    if (isExcel) {
      setIsParsingExcel(true);
      try {
        const result = await parseExcelScheduleFile(file);
        setParsedExcelSessions(result.sessions);
      } catch (err: any) {
        setParseError(err?.message || 'Gagal memproses file Excel. Pastikan format tabel sesuai.');
      } finally {
        setIsParsingExcel(false);
      }
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Save Uploaded Attachment (with optional session import)
  const handleSaveUpload = (importSessionsToSystem: boolean = false) => {
    if (!selectedFile || !fileType || !activeTraining) return;

    const formattedSize = selectedFile.size > 1024 * 1024 
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(selectedFile.size / 1024)} KB`;

    const newAttachment: ScheduleAttachment = {
      id: `ATT-${Date.now().toString(36).toUpperCase()}`,
      trainingId: activeTraining.id,
      fileName: selectedFile.name,
      fileType: fileType,
      fileSize: formattedSize,
      uploadedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      dataUrl: fileDataUrl,
      description: fileDescription.trim() || (fileType === 'pdf' ? 'Dokumen Jadwal Resmi (PDF)' : 'Worksheet Jadwal Excel'),
      parsedSessionsCount: parsedExcelSessions ? parsedExcelSessions.length : undefined
    };

    // If admin chose to import parsed sessions into the active training
    if (importSessionsToSystem && parsedExcelSessions && parsedExcelSessions.length > 0 && onImportSessions) {
      const formattedSessions: TrainingSession[] = parsedExcelSessions.map((ps, idx) => {
        const assignedParticipants = activeTraining.participantIds && activeTraining.participantIds.length > 0
          ? activeTraining.participantIds
          : pesertaList.map((p) => p.id);

        return {
          id: ps.id || `SES-IMP-${Date.now().toString(36)}-${idx + 1}`,
          trainingId: activeTraining.id,
          trainingName: activeTraining.title,
          sessionTitle: ps.sessionTitle || `Sesi Pembelajaran Ke-${idx + 1}`,
          sessionType: ps.sessionType || 'pengajar',
          date: ps.date || '2026-09-12',
          startTime: ps.startTime || '08:00',
          endTime: ps.endTime || '11:30',
          jp: ps.jp || 4,
          mode: ps.mode || 'Luring',
          locationName: ps.locationName || 'Gedung BPSDM Lt. 3, Ruang Pusdiklat 1',
          targetLat: -6.2088,
          targetLng: 106.8456,
          maxRadiusMeters: 250,
          pengajarId: 'user-pengajar-1',
          pengajarName: ps.pengajarName || 'Dra. Hj. Siti Rahmah, M.M.',
          pengujiId: ps.sessionType === 'penguji' ? 'user-penguji-1' : undefined,
          pengujiName: ps.sessionType === 'penguji' ? (ps.pengujiName || 'Dr. Ir. Achmad Fauzi, M.Eng.') : undefined,
          participantIds: assignedParticipants,
          status: 'Akan Datang'
        };
      });

      onImportSessions(activeTraining.id, formattedSessions);
    }

    if (onUploadScheduleAttachment) {
      onUploadScheduleAttachment(activeTraining.id, newAttachment);
    }

    setUploadSuccessMessage(`Berkas "${selectedFile.name}" berhasil diunggah${importSessionsToSystem ? ' dan seluruh sesi berhasil diimpor ke jadwal' : ''}!`);
    setTimeout(() => setUploadSuccessMessage(''), 4000);

    // Reset Modal State
    setSelectedFile(null);
    setFileType(null);
    setFileDataUrl('');
    setFileDescription('');
    setParsedExcelSessions(null);
    setIsUploadModalOpen(false);
  };

  // Filter Sessions
  const filteredSessions = activeTraining?.sessions.filter((ses) => {
    if (filterType === 'all') return true;
    return ses.sessionType === filterType;
  }) || [];

  const attachments = activeTraining?.attachments || [];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Kelola Jadwal & Sesi Pelatihan ASN
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Unggah berkas jadwal dalam format PDF atau Excel, import sesi secara otomatis, dan kelola penugasan pengajar & penguji.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Unggah File Jadwal (PDF & Excel) */}
          <button
            type="button"
            onClick={() => {
              setIsUploadModalOpen(true);
              setParseError('');
              setSelectedFile(null);
              setParsedExcelSessions(null);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Jadwal (PDF / Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewProgramModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            + Buat Program
          </button>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isFormOpen ? 'Tutup Form' : '+ Input Manual'}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {uploadSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{uploadSuccessMessage}</span>
        </div>
      )}

      {/* Program Selector, Filter Bar & Quick Export */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Pilih Program Pelatihan Aktif:
          </label>
          <select
            value={selectedTrainingId}
            onChange={(e) => setSelectedTrainingId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {trainings.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.code}] {t.title} ({t.batch}) • {t.sessions.length} Sesi
              </option>
            ))}
          </select>
        </div>

        {/* Quick Export Tools for the Active Schedule */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
          <button
            type="button"
            onClick={() => exportScheduleExcel(activeTraining)}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Download jadwal sesi dalam format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => generateSchedulePDF(activeTraining)}
            className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Download jadwal resmi berformat PDF berstempel instansi"
          >
            <FileText className="w-3.5 h-3.5 text-rose-700" />
            <span>Cetak PDF</span>
          </button>

          <button
            type="button"
            onClick={downloadScheduleExcelTemplate}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Download contoh template Excel kosong untuk diisi dan diunggah"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Template Excel</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: BERKAS DOKUMEN JADWAL RESMI (PDF & EXCEL)         */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] flex items-center justify-center font-bold">
                📎
              </span>
              Berkas Lampiran Dokumen Jadwal Resmi (PDF & Excel)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Berkas resmi yang diunggah dapat dilihat dan diunduh oleh Pengajar, Penguji, dan Peserta Pelatihan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsUploadModalOpen(true);
              setParseError('');
              setSelectedFile(null);
              setParsedExcelSessions(null);
            }}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <Upload className="w-3.5 h-3.5" />
            + Unggah Berkas Baru
          </button>
        </div>

        {attachments.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-4">
            <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-700">Belum Ada Berkas Jadwal yang Diunggah</div>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
              Admin dapat mengunggah SK Jadwal berformat PDF atau berkas tabel jadwal yang dibuat dalam bentuk Microsoft Excel (.xlsx).
            </p>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Unggah File Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attachments.map((att) => {
              const isPdf = att.fileType === 'pdf';
              return (
                <div
                  key={att.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 flex items-start justify-between gap-3 group transition-all"
                >
                  <div className="flex items-start gap-3 truncate">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isPdf ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isPdf ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {att.fileName}
                        </span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                          isPdf 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {att.fileType}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {att.description || 'Berkas Dokumen Jadwal'}
                      </p>

                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Ukuran: {att.fileSize}</span>
                        <span>•</span>
                        <span>Diunggah: {att.uploadedAt}</span>
                        {att.parsedSessionsCount !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">
                              {att.parsedSessionsCount} Sesi Terbaca
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Tinjau / Preview Dokumen PDF"
                      >
                        <Eye className="w-4 h-4 text-blue-700" />
                      </button>
                    )}

                    <a
                      href={att.dataUrl || '#'}
                      download={att.fileName}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Download Berkas"
                      onClick={(e) => {
                        if (!att.dataUrl) {
                          e.preventDefault();
                          if (isPdf) {
                            generateSchedulePDF(activeTraining);
                          } else {
                            exportScheduleExcel(activeTraining);
                          }
                        }
                      }}
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                    </a>

                    {onDeleteScheduleAttachment && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus lampiran "${att.fileName}"?`)) {
                            onDeleteScheduleAttachment(activeTraining.id, att.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Lampiran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion Form: Input Jadwal Sesi Manual */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitSession}
          className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-blue-500/30 shadow-md space-y-5 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">
                  +
                </span>
                Formulir Input Jadwal Sesi Pelatihan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tambahkan sesi ke dalam program: <strong className="text-slate-800">{activeTraining?.title}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Batal / Tutup
            </button>
          </div>

          {/* STEP 1: PILIHAN APAKAH JADWAL PENGAJAR ATAU JADWAL PENGUJI */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Pilih Jenis Jadwal Sesi:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => {
                  setSessionType('pengajar');
                  if (!sessionTitle) setSessionTitle('Pembelajaran Multimedia & Desain Andragogi');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  sessionType === 'pengajar'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${sessionType === 'pengajar' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Jadwal Pengajar (Widyaiswara)
                    {sessionType === 'pengajar' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Sesi materi teori, studi kasus, atau workshop praktikum yang diampu oleh Widyaiswara / Fasilitator.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  setSessionType('penguji');
                  if (!sessionTitle) setSessionTitle('Seminar Rancangan Aksi Perubahan & Ujian Akhir');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  sessionType === 'penguji'
                    ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${sessionType === 'penguji' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Jadwal Penguji (Seminar / Ujian)
                    {sessionType === 'penguji' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Sesi ujian komprehensif, seminar rancangan proyek perubahan, atau evaluasi kelulusan akhir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: DETAIL SESI & WAKTU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">
                Judul Sesi / Mata Pelatihan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Contoh: Penguatan Integritas & Nilai-Nilai Dasar ASN BerAKHLAK"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tanggal Pelaksanaan</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jam Mulai</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jam Selesai</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">
                {sessionType === 'pengajar' ? 'Pilih Pengajar / Widyaiswara' : 'Pilih Penguji Seminar'}
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-medium"
              >
                <option value="">-- Pilih dari Daftar Aparatur --</option>
                {(sessionType === 'pengajar' ? pengajarList : pengujiList).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.jabatan})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Ruangan / Tempat</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Mode Pembelajaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('Luring')}
                  className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    mode === 'Luring'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🏢 Tatap Muka (Luring)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('Daring')}
                  className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    mode === 'Daring'
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  💻 Daring (Zoom)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Beban Jam Pelajaran (JP)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={jp}
                onChange={(e) => setJp(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* STEP 3: PESERTA YANG MENGIKUTI */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Pilih Peserta yang Mengikuti Sesi Ini ({selectedParticipantIds.length} dari {pesertaList.length} Terpilih):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllParticipants}
                  className="text-[11px] text-blue-700 hover:underline font-bold cursor-pointer"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearParticipants}
                  className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {pesertaList.map((p) => {
                const isChecked = selectedParticipantIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    onClick={() => handleToggleParticipant(p.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="truncate">
                      <div className="text-xs truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.nip}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Simpan Jadwal Sesi
            </button>
          </div>
        </form>
      )}

      {/* FILTER VIEW: SEMUA | PENGAJAR | PENGUJI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar Sesi Pelatihan Terdaftar ({filteredSessions.length}):
          </h3>
          <span className="text-[11px] text-slate-500">
            • Total Beban: {activeTraining?.sessions.reduce((acc, s) => acc + s.jp, 0) || 0} JP
          </span>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({activeTraining?.sessions.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pengajar')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'pengajar'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Pengajar ({activeTraining?.sessions.filter((s) => s.sessionType === 'pengajar').length || 0})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('penguji')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'penguji'
                ? 'bg-white text-purple-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            Penguji ({activeTraining?.sessions.filter((s) => s.sessionType === 'penguji').length || 0})
          </button>
        </div>
      </div>

      {/* SESSIONS CARDS LIST */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-xs text-slate-500">
            Belum ada jadwal sesi yang terdaftar untuk filter ini.
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Upload dari Excel / PDF
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Input Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSessions.map((ses) => {
            const isPenguji = ses.sessionType === 'penguji';
            const enrolledPeserta = allUsers.filter(
              (u) => u.role === 'peserta' && ses.participantIds?.includes(u.id)
            );

            return (
              <div
                key={ses.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative"
              >
                <div className="space-y-2">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                      isPenguji
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {isPenguji ? '🎓 Jadwal Penguji' : '📘 Jadwal Pengajar'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        ses.mode === 'Luring' ? 'bg-slate-100 text-slate-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {ses.mode}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ses.jp} JP
                      </span>
                    </div>
                  </div>

                  {/* Sesi Title */}
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {ses.sessionTitle}
                  </h4>

                  {/* Fasilitator / Penguji */}
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
                    {isPenguji ? (
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                    <span className="truncate">
                      {isPenguji
                        ? `Penguji: ${ses.pengujiName || '-'}`
                        : `Pengajar: ${ses.pengajarName || '-'}`}
                    </span>
                  </div>

                  {/* Tanggal & Waktu */}
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ses.date} • {ses.startTime} - {ses.endTime} WIB</span>
                  </div>

                  {/* Ruangan */}
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ses.locationName}</span>
                  </div>

                  {/* Peserta yang Mengikuti */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Peserta Mengikuti ({enrolledPeserta.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {enrolledPeserta.map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium truncate max-w-[120px]"
                          title={p.name}
                        >
                          {p.name.split(',')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                {onDeleteSession && (
                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus sesi "${ses.sessionTitle}" dari jadwal?`)) {
                          onDeleteSession(activeTraining.id, ses.id);
                        }
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus Sesi
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UNGGAH BERKAS JADWAL (PDF & EXCEL .XLSX / .CSV)     */}
      {/* ========================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-700" />
                  Unggah Berkas Jadwal Pelatihan (PDF & Excel)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Program: <strong className="text-slate-800">{activeTraining?.title}</strong> ({activeTraining?.code})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Panduan Format File */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <FileText className="w-4 h-4" />
                  Format PDF (.pdf)
                </div>
                <p className="text-[11px] text-rose-900/80 leading-relaxed">
                  Untuk dokumen SK jadwal resmi, matriks stempel, atau berkas panduan siap baca dan siap cetak.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <FileSpreadsheet className="w-4 h-4" />
                  Format Excel (.xlsx, .xls, .csv)
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  Tabel matriks jadwal yang dibuat di Microsoft Excel dapat dibaca dan <strong>diimpor otomatis</strong> menjadi sesi pelatihan aktif.
                </p>
              </div>
            </div>

            {/* Dropzone Upload */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-600 bg-emerald-50 ring-4 ring-emerald-500/20'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf, .xlsx, .xls, .csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <FileUp className="w-6 h-6" />
              </div>

              <div className="text-xs font-bold text-slate-800">
                Tarik & Lepaskan Berkas PDF atau Excel ke Sini
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Atau klik area ini untuk memilih berkas dari komputer Anda
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                Mendukung berkas: .PDF, .XLSX, .XLS, .CSV (Maksimal 15 MB)
              </div>
            </div>

            {/* Download Template Excel Link */}
            <div className="flex items-center justify-between text-xs px-1 text-slate-500">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Belum memiliki format Excel yang pas?
              </span>
              <button
                type="button"
                onClick={downloadScheduleExcelTemplate}
                className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Template Excel Jadwal Resmi
              </button>
            </div>

            {/* Error Message */}
            {parseError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Selected File Details */}
            {selectedFile && (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${
                      fileType === 'pdf' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {fileType === 'pdf' ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{selectedFile.name}</div>
                      <div className="text-[10px] text-slate-500">
                        Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB • Tipe: {fileType?.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileType(null);
                      setParsedExcelSessions(null);
                    }}
                    className="text-slate-400 hover:text-rose-600 text-xs p-1"
                  >
                    Ganti
                  </button>
                </div>

                {/* Deskripsi Berkas Opsional */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Keterangan / Catatan Berkas (Opsional):
                  </label>
                  <input
                    type="text"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="Contoh: Matriks Jadwal Pembelajaran Revisi I BPSDM"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>

                {/* Loading state parsing Excel */}
                {isParsingExcel && (
                  <div className="text-xs text-slate-500 py-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin"></span>
                    Membaca struktur tabel Excel...
                  </div>
                )}

                {/* Tinjauan Baris Hasil Parsing Excel */}
                {parsedExcelSessions && parsedExcelSessions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Tinjauan Data Excel ({parsedExcelSessions.length} Sesi Terbaca):
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Siap Diimpor
                      </span>
                    </div>

                    <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 text-[11px]">
                      {parsedExcelSessions.map((ses, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                          <div className="truncate">
                            <div className="font-bold text-slate-800 truncate">
                              {idx + 1}. {ses.sessionTitle}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {ses.date} • {ses.startTime} - {ses.endTime} ({ses.jp} JP) • {ses.pengajarName}
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                            ses.sessionType === 'penguji' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ses.sessionType === 'penguji' ? 'Penguji' : 'Pengajar'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>

              {/* Action for PDF File */}
              {selectedFile && fileType === 'pdf' && (
                <button
                  type="button"
                  onClick={() => handleSaveUpload(false)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Simpan & Lampirkan PDF</span>
                </button>
              )}

              {/* Actions for Excel File */}
              {selectedFile && fileType === 'excel' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveUpload(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Simpan Berkas Saja
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveUpload(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Simpan & Import {parsedExcelSessions?.length || 0} Sesi ke Jadwal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PREVIEW BERKAS PDF JADWAL                           */}
      {/* ========================================================= */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{previewAttachment.fileName}</h4>
                  <p className="text-[11px] text-slate-500">
                    Ukuran: {previewAttachment.fileSize} • Diunggah: {previewAttachment.uploadedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.dataUrl || '#'}
                  download={previewAttachment.fileName}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  onClick={(e) => {
                    if (!previewAttachment.dataUrl) {
                      e.preventDefault();
                      generateSchedulePDF(activeTraining);
                    }
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh PDF
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Viewer Container */}
            <div className="flex-1 min-h-[350px] bg-slate-100 rounded-2xl border border-slate-200 p-2 overflow-hidden flex flex-col">
              {previewAttachment.dataUrl ? (
                <iframe
                  src={previewAttachment.dataUrl}
                  title="PDF Viewer"
                  className="w-full flex-1 rounded-xl bg-white border border-slate-200 min-h-[350px]"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white rounded-xl">
                  <FileText className="w-12 h-12 text-rose-500" />
                  <div className="text-sm font-bold text-slate-900">{previewAttachment.fileName}</div>
                  <p className="text-xs text-slate-500 max-w-md">
                    Dokumen jadwal resmi berformat PDF. Anda dapat langsung mengunduh dan mencetak berkas ini.
                  </p>
                  <button
                    type="button"
                    onClick={() => generateSchedulePDF(activeTraining)}
                    className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    Unduh & Buka Dokumen PDF Resmi
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>SIPEKA • Sistem Informasi Presensi & Evaluasi Diklat ASN</span>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="font-bold text-slate-700 hover:underline cursor-pointer"
              >
                Tutup Tinjauan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buat Program Pelatihan Baru */}
      {isNewProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleCreateNewProgram}
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Buat Program Pelatihan Baru</h4>
              <button
                type="button"
                onClick={() => setIsNewProgramModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama / Judul Program Pelatihan</label>
                <input
                  type="text"
                  required
                  value={newProgramTitle}
                  onChange={(e) => setNewProgramTitle(e.target.value)}
                  placeholder="Contoh: Pelatihan Teknis Pembelajaran Digital ASN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kode Diklat</label>
                  <input
                    type="text"
                    value={newProgramCode}
                    onChange={(e) => setNewProgramCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Angkatan</label>
                  <input
                    type="text"
                    value={newProgramBatch}
                    onChange={(e) => setNewProgramBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewProgramModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold cursor-pointer"
              >
                Buat Program
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
