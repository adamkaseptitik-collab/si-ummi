import { useState, useEffect } from 'react';
import { Student, MemorizationRecord, AnnouncementItem, AppView, UserRole, AcademicGrade, PointRecord, StudentAttendance } from '../types';
import { ANNOUNCEMENT_ITEMS } from '../data';

interface StudentPortalViewProps {
  student: Student;
  allStudents: Student[];
  records: MemorizationRecord[];
  pointRecords?: PointRecord[];
  grades?: AcademicGrade[];
  studentAttendance?: StudentAttendance[];
  onSelectStudent: (id: string | null) => void;
  setView: (view: AppView) => void;
  userRole?: UserRole;
  portalSettings: any;
  announcements: AnnouncementItem[];
}

export default function StudentPortalView({
  student,
  allStudents,
  records,
  pointRecords = [],
  grades = [],
  studentAttendance = [],
  onSelectStudent,
  setView,
  userRole,
  portalSettings,
  announcements = [],
}: StudentPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'grades' | 'violations' | 'notes'>('grades');
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [printStatusText, setPrintStatusText] = useState('');

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [dateSelectionDone, setDateSelectionDone] = useState(false);

  const getFormattedDate = () => {
    const date = new Date();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Find all setoran history dynamically for this student
  const studentRecords = (records || []).filter((r) => r.studentId === student.id);
  const latestRecord: MemorizationRecord | null = studentRecords.length > 0 ? studentRecords[0] : null;

  // Compute other dynamic data
  const studentGrades = (grades || []).filter((g) => g.studentId === student.id);
  const studentPoints = (pointRecords || []).filter((p) => p.studentId === student.id);

  const hasHafalan = student.tahfidzJuz > 0 || studentRecords.length > 0;
  const hasScore = student.totalScore > 0 || studentRecords.length > 0;

  // Calculate average of each memorization record
  const averageScoreVal = studentRecords.length > 0
    ? Number((studentRecords.reduce((sum, r) => sum + r.finalScore, 0) / studentRecords.length).toFixed(1))
    : 0;

  const letterGrade = averageScoreVal >= 85 ? 'A' : averageScoreVal >= 70 ? 'B' : averageScoreVal > 0 ? 'C' : '-';

  // Calculate dynamic attendance rate from studentAttendance logs
  const studentLogs = (studentAttendance || []).filter((sa) => sa.studentId === student.id);
  const hadirCount = studentLogs.filter((sa) => sa.status === 'Hadir').length;
  const sakitCount = studentLogs.filter((sa) => sa.status === 'Sakit').length;
  const izinCount = studentLogs.filter((sa) => sa.status === 'Izin').length;
  const alpaCount = studentLogs.filter((sa) => sa.status === 'Alpa').length;
  const attendanceRateVal = studentLogs.length > 0
    ? Math.round((hadirCount / studentLogs.length) * 100)
    : (student.attendanceRate || 0);

  // Calculate total baris from 'Ziyadah' memorization records
  const totalBarisZiyadah = studentRecords
    .filter((r) => r.type === 'Ziyadah')
    .reduce((sum, r) => {
      const parsed = parseInt(r.line);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);

  // Dynamic data for FILTERED report based on startDate and endDate
  const filteredRecords = studentRecords.filter((r) => r.date >= startDate && r.date <= endDate);
  const latestRecordFiltered = filteredRecords.length > 0 ? filteredRecords[0] : null;

  const filteredGrades = studentGrades.filter((g) => {
    const gDate = g.date || '2026-07-16';
    return gDate >= startDate && gDate <= endDate;
  });

  const filteredPoints = studentPoints.filter((p) => p.date >= startDate && p.date <= endDate);

  const averageScoreValFiltered = filteredGrades.length > 0
    ? Number((filteredGrades.reduce((sum, g) => sum + g.finalScore, 0) / filteredGrades.length).toFixed(1))
    : 0;

  const letterGradeFiltered = averageScoreValFiltered >= 85 ? 'A' : averageScoreValFiltered >= 75 ? 'B' : averageScoreValFiltered >= 60 ? 'C' : averageScoreValFiltered > 0 ? 'D' : '-';

  const filteredLogs = studentLogs.filter((sa) => sa.date >= startDate && sa.date <= endDate);
  const sakitCountFiltered = filteredLogs.filter((sa) => sa.status === 'Sakit').length;
  const izinCountFiltered = filteredLogs.filter((sa) => sa.status === 'Izin').length;
  const alpaCountFiltered = filteredLogs.filter((sa) => sa.status === 'Alpa').length;
  const hadirCountFiltered = filteredLogs.filter((sa) => sa.status === 'Hadir').length;
  const attendanceRateValFiltered = filteredLogs.length > 0
    ? Math.round((hadirCountFiltered / filteredLogs.length) * 100)
    : (student.attendanceRate || 0);

  const totalBarisZiyadahFiltered = filteredRecords
    .filter((r) => r.type === 'Ziyadah')
    .reduce((sum, r) => {
      const parsed = parseInt(r.line);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);

  const totalPointsPrestasiFiltered = filteredPoints
    .filter((p) => p.type === 'Prestasi')
    .reduce((sum, p) => sum + Math.abs(p.points), 0);

  const totalPointsPelanggaranFiltered = filteredPoints
    .filter((p) => p.type === 'Pelanggaran')
    .reduce((sum, p) => sum + Math.abs(p.points), 0);

  const netTotalPointsFiltered = totalPointsPrestasiFiltered - totalPointsPelanggaranFiltered;

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

  const [viewMode, setViewMode] = useState<'academic' | 'institution'>('academic');

  const isNormalPortal = userRole === 'ustadz' || userRole === 'wali_santri';

  const handlePrint = () => {
    setPrintModalOpen(true);
    setDateSelectionDone(false);
    setPrintProgress(0);
    setPrintStatusText('');
  };

  const startReportGeneration = () => {
    setDateSelectionDone(true);
    setPrintProgress(0);
    setPrintStatusText('Menghubungkan ke basis data santri...');
    
    const steps = [
      { p: 15, t: 'Membaca rekam data lengkap akademik...' },
      { p: 40, t: 'Mengambil riwayat setoran tahfidz...' },
      { p: 65, t: 'Menyusun rekapitulasi poin & kedisiplinan...' },
      { p: 85, t: 'Memformat tata letak dokumen Raport Santri...' },
      { p: 100, t: 'Selesai! Dokumen siap dicetak.' }
    ];
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        setPrintProgress(step.p);
        setPrintStatusText(step.t);
      }, (index + 1) * 200);
    });
  };

  const executeActualPrint = () => {
    const element = document.getElementById('printable-report-area');
    if (!element) {
      alert('Elemen laporan tidak ditemukan.');
      return;
    }

    // 1. Clone the printable area
    const printClone = element.cloneNode(true) as HTMLElement;
    printClone.id = 'temp-print-area';
    printClone.classList.remove('hidden');
    printClone.classList.remove('print:block');
    printClone.style.display = 'block';
    printClone.style.position = 'absolute';
    printClone.style.left = '0';
    printClone.style.top = '0';
    printClone.style.width = '100%';
    printClone.style.background = 'white';
    printClone.style.color = 'black';
    printClone.style.padding = '24px';

    // 2. Add temporary style tag to isolate and show only the print clone during print
    const style = document.createElement('style');
    style.id = 'temp-print-style';
    style.innerHTML = `
      @page {
        size: auto;
        margin: 0mm; /* Hides default browser header/footer containing raw HTTP link */
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        #root {
          display: none !important;
        }
        body > *:not(#temp-print-area) {
          display: none !important;
        }
        #temp-print-area {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 18mm 20mm !important; /* Elegant printable page margins */
          background: white !important;
          color: black !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(printClone);

    const originalTitle = document.title;
    document.title = `Raport_Santri_Madrasah_Ummi_${student.name.replace(/\s+/g, '_')}`;

    // 3. Trigger print with user-focus on iframe
    try {
      window.focus();
      setTimeout(() => {
        try {
          window.print();
        } catch (innerErr: any) {
          console.error("Print dialog error:", innerErr);
          alert("Jika dialog cetak terblokir di frame AI Studio, silakan klik tombol 'Buka di Tab Baru' di kanan atas halaman pratinjau utama, kemudian coba cetak lagi.");
        }
        
        // 4. Cleanup after print dialog is handled
        setTimeout(() => {
          printClone.remove();
          style.remove();
          document.title = originalTitle;
        }, 1000);
      }, 150);
    } catch (err: any) {
      console.error("Print setup error:", err);
      printClone.remove();
      style.remove();
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  const ensureHtml2PdfLoaded = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
        return;
      }

      const existingScript = document.querySelector('script[src*="html2pdf"]');
      if (existingScript) {
        let interval = setInterval(() => {
          if ((window as any).html2pdf) {
            clearInterval(interval);
            resolve((window as any).html2pdf);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
          if ((window as any).html2pdf) {
            resolve((window as any).html2pdf);
          } else {
            reject(new Error('Gagal memuat pustaka PDF. Silakan periksa koneksi internet Anda.'));
          }
        }, 5000);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      script.onload = () => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
        } else {
          reject(new Error('Pustaka PDF terunduh tetapi gagal divalidasi.'));
        }
      };
      script.onerror = () => {
        reject(new Error('Gagal mengunduh pustaka PDF dari CDN.'));
      };
      document.head.appendChild(script);
    });
  };

  const handleSaveReport = async () => {
    const element = document.getElementById('printable-report-area');
    if (!element) {
      alert('Elemen laporan tidak ditemukan.');
      return;
    }

    try {
      const h2p = await ensureHtml2PdfLoaded();
      
      const opt = {
        margin:       [10, 10, 10, 10], // Margin in mm (1 cm)
        filename:     `Raport_${student.name.replace(/\s+/g, '_')}_${startDate}_s_d_${endDate}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2.2, 
          useCORS: true, 
          logging: false,
          letterRendering: true
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Clone element to prepare it with exact style for PDF conversion
      const clone = element.cloneNode(true) as HTMLElement;
      clone.id = 'temp-pdf-clone';
      clone.classList.remove('hidden');
      clone.classList.remove('print:block');
      clone.style.display = 'block';
      clone.style.width = '790px'; // Approx. Standard Web A4 size
      clone.style.padding = '32px';
      clone.style.backgroundColor = 'white';
      clone.style.color = 'black';

      // Create an invisible wrapper container inside the active viewport so html2canvas renders it perfectly
      const wrapper = document.createElement('div');
      wrapper.id = 'temp-pdf-wrapper';
      wrapper.style.position = 'absolute';
      wrapper.style.left = '0';
      wrapper.style.top = '0';
      wrapper.style.width = '790px';
      wrapper.style.zIndex = '-9999';
      wrapper.style.opacity = '0.01'; // Invisible to user, fully layout-enabled for html2canvas
      wrapper.style.pointerEvents = 'none';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      h2p().set(opt).from(clone).save();
      
      // Safe deferment for cleaning up cloned DOM after browser triggers down-stream canvas printing
      setTimeout(() => {
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }, 2000);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-section-gap font-sans text-left">
      {/* 1. Screen View Area (Hidden during printing) */}
      <div className="print:hidden space-y-section-gap">
        {/* Portal Mode Switcher for Normal Users (Ustadz & Wali Santri) */}
        {isNormalPortal && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface rounded-xl border border-outline-variant/50 p-4 shadow-2xs">
            <div>
              <h1 className="font-display text-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">door_open</span>
                <span>Portal Madrasah</span>
              </h1>
              <p className="text-on-surface-variant text-[10px] mt-0.5 font-medium">
                {portalSettings.welcomeMsg}
              </p>
            </div>
            <div className="flex bg-surface-container-high p-1 rounded-lg border border-outline-variant/30 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('academic')}
                className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'academic'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>Laporan Akademik Santri</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('institution')}
                className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'institution'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">mosque</span>
                <span>Profil Lembaga</span>
              </button>
            </div>
          </div>
        )}

        {viewMode === 'institution' && isNormalPortal ? (
          <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in max-w-4xl mx-auto">
            {/* Outer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Institution Profile (Colspan 2) */}
              <div className="md:col-span-2 bg-white border border-outline-variant/60 rounded-xl p-6 space-y-5 shadow-2xs">
                <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[32px]">mosque</span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-primary uppercase">{portalSettings.institutionName}</h2>
                    <p className="text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider mt-0.5">{portalSettings.subTitle || "Sistem Informasi Akademik Terpadu"}</p>
                  </div>
                </div>

                {/* General Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface p-3.5 rounded-lg border border-outline-variant/45">
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Nomor Statistik Madrasah (NSM)</span>
                    <span className="font-mono text-xs font-bold text-primary mt-1 block">{portalSettings.nsm}</span>
                  </div>
                  <div className="bg-surface p-3.5 rounded-lg border border-outline-variant/45">
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">NPSN / Izin Operasional</span>
                    <span className="font-mono text-xs font-bold text-primary mt-1 block">{portalSettings.npsn} / 502/Pd.Pes/2023</span>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Alamat Lembaga</h4>
                  <p className="text-on-surface font-medium leading-relaxed bg-surface p-3 rounded-lg border border-outline-variant/30 font-sans">
                    {portalSettings.address}<br />
                    <span className="text-[10px] text-on-surface-variant font-semibold">Email: {portalSettings.email} | Telp: {portalSettings.phone}</span>
                  </p>
                </div>

                {/* Vision & Mission */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Visi Lembaga</h4>
                    <p className="text-on-surface leading-relaxed italic bg-surface p-3 rounded-lg border border-outline-variant/30">
                      &quot;{portalSettings.vision}&quot;
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">Misi Lembaga</h4>
                    <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 space-y-1.5 text-on-surface font-medium">
                      {Array.isArray(portalSettings.mission) ? (
                        portalSettings.mission.map((m: string, i: number) => (
                          <p key={i}>{i + 1}. {m}</p>
                        ))
                      ) : (
                        <p>{portalSettings.mission}</p>
                      )}
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
        ) : (
          <>
            {/* Breadcrumb / Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <button type="button" onClick={() => setView('dashboard')} className="hover:text-primary font-medium transition-colors cursor-pointer">
                  Dashboard
                </button>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <button type="button" onClick={() => setView('students')} className="hover:text-primary font-medium transition-colors cursor-pointer">
                  Data Santri
                </button>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-on-surface font-semibold">{student.name}</span>
              </div>

              {/* Change Child Dropdown (For parents or admins to view others) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">Lihat Portal Santri:</span>
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
                      <span>NIS: {student.nip}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px] text-primary">class</span>
                      <span>Kelas: {student.class}</span>
                    </span>
                  </div>
                </div>
                <div className="shrink-0 mt-4 md:mt-0 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 px-5 py-2 rounded-lg font-sans text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm animate-pulse-slow"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Cetak PDF Laporan</span>
                  </button>
                  <button
                    type="button"
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
                {hasHafalan ? (
                  <>
                    {totalBarisZiyadah} <span className="text-xs font-sans text-on-surface-variant">Baris (Ziyadah)</span>
                  </>
                ) : (
                  <span className="text-on-surface-variant/40">-</span>
                )}
              </div>
            </div>

            {/* Stat: Grade */}
            <div className="bg-white rounded-xl border border-outline-variant/60 p-4 flex flex-col justify-between hover:bg-surface-container-low transition-colors shadow-2xs">
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider leading-none">Rata-rata Nilai</span>
                <span className="material-symbols-outlined text-primary text-[18px]">school</span>
              </div>
              <div className="font-display text-2xl font-bold text-primary mt-2">
                {averageScoreVal > 0 ? (
                  <>
                    {letterGrade}{' '}
                    <span className="text-xs font-sans text-on-surface-variant">({averageScoreVal.toFixed(1)})</span>
                  </>
                ) : (
                  <span className="text-on-surface-variant/40">-</span>
                )}
              </div>
            </div>

            {/* Stat: Attendance */}
            <div className="bg-white rounded-xl border border-outline-variant/60 p-4 flex flex-col justify-between hover:bg-surface-container-low transition-colors col-span-2 sm:col-span-1 shadow-2xs">
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider leading-none">Kehadiran</span>
                <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
              </div>
              <div className="font-sans text-[11px] font-semibold text-primary mt-2 space-y-1">
                <div className="flex justify-between items-center bg-blue-50/60 text-blue-800 px-2 py-0.5 rounded-sm">
                  <span>Sakit</span>
                  <span className="font-bold font-mono text-xs">{sakitCount}</span>
                </div>
                <div className="flex justify-between items-center bg-amber-50/60 text-amber-800 px-2 py-0.5 rounded-sm">
                  <span>Izin</span>
                  <span className="font-bold font-mono text-xs">{izinCount}</span>
                </div>
                <div className="flex justify-between items-center bg-red-50/60 text-red-800 px-2 py-0.5 rounded-sm">
                  <span>Alpa</span>
                  <span className="font-bold font-mono text-xs">{alpaCount}</span>
                </div>
              </div>
            </div>

            {/* Stat: Achievement Badge */}
            <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-4 flex flex-col justify-between hover:bg-amber-100/30 transition-all col-span-2 sm:col-span-1 shadow-2xs">
              <div className="flex justify-between items-start mb-2">
                <span className="font-sans text-xs font-bold text-amber-800 uppercase tracking-wider leading-none">Prestasi</span>
                <span className="material-symbols-outlined text-amber-600 text-[18px]">emoji_events</span>
              </div>
              <div className="font-sans text-xs font-bold text-amber-900 mt-2 truncate max-w-full">
                {student.latestAchievement || <span className="text-amber-800/40">-</span>}
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
              {hasHafalan ? (
                <>
                  <div className="w-[15%] bg-secondary-fixed-dim rounded-t-md h-[30%]"></div>
                  <div className="w-[15%] bg-secondary-fixed-dim rounded-t-md h-[45%]"></div>
                  <div className="w-[15%] bg-secondary-fixed-dim rounded-t-md h-[60%]"></div>
                  <div className="w-[15%] bg-secondary-fixed-dim rounded-t-md h-[78%]"></div>
                  <div className="w-[15%] bg-primary rounded-t-md h-[100%] shadow-[0_0_8px_rgba(0,53,39,0.3)]"></div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/40 font-semibold text-[11px]">
                  Data tidak tersedia
                </div>
              )}
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
              {latestRecord ? (
                <div className="bg-secondary-fixed/10 p-3.5 rounded-lg border border-secondary-fixed/30 text-left">
                  <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 leading-none">
                    Hafalan Terakhir (Setoran)
                  </p>
                  <p className="font-display text-md font-bold text-primary">
                    {latestRecord.surah}
                  </p>
                  <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                    Ayat {latestRecord.startAyat} - {latestRecord.endAyat}
                    <span className="text-[10px] ml-2 text-outline">| Tgl: {latestRecord.date}</span>
                  </p>
                </div>
              ) : (
                <div className="bg-surface p-4 rounded-lg border border-dashed border-outline-variant/55 text-center text-on-surface-variant/60">
                  Belum ada data setoran hafalan.
                </div>
              )}
              <button
                onClick={() => setCertModalOpen(true)}
                disabled={!hasHafalan}
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-sans text-xs font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                    <th className="p-3 border-b border-outline-variant/50 font-bold text-center">Tugas</th>
                    <th className="p-3 border-b border-outline-variant/50 font-bold text-center">UTS</th>
                    <th className="p-3 border-b border-outline-variant/50 font-bold text-center">UAS</th>
                    <th className="p-3 border-b border-outline-variant/50 font-bold text-center">Nilai Akhir</th>
                    <th className="p-3 border-b border-outline-variant/50 font-bold text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-sans">
                  {studentGrades.length > 0 ? (
                    studentGrades.map((g) => (
                      <tr key={g.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low/30 transition-colors bg-white">
                        <td className="p-3 font-semibold text-on-surface">{g.subjectName}</td>
                        <td className="p-3 text-center font-mono font-bold">{g.assignmentScore}</td>
                        <td className="p-3 text-center font-mono font-bold">{g.utsScore}</td>
                        <td className="p-3 text-center font-mono font-bold">{g.uasScore}</td>
                        <td className="p-3 text-center font-mono font-bold text-primary">{g.finalScore.toFixed(1)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            g.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                            g.grade === 'B' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {g.grade}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-on-surface-variant/60 font-medium">
                        Belum ada data nilai akademik.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'violations' && (
              <div className="space-y-3 p-1">
                {studentPoints.length > 0 ? (
                  studentPoints.map((p) => (
                    <div key={p.id} className={`p-3 rounded-lg flex items-start gap-3 border ${
                      p.type === 'Prestasi' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                        : 'bg-orange-50 border-orange-100 text-orange-900'
                    }`}>
                      <span className={`material-symbols-outlined mt-0.5 text-[20px] ${
                        p.type === 'Prestasi' ? 'text-emerald-600' : 'text-orange-600'
                      }`}>
                        {p.type === 'Prestasi' ? 'emoji_events' : 'warning'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-xs">{p.categoryName} ({p.points > 0 ? `+${p.points}` : p.points} Poin)</h4>
                        <p className={`text-[11px] mt-0.5 leading-relaxed ${
                          p.type === 'Prestasi' ? 'text-emerald-800' : 'text-orange-800'
                        }`}>{p.notes || '-'}</p>
                        <span className={`text-[9px] font-bold block mt-1 uppercase ${
                          p.type === 'Prestasi' ? 'text-emerald-600' : 'text-orange-600'
                        }`}>{p.date} | Oleh: {p.teacherName}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-on-surface-variant/60 font-medium">
                    Belum ada data prestasi atau pelanggaran.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-3 p-1">
                {studentGrades.filter(g => g.notes).length > 0 ? (
                  studentGrades.filter(g => g.notes).map((g) => (
                    <div key={g.id} className="p-4 rounded-lg bg-surface-container-low border-l-4 border-primary">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">record_voice_over</span>
                        <span className="font-bold text-primary text-xs">Evaluasi Mapel {g.subjectName}:</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed italic">
                        &quot;{g.notes}&quot;
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-on-surface-variant/60 font-medium">
                    Belum ada catatan dari ustadz.
                  </div>
                )}
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
            {announcements.map((item) => (
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
                <p className="text-[11px] font-bold text-amber-900 tracking-wider">NIS: {student.nip} | Kelas: {student.class}</p>
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
                  <p className="font-bold border-b border-amber-950/20 pb-0.5">{portalSettings.kepalaMadrasah || "KH. Abdullah, M.Pd.I"}</p>
                </div>
              </div>
            </div>

            {/* Print trigger */}
            <div className="mt-8 flex justify-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak Piagam</span>
              </button>
            </div>
          </div>
        </div>
      )}

          </>
        )}
      </div>

      {/* Progress & Print Preview Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 bg-[#003527]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden animate-fade-in text-left">
          <div className="bg-white rounded-2xl border border-outline-variant/60 max-w-3xl w-full p-6 shadow-2xl relative text-left overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">print</span>
                <h3 className="font-display text-md font-bold text-primary">Cetak Raport Santri</h3>
              </div>
              <button
                onClick={() => setPrintModalOpen(false)}
                className="p-1.5 hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-[300px] space-y-5 pr-1">
              {!dateSelectionDone ? (
                /* STEP 1: Interactive Date range filter */
                <div className="py-8 px-4 space-y-6">
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex gap-3 items-start">
                    <span className="material-symbols-outlined text-primary text-[24px]">calendar_month</span>
                    <div className="text-xs text-primary/95 leading-relaxed">
                      <p className="font-bold text-sm">Filter Rentang Tanggal Raport</p>
                      <p className="mt-1">
                        Silakan tentukan periode tanggal mulai dan tanggal selesai. Data rekapitulasi kehadiran (Poin I), nilai ujian akademik (Poin II), total perkembangan hafalan Ziyadah (Poin III), serta rekapitulasi poin prestasi dan pelanggaran (Poin IV) akan dikalkulasikan secara otomatis berdasarkan rentang tanggal ini.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Tanggal Mulai (Dari)
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-outline-variant/80 rounded-xl bg-surface text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Tanggal Selesai (Sampai)
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-outline-variant/80 rounded-xl bg-surface text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={startReportGeneration}
                      className="px-6 py-3 bg-primary text-white hover:bg-primary/90 rounded-xl font-sans text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">engineering</span>
                      <span>Proses &amp; Buat Raport Santri</span>
                    </button>
                  </div>
                </div>
              ) : printProgress < 100 ? (
                /* Compilation Progress screen */
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing circular outer border */}
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    <span className="material-symbols-outlined text-primary text-[28px] absolute">settings_suggest</span>
                  </div>
                  
                  <div className="text-center space-y-2 max-w-sm">
                    <h4 className="font-sans font-bold text-sm text-on-background">Mempersiapkan Dokumen...</h4>
                    {/* Progress indicator */}
                    <div className="w-64 bg-outline-variant/30 h-2 rounded-full overflow-hidden mx-auto">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${printProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-medium animate-pulse">
                      {printStatusText}
                    </p>
                  </div>
                </div>
              ) : (
                /* Beautiful Live Preview of the completed report */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-600 mt-0.5 text-[20px]">check_circle</span>
                    <div className="flex-1 text-xs text-emerald-900 leading-relaxed font-sans">
                      <p className="font-bold">Dokumen Raport Berhasil Disusun!</p>
                      <p className="mt-0.5 text-[11px] font-medium text-emerald-800">
                        Pratinjau lengkap data di bawah ini siap dicetak berdasarkan rentang tanggal <strong>{startDate} s/d {endDate}</strong>. 
                        <strong> Tip iFrame:</strong> Jika tombol cetak tidak merespon di preview ini, silakan klik tombol 
                        <span className="font-bold"> "Buka di Tab Baru" </span> di sudut kanan atas window pratinjau utama AI Studio, lalu lakukan cetak raport secara langsung.
                      </p>
                    </div>
                  </div>

                  {/* Scrollable Document Miniature Preview Frame */}
                  <div className="border border-outline-variant/80 rounded-xl bg-surface-container-lowest p-6 shadow-inner font-sans text-[10px] text-black max-h-[380px] overflow-y-auto leading-relaxed relative">
                    <div className="absolute top-2 right-2 bg-slate-100 text-slate-600 font-mono text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border border-slate-200">
                      Pratinjau Laporan
                    </div>
                    {/* Title */}
                    <div className="text-center border-b border-black pb-2 mb-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-black">
                        MADRASAH &amp; PONDOK UMMI
                      </h4>
                    </div>

                    {/* Student Biodata */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-[9px] leading-relaxed">
                      <div>
                        <table className="w-full">
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td className="font-bold py-0.5 w-24">Nama Santri</td>
                              <td className="w-2">:</td>
                              <td>{student.name}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="font-bold py-0.5">NIS</td>
                              <td>:</td>
                              <td>{student.nip}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="font-bold py-0.5">Kelas / Program</td>
                              <td>:</td>
                              <td>{student.class} / {student.program}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <table className="w-full">
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td className="font-bold py-0.5 w-24">Total Hafalan</td>
                              <td className="w-2">:</td>
                              <td>{totalBarisZiyadahFiltered} Baris (Ziyadah)</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="font-bold py-0.5">Rata-rata Nilai</td>
                              <td>:</td>
                              <td>{averageScoreValFiltered > 0 ? `${letterGradeFiltered} (${averageScoreValFiltered.toFixed(1)})` : '-'}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="font-bold py-0.5">Rentang Tanggal</td>
                              <td>:</td>
                              <td className="font-bold">{startDate} s/d {endDate}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section I: Kehadiran */}
                    <div className="mb-4">
                      <h5 className="font-bold text-[9px] uppercase tracking-wider mb-1 border-l-2 border-black pl-1.5">
                        I. Rekapitulasi Kehadiran
                      </h5>
                      <table className="w-full text-center border border-black border-collapse text-[8px]">
                        <thead>
                          <tr className="bg-gray-50 font-bold">
                            <th className="p-1 border border-black">Sakit (S)</th>
                            <th className="p-1 border border-black">Izin (I)</th>
                            <th className="p-1 border border-black">Tanpa Keterangan (A)</th>
                            <th className="p-1 border border-black">Persentase Kehadiran</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-1 border border-black font-mono">{sakitCountFiltered} Hari</td>
                            <td className="p-1 border border-black font-mono">{izinCountFiltered} Hari</td>
                            <td className="p-1 border border-black font-mono">{alpaCountFiltered} Hari</td>
                            <td className="p-1 border border-black font-bold font-mono">{attendanceRateValFiltered}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Section II: Akademik */}
                    <div className="mb-4">
                      <h5 className="font-bold text-[9px] uppercase tracking-wider mb-1 border-l-2 border-black pl-1.5">
                        II. Nilai Hasil Belajar (Akademik)
                      </h5>
                      <table className="w-full text-left border border-black border-collapse text-[8px]">
                        <thead>
                          <tr className="bg-gray-50 font-bold text-center">
                            <th className="p-1 border border-black text-left">Mata Pelajaran</th>
                            <th className="p-1 border border-black w-14">Tugas</th>
                            <th className="p-1 border border-black w-14">UTS</th>
                            <th className="p-1 border border-black w-14">UAS</th>
                            <th className="p-1 border border-black w-16">Nilai Akhir</th>
                            <th className="p-1 border border-black w-14">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGrades.length > 0 ? (
                            filteredGrades.map((g) => (
                              <tr key={g.id}>
                                <td className="p-1 border border-black font-medium">{g.subjectName}</td>
                                <td className="p-1 border border-black text-center font-mono">{g.assignmentScore}</td>
                                <td className="p-1 border border-black text-center font-mono">{g.utsScore}</td>
                                <td className="p-1 border border-black text-center font-mono">{g.uasScore}</td>
                                <td className="p-1 border border-black text-center font-mono font-bold">{g.finalScore.toFixed(1)}</td>
                                <td className="p-1 border border-black text-center font-bold">{g.grade}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-3 text-center border border-black italic text-gray-500">
                                Belum ada data nilai akademik pada rentang tanggal ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Section III: Tahfidz */}
                    <div className="mb-4">
                      <h5 className="font-bold text-[9px] uppercase tracking-wider mb-1 border-l-2 border-black pl-1.5">
                        III. Perkembangan Hafalan Al-Qur'an (Riwayat Terakhir)
                      </h5>
                      <table className="w-full text-left border border-black border-collapse text-[8px] mb-1.5">
                        <thead>
                          <tr className="bg-gray-50 font-bold text-center">
                            <th className="p-1 border border-black w-8">No</th>
                            <th className="p-1 border border-black text-left w-20">Tanggal</th>
                            <th className="p-1 border border-black w-16">Kategori</th>
                            <th className="p-1 border border-black w-14">Juz</th>
                            <th className="p-1 border border-black text-left">Surah</th>
                            <th className="p-1 border border-black w-20">Ayat</th>
                            <th className="p-1 border border-black w-14">Nilai</th>
                            <th className="p-1 border border-black w-12">Grade</th>
                            <th className="p-1 border border-black">Penyimak</th>
                          </tr>
                        </thead>
                        <tbody>
                          {latestRecordFiltered ? (
                            <tr>
                              <td className="p-1 border border-black text-center font-mono">1</td>
                              <td className="p-1 border border-black text-center font-mono">{latestRecordFiltered.date}</td>
                              <td className="p-1 border border-black text-center font-medium">{latestRecordFiltered.type}</td>
                              <td className="p-1 border border-black text-center font-mono font-bold">Juz {latestRecordFiltered.juz}</td>
                              <td className="p-1 border border-black font-semibold">{latestRecordFiltered.surah}</td>
                              <td className="p-1 border border-black text-center font-mono">{latestRecordFiltered.startAyat}-{latestRecordFiltered.endAyat}</td>
                              <td className="p-1 border border-black text-center font-mono font-bold" style={{ color: '#1e3a8a' }}>{latestRecordFiltered.finalScore}</td>
                              <td className="p-1 border border-black text-center font-bold">{latestRecordFiltered.grade}</td>
                              <td className="p-1 border border-black">{latestRecordFiltered.ustadz}</td>
                            </tr>
                          ) : (
                            <tr>
                              <td colSpan={9} className="p-3 text-center border border-black italic text-gray-500">
                                Belum ada riwayat setoran hafalan pada rentang tanggal ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="text-[8px] flex justify-between items-center bg-emerald-50 border border-emerald-100 p-1.5 rounded-sm">
                        <span className="font-bold text-emerald-900 uppercase tracking-wide text-[7px]">Total Akumulasi Baris Setoran Ziyadah (Rentang Tanggal):</span>
                        <span className="font-bold font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">{totalBarisZiyadahFiltered} Baris</span>
                      </div>
                    </div>

                    {/* Section IV: Kedisiplinan & Prestasi */}
                    <div className="mb-4">
                      <h5 className="font-bold text-[9px] uppercase tracking-wider mb-1 border-l-2 border-black pl-1.5">
                        IV. Rekapitulasi Kedisiplinan &amp; Prestasi (Sistem Poin)
                      </h5>
                      <div className="border border-black p-3 rounded-sm space-y-2 bg-gray-50/50">
                        <div className="grid grid-cols-3 gap-2 text-center text-[8px] font-medium leading-normal">
                          <div className="p-1.5 bg-green-50 border border-green-100 rounded-sm">
                            <p className="text-green-800 font-bold uppercase tracking-wider text-[7px] mb-0.5">Total Poin Prestasi</p>
                            <p className="text-sm font-bold font-mono text-green-700">+{totalPointsPrestasiFiltered} Poin</p>
                          </div>
                          <div className="p-1.5 bg-red-50 border border-red-100 rounded-sm">
                            <p className="text-red-800 font-bold uppercase tracking-wider text-[7px] mb-0.5">Total Poin Pelanggaran</p>
                            <p className="text-sm font-bold font-mono text-red-700 font-bold">-{totalPointsPelanggaranFiltered} Poin</p>
                          </div>
                          <div className={`p-1.5 rounded-sm border ${netTotalPointsFiltered >= 0 ? 'bg-emerald-50/70 border-emerald-100' : 'bg-rose-50/70 border-rose-100'}`}>
                            <p className={`font-bold uppercase tracking-wider text-[7px] mb-0.5 ${netTotalPointsFiltered >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>Akumulasi Skor Bersih</p>
                            <p className={`text-sm font-bold font-mono ${netTotalPointsFiltered >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {netTotalPointsFiltered >= 0 ? '+' : ''}{netTotalPointsFiltered} Poin
                            </p>
                          </div>
                        </div>
                        <p className="text-[7.5px] text-gray-500 text-center font-medium italic">
                          *Data dikalkulasikan berdasarkan riwayat kedisiplinan pada rentang tanggal {startDate} s/d {endDate}.
                        </p>
                      </div>
                    </div>

                    {/* Section V: Catatan Evaluasi */}
                    {filteredGrades.some((g) => g.notes) && (
                      <div className="mb-4">
                        <h5 className="font-bold text-[9px] uppercase tracking-wider mb-1 border-l-2 border-black pl-1.5">
                          V. Catatan Evaluasi & Perkembangan Khusus
                        </h5>
                        <div className="border border-black p-2 rounded-sm space-y-1 bg-gray-50/50 text-[8px]">
                          {filteredGrades.filter((g) => g.notes).map((g) => (
                            <div key={g.id}>
                              <span className="font-bold">{g.subjectName}:</span> <span className="italic">"{g.notes}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signatures */}
                    <div className="flex flex-col items-end mt-6 pr-4 text-[8px] leading-relaxed">
                      <div className="text-center">
                        <p>Kuningan, {getFormattedDate()}</p>
                        <p className="mt-0.5">Kepala Madrasah,</p>
                        <div className="h-10"></div>
                        <p className="font-bold underline">{portalSettings.kepalaMadrasah || "KH. Abdullah, M.Pd.I"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-outline-variant/30 pt-4 mt-4 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 border border-outline-variant/80 hover:bg-surface-container-low text-on-surface rounded-lg font-sans text-xs font-semibold cursor-pointer transition-all"
              >
                Tutup
              </button>
              {printProgress === 100 && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveReport}
                    className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Simpan Laporan (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={executeActualPrint}
                    className="px-5 py-2 bg-[#003527] text-white hover:bg-[#064e3b] rounded-lg font-sans text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>Cetak Sekarang (Dialog)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Section - Hidden on screen, visible only during print */}
      <div id="printable-report-area" className="hidden print:block font-sans text-xs text-black p-8 bg-white">
        {/* Header Raport */}
        <div className="text-center border-b-2 border-black pb-3 mb-6">
          <h4 className="text-md font-bold uppercase tracking-widest text-black">
            MADRASAH &amp; PONDOK UMMI
          </h4>
        </div>

        {/* Student Biodata */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-xs leading-relaxed">
          <div>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="font-bold py-1 w-28">Nama Santri</td>
                  <td className="w-4">:</td>
                  <td>{student.name}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="font-bold py-1">NIS</td>
                  <td>:</td>
                  <td>{student.nip}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="font-bold py-1">Kelas / Program</td>
                  <td>:</td>
                  <td>{student.class} / {student.program}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="font-bold py-1 w-28">Total Hafalan</td>
                  <td className="w-4">:</td>
                  <td>{totalBarisZiyadahFiltered} Baris (Ziyadah)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="font-bold py-1">Rata-rata Nilai</td>
                  <td>:</td>
                  <td>{averageScoreValFiltered > 0 ? `${letterGradeFiltered} (${averageScoreValFiltered.toFixed(1)})` : '-'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="font-bold py-1 font-bold">Rentang Tanggal</td>
                  <td>:</td>
                  <td className="font-bold">{startDate} s/d {endDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* I. Rekapitulasi Kehadiran */}
        <div className="mb-6">
          <h5 className="font-bold text-[11px] uppercase tracking-wider mb-2 border-l-4 border-black pl-2">
            I. Rekapitulasi Kehadiran
          </h5>
          <table className="w-full text-center border border-black border-collapse">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="p-1.5 border border-black text-xs">Sakit (S)</th>
                <th className="p-1.5 border border-black text-xs">Izin (I)</th>
                <th className="p-1.5 border border-black text-xs">Tanpa Keterangan (A)</th>
                <th className="p-1.5 border border-black text-xs">Persentase Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1.5 border border-black font-mono">{sakitCountFiltered} Hari</td>
                <td className="p-1.5 border border-black font-mono">{izinCountFiltered} Hari</td>
                <td className="p-1.5 border border-black font-mono">{alpaCountFiltered} Hari</td>
                <td className="p-1.5 border border-black font-bold font-mono">{attendanceRateValFiltered}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* II. Laporan Nilai Akademik */}
        <div className="mb-6">
          <h5 className="font-bold text-[11px] uppercase tracking-wider mb-2 border-l-4 border-black pl-2">
            II. Nilai Hasil Belajar (Akademik)
          </h5>
          <table className="w-full text-left border border-black border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 font-bold text-center">
                <th className="p-2 border border-black text-left">Mata Pelajaran</th>
                <th className="p-2 border border-black w-20">Tugas</th>
                <th className="p-2 border border-black w-20">UTS</th>
                <th className="p-2 border border-black w-20">UAS</th>
                <th className="p-2 border border-black w-24">Nilai Akhir</th>
                <th className="p-2 border border-black w-20">Grade</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((g) => (
                  <tr key={g.id}>
                    <td className="p-2 border border-black font-medium">{g.subjectName}</td>
                    <td className="p-2 border border-black text-center font-mono">{g.assignmentScore}</td>
                    <td className="p-2 border border-black text-center font-mono">{g.utsScore}</td>
                    <td className="p-2 border border-black text-center font-mono">{g.uasScore}</td>
                    <td className="p-2 border border-black text-center font-mono font-bold">{g.finalScore.toFixed(1)}</td>
                    <td className="p-2 border border-black text-center font-bold">{g.grade}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center border border-black italic">
                    Belum ada data nilai akademik pada rentang tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* III. Laporan Tahfidz (Riwayat Terakhir!) */}
        <div className="mb-6">
          <h5 className="font-bold text-[11px] uppercase tracking-wider mb-2 border-l-4 border-black pl-2">
            III. Perkembangan Hafalan Al-Qur'an (Riwayat Terakhir)
          </h5>
          <table className="w-full text-left border border-black border-collapse text-xs mb-2">
            <thead>
              <tr className="bg-gray-100 font-bold text-center">
                <th className="p-2 border border-black w-12">No</th>
                <th className="p-2 border border-black text-left">Tanggal Setoran</th>
                <th className="p-2 border border-black">Kategori</th>
                <th className="p-2 border border-black w-20">Juz</th>
                <th className="p-2 border border-black text-left">Surah</th>
                <th className="p-2 border border-black w-24">Ayat</th>
                <th className="p-2 border border-black w-20 font-bold">Nilai</th>
                <th className="p-2 border border-black w-16">Grade</th>
                <th className="p-2 border border-black">Penyimak (Ustadz)</th>
              </tr>
            </thead>
            <tbody>
              {latestRecordFiltered ? (
                <tr>
                  <td className="p-2 border border-black text-center font-mono">1</td>
                  <td className="p-2 border border-black font-mono text-center">{latestRecordFiltered.date}</td>
                  <td className="p-2 border border-black text-center">{latestRecordFiltered.type}</td>
                  <td className="p-2 border border-black text-center font-mono font-bold">Juz {latestRecordFiltered.juz}</td>
                  <td className="p-2 border border-black font-semibold">{latestRecordFiltered.surah}</td>
                  <td className="p-2 border border-black text-center font-mono">{latestRecordFiltered.startAyat} - {latestRecordFiltered.endAyat}</td>
                  <td className="p-2 border border-black text-center font-mono font-bold" style={{ color: '#1e3a8a' }}>{latestRecordFiltered.finalScore}</td>
                  <td className="p-2 border border-black text-center font-bold">{latestRecordFiltered.grade}</td>
                  <td className="p-2 border border-black">{latestRecordFiltered.ustadz}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={9} className="p-4 text-center border border-black italic text-gray-500">
                    Belum ada data setoran hafalan pada rentang tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="text-xs flex justify-between items-center bg-emerald-50 border border-emerald-100 p-2 rounded-sm">
            <span className="font-bold text-emerald-900 uppercase tracking-wider text-[9px]">Total Akumulasi Baris Setoran Ziyadah (Rentang Tanggal):</span>
            <span className="font-bold font-mono text-emerald-700 bg-white px-3 py-1 rounded border border-emerald-200">{totalBarisZiyadahFiltered} Baris</span>
          </div>
        </div>

        {/* IV. Catatan Kedisiplinan & Prestasi */}
        <div className="mb-6">
          <h5 className="font-bold text-[11px] uppercase tracking-wider mb-2 border-l-4 border-black pl-2">
            IV. Rekapitulasi Kedisiplinan &amp; Prestasi (Sistem Poin)
          </h5>
          <div className="border border-black p-4 rounded-sm space-y-3 bg-gray-50/50">
            <div className="grid grid-cols-3 gap-4 text-center text-xs font-semibold leading-relaxed">
              <div className="p-2 bg-green-50 border border-green-100 rounded-sm">
                <p className="text-green-800 font-bold uppercase tracking-wider text-[9px] mb-1">Total Poin Prestasi</p>
                <p className="text-md font-bold font-mono text-green-700">+{totalPointsPrestasiFiltered} Poin</p>
              </div>
              <div className="p-2 bg-red-50 border border-red-100 rounded-sm">
                <p className="text-red-800 font-bold uppercase tracking-wider text-[9px] mb-1">Total Poin Pelanggaran</p>
                <p className="text-md font-bold font-mono text-red-700 font-bold">-{totalPointsPelanggaranFiltered} Poin</p>
              </div>
              <div className={`p-2 rounded-sm border ${netTotalPointsFiltered >= 0 ? 'bg-emerald-50/70 border-emerald-100' : 'bg-rose-50/70 border-rose-100'}`}>
                <p className={`font-bold uppercase tracking-wider text-[9px] mb-1 ${netTotalPointsFiltered >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>Akumulasi Skor Bersih</p>
                <p className={`text-md font-bold font-mono ${netTotalPointsFiltered >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {netTotalPointsFiltered >= 0 ? '+' : ''}{netTotalPointsFiltered} Poin
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 text-center font-medium italic">
              *Data dikalkulasikan berdasarkan riwayat kedisiplinan pada rentang tanggal {startDate} s/d {endDate}.
            </p>
          </div>
        </div>

        {/* V. Evaluasi Ustadz & Catatan */}
        {filteredGrades.some((g) => g.notes) && (
          <div className="mb-8">
            <h5 className="font-bold text-[11px] uppercase tracking-wider mb-2 border-l-4 border-black pl-2">
              V. Catatan Evaluasi & Perkembangan Khusus
            </h5>
            <div className="border border-black p-3 rounded-sm space-y-1.5 bg-gray-50/50">
              {filteredGrades.filter((g) => g.notes).map((g) => (
                <div key={g.id} className="text-xs">
                  <span className="font-bold">{g.subjectName}:</span> <span className="italic">"{g.notes}"</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="flex flex-col items-end mt-12 pr-12 text-xs leading-relaxed">
          <div className="text-center">
            <p>Kuningan, {getFormattedDate()}</p>
            <p className="mt-1">Kepala Madrasah,</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-sm">{portalSettings.kepalaMadrasah || "KH. Abdullah, M.Pd.I"}</p>
          </div>
        </div>

        {/* Official Footer Watermark */}
        <div className="mt-16 pt-3 border-t border-gray-200 text-center text-[10px] text-gray-400 font-medium tracking-wide flex justify-between items-center">
          <span>* MADRASAH &amp; PONDOK UMMI</span>
          <span className="font-semibold uppercase text-gray-500 tracking-wider">Sistem Informasi UMMI</span>
        </div>
      </div>
    </div>
  );
}
