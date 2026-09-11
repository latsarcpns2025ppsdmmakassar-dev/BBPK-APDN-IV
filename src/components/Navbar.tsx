import React from 'react';
import { User, UserRole } from '../types';
import { 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Award, 
  Code2, 
  Building2, 
  CalendarCheck,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onOpenSchemaModal: () => void;
  activeTab: 'presensi' | 'evaluasi' | 'dashboard' | 'sertifikat';
  setActiveTab: (tab: 'presensi' | 'evaluasi' | 'dashboard' | 'sertifikat') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onLogout,
  onOpenSchemaModal,
  activeTab,
  setActiveTab
}) => {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin Panitia',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          activeBg: 'bg-rose-600 text-white',
          icon: ShieldCheck,
          desc: 'Akses penuh rekapitulasi, ekspor PDF/Excel, & supervisi'
        };
      case 'pengajar':
        return {
          label: 'Widyaiswara / Pengajar',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          activeBg: 'bg-indigo-600 text-white',
          icon: GraduationCap,
          desc: 'Penilaian sikap peserta & unduh Berita Acara (BAP)'
        };
      case 'penguji':
        return {
          label: 'Penguji Evaluasi',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          activeBg: 'bg-purple-600 text-white',
          icon: Award,
          desc: 'Evaluasi seminar rancangan & pengesahan BAP'
        };
      case 'peserta':
      default:
        return {
          label: 'Peserta ASN',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          activeBg: 'bg-emerald-600 text-white',
          icon: UserCheck,
          desc: 'Presensi mandiri, evaluasi pengajar, & unduh sertifikat'
        };
    }
  };

  const currentConfig = getRoleConfig(currentUser.role);
  const CurrentIcon = currentConfig.icon;

  // Filter peers that share the SAME role as current user
  const peerUsers = allUsers.filter((u) => u.role === currentUser.role);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner Pemerintah */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-200">
            SIPEKA • Sistem Terintegrasi Presensi & Evaluasi Pelatihan Terpadu ASN
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-400">Pusdiklat / BPSDM Aparatur</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <button
            onClick={onOpenSchemaModal}
            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 cursor-pointer transition-colors bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md text-[11px]"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Skema JSON & Panduan AI</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center text-white font-bold shadow-xs">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">SIPEKA</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${currentConfig.bg}`}>
                  {currentConfig.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Presensi Mandiri Tanpa Token • Gatekeeping • Evaluasi Dua Arah
              </p>
            </div>
          </div>

          {/* Role-Specific Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80">
            {currentUser.role === 'peserta' && (
              <>
                <button
                  onClick={() => setActiveTab('presensi')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'presensi'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  Presensi Mandiri
                </button>
                <button
                  onClick={() => setActiveTab('evaluasi')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'evaluasi'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Evaluasi Pengajar
                </button>
                <button
                  onClick={() => setActiveTab('sertifikat')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'sertifikat'
                      ? 'bg-white text-amber-900 shadow-xs border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  Sertifikat Saya
                </button>
              </>
            )}

            {(currentUser.role === 'pengajar' || currentUser.role === 'penguji') && (
              <>
                <button
                  onClick={() => setActiveTab('evaluasi')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'evaluasi'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Penilaian Peserta (Evaluasi)
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Berita Acara (BAP)
                </button>
                <button
                  onClick={() => setActiveTab('presensi')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'presensi'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  Jadwal Sesi Saya
                </button>
              </>
            )}

            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  Kelola Jadwal & Rekap BAP
                </button>
                <button
                  onClick={() => setActiveTab('evaluasi')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'evaluasi'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Evaluasi Dua Arah
                </button>
                <button
                  onClick={() => setActiveTab('presensi')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'presensi'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  Supervisi Presensi
                </button>
              </>
            )}
          </nav>

          {/* User Profile Badge & Ganti Akun */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                <span>NIP: {currentUser.nip}</span>
              </div>
            </div>

            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${currentConfig.bg}`}>
              <CurrentIcon className="w-4 h-4" />
            </div>

            {/* Tombol Ganti Akun / Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Keluar / Ganti Peran & Akun Pengguna"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600" />
              <span className="hidden sm:inline">Ganti Akun</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 gap-1 text-xs">
          {currentUser.role === 'peserta' ? (
            <>
              <button
                onClick={() => setActiveTab('presensi')}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center ${
                  activeTab === 'presensi' ? 'bg-blue-800 text-white' : 'text-slate-600'
                }`}
              >
                Presensi
              </button>
              <button
                onClick={() => setActiveTab('evaluasi')}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center ${
                  activeTab === 'evaluasi' ? 'bg-blue-800 text-white' : 'text-slate-600'
                }`}
              >
                Evaluasi
              </button>
              <button
                onClick={() => setActiveTab('sertifikat')}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center ${
                  activeTab === 'sertifikat' ? 'bg-amber-600 text-white' : 'text-slate-600'
                }`}
              >
                Sertifikat
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center ${
                  activeTab === 'dashboard' ? 'bg-blue-800 text-white' : 'text-slate-600'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('evaluasi')}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center ${
                  activeTab === 'evaluasi' ? 'bg-blue-800 text-white' : 'text-slate-600'
                }`}
              >
                Evaluasi
              </button>
              <button
                onClick={() => setActiveTab('presensi')}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center ${
                  activeTab === 'presensi' ? 'bg-blue-800 text-white' : 'text-slate-600'
                }`}
              >
                Jadwal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-bar: Hanya menampilkan opsi ganti rekan sejawat jika terdapat lebih dari 1 user pada peran yang SAMA */}
      {peerUsers.length > 1 && (
        <div className="bg-slate-50/80 border-t border-slate-200/70 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Akun {currentConfig.label}:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {peerUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => onSelectUser(user)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate max-w-[200px] ${
                        isSelected
                          ? 'bg-blue-800 text-white shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                      title={user.name}
                    >
                      {user.name.split(',')[0]}
                      {isSelected && ' (Aktif)'}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-bold hover:underline shrink-0 cursor-pointer"
            >
              ← Ganti ke Peran Lain
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
