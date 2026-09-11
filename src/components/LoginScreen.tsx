import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  Award, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  Lock,
  UserPlus,
  LogIn,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

interface LoginScreenProps {
  allUsers: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  onOpenSchemaModal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  allUsers,
  onLogin,
  onRegister,
  onOpenSchemaModal
}) => {
  // Main Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Unified Login Form States
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [showQuickSelect, setShowQuickSelect] = useState<boolean>(false);

  // Register Form States
  const [regName, setRegName] = useState<string>('');
  const [regNip, setRegNip] = useState<string>('');
  const [regInstansi, setRegInstansi] = useState<string>('');
  const [regJabatan, setRegJabatan] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'peserta' | 'pengajar' | 'penguji' | null>(null);
  const [regError, setRegError] = useState<string>('');

  // 3 Peran Aparatur Saja untuk Pendaftaran Baru (Peserta, Pengajar, Penguji)
  const registrationRoles: {
    role: 'peserta' | 'pengajar' | 'penguji';
    title: string;
    subtitle: string;
    description: string;
    icon: React.ElementType;
    colorScheme: {
      border: string;
      bg: string;
      badge: string;
      iconBg: string;
      activeBorder: string;
    };
  }[] = [
    {
      role: 'peserta',
      title: 'Peserta Pelatihan (ASN)',
      subtitle: 'Aparatur Sipil Negara Peserta',
      description: 'Presensi mandiri (swafoto & geolokasi), evaluasi pengajar/penguji, serta unduh e-Sertifikat kelulusan ber-JP resmi.',
      icon: UserCheck,
      colorScheme: {
        border: 'border-emerald-200',
        bg: 'bg-emerald-50/50',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        iconBg: 'bg-emerald-600 text-white',
        activeBorder: 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50'
      }
    },
    {
      role: 'pengajar',
      title: 'Widyaiswara / Pengajar',
      subtitle: 'Tenaga Pengajar & Fasilitator',
      description: 'Memantau agenda mengajar, memeriksa presensi kehadiran kelas, dan menginput penilaian sikap integritas & tugas praktik.',
      icon: GraduationCap,
      colorScheme: {
        border: 'border-indigo-200',
        bg: 'bg-indigo-50/50',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        iconBg: 'bg-indigo-600 text-white',
        activeBorder: 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50'
      }
    },
    {
      role: 'penguji',
      title: 'Penguji Seminar / Ujian',
      subtitle: 'Tim Evaluator & Penguji',
      description: 'Menguji seminar rancangan aksi perubahan, ujian komprehensif, dan validasi kelayakan kelulusan e-Sertifikat.',
      icon: Award,
      colorScheme: {
        border: 'border-purple-200',
        bg: 'bg-purple-50/50',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        iconBg: 'bg-purple-600 text-white',
        activeBorder: 'border-purple-600 ring-2 ring-purple-500/30 bg-purple-50'
      }
    }
  ];

  // Handle Unified Login Form
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedId = identifierInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedId) {
      setLoginError('Silakan masukkan NIP Pegawai atau Username.');
      return;
    }

    // Check if Admin Login: username 'admin' and password 'admin'
    if (trimmedId.toLowerCase() === 'admin') {
      if (trimmedPass === 'admin') {
        const adminAccount = allUsers.find((u) => u.role === 'admin') || {
          id: 'user-admin-1',
          nip: '198205142008011003',
          name: 'Administrator Pusdiklat',
          email: 'admin.diklat@lan.go.id',
          role: 'admin' as UserRole,
          instansi: 'Pusdiklat Aparatur Sipil Negara / BPSDM',
          jabatan: 'Administrator Sistem & Panitia Diklat'
        };
        onLogin(adminAccount);
        return;
      } else {
        setLoginError('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
        return;
      }
    }

    // Check if matching ASN User by NIP or Email or Name
    const matchedUser = allUsers.find(
      (u) => 
        u.nip.trim() === trimmedId || 
        u.email?.toLowerCase().trim() === trimmedId.toLowerCase() ||
        u.name.toLowerCase().trim() === trimmedId.toLowerCase()
    );

    if (matchedUser) {
      // Validate password if user has password set
      if (matchedUser.password && trimmedPass && matchedUser.password !== trimmedPass) {
        setLoginError('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
        return;
      }
      onLogin(matchedUser);
    } else {
      setLoginError(`Akun dengan NIP "${trimmedId}" belum terdaftar. Silakan lakukan pendaftaran akun baru pada tab "Daftar Akun Baru".`);
    }
  };

  // Helper to quick-select an ASN user
  const handleSelectQuickUser = (user: User) => {
    setIdentifierInput(user.nip);
    setPasswordInput(user.password || '123456');
    setLoginError('');
    onLogin(user);
  };

  // Handle Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Nama Lengkap wajib diisi beserta gelar.');
      return;
    }
    if (!regNip.trim() || regNip.trim().length < 8) {
      setRegError('NIP Pegawai wajib diisi minimal 8 digit angka.');
      return;
    }
    if (!regInstansi.trim()) {
      setRegError('Instansi / Unit Kerja wajib diisi.');
      return;
    }
    if (!regJabatan.trim()) {
      setRegError('Jabatan ASN wajib diisi.');
      return;
    }
    if (!regRole) {
      setRegError('Silakan tentukan pilihan peran Anda: Peserta, Pengajar, atau Penguji.');
      return;
    }

    // Check if NIP already exists
    const existing = allUsers.find((u) => u.nip.trim() === regNip.trim());
    if (existing) {
      setRegError(`NIP ${regNip} sudah terdaftar sebagai "${existing.name}". Silakan langsung gunakan menu Masuk (Login).`);
      return;
    }

    const newUser: User = {
      id: `user-${regRole}-${Date.now().toString(36)}`,
      nip: regNip.trim(),
      name: regName.trim(),
      email: `${regNip.trim()}@asn.go.id`,
      role: regRole,
      instansi: regInstansi.trim(),
      jabatan: regJabatan.trim(),
      password: regPassword.trim() || '123456'
    };

    onRegister(newUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex flex-col font-sans">
      {/* Top Government Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">
              SIPEKA • Sistem Informasi Presensi & Evaluasi Pelatihan Terpadu ASN
            </span>
          </div>
          <div className="text-slate-400 text-[11px] flex items-center gap-3">
            <span>Pusdiklat Aparatur • Lembaga Administrasi Negara</span>
            {onOpenSchemaModal && (
              <button
                type="button"
                onClick={onOpenSchemaModal}
                className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer underline"
              >
                Panduan Sistem & Skema
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col justify-center">
        {/* Header Branding */}
        <div className="text-center max-w-2xl mx-auto mb-6 space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-900 text-white rounded-2xl shadow-md ring-4 ring-blue-800/10">
            <Building2 className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              SIPEKA APARATUR SIPIL NEGARA
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Sistem Terintegrasi Presensi Mandiri, Evaluasi Dua Arah, dan Penerbitan e-Sertifikat Pelatihan ASN
            </p>
          </div>
        </div>

        {/* Tab Switcher: [ MASUK (LOGIN) ] vs [ DAFTAR AKUN BARU ] */}
        <div className="max-w-md mx-auto w-full mb-6">
          <div className="grid grid-cols-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-blue-900 shadow-md border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4 text-blue-700" />
              <span>Masuk (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setRegError('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-blue-900 shadow-md border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>Daftar Akun Baru</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: FORM LOGIN LANGSUNG (TANPA DASHBOARD PILIH PERAN) */}
        {/* ========================================================= */}
        {authMode === 'login' && (
          <div className="max-w-xl mx-auto w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg space-y-6">
            <div className="border-b border-slate-100 pb-4 text-center">
              <h2 className="text-lg font-bold text-slate-900">
                Masuk ke Akun Pelatihan Anda
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan NIP Pegawai dan kata sandi akun Anda
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP Pegawai <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder="Masukkan NIP Pegawai (18 digit)..."
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi (Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Login Drawer for Easy Testing */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQuickSelect(!showQuickSelect)}
                className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 py-1 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                  <span>Daftar Akun Terdaftar (Masuk Cepat 1-Klik)</span>
                </span>
                {showQuickSelect ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showQuickSelect && (
                <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  <div className="text-[11px] text-slate-500 px-1 font-medium">
                    Klik salah satu akun di bawah untuk langsung masuk sesuai peran yang terdaftar:
                  </div>
                  {allUsers.filter((u) => u.role !== 'admin').map((u) => {
                    const roleBadge = 
                      u.role === 'pengajar'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        : u.role === 'penguji'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                    const roleLabel =
                      u.role === 'pengajar'
                        ? 'Pengajar'
                        : u.role === 'penguji'
                        ? 'Penguji'
                        : 'Peserta';

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectQuickUser(u)}
                        className="bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-400 p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group shadow-2xs"
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900 truncate">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            NIP: {u.nip} • {u.jabatan}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge}`}>
                            {roleLabel}
                          </span>
                          <span className="text-blue-700 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Masuk →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer switcher to register */}
            <div className="text-center pt-2 text-xs text-slate-500">
              Belum memiliki akun terdaftar?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-blue-700 font-bold hover:underline cursor-pointer"
              >
                Daftar Akun Baru di Sini
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DAFTAR AKUN BARU (DI SINI BARU ADA PILIHAN PERAN)  */}
        {/* ========================================================= */}
        {authMode === 'register' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <span>Formulir Pendaftaran Akun Aparatur Sipil Negara</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data kedinasan Anda dan tentukan pilihan peran pelatihan Anda.
                </p>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  Masuk di sini
                </button>
              </span>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Bagian A: Data Identitas Pegawai */}
              <div className="space-y-4">
                <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-900 text-[11px] flex items-center justify-center font-bold">
                    A
                  </span>
                  Data Identitas Kedinasan Pegawai
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Beserta Gelar <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Dr. Rian Pratama, S.Pd., M.Ed."
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP Pegawai (18 Digit Angka) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 199308212020121005"
                      value={regNip}
                      onChange={(e) => setRegNip(e.target.value.replace(/\D/g, ''))}
                      maxLength={18}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Instansi / Balai Diklat Asal <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Balai Pembelajaran & Penjaminan Mutu"
                      value={regInstansi}
                      onChange={(e) => setRegInstansi(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jabatan Fungsional / Struktural <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pengembang Teknologi Pembelajaran Ahli Muda"
                      value={regJabatan}
                      onChange={(e) => setRegJabatan(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kata Sandi (Password) <span className="text-slate-400 font-normal">(Minimal 6 karakter)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Buat kata sandi untuk akun Anda..."
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian B: PILIH PERAN (DI SINI ADA PILIHAN PERAN) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-900 text-[11px] flex items-center justify-center font-bold">
                      B
                    </span>
                    Pilih Peran Anda Dalam Pelatihan <span className="text-rose-500">*</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Tersedia 3 pilihan peran ASN)
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Pilih salah satu peran yang Anda emban. Sistem akan mengonfigurasi fitur dan menu ruang kerja Anda sesuai peran ini:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {registrationRoles.map((r) => {
                    const isSelected = regRole === r.role;
                    const IconComponent = r.icon;

                    return (
                      <div
                        key={r.role}
                        onClick={() => {
                          setRegRole(r.role);
                          setRegError('');
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? r.colorScheme.activeBorder
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${r.colorScheme.iconBg}`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {r.title}
                            </h4>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {r.subtitle}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                            {r.description}
                          </p>
                        </div>

                        <div className={`mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] font-bold ${
                          isSelected ? 'text-blue-900' : 'text-slate-500'
                        }`}>
                          {isSelected ? '✓ Peran Terpilih' : 'Pilih Peran Ini'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Akun Anda langsung aktif dan dapat digunakan untuk pelatihan.</span>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar & Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-[11px] text-slate-400 mt-8 space-y-1">
          <div>Pusdiklat Pegawai ASN • Lembaga Administrasi Negara Republik Indonesia</div>
          <div>Sistem Presensi Geotagging & Swafoto Tanpa Token • Gatekeeping e-Sertifikat Ber-TTE</div>
        </div>
      </div>
    </div>
  );
};
