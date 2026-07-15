import React, { useState, useEffect } from 'react';
import { TeacherAttendance, Student, StudentAttendance, Teacher } from '../types';
import { USTADZ_LIST } from '../data';

interface AbsensiPengajarViewProps {
  attendance: TeacherAttendance[];
  onUpdateAttendance: (updated: TeacherAttendance[]) => void;
  classes?: string[];
  students?: Student[];
  studentAttendance?: StudentAttendance[];
  onUpdateStudentAttendance?: (updated: StudentAttendance[]) => void;
  teachers?: Teacher[];
}

const JAM_PELAJARAN_LIST = [
  'Qabla Subuh (03.50-05.20)',
  'Bada Subuh (05.00-06.00)',
  'Pagi (08.00-09.00)',
  'Pagi (09.00-10.00)',
  'Siang (14.00-15.00)',
  'Sore (16.00-17.00)',
  'Bada Maghrib (18.30-19.30)',
  'Bada Isya (20.00-21.00)'
];

export default function AbsensiPengajarView({
  attendance,
  onUpdateAttendance,
  classes = [],
  students = [],
  studentAttendance = [],
  onUpdateStudentAttendance = () => {},
  teachers = [],
}: AbsensiPengajarViewProps) {
  // Navigation: 'ustadz' | 'santri'
  const [activeTab, setActiveTab] = useState<'ustadz' | 'santri'>('ustadz');

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Load subjects from academic menu
  const [subjectsList] = useState<any[]>(() => {
    const cached = localStorage.getItem('siakad_academic_subjects');
    return cached ? JSON.parse(cached) : [
      { code: 'MD01', name: 'Aqidah Akhlaq' },
      { code: 'MD02', name: 'Fiqih Ibadah' },
      { code: 'MD03', name: 'Bahasa Arab (Nahwu)' },
      { code: 'MD04', name: 'Shorof & Tashrif' },
      { code: 'MD05', name: 'Tajwid & Makharij' },
    ];
  });

  // ==========================================
  // STATE & LOGIC: TEACHER ATTENDANCE (USTADZ)
  // ==========================================
  const [activeTeacherCheckIn, setActiveTeacherCheckIn] = useState('');
  const [activeJamPelajaran, setActiveJamPelajaran] = useState('');
  const [activeClass, setActiveClass] = useState('');
  const [activeSubject, setActiveSubject] = useState('');
  const [activeStatus, setActiveStatus] = useState<'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | ''>('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock effect for check-in console
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter attendance for the selected date
  const todaysAttendance = attendance.filter((a) => a.date === selectedDate);

  // Handle status toggle for a teacher's record in list
  const handleStatusChange = (id: string, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    const updated = attendance.map((a) => {
      if (a.id === id) {
        const timeIn = status === 'Hadir' ? '07:15' : undefined;
        return { ...a, status, timeIn };
      }
      return a;
    });
    onUpdateAttendance(updated);
  };

  // Handle notes change for a teacher's record in list
  const handleNotesChange = (id: string, notes: string) => {
    const updated = attendance.map((a) => {
      if (a.id === id) {
        return { ...a, notes };
      }
      return a;
    });
    onUpdateAttendance(updated);
  };

  // Handle self-check-in submission from the portal form
  const handleSelfCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeacherCheckIn) {
      alert('Mohon pilih Nama Pendidik / Ustadz terlebih dahulu!');
      return;
    }
    if (!activeJamPelajaran) {
      alert('Mohon pilih Jam Pelajaran terlebih dahulu!');
      return;
    }
    if (!activeClass) {
      alert('Mohon pilih Kelas Mengajar terlebih dahulu!');
      return;
    }
    if (!activeSubject) {
      alert('Mohon pilih Mata Pelajaran terlebih dahulu!');
      return;
    }
    if (!activeStatus) {
      alert('Mohon pilih Status Kehadiran terlebih dahulu!');
      return;
    }

    const hh = String(currentTime.getHours()).padStart(2, '0');
    const mm = String(currentTime.getMinutes()).padStart(2, '0');
    const formattedTime = `${hh}:${mm}`;

    const newRecord: TeacherAttendance = {
      id: `ta_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      teacherName: activeTeacherCheckIn,
      date: selectedDate,
      status: activeStatus,
      timeIn: activeStatus === 'Hadir' ? formattedTime : undefined,
      notes: checkInNotes || `Presensi mandiri - Kelas ${activeClass}`,
      lessonHour: activeJamPelajaran,
      class: activeClass,
      subject: activeSubject,
    };

    // Filter out old records for the same teacher, date, class, and time slot to avoid duplicate spam
    const filteredAttendance = attendance.filter(
      (a) => !(a.teacherName === activeTeacherCheckIn && a.date === selectedDate && a.lessonHour === activeJamPelajaran && a.class === activeClass)
    );

    onUpdateAttendance([...filteredAttendance, newRecord]);
    setCheckInNotes('');
    alert(`Sukses! Presensi ${activeTeacherCheckIn} berhasil disimpan sebagai [${activeStatus}] untuk kelas [${activeClass}] pada slot [${activeJamPelajaran}].`);
  };

  // Handle delete attendance record
  const handleDeleteRecord = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan kehadiran ini?')) {
      onUpdateAttendance(attendance.filter((a) => a.id !== id));
    }
  };

  // Compute Teacher Stats
  const teachersCount = teachers.length > 0 ? teachers.length : USTADZ_LIST.length;
  const presentCount = todaysAttendance.filter((a) => a.status === 'Hadir').length;
  const izinCount = todaysAttendance.filter((a) => a.status === 'Izin').length;
  const sakitCount = todaysAttendance.filter((a) => a.status === 'Sakit').length;
  const alpaCount = todaysAttendance.filter((a) => a.status === 'Alpa').length;

  const attendanceRate = teachersCount > 0 ? Math.round((presentCount / teachersCount) * 100) : 100;

  // Filter ustadz for display
  const displayedAttendance = todaysAttendance.filter((a) =>
    a.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.class && a.class.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.lessonHour && a.lessonHour.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // PDF Print generator for Teacher Attendance (Rekap Pengajar)
  const handlePrintTeacherPDF = () => {
    const tableRows = todaysAttendance.map((record, index) => {
      return `
        <tr>
          <td class="text-center font-mono">${index + 1}</td>
          <td><strong>${record.teacherName}</strong></td>
          <td class="text-center font-mono">${record.date}</td>
          <td class="text-center font-semibold">${record.lessonHour || '-'}</td>
          <td class="text-center">${record.class || '-'}</td>
          <td>${record.subject || '-'}</td>
          <td class="text-center font-bold">
            <span style="color: ${
              record.status === 'Hadir' ? '#047857' : record.status === 'Izin' ? '#1e3a8a' : record.status === 'Sakit' ? '#b45309' : '#b91c1c'
            };">
              ${record.status}
            </span>
          </td>
          <td class="text-center font-mono">${record.timeIn || '-'}</td>
          <td>${record.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Hasil Rekap Absensi</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #333; line-height: 1.4; }
            .header-container { border-bottom: 2px solid #003527; padding-bottom: 12px; margin-bottom: 20px; }
            h2 { text-align: center; color: #003527; margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
            h3 { text-align: center; color: #1e293b; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
            p.meta-info { text-align: center; color: #64748b; margin: 0; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; text-transform: uppercase; font-size: 10px; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; }
            .font-bold { font-weight: bold; }
            .summary-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px 15px; margin-top: 20px; font-size: 12px; color: #065f46; }
            .footer { margin-top: 40px; text-align: right; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h2>Hasil Rekap Absensi</h2>
            <h3>MADRASAH UMMI</h3>
            <p class="meta-info">Tanggal Rekap: ${selectedDate} • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div class="summary-box" style="margin-bottom: 20px; border-color: #003527; background-color: #f0fdf4; color: #064e3b;">
            <p style="margin: 0;"><strong>REKAPITULASI PRESENSI HARIAN:</strong></p>
            <p style="margin: 5px 0 0 0;">Total Pencatatan: <strong>${todaysAttendance.length} Entri</strong> | Hadir: <strong>${presentCount}</strong> | Izin: <strong>${izinCount}</strong> | Sakit: <strong>${sakitCount}</strong> | Alpa: <strong>${alpaCount}</strong></p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">No</th>
                <th>Nama Guru / Ustadz</th>
                <th class="text-center">Tanggal</th>
                <th class="text-center">Jam Ke</th>
                <th class="text-center">Kelas</th>
                <th>Mata Pelajaran</th>
                <th class="text-center">Status</th>
                <th class="text-center">Jam Masuk</th>
                <th>Keterangan / Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="9" style="text-align:center; padding: 20px; color:#64748b; font-style:italic;">Tidak ada data presensi untuk tanggal terpilih ini.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Laporan ini digenerate secara otomatis oleh Sistem Informasi Akademik Madrasah Ummi
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert('Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir oleh browser.');
    }
  };

  // ==========================================
  // STATE & LOGIC: STUDENT ATTENDANCE (SANTRI)
  // ==========================================
  const [studentSelectedClass, setStudentSelectedClass] = useState('');
  const [studentSelectedId, setStudentSelectedId] = useState('');
  const [studentAttendanceStatus, setStudentAttendanceStatus] = useState<'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | ''>('');
  const [studentAttendanceNotes, setStudentAttendanceNotes] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // List of active students in the selected class
  const classStudents = students.filter(
    (s) => s.class === studentSelectedClass && s.status === 'Aktif'
  );

  // Sync default selected student when class changes
  useEffect(() => {
    setStudentSelectedId('');
  }, [studentSelectedClass]);

  // Filter student attendance records for selected class and date
  const classStudentAttendance = studentAttendance.filter(
    (sa) => sa.class === studentSelectedClass && sa.date === selectedDate
  );

  // Stats for the student class attendance
  const totalClassStudents = classStudents.length;
  const studentPresentCount = classStudentAttendance.filter((sa) => sa.status === 'Hadir').length;
  const studentIzinCount = classStudentAttendance.filter((sa) => sa.status === 'Izin').length;
  const studentSakitCount = classStudentAttendance.filter((sa) => sa.status === 'Sakit').length;
  const studentAlpaCount = classStudentAttendance.filter((sa) => sa.status === 'Alpa').length;
  const studentBelumPresensiCount = totalClassStudents - classStudentAttendance.length;

  const studentAttendanceRate = totalClassStudents > 0 
    ? Math.round((studentPresentCount / totalClassStudents) * 100) 
    : 100;

  // Handle saving student attendance from input form
  const handleSaveStudentAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSelectedClass) {
      alert('Mohon pilih kelas terlebih dahulu!');
      return;
    }
    if (!studentSelectedId) {
      alert('Mohon pilih santri terlebih dahulu!');
      return;
    }
    if (!studentAttendanceStatus) {
      alert('Mohon pilih status kehadiran terlebih dahulu!');
      return;
    }

    const selectedStud = classStudents.find((s) => s.id === studentSelectedId);
    if (!selectedStud) return;

    const newRecord: StudentAttendance = {
      id: `sa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      studentId: selectedStud.id,
      studentName: selectedStud.name,
      class: studentSelectedClass,
      date: selectedDate,
      status: studentAttendanceStatus as any,
      notes: studentAttendanceNotes,
    };

    // Filter out previous attendance for this student on this date
    const updated = studentAttendance.filter(
      (sa) => !(sa.studentId === selectedStud.id && sa.date === selectedDate)
    );

    onUpdateStudentAttendance([...updated, newRecord]);
    setStudentAttendanceNotes('');
    alert(`Sukses! Kehadiran ${selectedStud.name} berhasil direkam sebagai [${studentAttendanceStatus}].`);
  };

  // Inline update student status in table
  const handleStudentStatusChange = (studentId: string, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    const existing = studentAttendance.find((sa) => sa.studentId === studentId && sa.date === selectedDate);
    const stud = classStudents.find((s) => s.id === studentId);
    if (!stud) return;

    if (existing) {
      const updated = studentAttendance.map((sa) => {
        if (sa.id === existing.id) {
          return { ...sa, status };
        }
        return sa;
      });
      onUpdateStudentAttendance(updated);
    } else {
      const newRecord: StudentAttendance = {
        id: `sa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId,
        studentName: stud.name,
        class: studentSelectedClass,
        date: selectedDate,
        status,
        notes: '',
      };
      onUpdateStudentAttendance([...studentAttendance, newRecord]);
    }
  };

  // Inline update student notes in table
  const handleStudentNotesChange = (studentId: string, notes: string) => {
    const existing = studentAttendance.find((sa) => sa.studentId === studentId && sa.date === selectedDate);
    const stud = classStudents.find((s) => s.id === studentId);
    if (!stud) return;

    if (existing) {
      const updated = studentAttendance.map((sa) => {
        if (sa.id === existing.id) {
          return { ...sa, notes };
        }
        return sa;
      });
      onUpdateStudentAttendance(updated);
    } else {
      const newRecord: StudentAttendance = {
        id: `sa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId,
        studentName: stud.name,
        class: studentSelectedClass,
        date: selectedDate,
        status: 'Hadir',
        notes,
      };
      onUpdateStudentAttendance([...studentAttendance, newRecord]);
    }
  };

  // Delete student attendance record
  const handleDeleteStudentAttendance = (studentId: string) => {
    const record = studentAttendance.find((sa) => sa.studentId === studentId && sa.date === selectedDate);
    if (!record) return;

    if (confirm(`Apakah Anda yakin ingin menghapus rekor kehadiran untuk "${record.studentName}"?`)) {
      onUpdateStudentAttendance(studentAttendance.filter((sa) => sa.id !== record.id));
    }
  };

  // PDF Export for Student Attendance (Rekap Santri)
  const handlePrintStudentPDF = () => {
    const classRecords = classStudents.map((stud) => {
      const record = studentAttendance.find((sa) => sa.studentId === stud.id && sa.date === selectedDate);
      return {
        studentName: stud.name,
        nisn: stud.nisn || stud.nip || '-',
        class: studentSelectedClass,
        date: selectedDate,
        status: record ? record.status : 'Belum Absen',
        notes: record ? record.notes || '' : '',
      };
    });

    const tableRows = classRecords.map((record, index) => {
      return `
        <tr>
          <td class="text-center font-mono">${index + 1}</td>
          <td><strong>${record.studentName}</strong></td>
          <td class="text-center font-mono">${record.nisn}</td>
          <td class="text-center">${record.class}</td>
          <td class="text-center font-mono">${record.date}</td>
          <td class="text-center font-bold">
            <span style="color: ${
              record.status === 'Hadir' ? '#047857' : record.status === 'Izin' ? '#1e3a8a' : record.status === 'Sakit' ? '#b45309' : record.status === 'Alpa' ? '#b91c1c' : '#64748b'
            };">
              ${record.status}
            </span>
          </td>
          <td>${record.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Rekap Kehadiran Santri - Kelas ${studentSelectedClass}</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #333; line-height: 1.4; }
            .header-container { border-bottom: 2px solid #003527; padding-bottom: 12px; margin-bottom: 20px; }
            h2 { text-align: center; color: #003527; margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
            h3 { text-align: center; color: #1e293b; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
            p.meta-info { text-align: center; color: #64748b; margin: 0; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; text-transform: uppercase; font-size: 10px; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; }
            .summary-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px 15px; margin-top: 20px; font-size: 12px; color: #065f46; }
            .footer { margin-top: 40px; text-align: right; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h2>Hasil Rekap Absensi</h2>
            <h3>MADRASAH UMMI</h3>
            <p class="meta-info">Kelas: ${studentSelectedClass} • Tanggal Rekap: ${selectedDate} • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div class="summary-box" style="margin-bottom: 20px; border-color: #003527; background-color: #f0fdf4; color: #064e3b;">
            <p style="margin: 0;"><strong>REKAPITULASI KEHADIRAN KELAS:</strong></p>
            <p style="margin: 5px 0 0 0;">Total Santri Terdaftar: <strong>${totalClassStudents} Siswa</strong> | Hadir: <strong>${studentPresentCount}</strong> | Izin: <strong>${studentIzinCount}</strong> | Sakit: <strong>${studentSakitCount}</strong> | Alpa: <strong>${studentAlpaCount}</strong> | Belum Mengisi: <strong>${studentBelumPresensiCount}</strong></p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">No</th>
                <th>Nama Santri</th>
                <th class="text-center">NISN / ID</th>
                <th class="text-center">Kelas</th>
                <th class="text-center">Tanggal</th>
                <th class="text-center">Status</th>
                <th>Keterangan / Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#64748b; font-style:italic;">Tidak ada data santri di kelas ini.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Laporan ini digenerate secara otomatis oleh Sistem Informasi Akademik Madrasah Ummi
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert('Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir oleh browser.');
    }
  };

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Absensi &amp; Kehadiran</h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Portal pencatatan kehadiran mandiri ustadz, jadwal jam mengajar, serta presensi harian santri per kelas.
          </p>
        </div>

        {/* Datepicker */}
        <div className="flex items-center gap-2 bg-white border border-outline-variant/60 rounded-lg p-2 shadow-2xs">
          <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-xs font-semibold text-primary outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Dynamic Sub-Tab Bar Navigation */}
      <div className="flex border-b border-outline-variant/40 gap-1 pb-px print:hidden">
        <button
          onClick={() => setActiveTab('ustadz')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ustadz'
              ? 'border-primary text-primary bg-surface-container-low/45 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low/20 rounded-t-lg'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          <span>Kehadiran Guru / Ustadz</span>
        </button>
        <button
          onClick={() => setActiveTab('santri')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'santri'
              ? 'border-primary text-primary bg-surface-container-low/45 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low/20 rounded-t-lg'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>Kehadiran Santri / Siswa</span>
        </button>
      </div>

      {/* ======================================= */}
      {/* TAB CONTENT: TEACHER ATTENDANCE (USTADZ) */}
      {/* ======================================= */}
      {activeTab === 'ustadz' && (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Pendidik Aktif</span>
              <h4 className="font-display text-xl font-bold text-primary mt-2">{teachersCount} Ustadz</h4>
              <span className="text-on-surface-variant text-[9px] mt-1">Terdaftar di sistem</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Hadir Hari Ini</span>
              <h4 className="font-display text-xl font-bold text-emerald-700 mt-2">{presentCount} Rekor</h4>
              <span className="text-emerald-600 font-bold text-[9px] mt-1">Tingkat kehadiran: {attendanceRate}%</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Izin</span>
              <h4 className="font-display text-xl font-bold text-amber-600 mt-2">{izinCount} Orang</h4>
              <span className="text-on-surface-variant text-[9px] mt-1">Sakit &amp; Keperluan</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Sakit</span>
              <h4 className="font-display text-xl font-bold text-blue-600 mt-2">{sakitCount} Orang</h4>
              <span className="text-on-surface-variant text-[9px] mt-1">Dalam keterangan medis</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs col-span-2 md:col-span-1">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Alpa / Kosong</span>
              <h4 className="font-display text-xl font-bold text-red-600 mt-2">{alpaCount} Orang</h4>
              <span className="text-red-500 font-bold text-[9px] mt-1">Belum rekam kehadiran</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Self Attendance Console (Left side) */}
            <div className="lg:col-span-4 bg-primary text-on-primary rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-emerald-800/20 to-transparent pointer-events-none"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">touch_app</span>
                    <span>Portal Presensi Mandiri</span>
                  </h3>
                  <span className="bg-white/15 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold text-white tracking-wider">PORTAL</span>
                </div>

                {/* Live Clock Card */}
                <div className="bg-white/10 rounded-lg p-3.5 text-center border border-white/10 backdrop-blur-xs">
                  <div className="font-mono text-2xl font-bold tracking-widest text-secondary-fixed">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="text-[10px] text-on-primary-container font-semibold uppercase tracking-wider mt-1 font-mono">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                {/* Self Checkin Form */}
                <form onSubmit={handleSelfCheckIn} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-white font-semibold mb-1">Nama Pendidik / Ustadz</label>
                    <select
                      value={activeTeacherCheckIn}
                      onChange={(e) => setActiveTeacherCheckIn(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary-fixed"
                    >
                      <option value="" disabled className="bg-primary text-white/50">-- Pilih Pendidik / Ustadz --</option>
                      {(teachers.length > 0 ? teachers.map((t) => t.name) : USTADZ_LIST).map((name) => (
                        <option key={name} value={name} className="bg-primary text-white font-medium">
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-white font-semibold mb-1">Jam Pelajaran Ke</label>
                      <select
                        value={activeJamPelajaran}
                        onChange={(e) => setActiveJamPelajaran(e.target.value)}
                        className="w-full bg-white/10 border border-white/15 rounded-lg px-2 py-1.5 text-white text-[10px] font-semibold outline-none focus:ring-1 focus:ring-secondary-fixed"
                      >
                        <option value="" disabled className="bg-primary text-white/50">-- Pilih Jam Ke --</option>
                        {JAM_PELAJARAN_LIST.map((jam) => (
                          <option key={jam} value={jam} className="bg-primary text-white font-medium">
                            {jam.split(' ')[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-1">Kelas Mengajar</label>
                      <select
                        value={activeClass}
                        onChange={(e) => setActiveClass(e.target.value)}
                        className="w-full bg-white/10 border border-white/15 rounded-lg px-2 py-1.5 text-white text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary-fixed"
                      >
                        <option value="" disabled className="bg-primary text-white/50">-- Pilih Kelas --</option>
                        {classes.map((cls) => (
                          <option key={cls} value={cls} className="bg-primary text-white font-medium">
                            {cls}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-1">Mata Pelajaran</label>
                    <select
                      value={activeSubject}
                      onChange={(e) => setActiveSubject(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary-fixed"
                    >
                      <option value="" disabled className="bg-primary text-white/50">-- Pilih Pelajaran --</option>
                      {subjectsList.map((sub) => (
                        <option key={sub.code} value={sub.name} className="bg-primary text-white font-medium">
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-1">Status Kehadiran</label>
                    <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                      {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setActiveStatus(st)}
                          className={`py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                            activeStatus === st
                              ? 'bg-secondary-fixed text-primary shadow-2xs'
                              : 'text-white/80 hover:bg-white/5'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-1">Keterangan / Catatan Tambahan</label>
                    <input
                      type="text"
                      placeholder="e.g. Pembahasan bab fiqih qurban"
                      value={checkInNotes}
                      onChange={(e) => setCheckInNotes(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs outline-none placeholder-white/45 focus:ring-1 focus:ring-secondary-fixed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-secondary-fixed hover:bg-on-primary-fixed text-primary font-bold rounded-lg transition-colors cursor-pointer text-xs shadow-3xs flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                    <span>Kirim Presensi Mengajar</span>
                  </button>
                </form>
              </div>
            </div>

            {/* List Table Grid (Right side) */}
            <div className="lg:col-span-8 bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-outline-variant/40 bg-surface-container-lowest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                    <span>Log Logbook &amp; Presensi Mengajar Guru</span>
                  </h3>
                  <div className="relative w-full sm:w-48">
                    <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[16px] text-on-surface-variant">search</span>
                    <input
                      type="text"
                      placeholder="Cari kelas / nama..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-[11px] border border-outline-variant/60 rounded-lg outline-none bg-surface-container-low"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3 pl-4">No</th>
                        <th className="p-3">Guru / Ustadz</th>
                        <th className="p-3 text-center">Kelas &amp; Jam</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3 pr-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 text-xs font-medium text-on-surface">
                      {displayedAttendance.length > 0 ? (
                        displayedAttendance.map((record, index) => (
                          <tr key={record.id} className="hover:bg-surface-container-low/20 transition-colors">
                            <td className="p-3 pl-4 font-mono text-on-surface-variant">{index + 1}</td>
                            <td className="p-3">
                              <div className="font-bold text-on-surface">{record.teacherName}</div>
                              <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">{record.subject || 'Diniyah'}</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-semibold block">{record.class || '-'}</span>
                              <span className="text-[10px] text-on-surface-variant mt-0.5 block">{record.lessonHour?.split(' ')[0] || '-'}</span>
                            </td>

                            {/* Status Dropdown Select */}
                            <td className="p-3">
                              <select
                                value={record.status}
                                onChange={(e) => handleStatusChange(record.id, e.target.value as 'Hadir' | 'Izin' | 'Sakit' | 'Alpa')}
                                className={`px-3 py-1.5 border rounded-lg text-xs font-bold outline-none cursor-pointer transition-colors shadow-3xs ${
                                  record.status === 'Hadir'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : record.status === 'Izin'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : record.status === 'Sakit'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                                }`}
                              >
                                <option value="Hadir" className="bg-white text-emerald-800 font-bold">Hadir</option>
                                <option value="Izin" className="bg-white text-amber-800 font-bold">Izin</option>
                                <option value="Sakit" className="bg-white text-blue-800 font-bold">Sakit</option>
                                <option value="Alpa" className="bg-white text-red-800 font-bold">Alpa</option>
                              </select>
                            </td>

                            {/* Custom Notes form */}
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Tulis keterangan..."
                                value={record.notes || ''}
                                onChange={(e) => handleNotesChange(record.id, e.target.value)}
                                className="w-full px-2 py-1 border border-outline-variant/40 rounded-md text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium bg-transparent bg-white/20"
                              />
                            </td>

                            {/* Delete single record */}
                            <td className="p-3 pr-4 text-center">
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className="p-1 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-full transition-colors cursor-pointer"
                                title="Hapus Rekor Presensi"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
                            <span className="material-symbols-outlined text-[36px] text-primary/30 block mb-1">event_busy</span>
                            <span>Tidak ada data log kehadiran guru yang sesuai kriteria pencarian Anda.</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-surface p-4 border-t border-outline-variant/60 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[11px] text-on-surface-variant font-semibold">
                  Rekap absensi ustadz secara periodik dapat dipantau di sub-tab Laporan Kehadiran Guru.
                </span>
                <button
                  type="button"
                  onClick={handlePrintTeacherPDF}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:bg-primary-container hover:scale-102 active:scale-98 transition-all text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>Simpan Rekap Absensi</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================= */}
      {/* TAB CONTENT: STUDENT ATTENDANCE (SANTRI) */}
      {/* ======================================= */}
      {activeTab === 'santri' && (
        <>
          {/* Student KPI Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Total Santri Kelas</span>
              <h4 className="font-display text-xl font-bold text-primary mt-2">{totalClassStudents} Santri</h4>
              <span className="text-on-surface-variant text-[9px] mt-1">Siswa di kelas {studentSelectedClass}</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Hadir Hari Ini</span>
              <h4 className="font-display text-xl font-bold text-emerald-700 mt-2">{studentPresentCount} Santri</h4>
              <span className="text-emerald-600 font-bold text-[9px] mt-1">Kehadiran Kelas: {studentAttendanceRate}%</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Izin</span>
              <h4 className="font-display text-xl font-bold text-amber-600 mt-2">{studentIzinCount} Santri</h4>
              <span className="text-on-surface-variant text-[9px] mt-1">Keperluan terdaftar</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Sakit</span>
              <h4 className="font-display text-xl font-bold text-blue-600 mt-2">{studentSakitCount} Santri</h4>
              <span className="text-on-surface-variant text-[9px] mt-1">Keterangan medis</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs col-span-2 md:col-span-1">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Alpa / Kosong</span>
              <h4 className="font-display text-xl font-bold text-red-600 mt-2">{studentAlpaCount} Santri</h4>
              <span className="text-red-500 font-bold text-[9px] mt-1">Tanpa keterangan ({studentBelumPresensiCount} belum diisi)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Left Form Column */}
            <div className="lg:col-span-4 bg-primary text-on-primary rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-emerald-800/20 to-transparent pointer-events-none"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">group_add</span>
                    <span>Pencatatan Presensi Santri</span>
                  </h3>
                  <span className="bg-white/15 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold text-white tracking-wider">SANTRI</span>
                </div>

                {/* Form to log single student attendance */}
                <form onSubmit={handleSaveStudentAttendance} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-white font-semibold mb-1">Pilih Kelas</label>
                    <select
                      value={studentSelectedClass}
                      onChange={(e) => setStudentSelectedClass(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary-fixed"
                    >
                      <option value="" disabled className="bg-primary text-white/50">-- Pilih Kelas --</option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls} className="bg-primary text-white font-medium">
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-1">Pilih Santri / Siswa</label>
                    <select
                      value={studentSelectedId}
                      onChange={(e) => setStudentSelectedId(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary-fixed"
                    >
                      <option value="" disabled className="bg-primary text-white/50">-- Pilih Santri --</option>
                      {classStudents.length > 0 ? (
                        classStudents.map((stud) => (
                          <option key={stud.id} value={stud.id} className="bg-primary text-white font-medium">
                            {stud.name} ({stud.nisn || stud.nip})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled className="bg-primary text-white/50">
                          {studentSelectedClass ? 'Tidak ada santri aktif di kelas ini' : 'Silakan pilih kelas terlebih dahulu'}
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-1">Status Kehadiran</label>
                    <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                      {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStudentAttendanceStatus(st)}
                          className={`py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                            studentAttendanceStatus === st
                              ? 'bg-secondary-fixed text-primary shadow-2xs'
                              : 'text-white/80 hover:bg-white/5'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-1">Keterangan / Catatan Kehadiran</label>
                    <input
                      type="text"
                      placeholder="e.g. Surat dokter / terlambat 10 mnt"
                      value={studentAttendanceNotes}
                      onChange={(e) => setStudentAttendanceNotes(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs outline-none placeholder-white/45 focus:ring-1 focus:ring-secondary-fixed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!studentSelectedId}
                    className="w-full py-2 bg-secondary-fixed hover:bg-on-primary-fixed text-primary font-bold rounded-lg transition-colors cursor-pointer text-xs shadow-3xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Simpan Kehadiran Santri</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Display Column */}
            <div className="lg:col-span-8 bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-outline-variant/40 bg-surface-container-lowest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                    <span>Daftar Presensi Harian Santri - Kelas {studentSelectedClass}</span>
                  </h3>
                  <div className="relative w-full sm:w-48">
                    <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[16px] text-on-surface-variant">search</span>
                    <input
                      type="text"
                      placeholder="Cari santri..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-[11px] border border-outline-variant/60 rounded-lg outline-none bg-surface-container-low"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3 pl-4">No</th>
                        <th className="p-3">Nama Santri</th>
                        <th className="p-3 text-center">NISN / ID</th>
                        <th className="p-3">Status Kehadiran</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3 pr-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 text-xs font-medium text-on-surface">
                      {classStudents.length > 0 ? (
                        classStudents
                          .filter((stud) => stud.name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                          .map((stud, index) => {
                            const record = studentAttendance.find((sa) => sa.studentId === stud.id && sa.date === selectedDate);
                            const currentStatus = record ? record.status : 'Belum Absen';
                            
                            return (
                              <tr key={stud.id} className="hover:bg-surface-container-low/20 transition-colors">
                                <td className="p-3 pl-4 font-mono text-on-surface-variant">{index + 1}</td>
                                <td className="p-3 font-bold">{stud.name}</td>
                                <td className="p-3 text-center font-mono">{stud.nisn || stud.nip || '-'}</td>
                                <td className="p-3">
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => handleStudentStatusChange(stud.id, e.target.value as any)}
                                    className={`px-2.5 py-1.5 border rounded-lg text-[11px] font-bold outline-none cursor-pointer transition-colors shadow-3xs ${
                                      currentStatus === 'Hadir'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : currentStatus === 'Izin'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : currentStatus === 'Sakit'
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : currentStatus === 'Alpa'
                                        ? 'bg-red-50 text-red-800 border-red-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}
                                  >
                                    <option value="Belum Absen" disabled className="bg-white text-slate-400">Belum diisi</option>
                                    <option value="Hadir" className="bg-white text-emerald-800 font-bold">Hadir</option>
                                    <option value="Izin" className="bg-white text-amber-800 font-bold">Izin</option>
                                    <option value="Sakit" className="bg-white text-blue-800 font-bold">Sakit</option>
                                    <option value="Alpa" className="bg-white text-red-800 font-bold">Alpa</option>
                                  </select>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    placeholder="Tulis keterangan..."
                                    value={record ? record.notes || '' : ''}
                                    onChange={(e) => handleStudentNotesChange(stud.id, e.target.value)}
                                    className="w-full px-2 py-1 border border-outline-variant/40 rounded-md text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium bg-transparent bg-white/20"
                                  />
                                </td>
                                <td className="p-3 pr-4 text-center">
                                  <button
                                    onClick={() => handleDeleteStudentAttendance(stud.id)}
                                    disabled={!record}
                                    className="p-1 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Hapus Rekor Presensi Santri"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
                            <span className="material-symbols-outlined text-[36px] text-primary/30 block mb-1">school</span>
                            <span>
                              {studentSelectedClass 
                                ? `Tidak ada santri terdaftar di kelas ${studentSelectedClass} ini.`
                                : 'Silakan pilih kelas terlebih dahulu untuk menampilkan daftar santri.'}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-surface p-4 border-t border-outline-variant/60 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[11px] text-on-surface-variant font-semibold">
                  Gunakan tombol Simpan Rekap PDF untuk mengunduh rekapitulasi kehadiran santri kelas {studentSelectedClass} hari ini.
                </span>
                <button
                  type="button"
                  onClick={handlePrintStudentPDF}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:bg-primary-container hover:scale-102 active:scale-98 transition-all text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>Simpan Rekap PDF</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invisible iframe used for PDF printing */}
      <iframe id="print-pdf-iframe" style={{ display: 'none' }} title="Print PDF Frame" />
    </div>
  );
}
