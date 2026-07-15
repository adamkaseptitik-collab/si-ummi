import React, { useState, useEffect } from 'react';
import { Student, AppView, MemorizationRecord, UserAccount, ScheduleItem, AgendaItem } from '../types';
import { SCHEDULE_ITEMS, AGENDA_ITEMS, CLASSES, PROGRAMS } from '../data';

interface DashboardViewProps {
  students: Student[];
  records: MemorizationRecord[];
  currentUser: UserAccount | null;
  setView: (view: AppView) => void;
  setSelectedStudentId: (id: string | null) => void;
  onAddStudent: () => void;
  classes: string[];
}

export default function DashboardView({
  students,
  records,
  currentUser,
  setView,
  setSelectedStudentId,
  onAddStudent,
  classes,
}: DashboardViewProps) {
  const [dashClass, setDashClass] = useState('');
  const [dashProgram, setDashProgram] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrStatus, setQrStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scannedSantri, setScannedSantri] = useState<Student | null>(null);

  const [previewStudent, setPreviewStudent] = useState<{ name: string; photoUrl: string } | null>(null);

  const handleDownloadPhoto = async (url: string, name: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, '_')}_foto.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Gagal mengunduh menggunakan fetch, beralih ke pembukaan tab baru:", error);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `${name.replace(/\s+/g, '_')}_foto.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

  // Managing Agenda and Schedule locally with localStorage persistence
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(() => {
    const cached = localStorage.getItem('siakad_dashboard_agenda');
    return cached ? JSON.parse(cached) : AGENDA_ITEMS;
  });

  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(() => {
    const cached = localStorage.getItem('siakad_dashboard_schedule');
    return cached ? JSON.parse(cached) : SCHEDULE_ITEMS;
  });

  // Real-time clock for Schedule auto-checking
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // tick every 10 seconds for real-time responsiveness
    return () => clearInterval(timer);
  }, []);

  // Process schedule items based on the current local system time
  const processedScheduleItems = (() => {
    const currentH = currentTime.getHours();
    const currentM = currentTime.getMinutes();
    const currentMinutes = currentH * 60 + currentM;

    const itemsWithMinutes = scheduleItems.map(item => {
      let startMinutes = 0;
      let endMinutes = 0;
      try {
        const matches = [...item.time.matchAll(/(\d{1,2})[:.](\d{2})/g)];
        if (matches.length >= 2) {
          startMinutes = parseInt(matches[0][1], 10) * 60 + parseInt(matches[0][2], 10);
          endMinutes = parseInt(matches[1][1], 10) * 60 + parseInt(matches[1][2], 10);
        } else if (matches.length === 1) {
          startMinutes = parseInt(matches[0][1], 10) * 60 + parseInt(matches[0][2], 10);
          endMinutes = startMinutes + 60; // fallback to 1 hour duration
        }
      } catch (e) {
        console.error("Error parsing schedule item time:", item.time, e);
      }
      return {
        item,
        startMinutes,
        endMinutes
      };
    });

    const result = itemsWithMinutes.map(wrapper => {
      const isPast = currentMinutes >= wrapper.endMinutes;
      return {
        ...wrapper.item,
        isPast,
        isCurrent: false
      };
    });

    // Mark the first non-past item as current/active
    const activeIndex = result.findIndex(item => !item.isPast);
    if (activeIndex !== -1) {
      result[activeIndex].isCurrent = true;
    }

    return result;
  })();

  // Modal open/close states
  const [isEditAgendaOpen, setIsEditAgendaOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);

  // States for Agenda Form
  const [agendaFormId, setAgendaFormId] = useState<string | null>(null);
  const [agendaFormTitle, setAgendaFormTitle] = useState('');
  const [agendaFormDesc, setAgendaFormDesc] = useState('');
  const [agendaFormDate, setAgendaFormDate] = useState('');
  const [agendaFormLabel, setAgendaFormLabel] = useState<'Penting' | 'Informasi' | 'Kegiatan'>('Informasi');

  // States for Schedule Form
  const [scheduleFormId, setScheduleFormId] = useState<string | null>(null);
  const [scheduleFormTime, setScheduleFormTime] = useState('');
  const [scheduleFormTitle, setScheduleFormTitle] = useState('');
  const [scheduleFormLoc, setScheduleFormLoc] = useState('');
  const [scheduleFormIcon, setScheduleFormIcon] = useState('school');
  const [scheduleFormIsCurrent, setScheduleFormIsCurrent] = useState(false);
  const [scheduleFormIsPast, setScheduleFormIsPast] = useState(false);

  // Agenda Functions
  const handleSaveAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaFormTitle || !agendaFormDesc || !agendaFormDate) {
      alert('Semua kolom wajib diisi!');
      return;
    }

    let updated: AgendaItem[];
    if (agendaFormId) {
      updated = agendaItems.map((item) =>
        item.id === agendaFormId
          ? {
              ...item,
              title: agendaFormTitle,
              description: agendaFormDesc,
              date: agendaFormDate,
              label: agendaFormLabel,
            }
          : item
      );
    } else {
      const newItem: AgendaItem = {
        id: `ag_user_${Date.now()}`,
        title: agendaFormTitle,
        description: agendaFormDesc,
        date: agendaFormDate,
        label: agendaFormLabel,
      };
      updated = [newItem, ...agendaItems];
    }

    setAgendaItems(updated);
    localStorage.setItem('siakad_dashboard_agenda', JSON.stringify(updated));
    resetAgendaForm();
  };

  const handleDeleteAgenda = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
      const updated = agendaItems.filter((item) => item.id !== id);
      setAgendaItems(updated);
      localStorage.setItem('siakad_dashboard_agenda', JSON.stringify(updated));
    }
  };

  const resetAgendaForm = () => {
    setAgendaFormId(null);
    setAgendaFormTitle('');
    setAgendaFormDesc('');
    setAgendaFormDate('');
    setAgendaFormLabel('Informasi');
  };

  const startEditAgenda = (item: AgendaItem) => {
    setAgendaFormId(item.id);
    setAgendaFormTitle(item.title);
    setAgendaFormDesc(item.description);
    setAgendaFormDate(item.date);
    setAgendaFormLabel(item.label || 'Informasi');
  };

  // Schedule Functions
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleFormTime || !scheduleFormTitle || !scheduleFormLoc) {
      alert('Semua kolom wajib diisi!');
      return;
    }

    let updated: ScheduleItem[];
    if (scheduleFormId) {
      updated = scheduleItems.map((item) =>
        item.id === scheduleFormId
          ? {
              ...item,
              time: scheduleFormTime,
              title: scheduleFormTitle,
              location: scheduleFormLoc,
              icon: scheduleFormIcon,
              isCurrent: scheduleFormIsCurrent,
              isPast: scheduleFormIsPast,
            }
          : item
      );
    } else {
      const newItem: ScheduleItem = {
        id: `sc_user_${Date.now()}`,
        time: scheduleFormTime,
        title: scheduleFormTitle,
        location: scheduleFormLoc,
        icon: scheduleFormIcon,
        isCurrent: scheduleFormIsCurrent,
        isPast: scheduleFormIsPast,
      };
      updated = [...scheduleItems, newItem];
    }

    setScheduleItems(updated);
    localStorage.setItem('siakad_dashboard_schedule', JSON.stringify(updated));
    resetScheduleForm();
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal kegiatan ini?')) {
      const updated = scheduleItems.filter((item) => item.id !== id);
      setScheduleItems(updated);
      localStorage.setItem('siakad_dashboard_schedule', JSON.stringify(updated));
    }
  };

  const resetScheduleForm = () => {
    setScheduleFormId(null);
    setScheduleFormTime('');
    setScheduleFormTitle('');
    setScheduleFormLoc('');
    setScheduleFormIcon('school');
    setScheduleFormIsCurrent(false);
    setScheduleFormIsPast(false);
  };

  const startEditSchedule = (item: ScheduleItem) => {
    setScheduleFormId(item.id);
    setScheduleFormTime(item.time);
    setScheduleFormTitle(item.title);
    setScheduleFormLoc(item.location);
    setScheduleFormIcon(item.icon);
    setScheduleFormIsCurrent(!!item.isCurrent);
    setScheduleFormIsPast(!!item.isPast);
  };

  // 1. Live distribution based on last input setoran
  const studentsWithLiveJuz = students.map((student) => {
    const studentRecords = records.filter((r) => r.studentId === student.id);
    if (studentRecords.length === 0) {
      return { ...student, liveJuz: student.tahfidzJuz };
    }
    const sortedRecords = [...studentRecords].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });
    return { ...student, liveJuz: sortedRecords[0].juz };
  });

  // Filter the student array dynamically
  const filteredStudents = studentsWithLiveJuz.filter((s) => {
    const matchesClass = !dashClass || s.class === dashClass;
    const matchesProgram = !dashProgram || s.program === dashProgram;
    return matchesClass && matchesProgram;
  });

  // 3. Get last 5 memorization achievements (recent setoran)
  const last5Achievements = [...records]
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    })
    .slice(0, 5);

  // Calculate live KPI metrics
  const rawTotalSantri = filteredStudents.length;
  const activeSantri = filteredStudents.filter((s) => s.status === 'Aktif').length;
  const nonActiveSantri = filteredStudents.filter((s) => s.status !== 'Aktif').length;
  
  // Calculate average lines per day of Ziyadah (for the filtered students)
  const ziyadahRecords = records.filter(r => {
    const isZiyadah = r.type && r.type.toLowerCase() === 'ziyadah';
    if (!isZiyadah) return false;
    return filteredStudents.some(s => s.id === r.studentId || s.name.trim().toLowerCase() === r.studentName.trim().toLowerCase());
  });

  const ziyadahByDate: { [date: string]: number } = {};
  ziyadahRecords.forEach(r => {
    const lNum = parseInt(String(r.line));
    const lines = isNaN(lNum) ? 0 : lNum;
    ziyadahByDate[r.date] = (ziyadahByDate[r.date] || 0) + lines;
  });

  const uniqueDays = Object.keys(ziyadahByDate).length;
  const totalZiyadahLines = Object.values(ziyadahByDate).reduce((sum, val) => sum + val, 0);

  const averageScore = uniqueDays > 0
    ? Number((totalZiyadahLines / uniqueDays).toFixed(1))
    : 0;

  // Juz categories distribution from filtered pool (using liveJuz)
  const juz1_5 = filteredStudents.filter((s) => s.liveJuz >= 1 && s.liveJuz <= 5).length;
  const juz6_10 = filteredStudents.filter((s) => s.liveJuz >= 6 && s.liveJuz <= 10).length;
  const juz11_15 = filteredStudents.filter((s) => s.liveJuz >= 11 && s.liveJuz <= 15).length;
  const juz16_20 = filteredStudents.filter((s) => s.liveJuz >= 16 && s.liveJuz <= 20).length;
  const juz21_30 = filteredStudents.filter((s) => s.liveJuz >= 21).length;

  const juzCategories = [
    { label: 'Juz 1-5', count: juz1_5, color: '#10b981' },
    { label: 'Juz 6-10', count: juz6_10, color: '#3b82f6' },
    { label: 'Juz 11-15', count: juz11_15, color: '#f59e0b' },
    { label: 'Juz 16-20', count: juz16_20, color: '#8b5cf6' },
    { label: 'Juz 21-30', count: juz21_30, color: '#ec4899' },
  ];

  const maxJuzCount = Math.max(...juzCategories.map((c) => c.count), 1);

  // Proporsi Gender
  const countLaki = filteredStudents.filter((s) => s.gender === 'Laki-laki').length;
  const countPerempuan = filteredStudents.filter((s) => s.gender === 'Perempuan').length;
  const totalGender = countLaki + countPerempuan || 1;
  const pctLaki = Math.round((countLaki / totalGender) * 100);
  const pctPerempuan = Math.round((countPerempuan / totalGender) * 100);

  const handleOpenQrScanner = () => {
    setQrModalOpen(true);
    setQrStatus('scanning');
    setScannedSantri(null);
    setTimeout(() => {
      // Simulate scanning one random student after 2 seconds
      if (filteredStudents.length > 0) {
        const randomStudent = filteredStudents[Math.floor(Math.random() * filteredStudents.length)];
        setScannedSantri(randomStudent);
        setQrStatus('success');
      } else {
        setQrStatus('idle');
        setQrModalOpen(false);
        alert('Tidak ada data santri yang cocok untuk discan pada filter saat ini.');
      }
    }, 1800);
  };

  const handleResetDashboardFilters = () => {
    setDashClass('');
    setDashProgram('');
  };

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      {/* Quick Actions & Dashboard Filters Menu */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-outline-variant/60 p-4 rounded-xl shadow-3xs">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            id="btn-tambah-santri"
            onClick={onAddStudent}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-primary text-on-primary px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-all shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Tambah Santri</span>
          </button>
          <button
            id="btn-input-setoran"
            onClick={() => setView('tahfidz_input')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 border border-primary text-primary px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/5 transition-all bg-surface shadow-3xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">post_add</span>
            <span>Input Setoran</span>
          </button>
          <button
            id="btn-absensi-qr"
            onClick={() => setView('absensi_pengajar')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 border border-primary text-primary px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/5 transition-all bg-surface shadow-3xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>Absensi</span>
          </button>
        </div>

        {/* Real-time Dashboard Filters */}
        <div className="flex items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/30 justify-end">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[18px]">filter_list</span>
            <span className="font-semibold text-on-surface-variant text-[11px] mr-1 hidden sm:inline">Filter Dasbor:</span>
          </div>

          <select
            value={dashClass}
            onChange={(e) => setDashClass(e.target.value)}
            className="px-2 py-1.5 border border-outline-variant/80 rounded-md bg-surface text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="">Semua Kelas</option>
            {classes.filter((c) => c !== 'Semua Kelas').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={dashProgram}
            onChange={(e) => setDashProgram(e.target.value)}
            className="px-2 py-1.5 border border-outline-variant/80 rounded-md bg-surface text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="">Semua Program</option>
            {PROGRAMS.filter((p) => p !== 'Semua Program').map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {(dashClass || dashProgram) && (
            <button
              onClick={handleResetDashboardFilters}
              className="p-1 text-primary hover:bg-primary/5 rounded-full cursor-pointer"
              title="Reset Filter"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}

          {/* Theme Toggle Sun/Moon Icon */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all cursor-pointer flex items-center justify-center border border-outline-variant/40 ml-1"
            title={isDarkMode ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {/* Total Santri */}
        <div
          onClick={() => setView('students')}
          className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between cursor-pointer hover:border-primary/60 hover:bg-surface-container-low transition-all shadow-3xs"
        >
          <div className="flex justify-between items-start">
            <span className="font-bold text-on-surface-variant uppercase tracking-wider text-[9px]">Santri Terfilter</span>
            <div className="p-1 bg-secondary-fixed text-primary rounded-md">
              <span className="material-symbols-outlined text-[18px] font-bold">groups</span>
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="font-display text-xl font-extrabold text-primary">{rawTotalSantri} Orang</h3>
            <p className="text-on-surface-variant text-[10px] mt-0.5">Dari total {students.length} santri aktif</p>
          </div>
        </div>

        {/* Rata-rata Nilai */}
        <div
          className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-3xs"
        >
          <div className="flex justify-between items-start">
            <span className="font-bold text-on-surface-variant uppercase tracking-wider text-[9px]">Rerata Nilai Setoran</span>
            <div className="p-1 bg-secondary-fixed text-primary rounded-md">
              <span className="material-symbols-outlined text-[18px] font-bold">star</span>
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="font-display text-xl font-extrabold text-primary">{averageScore} Baris / Hari</h3>
            <p className="text-on-surface-variant text-[10px] mt-0.5">Rerata baris Ziyadah per hari</p>
          </div>
        </div>

        {/* Santri Aktif */}
        <div
          onClick={() => setView('students')}
          className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between cursor-pointer hover:border-primary/60 hover:bg-surface-container-low transition-all shadow-3xs"
        >
          <div className="flex justify-between items-start">
            <span className="font-bold text-on-surface-variant uppercase tracking-wider text-[9px]">Status Aktif</span>
            <div className="p-1 bg-emerald-50 text-emerald-800 rounded-md">
              <span className="material-symbols-outlined text-[18px] font-bold">how_to_reg</span>
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="font-display text-xl font-extrabold text-emerald-700">{activeSantri} Santri</h3>
            <p className="text-on-surface-variant text-[10px] mt-0.5">{nonActiveSantri} Berstatus nonaktif/alumni</p>
          </div>
        </div>

        {/* Rata-rata Juz Hafalan */}
        <div
          className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-3xs"
        >
          <div className="flex justify-between items-start">
            <span className="font-bold text-on-surface-variant uppercase tracking-wider text-[9px]">Total Kelas Terdaftar</span>
            <div className="p-1 bg-amber-50 text-amber-800 rounded-md">
              <span className="material-symbols-outlined text-[18px] font-bold">meeting_room</span>
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="font-display text-xl font-extrabold text-amber-700">
              {dashClass ? '1 Kelas' : `${classes.length} Rombel`}
            </h3>
            <p className="text-on-surface-variant text-[10px] mt-0.5">Tingkat Madrasah &amp; Pondok</p>
          </div>
        </div>
      </div>

      {/* Menu Layanan Utama Madrasah */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">grid_view</span>
            <span>Menu Layanan Aplikasi Madrasah</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Menu Data Santri */}
          <div
            onClick={() => setView('students')}
            className="bg-white border border-outline-variant/60 p-4.5 rounded-xl hover-elevate cursor-pointer hover:border-primary/70 hover:bg-surface-container-low transition-all shadow-3xs flex flex-col gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-primary flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-sans text-xs font-bold text-primary group-hover:text-primary-container transition-colors">Data Santri</h3>
              <p className="text-on-surface-variant text-[10px] leading-snug">Roster data profil lengkap, NISN, status keaktifan, &amp; wali.</p>
            </div>
          </div>

          {/* Menu Input Setoran */}
          <div
            onClick={() => setView('tahfidz_input')}
            className="bg-white border border-outline-variant/60 p-4.5 rounded-xl hover-elevate cursor-pointer hover:border-primary/70 hover:bg-surface-container-low transition-all shadow-3xs flex flex-col gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-primary flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
              <span className="material-symbols-outlined text-[22px]">post_add</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-sans text-xs font-bold text-primary group-hover:text-primary-container transition-colors">Input Setoran</h3>
              <p className="text-on-surface-variant text-[10px] leading-snug">Rekam hafalan baru, tajwid, makharij, &amp; nilai kelancaran.</p>
            </div>
          </div>

          {/* Menu Laporan Pencapaian */}
          <div
            onClick={() => setView('laporan_pencapaian')}
            className="bg-white border border-outline-variant/60 p-4.5 rounded-xl hover-elevate cursor-pointer hover:border-primary/70 hover:bg-surface-container-low transition-all shadow-3xs flex flex-col gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-primary flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
              <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-sans text-xs font-bold text-primary group-hover:text-primary-container transition-colors">Laporan Hafalan</h3>
              <p className="text-on-surface-variant text-[10px] leading-snug">Grafik pencapaian, rekap setoran, dan ekspor data PDF/CSV.</p>
            </div>
          </div>

          {/* Menu Catatan Poin */}
          <div
            onClick={() => setView('catatan_poin')}
            className="bg-white border border-outline-variant/60 p-4.5 rounded-xl hover-elevate cursor-pointer hover:border-primary/70 hover:bg-surface-container-low transition-all shadow-3xs flex flex-col gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-primary flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
              <span className="material-symbols-outlined text-[22px]">stars</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-sans text-xs font-bold text-primary group-hover:text-primary-container transition-colors">Catatan Poin</h3>
              <p className="text-on-surface-variant text-[10px] leading-snug">Input poin pelanggaran &amp; prestasi santri secara fleksibel.</p>
            </div>
          </div>

          {/* Menu Pengaturan */}
          <div
            onClick={() => setView('pengaturan')}
            className="bg-white border border-outline-variant/60 p-4.5 rounded-xl hover-elevate cursor-pointer hover:border-primary/70 hover:bg-surface-container-low transition-all shadow-3xs flex flex-col gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-primary flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-sans text-xs font-bold text-primary group-hover:text-primary-container transition-colors">Pengaturan Sistem</h3>
              <p className="text-on-surface-variant text-[10px] leading-snug">Profil madrasah, NSM, backup database, &amp; hak akses.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout for Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Main Chart Area - Interactive Juz Distribution */}
        <div className="lg:col-span-8 bg-white border border-outline-variant/60 rounded-xl p-6 flex flex-col min-h-[350px] shadow-3xs hover-elevate">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-display text-sm font-bold text-primary">Peta Sebaran Hafalan Juz Santri (Live)</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">Grafik sebaran level hafalan juz dari santri yang terfilter saat ini.</p>
            </div>
            <span className="font-mono text-[10px] bg-secondary-fixed text-primary px-2 py-0.5 rounded font-bold uppercase">
              {filteredStudents.length} Data Santri
            </span>
          </div>

          {rawTotalSantri > 0 ? (
            <div className="flex-1 flex items-end justify-between gap-4 pt-4 min-h-[180px]">
              {juzCategories.map((cat) => {
                const percentHeight = (cat.count / maxJuzCount) * 100;
                return (
                  <div key={cat.label} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-secondary-fixed px-1.5 py-0.5 rounded whitespace-nowrap">
                      {cat.count} Santri ({Math.round((cat.count / Math.max(rawTotalSantri, 1)) * 100)}%)
                    </span>
                    <div className="w-full bg-surface-container-high rounded-md h-[150px] relative overflow-hidden flex items-end">
                      <div
                        className="w-full rounded-t-xs transition-all duration-500 ease-out"
                        style={{
                          height: `${Math.max(percentHeight, 4)}%`,
                          backgroundColor: cat.color,
                        }}
                      ></div>
                    </div>
                    <span className="font-semibold text-[10px] text-on-surface-variant uppercase tracking-wider">{cat.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-outline-variant/40 rounded-lg bg-surface p-8 text-on-surface-variant">
              Tidak ada data santri yang cocok untuk dirender dalam grafik.
            </div>
          )}
        </div>

        {/* Secondary Chart - Gender Breakdown & Status Card */}
        <div className="lg:col-span-4 bg-white border border-outline-variant/60 rounded-xl p-6 flex flex-col min-h-[350px] shadow-3xs hover-elevate">
          <div className="mb-4">
            <h2 className="font-display text-sm font-bold text-primary">Proporsi Gender &amp; Status</h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Demografi santri berdasarkan data aktif terfilter.</p>
          </div>

          {rawTotalSantri > 0 ? (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {/* Gender Bar Chart visualization */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-blue-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Laki-laki ({countLaki})</span>
                  </span>
                  <span className="text-pink-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <span>Perempuan ({countPerempuan})</span>
                  </span>
                </div>
                {/* Visual stacked horizontal bar */}
                <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: `${pctLaki}%` }}
                    title={`Laki-laki: ${pctLaki}%`}
                  ></div>
                  <div
                    className="bg-pink-500 h-full transition-all duration-500"
                    style={{ width: `${pctPerempuan}%` }}
                    title={`Perempuan: ${pctPerempuan}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                  <span>{pctLaki}% Laki-laki</span>
                  <span>{pctPerempuan}% Perempuan</span>
                </div>
              </div>

              {/* Status Breakdown card */}
              <div className="bg-surface-container-low rounded-lg p-3.5 space-y-2 border border-outline-variant/20">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Proporsi Program</span>
                <div className="flex justify-between text-xs py-1 border-b border-outline-variant/20">
                  <span className="font-medium text-on-surface">Pondok / Boarding</span>
                  <span className="font-bold text-primary">
                    {filteredStudents.filter((s) => s.program === 'Pondok').length} Santri
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="font-medium text-on-surface">Madrasah</span>
                  <span className="font-bold text-primary">
                    {filteredStudents.filter((s) => s.program === 'Madrasah').length} Santri
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-outline-variant/40 rounded-lg bg-surface p-8 text-on-surface-variant">
              Tidak ada data demografi yang cocok dengan filter saat ini.
            </div>
          )}
        </div>
      </div>

      {/* Complex Middle Section: Agenda, Timeline, and Tahfidz Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Agenda & Pengumuman */}
        <div className="bg-white border border-outline-variant/60 rounded-xl p-5 flex flex-col h-[400px] shadow-3xs hover-elevate">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant/30 pb-3">
            <h2 className="font-display text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
              <span>Agenda &amp; Pengumuman</span>
            </h2>
            {(currentUser?.role === 'super_admin' || currentUser?.role === 'ustadz') && (
              <button
                onClick={() => {
                  resetAgendaForm();
                  setIsEditAgendaOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary-container font-semibold hover:underline bg-primary/5 px-2 py-1 rounded-md text-[11px] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>Kelola</span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {agendaItems.length > 0 ? (
              agendaItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg bg-surface-container-low border-l-4 border-primary transition-all hover:bg-surface-container-high/40 text-left relative group/item"
                >
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <h3 className="font-sans text-sm font-semibold text-on-surface line-clamp-1">{item.title}</h3>
                    {item.label === 'Penting' && (
                      <span className="font-sans text-[9px] font-bold text-primary bg-secondary-fixed px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                        {item.label}
                      </span>
                    )}
                    {item.label === 'Kegiatan' && (
                      <span className="font-sans text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                        {item.label}
                      </span>
                    )}
                    {item.label === 'Informasi' && (
                      <span className="font-sans text-[9px] font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                        {item.label}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{item.description}</p>
                  <div className="mt-2.5 text-[11px] text-on-surface-variant/75 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">event</span>
                      <span>{item.date}</span>
                    </div>
                    {(currentUser?.role === 'super_admin' || currentUser?.role === 'ustadz') && (
                      <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1.5">
                        <button
                          onClick={() => {
                            startEditAgenda(item);
                            setIsEditAgendaOpen(true);
                          }}
                          className="p-1 hover:bg-primary/10 rounded text-primary"
                          title="Edit Agenda"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAgenda(item.id)}
                          className="p-1 hover:bg-red-50 rounded text-red-700"
                          title="Hapus Agenda"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-on-surface-variant">
                Tidak ada agenda terdaftar.
              </div>
            )}
          </div>
        </div>

        {/* Jadwal Hari Ini (Timeline) */}
        <div className="bg-white border border-outline-variant/60 rounded-xl p-5 flex flex-col h-[400px] shadow-3xs hover-elevate">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant/30 pb-3">
            <h2 className="font-display text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              <span>Jadwal Kegiatan Hari Ini</span>
            </h2>
            {(currentUser?.role === 'super_admin' || currentUser?.role === 'ustadz') && (
              <button
                onClick={() => {
                  resetScheduleForm();
                  setIsEditScheduleOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary-container font-semibold hover:underline bg-primary/5 px-2 py-1 rounded-md text-[11px] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>Kelola</span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pl-1 pr-1 relative">
            {/* Timeline Vertical Line */}
            {processedScheduleItems.length > 0 && (
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-outline-variant/40"></div>
            )}

            <div className="space-y-5 relative z-10 text-left">
              {processedScheduleItems.length > 0 ? (
                processedScheduleItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex gap-4 items-start relative group/schedule-item ${item.isPast ? 'opacity-55' : ''}`}
                  >
                    {item.isCurrent ? (
                      <div className="w-9 h-9 rounded-full bg-primary border-4 border-secondary-fixed flex items-center justify-center shrink-0 relative shadow-sm">
                        <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-45"></div>
                        <span className="material-symbols-outlined text-[15px] text-on-primary">{item.icon}</span>
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[15px] text-on-surface-variant">{item.isPast ? 'done' : item.icon}</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-start">
                        <div className={`font-mono text-xs ${item.isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                          {item.time}
                        </div>
                        {(currentUser?.role === 'super_admin' || currentUser?.role === 'ustadz') && (
                          <div className="opacity-0 group-hover/schedule-item:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => {
                                startEditSchedule(item);
                                setIsEditScheduleOpen(true);
                              }}
                              className="p-0.5 hover:bg-primary/10 rounded text-primary"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(item.id)}
                              className="p-0.5 hover:bg-red-50 rounded text-red-700"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="font-sans text-sm font-semibold text-on-surface">
                        {item.title}
                      </div>
                      <div className="font-sans text-xs text-on-surface-variant">
                        {item.location}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-on-surface-variant">
                  Tidak ada jadwal terdaftar.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informasi Hafalan Terakhir Santri */}
        <div className="bg-white border border-outline-variant/60 rounded-xl p-5 flex flex-col h-[400px] shadow-3xs hover-elevate">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant/30 pb-3">
            <h2 className="font-display text-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <span>Informasi Hafalan Terakhir Santri</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {last5Achievements.length > 0 ? (
              <table className="w-full text-left border-collapse table-zebra">
                <tbody>
                  {last5Achievements.map((rec, idx) => {
                    const studentObj = students.find(s => s.id === rec.studentId);
                    return (
                      <tr
                        key={rec.id}
                        className="border-b border-outline-variant/20 hover:bg-surface-container-low/40 cursor-pointer"
                        onClick={() => {
                          setSelectedStudentId(rec.studentId);
                          setView('student_portal');
                        }}
                      >
                        <td className="py-2.5 pl-2 w-8 font-sans text-xs font-bold text-on-surface-variant text-center">
                          #{idx + 1}
                        </td>
                        <td className="py-2.5 px-2 text-left">
                          <div className="flex items-center gap-3">
                            {studentObj?.photoUrl ? (
                              <img
                                alt={rec.studentName}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover border border-outline-variant/40 shadow-xs animate-fade-in hover:scale-115 transition-transform duration-200 cursor-zoom-in relative z-10"
                                src={studentObj.photoUrl}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewStudent({ name: rec.studentName, photoUrl: studentObj.photoUrl });
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-[10px] font-bold text-on-surface-variant shadow-xs">
                                {rec.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <div className="font-sans text-xs font-semibold text-on-surface line-clamp-1">{rec.studentName}</div>
                              <div className="font-sans text-[10px] text-on-surface-variant">
                                {studentObj?.class || "Santri"} • {rec.date}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-semibold text-primary text-[11px] line-clamp-1 max-w-[120px]">
                              {rec.surah} (Juz {rec.juz})
                            </span>
                            <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold">
                              Hal. {rec.page}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-on-surface-variant">
                Tidak ada data setoran hafalan terakhir.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Absensi QR Simulation Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-[#003527]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-outline-variant max-w-sm w-full p-6 shadow-xl relative animate-fade-in text-left">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-[48px] text-primary">qr_code_scanner</span>
              <h3 className="font-display text-sm font-bold text-primary">Simulasi Absensi QR</h3>
              <p className="text-xs text-on-surface-variant">Scanning kartu santri (NFC / QR Card)...</p>

              {/* Scanner Screen */}
              <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 bg-surface-container-low flex flex-col items-center justify-center relative overflow-hidden">
                {qrStatus === 'scanning' && (
                  <>
                    <div className="w-full h-1 bg-primary absolute top-0 left-0 animate-bounce"></div>
                    <span className="material-symbols-outlined text-[36px] text-primary/40 animate-pulse">barcode_scanner</span>
                    <span className="text-[11px] text-primary font-semibold mt-2">Membaca data kartu...</span>
                  </>
                )}

                {qrStatus === 'success' && scannedSantri && (
                  <div className="space-y-3 w-full text-center animate-fade-in">
                    <div className="flex justify-center">
                      {scannedSantri.photoUrl ? (
                        <img
                          alt={scannedSantri.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-sm hover:scale-110 transition-transform duration-200 cursor-zoom-in"
                          src={scannedSantri.photoUrl}
                          onClick={() => setPreviewStudent({ name: scannedSantri.name, photoUrl: scannedSantri.photoUrl })}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-secondary-fixed text-primary flex items-center justify-center font-bold text-lg border-2 border-primary shadow-sm">
                          {scannedSantri.initials || 'ST'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-sans text-xs font-bold text-primary">{scannedSantri.name}</h4>
                      <p className="text-[10px] text-on-surface-variant">NIS: {scannedSantri.nisn || scannedSantri.nip || '-'} | {scannedSantri.class}</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Hadir Sukses (07:35)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleOpenQrScanner}
                  className="flex-1 py-2 rounded-lg bg-surface border border-outline-variant/60 text-on-surface hover:bg-surface-container-low transition-colors text-xs font-semibold cursor-pointer"
                >
                  Scan Ulang
                </button>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors text-xs font-semibold cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kelola Agenda Modal */}
      {isEditAgendaOpen && (
        <div className="fixed inset-0 bg-[#003527]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-outline-variant max-w-md w-full p-6 shadow-xl relative animate-fade-in text-left">
            <button
              onClick={() => setIsEditAgendaOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-display text-sm font-bold text-primary mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
              <span>{agendaFormId ? 'Edit Agenda & Pengumuman' : 'Tambah Agenda & Pengumuman'}</span>
            </h3>

            <form onSubmit={handleSaveAgenda} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">Judul Agenda *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ujian Semester Genap"
                  value={agendaFormTitle}
                  onChange={(e) => setAgendaFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">Deskripsi Agenda *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Keterangan lengkap kegiatan..."
                  value={agendaFormDesc}
                  onChange={(e) => setAgendaFormDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">Tanggal / Waktu *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 15 Agustus 2024"
                    value={agendaFormDate}
                    onChange={(e) => setAgendaFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">Label / Status</label>
                  <select
                    value={agendaFormLabel}
                    onChange={(e) => setAgendaFormLabel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer text-on-surface"
                  >
                    <option value="Informasi">Informasi</option>
                    <option value="Penting">Penting</option>
                    <option value="Kegiatan">Kegiatan</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/25">
                {agendaFormId && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteAgenda(agendaFormId);
                      setIsEditAgendaOpen(false);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer mr-auto"
                  >
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetAgendaForm();
                    setIsEditAgendaOpen(false);
                  }}
                  className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container-low rounded-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kelola Jadwal Modal */}
      {isEditScheduleOpen && (
        <div className="fixed inset-0 bg-[#003527]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-outline-variant max-w-md w-full p-6 shadow-xl relative animate-fade-in text-left">
            <button
              onClick={() => setIsEditScheduleOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-display text-sm font-bold text-primary mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              <span>{scheduleFormId ? 'Edit Jadwal Kegiatan' : 'Tambah Jadwal Kegiatan'}</span>
            </h3>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">Waktu / Jam *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 15:30 - 17:00"
                    value={scheduleFormTime}
                    onChange={(e) => setScheduleFormTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">Ikon (Material)</label>
                  <select
                    value={scheduleFormIcon}
                    onChange={(e) => setScheduleFormIcon(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer text-on-surface"
                  >
                    <option value="school">School (KBM)</option>
                    <option value="done">Checkmark (Selesai)</option>
                    <option value="schedule">Clock (Waktu)</option>
                    <option value="restaurant">Food (Makan)</option>
                    <option value="mosque">Mosque (Shalat)</option>
                    <option value="sports_soccer">Sports (Olahraga)</option>
                    <option value="bed">Bed (Istirahat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">Nama Kegiatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shalat Maghrib Berjamaah & Halaqah"
                  value={scheduleFormTitle}
                  onChange={(e) => setScheduleFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[9px]">Lokasi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Masjid Utama"
                  value={scheduleFormLoc}
                  onChange={(e) => setScheduleFormLoc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleFormIsCurrent}
                    onChange={(e) => {
                      setScheduleFormIsCurrent(e.target.checked);
                      if (e.target.checked) setScheduleFormIsPast(false);
                    }}
                    className="rounded border-outline-variant/80 text-primary focus:ring-primary"
                  />
                  <span>Sedang Berjalan (Current)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleFormIsPast}
                    onChange={(e) => {
                      setScheduleFormIsPast(e.target.checked);
                      if (e.target.checked) setScheduleFormIsCurrent(false);
                    }}
                    className="rounded border-outline-variant/80 text-primary focus:ring-primary"
                  />
                  <span>Sudah Selesai (Past)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/25">
                {scheduleFormId && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteSchedule(scheduleFormId);
                      setIsEditScheduleOpen(false);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer mr-auto"
                  >
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetScheduleForm();
                    setIsEditScheduleOpen(false);
                  }}
                  className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container-low rounded-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Photo Preview Modal */}
      {previewStudent && (
        <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-outline-variant max-w-sm w-full p-6 shadow-2xl relative text-left flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setPreviewStudent(null)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors cursor-pointer flex items-center justify-center"
              title="Tutup"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Profile Detail */}
            <div className="w-full text-center space-y-4">
              <span className="material-symbols-outlined text-[40px] text-primary">account_circle</span>
              <h3 className="font-display text-sm font-bold text-primary">Foto Profil Santri</h3>
              <p className="text-xs font-bold text-on-surface line-clamp-1">{previewStudent.name}</p>

              {/* Photo View Box */}
              <div className="relative border border-outline-variant rounded-xl overflow-hidden bg-black/5 flex items-center justify-center max-w-[240px] mx-auto aspect-square shadow-inner">
                <img
                  src={previewStudent.photoUrl}
                  alt={previewStudent.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[220px] max-w-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Download & Actions Bar */}
              <div className="flex gap-2 justify-center pt-2 w-full">
                <button
                  onClick={() => handleDownloadPhoto(previewStudent.photoUrl, previewStudent.name)}
                  className="flex items-center justify-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary-container transition-all shadow-xs cursor-pointer flex-1"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Unduh Foto</span>
                </button>
                <button
                  onClick={() => setPreviewStudent(null)}
                  className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container-low rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
