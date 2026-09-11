/**
 * SIPEKA - Sistem Terintegrasi Presensi & Evaluasi Pelatihan ASN
 * Arsitektur Prototipe Fungsional Terpadu
 */

import React, { useState } from 'react';
import { 
  User, 
  Training, 
  PresenceRecord, 
  EvaluationTeacherRecord, 
  EvaluationParticipantRecord,
  TrainingSession,
  ScheduleAttachment
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_TRAININGS, 
  INITIAL_PRESENCES, 
  INITIAL_TEACHER_EVALUATIONS, 
  INITIAL_PARTICIPANT_EVALUATIONS 
} from './data/mockData';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { WorkflowStepper } from './components/WorkflowStepper';
import { PresensiForm } from './components/PresensiForm';
import { EvaluationForm } from './components/EvaluationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { CertificateModal } from './components/CertificateModal';
import { SchemaViewerModal } from './components/SchemaViewerModal';

export default function App() {
  // Master State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]); // Default Peserta: Dr. Rian Pratama
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Tampilan Awal: Meminta login peran terlebih dahulu

  const [trainings, setTrainings] = useState<Training[]>(INITIAL_TRAININGS);
  const [presences, setPresences] = useState<PresenceRecord[]>(INITIAL_PRESENCES);
  const [evaluationsTeacher, setEvaluationsTeacher] = useState<EvaluationTeacherRecord[]>(
    INITIAL_TEACHER_EVALUATIONS
  );
  const [evaluationsParticipant, setEvaluationsParticipant] = useState<EvaluationParticipantRecord[]>(
    INITIAL_PARTICIPANT_EVALUATIONS
  );

  // Tab View
  const [activeTab, setActiveTab] = useState<'presensi' | 'evaluasi' | 'dashboard' | 'sertifikat'>('presensi');
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);

  // Active Session Helper
  const activeTraining = trainings[0];
  const activeSession = activeTraining?.sessions[0];

  // Login & Logout Handlers
  const handleLogin = (selectedUser: User) => {
    setCurrentUser(selectedUser);
    setIsLoggedIn(true);

    // Otomatis arahkan tab sesuai peran yang dipilih
    if (selectedUser.role === 'peserta') {
      setActiveTab('presensi');
    } else if (selectedUser.role === 'pengajar' || selectedUser.role === 'penguji') {
      setActiveTab('evaluasi');
    } else if (selectedUser.role === 'admin') {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Register New User Handler
  const handleRegister = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);

    // Jika peran adalah peserta, otomatis ikutsertakan ke pelatihan aktif agar bisa langsung presensi & unduh sertifikat
    if (newUser.role === 'peserta') {
      setTrainings((prev) =>
        prev.map((t) => ({
          ...t,
          participantIds: [...(t.participantIds || []), newUser.id],
          sessions: t.sessions.map((s) => ({
            ...s,
            participantIds: [...(s.participantIds || []), newUser.id]
          }))
        }))
      );
    }

    // Langsung masuk ke akun baru yang didaftarkan
    handleLogin(newUser);
  };

  // Handlers
  const handleAddPresence = (newPresence: PresenceRecord) => {
    setPresences((prev) => {
      const filtered = prev.filter(
        (p) => !(p.sessionId === newPresence.sessionId && p.userId === newPresence.userId)
      );
      return [newPresence, ...filtered];
    });
  };

  const handleAddTeacherEvaluation = (newEval: EvaluationTeacherRecord) => {
    setEvaluationsTeacher((prev) => [newEval, ...prev]);
  };

  const handleAddParticipantEvaluation = (newEval: EvaluationParticipantRecord) => {
    setEvaluationsParticipant((prev) => {
      const filtered = prev.filter(
        (p) => !(p.sessionId === newEval.sessionId && p.pesertaId === newEval.pesertaId)
      );
      return [newEval, ...filtered];
    });
  };

  // Schedule Management Handlers
  const handleAddTraining = (newTraining: Training) => {
    setTrainings((prev) => [newTraining, ...prev]);
  };

  const handleAddSession = (trainingId: string, newSession: TrainingSession) => {
    setTrainings((prev) =>
      prev.map((t) => {
        if (t.id === trainingId) {
          return {
            ...t,
            sessions: [...t.sessions, newSession],
            totalJp: t.totalJp + newSession.jp
          };
        }
        return t;
      })
    );
  };

  const handleDeleteSession = (trainingId: string, sessionId: string) => {
    setTrainings((prev) =>
      prev.map((t) => {
        if (t.id === trainingId) {
          const removed = t.sessions.find((s) => s.id === sessionId);
          return {
            ...t,
            sessions: t.sessions.filter((s) => s.id !== sessionId),
            totalJp: Math.max(0, t.totalJp - (removed?.jp || 0))
          };
        }
        return t;
      })
    );
  };

  // Upload Lampiran Jadwal (PDF atau Excel)
  const handleUploadScheduleAttachment = (trainingId: string, attachment: ScheduleAttachment) => {
    setTrainings((prev) =>
      prev.map((t) => {
        if (t.id === trainingId) {
          const existing = t.attachments || [];
          return {
            ...t,
            attachments: [attachment, ...existing]
          };
        }
        return t;
      })
    );
  };

  const handleDeleteScheduleAttachment = (trainingId: string, attachmentId: string) => {
    setTrainings((prev) =>
      prev.map((t) => {
        if (t.id === trainingId) {
          return {
            ...t,
            attachments: (t.attachments || []).filter((a) => a.id !== attachmentId)
          };
        }
        return t;
      })
    );
  };

  // Import Massal Sesi dari Excel
  const handleImportSessions = (trainingId: string, newSessions: TrainingSession[]) => {
    setTrainings((prev) =>
      prev.map((t) => {
        if (t.id === trainingId) {
          const addedJp = newSessions.reduce((acc, curr) => acc + (curr.jp || 0), 0);
          return {
            ...t,
            sessions: [...t.sessions, ...newSessions],
            totalJp: t.totalJp + addedJp
          };
        }
        return t;
      })
    );
  };

  // JIKA BELUM LOGIN: TAMPILKAN HALAMAN AWAL LOGIN PILIH PERAN & AKUN KHUSUS
  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen
          allUsers={users}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        />
        <SchemaViewerModal
          isOpen={isSchemaModalOpen}
          onClose={() => setIsSchemaModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
      {/* Navbar with Role-Tailored View & Logout */}
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={(user) => {
          setCurrentUser(user);
          // If switching to non-participant, auto adjust tab if on certificate
          if (user.role !== 'peserta' && activeTab === 'sertifikat') {
            setActiveTab('dashboard');
          }
        }}
        onLogout={handleLogout}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* User-Friendly Visual Workflow Stepper */}
        <WorkflowStepper
          currentUser={currentUser}
          activeSession={activeSession}
          presences={presences}
          evaluationsTeacher={evaluationsTeacher}
          evaluationsParticipant={evaluationsParticipant}
          onNavigateTab={setActiveTab}
        />

        {activeTab === 'presensi' && (
          <PresensiForm
            currentUser={currentUser}
            trainings={trainings}
            presences={presences}
            onSubmitPresence={handleAddPresence}
            onNavigateToEvaluation={() => setActiveTab('evaluasi')}
          />
        )}

        {activeTab === 'evaluasi' && (
          <EvaluationForm
            currentUser={currentUser}
            trainings={trainings}
            presences={presences}
            allUsers={users}
            evaluationsTeacher={evaluationsTeacher}
            evaluationsParticipant={evaluationsParticipant}
            onSubmitTeacherEvaluation={handleAddTeacherEvaluation}
            onSubmitParticipantEvaluation={handleAddParticipantEvaluation}
            onNavigateToPresensi={() => setActiveTab('presensi')}
            onNavigateToCertificate={() => setActiveTab('sertifikat')}
            onNavigateToBAP={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <AdminDashboard
            currentUser={currentUser}
            trainings={trainings}
            presences={presences}
            allUsers={users}
            evaluationsTeacher={evaluationsTeacher}
            evaluationsParticipant={evaluationsParticipant}
            onAddTraining={handleAddTraining}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onUploadScheduleAttachment={handleUploadScheduleAttachment}
            onDeleteScheduleAttachment={handleDeleteScheduleAttachment}
            onImportSessions={handleImportSessions}
          />
        )}

        {activeTab === 'sertifikat' && currentUser.role === 'peserta' && (
          <CertificateModal
            currentUser={currentUser}
            trainings={trainings}
            presences={presences}
            evaluationsTeacher={evaluationsTeacher}
            evaluationsParticipant={evaluationsParticipant}
            onAddParticipantEvaluation={handleAddParticipantEvaluation}
            onNavigateToPresensi={() => setActiveTab('presensi')}
            onNavigateToEvaluation={() => setActiveTab('evaluasi')}
          />
        )}
      </main>

      {/* Schema & Documentation Modal */}
      <SchemaViewerModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 SIPEKA - Prototipe Sistem Terintegrasi Presensi & Evaluasi Pelatihan ASN.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Standar PTP Kemdikbud / BPSDM / LAN RI</span>
            <span>•</span>
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="text-blue-700 hover:underline cursor-pointer font-medium"
            >
              Lihat Arsitektur Kode & Prompt AI
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
