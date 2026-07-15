import { useState, useEffect } from 'react';
import { Student, MemorizationRecord, AnnouncementItem, AppView, UserRole } from '../types';
import { INITIAL_MEMORIZATION, ANNOUNCEMENT_ITEMS } from '../data';

interface StudentPortalViewProps {
  student: Student;
  allStudents: Student[];
  onSelectStudent: (id: string | null) => void;
  setView: (view: AppView) => void;
  userRole?: UserRole;
}

export default function StudentPortalView({
  student,
  allStudents,
  onSelectStudent,
  setView,
  userRole,
}: StudentPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'grades' | 'violations' | 'notes'>('grades');
  const [certModalOpen, setCertModalOpen] = useState(false);

  // Find all setoran history for this student
  const studentRecords = INITIAL_MEMORIZATION.filter((r) => r.studentId === student.id);
  const latestRecord: MemorizationRecord | null = studentRecords.length > 0 ? studentRecords[0] : null;

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('siakad_dark_mode') === 'true');

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('siakad_dark_mode', String(nextMode));
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isNormalPortal = userRole === 'ustadz' || userRole === 'wali_santri';

  if (isNormalPortal) {
    return (
      <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in max-w-4xl mx-auto">
        {/* Portal Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Portal Madrasah</h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Selamat datang di Portal Resmi Madrasah Ummi. Berikut adalah informasi profil lembaga dan pengaturan akun Anda.
          </p>
        </div>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Institution Profile (Colspan 2) */}
          <div className="md:col-span-2 bg-white border border-outline-variant/60 rounded-xl p-6 space-y-5 shadow-2xs">
            <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[32px]">mosque</span>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-primary">YAYASAN PONDOK PESANTREN UMMI</h2>
                <p className="text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider mt-0.5">Sistem Informasi Akademik Terpadu</p>
              </div>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface p-3.5 rounded-lg border border-outline-variant/45">
                <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Nomor Statistik Madrasah (NSM)</span>
                <span className="font-mono text-xs font-bold text-primary mt-1 block">121235060002</span>
              </div>
              <div className="bg-surface p-3.5 rounded-lg border border-outline-variant/45">
                <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">NPSN / Izin Operasional</span>
                <span className="font-mono text-xs font-bold text-primary mt-1 block">20214812 / 502/Pd.Pes/2023</span>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Alamat Lembaga</h4>
              <p className="text-on-surface font-medium leading-relaxed bg-surface p-3 rounded-lg border border-outline-variant/30 font-sans">
                Jl. Pesantren No. 01, Kel. Watubelah, Kec. Sumber, Cirebon, Jawa Barat 45611<br />
                <span className="text-[10px] text-on-surface-variant font-semibold">Email: info@alfathanah.sch.id | Telp: (0231) 8849021</span>
              </p>
            </div>

            {/* Vision & Mission */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Visi Lembaga</h4>
                <p className="text-on-surface leading-relaxed italic bg-surface p-3 rounded-lg border border-outline-variant/30">
                  &quot;Terwujudnya Generasi Qur&apos;ani, Berakhlakul Karimah, Unggul dalam IPTEK, dan Kokoh dalam IMTAK.&quot;
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Misi Lembaga</h4>
                <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 space-y-1 text-on-surface font-medium">
                  <p>1. Menyelenggarakan pendidikan formal dan informal diniyah yang berorientasi pada tahfidzul Qur&apos;an secara profesional.</p>
                  <p>2. Membina akhlakul karimah melalui teladan kiai dan pembiasaan disiplin kehidupan santri di pondok pesantren.</p>
                  <p>3. Meningkatkan penguasaan ilmu pengetahuan, bahasa Arab, dan teknologi terapan bagi santri masa kini.</p>
                  <p>4. Mengembangkan potensi bakat dan minat kepemimpinan santri secara integral dan berkelanjutan.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Penggunaan & Profile (Colspan 1) */}
          <div className="space-y-6 text-left">
            {/* Mode Penggunaan */}
            <div className="bg-white border border-outline-variant/60 rounded-xl p-5 space-y-4 shadow-2xs">
              <h3 className="font-display text-sm font-bold text-primary border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">palette</span>
                <span>Mode Penggunaan</span>
              </h3>
              <p className="text-on-surface-variant leading-relaxed text-[11px]">
                Sesuaikan warna visual aplikasi dengan mengubah tema tampilan di bawah ini.
              </p>

              <div className="flex items-center justify-between bg-surface p-3.5 rounded-lg border border-outline-variant/30">
                <span className="font-bold text-on-surface">Tampilan Gelap (Dark Mode)</span>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative cursor-pointer ${
                    isDarkMode ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-all duration-300 absolute top-1 ${
                      isDarkMode ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Greeting Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
              <span className="material-symbols-outlined text-[32px] text-primary">verified_user</span>
              <h4 className="font-display text-sm font-bold text-primary">Akses Terverifikasi</h4>
              <p className="text-on-surface-variant leading-relaxed text-[11px]">
                Akun Anda telah diaktifkan secara resmi oleh Super Admin. Seluruh data rekam medis akademik disimpan dan dienkripsi dengan aman.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-section-gap font-sans">
      {/* Breadcrumb / Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <button onClick={() => setView('dashboard')} className="hover:text-primary font-medium transition-colors cursor-pointer">
            Dashboard
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <button onClick={() => setView('students')} className="hover:text-primary font-medium transition-colors cursor-pointer">
            Data Santri
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">{student.name}</span>
        </div>

        {/* Change Child Dropdown (For parents or admins to view others) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">Lihat Portal Santri:</span>
          <select
            value={student.id}
            onChange={(e) => onSelectStudent(e.target.value)}
            className="bg-white border border-outline-variant/60 rounded-md py-1 px-3 text-xs font-semibold text-primary outline-none cursor-pointer"
          >
            {allStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.class})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Header: Student Profile Summary */}
      <section className="bg-surface rounded-xl border border-outline-variant/60 p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed/30 to-transparent opacity-60 z-0 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-surface shadow-md overflow-hidden shrink-0 relative">
            {student.photoUrl ? (
              <img
                alt={student.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                src={student.photoUrl}
              />
            ) : (
              <div className="w-full h-full bg-secondary-fixed text-primary flex items-center justify-center font-bold text-2xl border-2 border-primary shadow-xs">
                {student.initials || student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-surface rounded-full"></div>
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="font-display text-2xl font-bold text-primary mb-1">{student.name}</h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                <span>NISN: {student.nisn}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-primary">class</span>
                <span>Kelas: {student.class}</span>
              </span>
            </div>
          </div>
          <div className="shrink-0 mt-4 md:mt-0">
            <button
              onClick={() => {
                alert('Fasilitas mengedit profil secara langsung dari Wali Portal memerlukan persetujuan Admin Madrasah.');
              }}
              className="bg-primary text-on-primary px-5 py-2 rounded-lg font-sans text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              <span>Minta Edit Profil</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid: Stats & Tahfidz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Overview */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Stat: Hafalan */}
            <div className="bg-white rounded-xl border border-outline-variant/60 p-4 flex flex-col justify-between hover:bg-surface-container-low transition-colors shadow-2xs">
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider leading-none">Total Hafalan</span>
                <span className="material-symbols-outlined text-primary text-[18px]">menu_book</span>
              </div>
              <div className="font-display text-2xl font-bold text-primary mt-2">
                {student.tahfidzJuz} <span className="text-xs font-sans text-on-surface-variant">Juz</span>
              </div>
            </div>

            {/* Stat: Grade */}
            <div className="bg-white rounded-xl border border-outline-variant/60 p-4 flex flex-col justify-between hover:bg-surface-container-low transition-colors shadow-2xs">
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider leading-none">Rata-rata Nilai</span>
                <span className="material-symbols-outlined text-primary text-[18px]">school</span>
              </div>
              <div className="font-display text-2xl font-bold text-primary mt-2">
                {student.totalScore >= 90 ? 'A' : 'B'}{' '}
                <span className="text-xs font-sans text-on-surface-variant">({student.totalScore.toFixed(0)})</span>
              </div>
            </div>

            {/* Stat: Attendance */}
            <div className="bg-white rounded-xl border border-outline-variant/60 p-4 flex flex-col justify-between hover:bg-surface-container-low transition-colors col-span-2 sm:col-span-1 shadow-2xs">
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider leading-none">Kehadiran</span>
                <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
              </div>
              <div className="font-display text-2xl font-bold text-primary mt-2">
                {student.attendanceRate}%
              </div>
            </div>

            {/* Stat: Achievement Badge */}
            <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-4 flex flex-col justify-between hover:bg-amber-100/30 transition-all col-span-2 sm:col-span-1 shadow-2xs">
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-xs font-bold text-amber-800 uppercase tracking-wider leading-none">Prestasi</span>
                <span className="material-symbols-outlined text-amber-600 text-[18px]">emoji_events</span>
              </div>
              <div className="font-sans text-xs font-bold text-amber-900 mt-2 truncate max-w-full">
                {student.latestAchievement || 'Santri Berbakat'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Tahfidz Progress */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-outline-variant/60 p-5 flex flex-col relative overflow-hidden shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-md font-bold text-primary">Progress Tahfidz</h3>
            <button
              onClick={() => {
                setView('tahfidz_input');
              }}
              className="text-primary font-sans text-xs font-bold border border-primary px-3 py-1 rounded hover:bg-primary/5 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Detail Setoran</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="flex-1 flex flex-col md:flex-row gap-6 items-center">
            {/* Simulated Chart Area */}
            <div className="w-full md:w-1/2 h-36 bg-surface-container-low rounded-lg border border-outline-variant/40 flex items-end justify-between p-4 relative">
              <div className="w-[15%] bg-secondary-fixed-dim rounded-t-md h-[30%]"></div>
              <div className="w-[15%] bg-secondary-fixed-dim rounded-t-md h-[45%]"></div>
              <div className="w-[15%] bg-secondary-fixed-dim rounded-t-md h-[60%]"></div>
              <div className="w-[15%] bg-secondary-fixed-dim rounded-t-md h-[78%]"></div>
              <div className="w-[15%] bg-primary rounded-t-md h-[100%] shadow-[0_0_8px_rgba(0,53,39,0.3)]"></div>
              <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 text-[9px] font-bold text-on-surface-variant/60 font-mono opacity-80">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>Mei</span>
              </div>
            </div>

            {/* Info & Action */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="bg-secondary-fixed/10 p-3.5 rounded-lg border border-secondary-fixed/30 text-left">
                <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 leading-none">
                  Hafalan Terakhir (Setoran)
                </p>
                <p className="font-display text-md font-bold text-primary">
                  {latestRecord ? latestRecord.surah : 'Surah Al-Kahfi'}
                </p>
                <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                  Ayat {latestRecord ? `${latestRecord.startAyat} - ${latestRecord.endAyat}` : '1 - 50'}
                  <span className="text-[10px] ml-2 text-outline">| Tgl: {latestRecord ? latestRecord.date : '12 Nov 2023'}</span>
                </p>
              </div>
              <button
                onClick={() => setCertModalOpen(true)}
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-sans text-xs font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                <span>Lihat Sertifikat Tahfidz</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Two Column Layout for Tabs & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabs Section */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-outline-variant/60 overflow-hidden flex flex-col shadow-2xs">
          {/* Tab Headers */}
          <div className="flex border-b border-outline-variant/40 bg-surface-container-low/50">
            <button
              onClick={() => setActiveTab('grades')}
              className={`flex-1 py-3 px-4 font-sans text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'grades'
                  ? 'border-primary text-primary bg-white font-extrabold'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              Nilai &amp; Absensi
            </button>
            <button
              onClick={() => setActiveTab('violations')}
              className={`flex-1 py-3 px-4 font-sans text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'violations'
                  ? 'border-primary text-primary bg-white font-extrabold'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              Pelanggaran &amp; Prestasi
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 px-4 font-sans text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'notes'
                  ? 'border-primary text-primary bg-white font-extrabold'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              Catatan Ustadz
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 flex-1 overflow-x-auto min-h-[220px]">
            {activeTab === 'grades' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-sans text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-3 border-b border-outline-variant/50 font-bold">Mata Pelajaran</th>
                    <th className="p-3 border-b border-outline-variant/50 font-bold text-center">Nilai Harian</th>
                    <th className="p-3 border-b border-outline-variant/50 font-bold text-center">UTS</th>
                    <th className="p-3 border-b border-outline-variant/50 font-bold text-center">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-sans">
                  <tr className="border-b border-outline-variant/20 hover:bg-surface-container-low/30 transition-colors bg-white">
                    <td className="p-3 font-semibold text-on-surface">Aqidah Akhlaq</td>
                    <td className="p-3 text-center font-mono font-bold">90</td>
                    <td className="p-3 text-center font-mono font-bold">88</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                        100%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant/20 hover:bg-surface-container-low/30 transition-colors bg-surface-bright">
                    <td className="p-3 font-semibold text-on-surface">Fiqih</td>
                    <td className="p-3 text-center font-mono font-bold">85</td>
                    <td className="p-3 text-center font-mono font-bold">92</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                        95%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant/20 hover:bg-surface-container-low/30 transition-colors bg-white">
                    <td className="p-3 font-semibold text-on-surface">Bahasa Arab</td>
                    <td className="p-3 text-center font-mono font-bold">95</td>
                    <td className="p-3 text-center font-mono font-bold">94</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                        100%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTab === 'violations' && (
              <div className="space-y-3 p-1">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 mt-0.5 text-[20px]">emoji_events</span>
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-xs">Penghargaan Akhlaq Terpuji</h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Aktif membantu menyiapkan masjid sebelum halaqah subuh dan menyusun sajadah rapi.
                    </p>
                    <span className="text-[9px] text-emerald-600 font-bold block mt-1 uppercase">12 Mei 2026</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 flex items-start gap-3">
                  <span className="material-symbols-outlined text-orange-600 mt-0.5 text-[20px]">warning</span>
                  <div>
                    <h4 className="font-semibold text-orange-900 text-xs">Teguran Ringan: Keterlambatan</h4>
                    <p className="text-[11px] text-orange-800 mt-0.5 leading-relaxed">
                      Terlambat masuk kelas diniyah pagi selama 10 menit tanpa alasan yang mendesak.
                    </p>
                    <span className="text-[9px] text-orange-600 font-bold block mt-1 uppercase">24 April 2026</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-3 p-1">
                <div className="p-4 rounded-lg bg-surface-container-low border-l-4 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">record_voice_over</span>
                    <span className="font-bold text-primary text-xs">Evaluasi Bulanan Ust. Ahmad Baihaqi:</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed italic">
                    &quot;Masya Allah, hafalan santri {student.name} berkembang dengan sangat baik dan tertib. Pengulangan hafalan (Murajaah) di luar jam wajib sangat konsisten. Hanya saja perlu sedikit dipoles pada bagian waqaf dan ibtida agar tidak terengah-engah pada ayat-ayat panjang. Istiqomah selalu nak.&quot;
                  </p>
                  <span className="text-[10px] text-outline mt-2 block font-medium">Diinput pada: 30 Juni 2026</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Announcement Section */}
        <section className="bg-white rounded-xl border border-outline-variant/60 p-5 flex flex-col h-full shadow-2xs">
          <h3 className="font-display text-md font-bold text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px]">campaign</span>
            <span>Pengumuman Wali Santri</span>
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {ANNOUNCEMENT_ITEMS.map((item) => (
              <div key={item.id} className="border-l-2 border-primary pl-3 py-0.5">
                <h4 className="font-sans text-xs font-bold text-on-background">{item.title}</h4>
                <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 leading-relaxed">{item.content}</p>
                <span className="text-[10px] text-outline mt-1.5 block font-medium">{item.date}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => alert('Semua pengumuman terbaru telah ditampilkan.')}
            className="mt-4 text-primary text-xs font-bold hover:underline self-start cursor-pointer"
          >
            Lihat Semua Pengumuman
          </button>
        </section>
      </div>

      {/* Certificate Showcase Mockup Modal */}
      {certModalOpen && (
        <div className="fixed inset-0 bg-[#003527]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-xl border-4 border-amber-500/30 max-w-2xl w-full p-8 shadow-2xl relative animate-fade-in text-center overflow-hidden">
            {/* Elegant Ornamental Borders */}
            <div className="absolute inset-4 border border-amber-600/30 pointer-events-none"></div>
            <div className="absolute inset-5 border-2 border-amber-600/10 pointer-events-none"></div>

            <button
              onClick={() => setCertModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-amber-100 rounded-full transition-all z-10"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="space-y-6 py-4 relative z-10">
              <span className="material-symbols-outlined text-[64px] text-amber-500 animate-pulse">workspace_premium</span>

              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-amber-900 tracking-wider">PIAGAM PENGHARGAAN</h2>
                <p className="font-sans text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-none">TAHFIDZ AL-QUR&apos;AN MADRASAH</p>
                <div className="w-24 h-0.5 bg-amber-600/40 mx-auto mt-2"></div>
              </div>

              <div className="space-y-3 my-8">
                <p className="text-xs text-amber-800 italic">Dengan ini menyatakan kelayakan &amp; kelulusan atas ujian kepada santri:</p>
                <h3 className="font-display text-2xl font-bold text-primary underline decoration-amber-500/50 decoration-2">{student.name}</h3>
                <p className="text-[11px] font-bold text-amber-900 tracking-wider">NISN: {student.nisn} | Kelas: {student.class}</p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                <p className="text-xs text-amber-900 font-bold">PRESTASI HAFIZ:</p>
                <p className="font-display text-xl font-bold text-primary my-1">
                  Khatam Juz {student.tahfidzJuz}
                </p>
                <p className="text-[10px] text-amber-800 italic">
                  Surah Terakhir: {student.tahfidzDetail}
                </p>
              </div>

              <p className="text-[11px] text-amber-800 max-w-lg mx-auto leading-relaxed">
                Semoga Allah SWT melimpahkan rahmat, barokah, dan ketetapan hati bagi ananda untuk terus mengamalkan, mencintai, dan menjaga kalam suci Ilahi di sepanjang hayat. Amin.
              </p>

              <div className="grid grid-cols-2 gap-8 pt-8 text-[11px] font-sans text-amber-950">
                <div className="text-left pl-8">
                  <p className="text-amber-800">Ustadz Pembimbing,</p>
                  <div className="h-12"></div>
                  <p className="font-bold border-b border-amber-950/20 pb-0.5">Ust. Ahmad Baihaqi</p>
                  <p className="text-[9px] text-amber-800">NIP. 19840210 200902 1 002</p>
                </div>

                <div className="text-right pr-8">
                  <p className="text-amber-800">Kepala Madrasah,</p>
                  <div className="h-12"></div>
                  <p className="font-bold border-b border-amber-950/20 pb-0.5">KH. Abdullah, M.Pd.I</p>
                  <p className="text-[9px] text-amber-800">NIDN. 0422118201</p>
                </div>
              </div>
            </div>

            {/* Print trigger */}
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak Piagam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
