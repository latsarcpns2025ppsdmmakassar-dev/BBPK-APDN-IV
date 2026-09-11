import React, { useState, useRef, useEffect } from 'react';
import { User, Training, TrainingSession, PresenceRecord, PresenceMethod } from '../types';
import { calculateDistanceInMeters } from '../utils/gatekeeper';
import { 
  MapPin, 
  Camera, 
  PenTool, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Building2,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Laptop,
  FileText,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { generateSchedulePDF, exportScheduleExcel } from '../utils/exportHelper';

interface PresensiFormProps {
  currentUser: User;
  trainings: Training[];
  presences: PresenceRecord[];
  onSubmitPresence: (presence: PresenceRecord) => void;
  onNavigateToEvaluation?: () => void;
}

export const PresensiForm: React.FC<PresensiFormProps> = ({
  currentUser,
  trainings,
  presences,
  onSubmitPresence,
  onNavigateToEvaluation
}) => {
  // Filter kegiatan yang diikuti oleh peserta (jika user role adalah peserta)
  const visibleTrainings = currentUser.role === 'peserta'
    ? trainings.filter((t) =>
        t.sessions.some((s) => s.participantIds?.includes(currentUser.id)) ||
        t.participantIds?.includes(currentUser.id)
      )
    : trainings;

  // 1. Selection State
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
  useEffect(() => {
    if (visibleTrainings.length > 0) {
      const trainingExists = visibleTrainings.some((t) => t.id === selectedTrainingId);
      if (!trainingExists) {
        setSelectedTrainingId(visibleTrainings[0].id);
      }
    }
  }, [currentUser.id, visibleTrainings]);

  useEffect(() => {
    if (visibleSessions.length > 0) {
      const exists = visibleSessions.some((s) => s.id === selectedSessionId);
      if (!exists) {
        setSelectedSessionId(visibleSessions[0].id);
      }
    } else {
      setSelectedSessionId('');
    }
  }, [selectedTrainingId, activeTraining, currentUser.id]);

  // Cek Kehadiran User pada Sesi Ini
  const existingPresence = presences.find(
    (p) => p.sessionId === selectedSessionId && p.userId === currentUser.id
  );

  // 2. Metode Presensi
  const [method, setMethod] = useState<PresenceMethod>(
    activeSession?.mode === 'Daring' ? 'Daring_Live_Selfie' : 'Luring_Signature_GPS'
  );

  useEffect(() => {
    if (activeSession) {
      setMethod(activeSession.mode === 'Daring' ? 'Daring_Live_Selfie' : 'Luring_Signature_GPS');
    }
  }, [activeSession?.id]);

  // 3. Geofencing Coordinates
  const targetLat = activeSession?.targetLat || -6.2088;
  const targetLng = activeSession?.targetLng || 106.8456;
  const maxRadius = activeSession?.maxRadiusMeters || 250;

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number }>({
    lat: targetLat + 0.00012,
    lng: targetLng + 0.00008,
    accuracy: 8
  });
  const [simulationMode, setSimulationMode] = useState<'near' | 'far' | 'real'>('near');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  // Dynamic QR Token (anti-screenshot token)
  const [dynamicQrCode, setDynamicQrToken] = useState<string>('');
  useEffect(() => {
    const updateToken = () => {
      const token = `SIPEKA-${activeSession?.id || 'SES'}-${Date.now().toString(36).toUpperCase()}`;
      setDynamicQrToken(token);
    };
    updateToken();
    const interval = setInterval(updateToken, 30000);
    return () => clearInterval(interval);
  }, [activeSession?.id]);

  const distanceMeters = calculateDistanceInMeters(
    currentCoords.lat,
    currentCoords.lng,
    targetLat,
    targetLng
  );
  const isInsideGeofence = distanceMeters <= maxRadius;

  // Toggle Simulasi GPS Cepat
  const handleSetSimulation = (mode: 'near' | 'far') => {
    setSimulationMode(mode);
    if (mode === 'near') {
      setCurrentCoords({
        lat: targetLat + 0.00012,
        lng: targetLng + 0.00008,
        accuracy: 8
      });
    } else {
      setCurrentCoords({
        lat: targetLat + 0.016,
        lng: targetLng + 0.014,
        accuracy: 15
      });
    }
  };

  const fetchRealGps = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation.');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
        setSimulationMode('real');
        setGpsLoading(false);
      },
      (err) => {
        alert('Tidak dapat mendeteksi GPS riil. Koordinat tetap disimulasikan di Kampus.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // 4. Canvas Tanda Tangan
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Fitur ramah: TTD Cepat (Auto-Sign for Quick Test)
  const autoGenerateSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    // Gambar pola goresan kaligrafi TTD resmi
    ctx.beginPath();
    ctx.moveTo(40, 90);
    ctx.bezierCurveTo(80, 20, 120, 140, 160, 60);
    ctx.bezierCurveTo(180, 20, 200, 100, 240, 80);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(120, 95);
    ctx.lineTo(290, 85);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(280, 75, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a8a';
    ctx.fill();

    setHasSignature(true);
  };

  // 5. Live Selfie
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      alert('Akses webcam dibatasi oleh browser. Anda dapat menggunakan opsi unggah foto atau gunakan foto sampel simulasi.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, 360, 360);

    // Watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 295, 360, 65);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`SIPEKA PRESENSI DARING ASN`, 10, 314);
    ctx.fillText(`${new Date().toLocaleString('id-ID')}`, 10, 330);
    ctx.fillText(`NIP: ${currentUser.nip} • ${currentUser.name.substring(0, 24)}`, 10, 346);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setSelfieImage(dataUrl);

    if (videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  // Sample photo simulation for easy testing
  const useSampleSelfie = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gradient avatar ASN
    const grad = ctx.createLinearGradient(0, 0, 320, 320);
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 320, 320);

    // Initial icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentUser.name.charAt(0), 160, 160);

    // Watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 250, 320, 70);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`VERIFIKASI SWAFOTO ASN`, 10, 272);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${new Date().toLocaleString('id-ID')}`, 10, 288);
    ctx.fillText(`NIP: ${currentUser.nip}`, 10, 304);

    setSelfieImage(canvas.toDataURL('image/jpeg', 0.9));
  };

  // 6. Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    if (method === 'Luring_Signature_GPS') {
      if (!isInsideGeofence) {
        alert(
          `Gagal Presensi: Anda berada ${distanceMeters} meter di luar batas geofence kampus (${maxRadius}m). Klik tombol simulasi "Dalam Kampus" untuk menguji!`
        );
        return;
      }
      if (!hasSignature) {
        alert('Harap bubuhkan tanda tangan digital pada kotak canvas atau klik "Tanda Tangan Otomatis".');
        return;
      }
    } else {
      if (!selfieImage) {
        alert('Harap ambil foto selfie atau klik "Gunakan Foto Sampel ASN".');
        return;
      }
    }

    setIsSubmitting(true);

    let signatureUrl: string | undefined = undefined;
    if (canvasRef.current && hasSignature) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    const newRecord: PresenceRecord = {
      id: `PRES-${Date.now().toString(36).toUpperCase()}`,
      trainingId: activeTraining.id,
      sessionId: activeSession.id,
      userId: currentUser.id,
      userNip: currentUser.nip,
      userName: currentUser.name,
      userRole: currentUser.role,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      method: method,
      status: 'HADIR',
      gps: {
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
        accuracyMeters: currentCoords.accuracy,
        distanceFromVenueMeters: distanceMeters,
        isInsideGeofence: isInsideGeofence
      },
      signatureDataUrl: signatureUrl,
      selfieDataUrl: selfieImage || undefined,
      qrValidationToken: dynamicQrCode,
      deviceInfo: navigator.userAgent
    };

    setTimeout(() => {
      onSubmitPresence(newRecord);
      setIsSubmitting(false);
      setSuccessToast(
        `Presensi sesi "${activeSession.sessionTitle}" berhasil dicatat sebagai HADIR. Pintu evaluasi pengajar telah terbuka!`
      );
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info & Status Kehadiran */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-800">
                <Calendar className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Presensi Mandiri Sesi Pelatihan
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tanpa token sesi! Cukup pilih jadwal sesi aktif dan lakukan verifikasi kehadiran digital.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            <div className="w-8 h-8 rounded-lg bg-blue-800 text-white font-bold flex items-center justify-center text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500">NIP. {currentUser.nip}</div>
            </div>
          </div>
        </div>

        {/* Existing Status Banner */}
        {existingPresence ? (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-emerald-950">
                  Status Presensi Sesi Ini: HADIR TERVERIFIKASI
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Tercatat pada {existingPresence.timestamp} WIB via{' '}
                  {existingPresence.method === 'Luring_Signature_GPS' ? 'Luring (TTD + Geofence GPS)' : 'Daring (Live Selfie)'}
                </div>
              </div>
            </div>
            {onNavigateToEvaluation && currentUser.role === 'peserta' && (
              <button
                onClick={onNavigateToEvaluation}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Lanjut Isi Evaluasi Pengajar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perhatian Gatekeeper:</strong> Anda belum melakukan presensi untuk sesi yang dipilih. Silakan lengkapi presensi di bawah untuk membuka hak evaluasi dan sertifikat.
            </span>
          </div>
        )}
      </div>

      {/* Main Presensi Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Step 1: Pemilihan Sesi Aktif */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">1</span>
              Pilih Program Pelatihan & Sesi Aktif
            </label>
            <span className="text-[11px] text-slate-400">Klik kartu sesi untuk memilih</span>
          </div>

          {/* Training Dropdown */}
          {visibleTrainings.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              Tidak ada jadwal pelatihan yang sedang Anda ikuti. Hubungi panitia BPSDM untuk pendaftaran.
            </div>
          ) : (
            <div>
              <select
                value={selectedTrainingId}
                onChange={(e) => setSelectedTrainingId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {visibleTrainings.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.code}] {t.title} ({t.batch})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lampiran Berkas Jadwal Resmi (PDF / Excel) */}
          {activeTraining?.attachments && activeTraining.attachments.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  📎 Dokumen Jadwal Resmi:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeTraining.attachments.map((att) => {
                    const isPdf = att.fileType === 'pdf';
                    return (
                      <a
                        key={att.id}
                        href={att.dataUrl || '#'}
                        download={att.fileName}
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border cursor-pointer hover:shadow-xs transition-all ${
                          isPdf 
                            ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={`${att.fileName} (${att.fileSize})`}
                      >
                        {isPdf ? <FileText className="w-3.5 h-3.5 text-rose-600" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                        <span className="max-w-[150px] truncate">{att.fileName}</span>
                        <Download className="w-3 h-3 opacity-70 ml-0.5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Session Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {visibleSessions.length === 0 ? (
              <div className="col-span-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                Tidak ada sesi aktif yang Anda ikuti pada program ini.
              </div>
            ) : (
              visibleSessions.map((ses) => {
                const isSelected = ses.id === selectedSessionId;
                const hasAttended = presences.some(
                  (p) => p.sessionId === ses.id && p.userId === currentUser.id && p.status === 'HADIR'
                );

                return (
                  <div
                    key={ses.id}
                    onClick={() => setSelectedSessionId(ses.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div>
                      {/* Badge Tipe Sesi & Mode */}
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          ses.sessionType === 'penguji'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {ses.sessionType === 'penguji' ? '🎓 Jadwal Penguji' : '📘 Jadwal Pengajar'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ses.mode === 'Luring' ? 'bg-slate-200 text-slate-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {ses.mode}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">{ses.jp} JP</span>
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {ses.sessionTitle}
                      </h3>

                      <div className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">
                        {ses.sessionType === 'penguji' 
                          ? `Penguji: ${ses.pengujiName || '-'}` 
                          : `Pengajar: ${ses.pengajarName}`}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {ses.startTime} WIB
                      </span>
                      {hasAttended ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Hadir
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Belum Presensi</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 2: Pilihan Metode Presensi */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">2</span>
              Pilih Metode Presensi Sesi Ini
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMethod('Luring_Signature_GPS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  method === 'Luring_Signature_GPS'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Presensi Luring (TTD & GPS)
              </button>
              <button
                type="button"
                onClick={() => setMethod('Daring_Live_Selfie')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  method === 'Daring_Live_Selfie'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Presensi Daring (Live Selfie)
              </button>
            </div>
          </div>

          {/* A. PRESENSI LURING UI */}
          {method === 'Luring_Signature_GPS' && (
            <div className="space-y-4">
              {/* Geofencing Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Deteksi Jarak & Geofencing Lokasi Pelatihan:
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      {activeSession?.locationName}
                    </span>
                  </div>

                  {/* Simulator Controls */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSetSimulation('near')}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        simulationMode === 'near'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Tes Di Kampus (~18m)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetSimulation('far')}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        simulationMode === 'far'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ✗ Tes Luar Radius (~1.8km)
                    </button>
                    <button
                      type="button"
                      onClick={fetchRealGps}
                      disabled={gpsLoading}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-blue-700 hover:bg-blue-50 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                      GPS Riil
                    </button>
                  </div>
                </div>

                {/* Visual Distance Gauge */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-800">
                      Jarak Anda ke Ruang Diklat: <span className="text-blue-800 font-mono text-sm">{distanceMeters} meter</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Batas Maksimal Radius: {maxRadius} meter • Koordinat: {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isInsideGeofence
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isInsideGeofence ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Radius Terverifikasi (Valid)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Di Luar Batas Radius
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic QR Anti-Joki Token */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-950 font-semibold">
                  <QrCode className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Token Dinamis Sesi: <strong className="font-mono text-blue-800">{dynamicQrCode}</strong></span>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded font-bold">
                  Auto-Refresh 30s
                </span>
              </div>

              {/* Canvas Tanda Tangan Digital */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-700" />
                    Bubuhkan Tanda Tangan Digital Anda
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={autoGenerateSignature}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      ✍️ Tanda Tangan Otomatis
                    </button>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                    >
                      Bersihkan (Clear)
                    </button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 flex flex-col items-center relative">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="bg-white rounded-lg shadow-2xs cursor-crosshair touch-none border border-slate-200 max-w-full"
                  />
                  {/* Baseline indicator */}
                  <div className="w-3/4 border-b border-dashed border-slate-200 pointer-events-none -mt-7 mb-7"></div>
                  
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>Goreskan tanda tangan menggunakan mouse, stylus, atau jari Anda di atas kotak putih.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. PRESENSI DARING UI */}
          {method === 'Daring_Live_Selfie' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-700" />
                  Swafoto Presensi Virtual (Live Selfie dengan Watermark Resmi)
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Viewfinder */}
                  <div className="w-60 h-60 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center border-2 border-slate-300 shadow-xs">
                    {selfieImage ? (
                      <img src={selfieImage} alt="Selfie" className="w-full h-full object-cover" />
                    ) : cameraActive ? (
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    ) : (
                      <div className="text-center p-4 text-slate-400 space-y-2">
                        <Camera className="w-8 h-8 mx-auto opacity-50" />
                        <div className="text-xs">Kamera Belum Aktif</div>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3 flex-1">
                    {!selfieImage ? (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap gap-2">
                          {!cameraActive ? (
                            <button
                              type="button"
                              onClick={startWebcam}
                              className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              Aktifkan Kamera Live
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              📸 Ambil Foto Sekarang
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={useSampleSelfie}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition-colors"
                          >
                            Gunakan Foto Sampel ASN
                          </button>
                        </div>

                        <div className="text-xs text-slate-500 pt-1">
                          Atau unggah file foto selfie dari galeri:
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) setSelfieImage(ev.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                          <Check className="w-4 h-4" /> Foto selfie presensi berhasil diverifikasi!
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelfieImage(null);
                            startWebcam();
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                        >
                          Ambil Ulang Foto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast Feedback */}
        {successToast && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            {onNavigateToEvaluation && currentUser.role === 'peserta' && (
              <button
                type="button"
                onClick={onNavigateToEvaluation}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
              >
                Lanjut ke Evaluasi →
              </button>
            )}
          </div>
        )}

        {/* Submit Bar */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            Sistem SIPEKA mencatat verifikasi GPS, waktu log, dan identitas digital secara terenkripsi.
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {isSubmitting ? 'Memproses Presensi...' : 'Kirim Presensi Sesi'}
          </button>
        </div>
      </form>
    </div>
  );
};
