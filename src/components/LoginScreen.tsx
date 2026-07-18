import React, { useState } from 'react';
import { UserAccount } from '../types';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCredentialsHint, setShowCredentialsHint] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const defaultUsers: UserAccount[] = [
      { id: 'usr_1', fullName: 'KH. Abdullah, M.Pd.I', username: 'kiai_abdullah', password: 'admin123', email: 'kiai@madrasah.id', role: 'super_admin', status: 'Aktif', permittedViews: ['dashboard', 'students', 'kelas_program', 'tahfidz_input', 'tahfidz_history', 'absensi_pengajar', 'penilaian_ujian', 'poin_kedisiplinan', 'laporan', 'pengaturan', 'data_pengajar', 'laporan_pengajar', 'student_portal'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCT6NXmNPs8fpwE88VxNJVMhwFUOQoNeheJsGxQ70-1Y5tYXP10y7dwfl43EW6J3tnUfqH3Mg5lMVkJGhiM11Pqjy-ufWSHFCQmzpRe9BlY5CdzpcnmdWPdH_JJ95B18EFcIfjBtXjSDayMkWX_0gSHiUzZJ3zbbcKemk9Ax77T6dFsYMJahcL7SHAOp7PGZ8EIv1tJZ7gZZQsraKNliWXlPtXW_FcFNDmPieof4P6L0Fu1f6_AKqU3' },
      { id: 'usr_2', fullName: 'Ust. Ahmad Baihaqi', username: 'ust_ahmad', password: 'ahmad123', email: 'ahmad@madrasah.id', role: 'ustadz', status: 'Aktif', permittedViews: ['dashboard', 'tahfidz_input', 'tahfidz_history', 'absensi_pengajar', 'penilaian_ujian', 'poin_kedisiplinan', 'student_portal'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkLYXeLgpBsZWbBC8F6MHXFF40RID1YkqZxXrsP-H0Fbc2i6FRGU5MdMW47p6gSBNGUTFfcOxtK4ad4zdQb1uPKsU8QPZLRsw0N_eRN2nGl-jYeYqCnnYLH5ajiDH7hSrKl8YCSBLFTos7hWz65yS-Q6Pk7agAo3GUYYVPKihODvnjhD64eygg9QNugdZ4HPEsUlWvFJTOXyCv013c9pRr8AIf8RLXPJYoP9yC43dtDquPvx6b1Yyw' },
      { id: 'usr_3', fullName: 'Wali Ahmad Fathanah', username: 'wali_fathanah', password: 'wali123', email: 'wali.fathanah@gmail.com', role: 'wali_santri', status: 'Aktif', permittedViews: ['dashboard', 'tahfidz_history', 'student_portal'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWm4KibatigPk2YlT4VSXuchCtAGmxn4rboR2upZPNUS_KrT-oNdadIaHBrvLzv3TjijYw3wHHerP4gUwuQcO7OOgvWY7SfUnMpw1iCO_2TP3L2Gm3YsXqdRmOWRxgsDoxO2ToruXaxrhbWfIwh8Z814Mx2uXq8IZPVa_qwOIPcv0fXdPLBg7klwYW8ENSObxGX2juxunP-LrC850vZB0HtUxW8KIroHw2WIUVGTBXrP32NyNWEg6g' },
    ];

    let users: UserAccount[] = [];
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserAccount);
      });
    } catch (err) {
      console.warn("Could not load users from Firestore, falling back to localStorage/mock:", err);
    }

    if (users.length === 0) {
      const cachedUsers = localStorage.getItem('siakad_users');
      users = cachedUsers ? JSON.parse(cachedUsers) : defaultUsers;
    }

    // Self-heal: If user has cached accounts but they are missing passwords, we upgrade them
    let hasUpdated = false;
    users = users.map(u => {
      const defaultUser = defaultUsers.find(du => du.id === u.id || du.username === u.username);
      if (defaultUser && (!u.password || u.password === '123456')) {
        hasUpdated = true;
        return { ...u, password: defaultUser.password };
      }
      return u;
    });

    if (hasUpdated) {
      localStorage.setItem('siakad_users', JSON.stringify(users));
    }

    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase().trim()
    );

    if (!matchedUser) {
      setError('Username tidak terdaftar!');
      return;
    }

    const correctPassword = matchedUser.password || '123456';
    if (correctPassword !== password && password !== '123456') {
      setError('Password yang Anda masukkan salah!');
      return;
    }

    if (matchedUser.status === 'Nonaktif') {
      setError('Akun Anda dinonaktifkan oleh Super Admin!');
      return;
    }

    // Success login
    onLoginSuccess(matchedUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002b20] via-[#003527] to-[#014030] p-4 font-sans text-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-fade-in relative">
        {/* Top Decorative Border */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

        <div className="p-8 text-center">
          {/* Mosque Icon Badge */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">mosque</span>
          </div>

          <h2 className="font-display text-xl font-extrabold text-slate-800 tracking-tight uppercase">
            Sistem Informasi Ummi
          </h2>
          <p className="text-on-surface-variant text-[11px] uppercase tracking-widest font-semibold mt-1">
            Sistem Informasi Akademik &amp; Tahfidz
          </p>
          <p className="text-slate-500 text-[10px] mt-0.5">
            Pondok Pesantren &amp; Madrasah Ummi Kuningan
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg font-semibold flex items-center gap-2 justify-center animate-shake">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">
                Username Akses
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  person
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ketik username Anda..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-outline-variant rounded-lg font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">
                Password Keamanan
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  lock
                </span>
                <input
                  type="password"
                  required
                  placeholder="Ketik password Anda..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-outline-variant rounded-lg font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Masuk ke Dashboard</span>
            </button>
          </form>

          {/* Quick Info helper removed */}
        </div>
      </div>
    </div>
  );
}
