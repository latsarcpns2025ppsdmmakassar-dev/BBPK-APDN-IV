import React, { useState } from 'react';
import { X, Copy, Check, Database, ShieldCheck, Code, Sparkles } from 'lucide-react';

interface SchemaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'gatekeeper' | 'prompts'>('schema');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const jsonSchemaText = `{
  "users": {
    "user_id_001": {
      "nip": "199208212019031005",
      "name": "Dr. Rian Pratama, S.Pd., M.Ed.",
      "email": "rian.ptp@kemdikbud.go.id",
      "role": "peserta", // "admin" | "peserta" | "pengajar" | "penguji"
      "instansi": "Balai Pengembangan Pembelajaran dan Penjaminan Mutu",
      "jabatan": "Pengembang Teknologi Pembelajaran (PTP) Ahli Muda",
      "nomorHp": "085299887766",
      "createdAt": "2026-09-01T08:00:00Z"
    }
  },
  "trainings": {
    "TRN-2026-PTP-01": {
      "code": "PTP-DIGITAL-VII",
      "title": "Pelatihan Fungsional Pengembang Teknologi Pembelajaran (PTP) Berbasis AI",
      "category": "Pelatihan Fungsional",
      "batch": "Angkatan VII Tahun 2026",
      "startDate": "2026-09-08",
      "endDate": "2026-09-18",
      "totalJp": 48,
      "penyelenggara": "Pusdiklat Aparatur Sipil Negara"
    }
  },
  "training_sessions": {
    "SES-01": {
      "trainingId": "TRN-2026-PTP-01",
      "sessionTitle": "Pemanfaatan Generative AI dalam Pengembangan Multimedia Pembelajaran",
      "date": "2026-09-11",
      "startTime": "08:00",
      "endTime": "11:30",
      "jp": 4,
      "mode": "Luring", // "Luring" | "Daring" | "Hybrid"
      "locationName": "Auditorium Gd. Pusdiklat Lt. 3, Jakarta",
      "targetLat": -6.2088,
      "targetLng": 106.8456,
      "maxRadiusMeters": 250,
      "pengajarId": "user-pengajar-1",
      "pengujiId": "user-penguji-1",
      "status": "Sedang Berlangsung"
    }
  },
  "presences": {
    "PRES-001": {
      "trainingId": "TRN-2026-PTP-01",
      "sessionId": "SES-01",
      "userId": "user-peserta-2",
      "userNip": "199504122020122011",
      "userName": "Anisa Kusuma Wardani, S.Kom., M.Cs.",
      "userRole": "peserta",
      "timestamp": "2026-09-11 07:48:22",
      "method": "Luring_Signature_GPS", // "Luring_Signature_GPS" | "Daring_Live_Selfie"
      "status": "HADIR", // "HADIR" | "TERLAMBAT" | "IZIN" | "ALPA"
      "gps": {
        "latitude": -6.20875,
        "longitude": 106.84562,
        "accuracyMeters": 8,
        "distanceFromVenueMeters": 14,
        "isInsideGeofence": true
      },
      "signatureDataUrl": "data:image/png;base64,...",
      "selfieDataUrl": null,
      "qrValidationToken": "SIPEKA-SES01-X81A",
      "deviceInfo": "Chrome on macOS"
    }
  },
  "evaluations_teacher": {
    "EVL-T-001": {
      "trainingId": "TRN-2026-PTP-01",
      "sessionId": "SES-01",
      "pesertaId": "user-peserta-2",
      "targetEvaluatedId": "user-pengajar-1",
      "targetRole": "pengajar",
      "ratings": {
        "penguasaanMateri": 5,
        "metodePenyampaian": 5,
        "pemanfaatanMediaPTP": 4,
        "interaksiAndragogi": 5,
        "ketepatanWaktu": 4
      },
      "overallAverage": 4.6,
      "catatanApresiasi": "Penyampaian sangat komunikatif dan aplikatif.",
      "saranPerbaikan": "Perbanyak waktu simulasi praktikum.",
      "submittedAt": "2026-09-11T11:35:10Z"
    }
  },
  "evaluations_participant": {
    "EVL-P-001": {
      "trainingId": "TRN-2026-PTP-01",
      "sessionId": "SES-01",
      "evaluatorId": "user-pengajar-1",
      "evaluatorRole": "pengajar",
      "pesertaId": "user-peserta-2",
      "scores": {
        "integritasDisiplin": 92,
        "keaktifanDiskusi": 95,
        "penguasaanSubstansi": 90,
        "tugasPraktik": 94
      },
      "finalScore": 92.75,
      "predikat": "Sangat Memuaskan",
      "catatanKualitatif": "Sangat aktif dalam merumuskan media pembelajaran.",
      "rekomendasiTindakLanjut": "Direkomendasikan menjadi Fasilitator Internal.",
      "submittedAt": "2026-09-11T12:15:00Z"
    }
  },
  "berita_acara_pelaksanaan": {
    "BAP-001": {
      "bapNumber": "BA.102/BAP/SES-01/2026",
      "trainingId": "TRN-2026-PTP-01",
      "sessionId": "SES-01",
      "evaluatorId": "user-pengajar-1",
      "evaluatorRole": "pengajar",
      "totalPesertaTerdaftar": 3,
      "totalPesertaHadir": 2,
      "evaluasiPesertaCompleted": true,
      "signedAt": "2026-09-11T13:00:00Z"
    }
  }
}`;

  const promptText = `/* =========================================================================
 * PROMPT INTEGRASI GOOGLE AI STUDIO / GEMINI API UNTUK SISTEM SIPEKA
 * Model Rekomendasi: gemini-2.5-flash
 * ========================================================================= */

// System Instruction untuk Sintesis Evaluasi Kompetensi ASN:
const SYSTEM_INSTRUCTION = \`Anda adalah seorang Ahli Evaluasi Pendidikan & Pelatihan ASN di Lembaga Administrasi Negara (LAN RI) dan Pengembang Teknologi Pembelajaran (PTP). Tugas Anda adalah menyusun narasi evaluasi kualitatif dan rekomendasi tindak lanjut bagi peserta pelatihan ASN berdasarkan rekapitulasi nilai kompetensi, catatan widyaiswara/penguji, serta keikutsertaan presensi.\`;

// Contoh User Prompt untuk Gemini API:
const USER_PROMPT_TEMPLATE = \`
Data Peserta Pelatihan ASN:
- Nama: Dr. Rian Pratama, S.Pd., M.Ed. (PTP Ahli Muda)
- Program Pelatihan: Pelatihan Fungsional Pengembang Teknologi Pembelajaran Berbasis AI
- Status Presensi: HADIR (Tepat Waktu, Verifikasi Geofence Luring)
- Skor Penilaian:
  * Integritas & Kedisiplinan: 92/100
  * Keaktifan Diskusi: 95/100
  * Penguasaan Substansi: 90/100
  * Tugas Praktik Media: 94/100
  * Nilai Akhir: 92.75 (Predikat: Sangat Memuaskan)

Tolong rumuskan:
1. Narasi Evaluasi Kualitatif (2-3 kalimat formal, apresiatif, berprinsip andragogi).
2. Rekomendasi Rencana Aksi Perubahan & Pengembangan Kompetensi di unit kerja asal.
\`;
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold">Arsitektur SIPEKA: Skema Database & Integrasi</h2>
              <p className="text-xs text-slate-400">
                Spesifikasi Teknis untuk Pengembang IT Diklat & Pejabat Fungsional PTP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              1. JSON Data Schema (4 Role)
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'prompts'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              2. Panduan Prompt Google AI Studio
            </button>
          </div>

          <button
            onClick={() => handleCopy(activeTab === 'schema' ? jsonSchemaText : promptText, activeTab)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            {copied === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed">
          {activeTab === 'schema' && (
            <pre className="whitespace-pre-wrap">{jsonSchemaText}</pre>
          )}
          {activeTab === 'prompts' && (
            <pre className="whitespace-pre-wrap text-emerald-400">{promptText}</pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Struktur siap diekspor ke Firebase Firestore / Supabase / PostgreSQL.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
