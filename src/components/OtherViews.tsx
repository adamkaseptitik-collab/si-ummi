import React, { useState, useEffect } from 'react';
import { Student, TeacherAttendance, StudentAttendance, PointRecord, MemorizationRecord, UserAccount, UserLog, Teacher } from '../types';

const ALL_MENU_VIEWS = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'students', label: 'Data Santri' },
  { view: 'kelas_program', label: 'Kelas & Program' },
  { view: 'tahfidz_input', label: 'Input Setoran' },
  { view: 'tahfidz_history', label: 'Riwayat Setoran' },
  { view: 'akademik', label: 'Akademik' },
  { view: 'absensi_pengajar', label: 'Absensi & Presensi' },
  { view: 'penilaian_ujian', label: 'Penilaian Ujian' },
  { view: 'poin_kedisiplinan', label: 'Poin Kedisiplinan' },
  { view: 'laporan', label: 'Laporan Rekap' },
  { view: 'pengaturan', label: 'Pengaturan' },
  { view: 'data_pengajar', label: 'Data Pengajar' },
  { view: 'laporan_pengajar', label: 'Laporan Pengajar' },
];
import { CLASSES, PROGRAMS, USTADZ_LIST } from '../data';

interface OtherViewsProps {
  students: Student[];
  classes?: string[];
  programs?: string[];
  records?: MemorizationRecord[];
  pointRecords?: PointRecord[];
  attendance?: TeacherAttendance[];
  studentAttendance?: StudentAttendance[];
  grades?: AcademicGrade[];
  onUpdateGrades?: (g: AcademicGrade[]) => void;
  currentUser?: UserAccount | null;
  onUpdateCurrentUser?: (user: UserAccount | null) => void;
  users?: UserAccount[];
  onUpdateUsers?: (u: UserAccount[]) => void;
  teachers?: Teacher[];
}

interface Subject {
  code: string;
  name: string;
  teacher: string;
  hours: number;
  room: string;
}

interface AcademicGrade {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  subjectCode: string;
  subjectName: string;
  utsScore: number;
  uasScore: number;
  assignmentScore: number;
  finalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  notes: string;
}

// ==========================================
// 1. MANAJEMEN AKADEMIK VIEW WITH GRADING
// ==========================================
export function AkademikView({ students, classes = [], programs = [], teachers = [] }: OtherViewsProps) {
  const activeTeachers = teachers.length > 0 ? teachers.map((t) => t.name) : USTADZ_LIST;
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const cached = localStorage.getItem('siakad_academic_subjects');
    return cached ? JSON.parse(cached) : [
      { code: 'MD01', name: 'Aqidah Akhlaq', teacher: 'Ust. Ahmad Baihaqi', hours: 4, room: 'Kelas 10-A' },
      { code: 'MD02', name: 'Fiqih Ibadah', teacher: 'Ust. Abdullah', hours: 4, room: 'Kelas 10-B' },
      { code: 'MD03', name: 'Bahasa Arab (Nahwu)', teacher: 'Ustadzah Fatimah', hours: 6, room: 'Masjid Utama' },
      { code: 'MD04', name: 'Shorof & Tashrif', teacher: 'Ustadzah Fatimah', hours: 4, room: 'Kelas 11-A' },
      { code: 'MD05', name: 'Tajwid & Makharij', teacher: 'Ust. Ahmad Baihaqi', hours: 2, room: 'Masjid Utama' },
    ];
  });

  const [grades, setGrades] = useState<AcademicGrade[]>(() => {
    const cached = localStorage.getItem('siakad_academic_grades');
    return cached ? JSON.parse(cached) : [
      { id: 'g1', studentId: 's1', studentName: 'Ahmad Fathanah', class: '10 IPA 1', subjectCode: 'MD01', subjectName: 'Aqidah Akhlaq', assignmentScore: 85, utsScore: 90, uasScore: 92, finalScore: 89.3, grade: 'A', notes: 'Sangat baik pengetahuannya' },
      { id: 'g2', studentId: 's2', studentName: 'Ahmad Rizqi Maulana', class: '10 MIPA A', subjectCode: 'MD01', subjectName: 'Aqidah Akhlaq', assignmentScore: 80, utsScore: 85, uasScore: 82, finalScore: 82.6, grade: 'B', notes: 'Pertahankan prestasinya' },
      { id: 'g3', studentId: 's3', studentName: 'Siti Aisyah Azzahra', class: '10 IPS B', subjectCode: 'MD03', subjectName: 'Bahasa Arab (Nahwu)', assignmentScore: 95, utsScore: 92, uasScore: 90, finalScore: 92.1, grade: 'A', notes: 'Luar biasa pemahaman dars' }
    ];
  });

  // Local storage sync
  useEffect(() => {
    localStorage.setItem('siakad_academic_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('siakad_academic_grades', JSON.stringify(grades));
  }, [grades]);

  // Tab State
  const [academicTab, setAcademicTab] = useState<'subjects' | 'grades'>('subjects');

  // Modal State for Subjects
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectTeacher, setSubjectTeacher] = useState('Ust. Ahmad Baihaqi');
  const [subjectHours, setSubjectHours] = useState(2);
  const [subjectRoom, setSubjectRoom] = useState('Kelas 10-A');

  // Modal State for Grades
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [assignmentScore, setAssignmentScore] = useState(80);
  const [utsScore, setUtsScore] = useState(80);
  const [uasScore, setUasScore] = useState(80);
  const [gradeNotes, setGradeNotes] = useState('');

  // Selected filters for grades tab
  const [selectedSubjectCode, setSelectedSubjectCode] = useState(subjects[0]?.code || '');
  const [selectedClass, setSelectedClass] = useState(classes[0] || '10 MIPA A');
  const [gradeNameSearch, setGradeNameSearch] = useState('');
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [selectedAddGradeClass, setSelectedAddGradeClass] = useState(classes[0] || '10 MIPA A');

  // Open Subject Modal for Add
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectCode('');
    setSubjectName('');
    setSubjectTeacher(activeTeachers[0] || 'Ust. Ahmad Baihaqi');
    setSubjectHours(2);
    setSubjectRoom('Kelas 10-A');
    setIsSubjectModalOpen(true);
  };

  // Open Subject Modal for Edit
  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubjectCode(sub.code);
    setSubjectName(sub.name);
    setSubjectTeacher(sub.teacher);
    setSubjectHours(sub.hours);
    setSubjectRoom(sub.room);
    setIsSubjectModalOpen(true);
  };

  // Save/Update Subject
  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode || !subjectName) {
      alert('Mohon lengkapi kode dan nama mata pelajaran!');
      return;
    }

    const item: Subject = {
      code: subjectCode.toUpperCase(),
      name: subjectName,
      teacher: subjectTeacher,
      hours: Number(subjectHours),
      room: subjectRoom
    };

    if (editingSubject) {
      // Edit subject
      const updated = subjects.map(s => s.code === editingSubject.code ? item : s);
      setSubjects(updated);
    } else {
      // Add subject
      if (subjects.some(s => s.code === item.code)) {
        alert('Mata pelajaran dengan kode tersebut sudah ada!');
        return;
      }
      setSubjects([...subjects, item]);
    }
    setIsSubjectModalOpen(false);
  };

  // Delete Subject
  const handleDeleteSubject = (code: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) {
      setSubjects(subjects.filter(s => s.code !== code));
      // Clean up grades for deleted subject
      setGrades(grades.filter(g => g.subjectCode !== code));
    }
  };

  // Open Grade Modal (Input/Edit)
  const handleOpenGradeInput = (stud: Student, sub: Subject) => {
    setIsAddingGrade(false);
    const existingGrade = grades.find(g => g.studentId === stud.id && g.subjectCode === sub.code);
    setActiveStudent(stud);
    setActiveSubject(sub);
    if (existingGrade) {
      setAssignmentScore(existingGrade.assignmentScore);
      setUtsScore(existingGrade.utsScore);
      setUasScore(existingGrade.uasScore);
      setGradeNotes(existingGrade.notes);
    } else {
      setAssignmentScore(80);
      setUtsScore(80);
      setUasScore(80);
      setGradeNotes('');
    }
    setIsGradeModalOpen(true);
  };

  // Open Grade Modal for Add Assessment
  const handleOpenAddGrade = () => {
    setIsAddingGrade(true);
    setSelectedAddGradeClass(selectedClass);
    const firstStudent = students.find(s => s.class === selectedClass && s.status === 'Aktif') || students.find(s => s.class === selectedClass) || students[0] || null;
    setActiveStudent(firstStudent);
    setActiveSubject(subjects.find(s => s.code === selectedSubjectCode) || subjects[0] || null);
    setAssignmentScore(80);
    setUtsScore(80);
    setUasScore(80);
    setGradeNotes('');
    setIsGradeModalOpen(true);
  };

  // Delete Grade
  const handleDeleteGrade = (studentId: string, subjectCode: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus nilai ujian santri ini?')) {
      const updated = grades.filter(g => !(g.studentId === studentId && g.subjectCode === subjectCode));
      setGrades(updated);
    }
  };

  // Save Student Grade
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !activeSubject) return;

    // Calculate Final Score: 30% Tugas + 30% UTS + 40% UAS
    const final = Number((assignmentScore * 0.3 + utsScore * 0.3 + uasScore * 0.4).toFixed(1));
    
    // Map Grade A-E
    let letterGrade: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
    if (final >= 85) letterGrade = 'A';
    else if (final >= 75) letterGrade = 'B';
    else if (final >= 60) letterGrade = 'C';
    else if (final >= 45) letterGrade = 'D';
    else letterGrade = 'E';

    const newGrade: AcademicGrade = {
      id: `g_${activeStudent.id}_${activeSubject.code}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      class: activeStudent.class,
      subjectCode: activeSubject.code,
      subjectName: activeSubject.name,
      assignmentScore,
      utsScore,
      uasScore,
      finalScore: final,
      grade: letterGrade,
      notes: gradeNotes
    };

    const exists = grades.some(g => g.studentId === activeStudent.id && g.subjectCode === activeSubject.code);
    if (exists) {
      setGrades(grades.map(g => (g.studentId === activeStudent.id && g.subjectCode === activeSubject.code) ? newGrade : g));
    } else {
      setGrades([...grades, newGrade]);
    }

    setIsGradeModalOpen(false);
  };

  // Print PDF for filtered grades
  const handlePrintGrades = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up diperbolehkan.');
      return;
    }
    const html = `
      <html>
        <head>
          <title>Laporan Penilaian Ujian Santri</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #333; line-height: 1.4; }
            h2 { text-align: center; color: #1e3a8a; margin-bottom: 5px; font-size: 20px; }
            h4 { text-align: center; color: #4b5563; margin-top: 0; margin-bottom: 25px; font-size: 13px; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; }
            .footer { margin-top: 40px; text-align: right; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h2>LAPORAN PENILAIAN UJIAN SANTRI</h2>
          <h4>Mata Pelajaran: ${currentSubjectObj?.name} (${selectedSubjectCode}) | Kelas: ${selectedClass}</h4>
          <table>
            <thead>
              <tr>
                <th style="width: 45px;" class="text-center">No</th>
                <th>Nama Santri</th>
                <th class="text-center">Nilai Tugas (30%)</th>
                <th class="text-center">Nilai UTS (30%)</th>
                <th class="text-center">Nilai UAS (40%)</th>
                <th class="text-center">Nilai Akhir</th>
                <th class="text-center">Grade</th>
                <th>Catatan / Evaluasi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map((stud, idx) => {
                const scoreData = grades.find(g => g.studentId === stud.id && g.subjectCode === selectedSubjectCode);
                return `
                  <tr>
                    <td class="text-center font-mono">${idx + 1}</td>
                    <td><strong>${stud.name}</strong></td>
                    <td class="text-center font-mono">${scoreData ? scoreData.assignmentScore : '-'}</td>
                    <td class="text-center font-mono">${scoreData ? scoreData.utsScore : '-'}</td>
                    <td class="text-center font-mono">${scoreData ? scoreData.uasScore : '-'}</td>
                    <td class="text-center font-mono" style="font-weight: bold; color: #1e3a8a;">${scoreData ? scoreData.finalScore.toFixed(1) : '-'}</td>
                    <td class="text-center" style="font-weight: bold;">${scoreData ? scoreData.grade : '-'}</td>
                    <td>${scoreData?.notes || '<span style="color:#94a3b8;font-style:italic;">Belum dinilai</span>'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            Dicetak otomatis via Sistem Informasi Akademik Pesantren • Tanggal: ${new Date().toLocaleDateString('id-ID')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Export CSV for filtered grades
  const handleExportCSV = () => {
    const headers = ['No', 'Nama Santri', 'Kelas', 'Mata Pelajaran', 'Nilai Tugas', 'Nilai UTS', 'Nilai UAS', 'Nilai Akhir', 'Grade', 'Catatan'];
    const rows = filteredStudents.map((stud, idx) => {
      const scoreData = grades.find(g => g.studentId === stud.id && g.subjectCode === selectedSubjectCode);
      return [
        idx + 1,
        stud.name,
        selectedClass,
        currentSubjectObj?.name || selectedSubjectCode,
        scoreData ? scoreData.assignmentScore : '',
        scoreData ? scoreData.utsScore : '',
        scoreData ? scoreData.uasScore : '',
        scoreData ? scoreData.finalScore.toFixed(1) : '',
        scoreData ? scoreData.grade : '',
        scoreData?.notes || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Nilai_${selectedClass.replace(/\s+/g, '_')}_${selectedSubjectCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selected subject object
  const currentSubjectObj = subjects.find(s => s.code === selectedSubjectCode) || subjects[0];

  // Filter students by selected class and name search
  const filteredStudents = students.filter(s => s.class === selectedClass && s.status === 'Aktif' && (!gradeNameSearch || s.name.toLowerCase().includes(gradeNameSearch.toLowerCase())));

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Akademik &amp; Kurikulum</h1>
        <p className="text-on-surface-variant text-xs mt-1">
          Kelola mata pelajaran diniyah pesantren, penugasan ustadz pengampu, serta penilaian ujian berkala santri.
        </p>
      </div>

      {academicTab === 'subjects' ? (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-outline-variant/60 p-5 rounded-xl flex flex-col justify-between shadow-3xs">
              <div>
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Tahun Ajaran</span>
                <h4 className="font-display text-lg font-bold text-primary mt-1">2026 / 2027</h4>
                <p className="text-on-surface-variant mt-1 text-[11px]">Semester Ganjil (Aktif)</p>
              </div>
              <span className="text-primary font-bold text-[10px] mt-4 tracking-widest uppercase block cursor-pointer hover:underline">Ubah Periode</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-5 rounded-xl flex flex-col justify-between shadow-3xs">
              <div>
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Total Kurikulum</span>
                <h4 className="font-display text-lg font-bold text-primary mt-1">{subjects.length} Kitab / Dars</h4>
                <p className="text-on-surface-variant mt-1 text-[11px]">Materi Terintegrasi Pondok &amp; Diniyah</p>
              </div>
              <span className="text-primary font-bold text-[10px] mt-4 tracking-widest uppercase block cursor-pointer hover:underline">Lihat Silabus</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-5 rounded-xl flex flex-col justify-between shadow-3xs">
              <div>
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Ketuntasan Belajar</span>
                <h4 className="font-display text-lg font-bold text-primary mt-1">94.8%</h4>
                <p className="text-on-surface-variant mt-1 text-[11px]">Rata-rata Kelulusan Ujian Santri</p>
              </div>
              <span className="text-primary font-bold text-[10px] mt-4 tracking-widest uppercase block cursor-pointer hover:underline">Laporan KKM</span>
            </div>
          </div>

          {/* Table Subject Roster */}
          <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
            <div className="p-4 border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-display text-sm font-bold text-primary">Daftar Kitab &amp; Pelajaran Aktif</h3>
              <button
                onClick={handleOpenAddSubject}
                className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded-md hover:bg-primary-container transition-colors text-[10px] uppercase cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Tambah Pelajaran</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3">Kode</th>
                    <th className="p-3">Mata Pelajaran (Kitab)</th>
                    <th className="p-3">Ustadz Pengampu</th>
                    <th className="p-3 text-center">Jam / Minggu</th>
                    <th className="p-3">Ruangan</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs">
                  {subjects.map((sub) => (
                    <tr key={sub.code} className="hover:bg-surface-container-low/30 transition-colors font-medium text-on-surface">
                      <td className="p-3 font-mono font-bold text-on-surface-variant">{sub.code}</td>
                      <td className="p-3 font-semibold text-primary">{sub.name}</td>
                      <td className="p-3 text-on-surface-variant">{sub.teacher}</td>
                      <td className="p-3 text-center font-mono font-bold">{sub.hours} JP</td>
                      <td className="p-3 text-on-surface-variant/80">{sub.room}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditSubject(sub)}
                          className="p-1 text-primary hover:bg-primary/5 rounded mr-1 cursor-pointer"
                          title="Edit Pelajaran"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(sub.code)}
                          className="p-1 text-error hover:bg-error/5 rounded cursor-pointer"
                          title="Hapus Pelajaran"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Grading Tab (Removed) */
        <div className="hidden">
          {/* Filtering Header Bar */}
          <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1">Pilih Mata Pelajaran</label>
              <div className="relative min-w-[200px]">
                <select
                  value={selectedSubjectCode}
                  onChange={(e) => setSelectedSubjectCode(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface-container-low text-xs outline-none cursor-pointer font-semibold"
                >
                  {subjects.map(s => (
                    <option key={s.code} value={s.code}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">expand_more</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1">Pilih Kelas</label>
              <div className="relative min-w-[150px]">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface-container-low text-xs outline-none cursor-pointer font-semibold"
                >
                  {classes.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">expand_more</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1">Cari Nama Santri</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama santri..."
                  value={gradeNameSearch}
                  onChange={(e) => setGradeNameSearch(e.target.value)}
                  className="pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface-container-low text-xs outline-none w-[180px] font-medium"
                />
                {gradeNameSearch && (
                  <button onClick={() => setGradeNameSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 text-right text-[11px] text-on-surface-variant font-medium">
              Ustadz Pengampu: <strong className="text-primary">{currentSubjectObj?.teacher || '-'}</strong> | JP: <strong className="text-primary">{currentSubjectObj?.hours || 0} Jam</strong>
            </div>
          </div>

          {/* Student Exam Grades Table */}
          <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
            <div className="p-4 border-b border-outline-variant/40 bg-surface-container-lowest flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">rule</span>
                  <span>Lembar Penilaian Ujian Santri - {selectedClass}</span>
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full leading-none">
                  {currentSubjectObj?.name}
                </span>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleOpenAddGrade}
                  className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container transition-colors text-[10px] uppercase cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px]">add_circle</span>
                  <span>Tambah Penilaian</span>
                </button>
                <button
                  onClick={handlePrintGrades}
                  className="px-3 py-1.5 bg-secondary-container text-on-secondary-container font-bold rounded hover:bg-secondary-fixed-dim transition-colors text-[10px] uppercase cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                  <span>Print PDF</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-secondary-container text-on-secondary-container font-bold rounded hover:bg-secondary-fixed-dim transition-colors text-[10px] uppercase cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3">Nama Santri</th>
                    <th className="p-3 text-center">Nilai Tugas (30%)</th>
                    <th className="p-3 text-center">Nilai UTS (30%)</th>
                    <th className="p-3 text-center">Nilai UAS (40%)</th>
                    <th className="p-3 text-center">Nilai Akhir</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Catatan / Evaluasi</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs text-on-surface font-medium">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((stud, idx) => {
                      const scoreData = grades.find(g => g.studentId === stud.id && g.subjectCode === selectedSubjectCode);
                      return (
                        <tr key={stud.id} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="p-3 text-center font-mono text-on-surface-variant">{idx + 1}</td>
                          <td className="p-3 font-semibold text-primary">{stud.name}</td>
                          <td className="p-3 text-center font-mono">
                            {scoreData ? scoreData.assignmentScore : '-'}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {scoreData ? scoreData.utsScore : '-'}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {scoreData ? scoreData.uasScore : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-primary">
                            {scoreData ? scoreData.finalScore.toFixed(1) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            {scoreData ? (
                              <span className={`inline-block font-sans font-extrabold w-6 h-6 text-center leading-6 rounded-full text-[10px] ${
                                scoreData.grade === 'A' ? 'bg-green-100 text-green-800' :
                                scoreData.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                scoreData.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                scoreData.grade === 'D' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {scoreData.grade}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-on-surface-variant text-[11px] truncate max-w-[200px]">
                            {scoreData?.notes || <span className="italic text-on-surface-variant/40">Belum dinilai</span>}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => currentSubjectObj && handleOpenGradeInput(stud, currentSubjectObj)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase cursor-pointer flex items-center gap-1 ${
                                  scoreData 
                                    ? 'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim' 
                                    : 'bg-primary text-on-primary hover:bg-primary-container shadow-2xs'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[13px]">{scoreData ? 'edit' : 'add_circle'}</span>
                                <span>{scoreData ? 'Edit' : 'Nilai'}</span>
                              </button>
                              {scoreData && (
                                <button
                                  onClick={() => handleDeleteGrade(stud.id, selectedSubjectCode)}
                                  className="p-1 text-error hover:bg-error/5 rounded cursor-pointer"
                                  title="Hapus Nilai"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[36px] text-primary/30 block mb-1">group_off</span>
                        <span>Tidak ada santri aktif di kelas {selectedClass}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subject Form Modal (Add / Edit) */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-outline-variant/60 rounded-xl w-full max-w-md p-6 shadow-xl text-left space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/40 pb-3">
              <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">menu_book</span>
                <span>{editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Pelajaran Baru'}</span>
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-on-surface">Kode Pelajaran</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSubject}
                    placeholder="Contoh: MD06"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none uppercase font-mono disabled:bg-surface-container-low disabled:text-on-surface-variant"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-on-surface">JP / Minggu</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={subjectHours}
                    onChange={(e) => setSubjectHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-on-surface">Nama Pelajaran / Kitab</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bulughul Maram, Nahwu Wadhih"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-on-surface">Ustadz Pengampu</label>
                <select
                  value={subjectTeacher}
                  onChange={(e) => setSubjectTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer"
                >
                  {activeTeachers.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-on-surface">Ruangan Kelas / Lokasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelas 10-A, Aula Atas"
                  value={subjectRoom}
                  onChange={(e) => setSubjectRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="py-2 px-4 border border-outline-variant rounded-lg font-semibold hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container transition-all shadow-xs cursor-pointer"
                >
                  {editingSubject ? 'Simpan Perubahan' : 'Simpan Pelajaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Form Modal (Input / Edit) */}
      {isGradeModalOpen && activeStudent && activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-outline-variant/60 rounded-xl w-full max-w-md p-6 shadow-xl text-left space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/40 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px] text-primary">edit_document</span>
                  <span>Input Nilai Ujian Santri</span>
                </h3>
                {isAddingGrade ? (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Pilih Kelas</label>
                      <select
                        value={selectedAddGradeClass}
                        onChange={(e) => {
                          const cls = e.target.value;
                          setSelectedAddGradeClass(cls);
                          const firstStudOfClass = students.find(s => s.class === cls && s.status === 'Aktif') || students.find(s => s.class === cls);
                          if (firstStudOfClass) {
                            setActiveStudent(firstStudOfClass);
                            const existing = grades.find(g => g.studentId === firstStudOfClass.id && g.subjectCode === activeSubject.code);
                            if (existing) {
                              setAssignmentScore(existing.assignmentScore);
                              setUtsScore(existing.utsScore);
                              setUasScore(existing.uasScore);
                              setGradeNotes(existing.notes);
                            } else {
                              setAssignmentScore(80);
                              setUtsScore(80);
                              setUasScore(80);
                              setGradeNotes('');
                            }
                          } else {
                            setActiveStudent(null);
                          }
                        }}
                        className="w-full px-3 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
                      >
                        {classes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Pilih Santri</label>
                      <select
                        value={activeStudent?.id || ''}
                        onChange={(e) => {
                          const sObj = students.find(s => s.id === e.target.value);
                          if (sObj) {
                            setActiveStudent(sObj);
                            const existing = grades.find(g => g.studentId === sObj.id && g.subjectCode === activeSubject.code);
                            if (existing) {
                              setAssignmentScore(existing.assignmentScore);
                              setUtsScore(existing.utsScore);
                              setUasScore(existing.uasScore);
                              setGradeNotes(existing.notes);
                            } else {
                              setAssignmentScore(80);
                              setUtsScore(80);
                              setUasScore(80);
                              setGradeNotes('');
                            }
                          }
                        }}
                        className="w-full px-3 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
                      >
                        {students.filter(s => s.class === selectedAddGradeClass).length > 0 ? (
                          students.filter(s => s.class === selectedAddGradeClass).map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.status !== 'Aktif' ? `(${s.status})` : ''}
                            </option>
                          ))
                        ) : (
                          <option value="">(Tidak ada santri di kelas ini)</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Pilih Pelajaran</label>
                      <select
                        value={activeSubject.code}
                        onChange={(e) => {
                          const subObj = subjects.find(sub => sub.code === e.target.value);
                          if (subObj) {
                            setActiveSubject(subObj);
                            if (activeStudent) {
                              const existing = grades.find(g => g.studentId === activeStudent.id && g.subjectCode === subObj.code);
                              if (existing) {
                                setAssignmentScore(existing.assignmentScore);
                                setUtsScore(existing.utsScore);
                                setUasScore(existing.uasScore);
                                setGradeNotes(existing.notes);
                              } else {
                                setAssignmentScore(80);
                                setUtsScore(80);
                                setUasScore(80);
                                setGradeNotes('');
                              }
                            }
                          }
                        }}
                        className="w-full px-3 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
                      >
                        {subjects.map(sub => (
                          <option key={sub.code} value={sub.code}>
                            [{sub.code}] {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Santri: <strong>{activeStudent.name}</strong> | Pelajaran: <strong>{activeSubject.name}</strong></p>
                )}
              </div>
              <button
                onClick={() => setIsGradeModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-on-surface">Tugas (30%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={assignmentScore}
                    onChange={(e) => setAssignmentScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-on-surface">UTS (30%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={utsScore}
                    onChange={(e) => setUtsScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-on-surface">UAS (40%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={uasScore}
                    onChange={(e) => setUasScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Calculated projection badge */}
              <div className="bg-secondary-container/10 border border-secondary-container/50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="block text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Proyeksi Nilai Akhir</span>
                  <span className="font-mono text-lg font-bold text-primary">{(assignmentScore * 0.3 + utsScore * 0.3 + uasScore * 0.4).toFixed(1)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Grade</span>
                  <span className="font-sans text-md font-extrabold text-primary text-right block uppercase">
                    {(assignmentScore * 0.3 + utsScore * 0.3 + uasScore * 0.4) >= 85 ? 'A' :
                     (assignmentScore * 0.3 + utsScore * 0.3 + uasScore * 0.4) >= 75 ? 'B' :
                     (assignmentScore * 0.3 + utsScore * 0.3 + uasScore * 0.4) >= 60 ? 'C' :
                     (assignmentScore * 0.3 + utsScore * 0.3 + uasScore * 0.4) >= 45 ? 'D' : 'E'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-on-surface">Catatan Guru / Keterangan Evaluasi</label>
                <textarea
                  placeholder="Contoh: Menguasai naskah dars dengan baik, tulisan rapi, hafalan matan mutqin."
                  value={gradeNotes}
                  rows={3}
                  onChange={(e) => setGradeNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="py-2 px-4 border border-outline-variant rounded-lg font-semibold hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container transition-all shadow-xs cursor-pointer"
                >
                  Simpan Nilai Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. INTEGRATED OVERALL REPORT VIEW (LAPORAN)
// ==========================================
type ReportTab = 'students' | 'tahfidz' | 'attendance' | 'student_attendance' | 'points' | 'grades';

export function LaporanView({
  students = [],
  classes = [],
  programs = [],
  records = [],
  pointRecords: pointRecordsProp = [],
  attendance: attendanceProp = [],
  studentAttendance: studentAttendanceProp = [],
  grades: gradesProp = [],
}: OtherViewsProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('students');

  // Loaded database from local storage as fallbacks
  const [tahfidzRecords, setTahfidzRecords] = useState<MemorizationRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendance[]>([]);
  const [localStudentAttendance, setLocalStudentAttendance] = useState<StudentAttendance[]>([]);
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([]);
  const [academicGrades, setAcademicGrades] = useState<AcademicGrade[]>([]);

  // Filter States
  const [filterName, setFilterName] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterSifatSetoran, setFilterSifatSetoran] = useState(''); // Murojaah, Ziyadah, Perbaikan, Tasmi 1 Dudukan
  const [filterPointType, setFilterPointType] = useState(''); // Prestasi, Pelanggaran
  const [filterStatus, setFilterStatus] = useState(''); // Aktif, Alumni
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Load tahfidz records
    const tahfidzCached = localStorage.getItem('siakad_memorization');
    if (tahfidzCached) {
      setTahfidzRecords(JSON.parse(tahfidzCached));
    }

    // Load attendance records
    const attCached = localStorage.getItem('siakad_teacher_attendance');
    if (attCached) {
      setAttendanceRecords(JSON.parse(attCached));
    }

    // Load point records
    const pointsCached = localStorage.getItem('siakad_point_records');
    if (pointsCached) {
      setPointRecords(JSON.parse(pointsCached));
    }

    // Load academic grades
    const gradesCached = localStorage.getItem('siakad_academic_grades');
    if (gradesCached) {
      setAcademicGrades(JSON.parse(gradesCached));
    }

    // Load student attendance
    const studentAttCached = localStorage.getItem('siakad_student_attendance');
    if (studentAttCached) {
      setLocalStudentAttendance(JSON.parse(studentAttCached));
    }
  }, [activeTab]);

  const activeRecords = records && records.length > 0 ? records : tahfidzRecords;
  const activeAttendance = attendanceProp && attendanceProp.length > 0 ? attendanceProp : attendanceRecords;
  const activeStudentAttendance = studentAttendanceProp && studentAttendanceProp.length > 0 ? studentAttendanceProp : localStudentAttendance;
  const activePoints = pointRecordsProp && pointRecordsProp.length > 0 ? pointRecordsProp : pointRecords;
  const activeGrades = gradesProp && gradesProp.length > 0 ? gradesProp : academicGrades;

  // Filter Logic
  const filteredStudents = students.filter((s) => {
    const matchesName = !filterName || s.name.toLowerCase().includes(filterName.toLowerCase());
    const matchesClass = !filterClass || s.class === filterClass;
    const matchesProgram = !filterProgram || s.program === filterProgram;
    const matchesStatus = !filterStatus || s.status === filterStatus;
    return matchesName && matchesClass && matchesProgram && matchesStatus;
  });

  const filteredGrades = activeGrades.filter((g) => {
    const matchesName = !filterName || g.studentName.toLowerCase().includes(filterName.toLowerCase());
    const matchesClass = !filterClass || g.class === filterClass;
    const student = students.find((s) => s.id === g.studentId || s.name.toLowerCase() === g.studentName.toLowerCase());
    const sProgram = student ? student.program : '';
    const matchesProgram = !filterProgram || sProgram === filterProgram;
    return matchesName && matchesClass && matchesProgram;
  });

  const filteredTahfidz = activeRecords.filter((r) => {
    const student = students.find((s) => s.id === r.studentId || s.name.toLowerCase() === r.studentName.toLowerCase());
    const sClass = student ? student.class : '';
    const sProgram = student ? student.program : '';

    const matchesName = !filterName || r.studentName.toLowerCase().includes(filterName.toLowerCase());
    const matchesClass = !filterClass || sClass === filterClass;
    const matchesProgram = !filterProgram || sProgram === filterProgram;
    const matchesSifat = !filterSifatSetoran || r.type.toLowerCase() === filterSifatSetoran.toLowerCase();
    const matchesStart = !startDate || r.date >= startDate;
    const matchesEnd = !endDate || r.date <= endDate;

    return matchesName && matchesClass && matchesProgram && matchesSifat && matchesStart && matchesEnd;
  });

  const filteredAttendance = activeAttendance.filter((r) => {
    const matchesName = !filterName || r.teacherName.toLowerCase().includes(filterName.toLowerCase());
    const matchesClass = !filterClass || r.class === filterClass;
    const matchesStart = !startDate || r.date >= startDate;
    const matchesEnd = !endDate || r.date <= endDate;
    return matchesName && matchesClass && matchesStart && matchesEnd;
  });

  const filteredStudentAttendance = activeStudentAttendance.filter((r) => {
    const matchesName = !filterName || r.studentName.toLowerCase().includes(filterName.toLowerCase());
    const matchesClass = !filterClass || r.class === filterClass;
    const student = students.find((s) => s.id === r.studentId || s.name.toLowerCase() === r.studentName.toLowerCase());
    const sProgram = student ? student.program : '';
    const matchesProgram = !filterProgram || sProgram === filterProgram;
    const matchesStart = !startDate || r.date >= startDate;
    const matchesEnd = !endDate || r.date <= endDate;
    return matchesName && matchesClass && matchesProgram && matchesStart && matchesEnd;
  });

  const filteredPoints = activePoints.filter((r) => {
    const matchesName = !filterName || r.studentName.toLowerCase().includes(filterName.toLowerCase());
    const matchesClass = !filterClass || r.class === filterClass;
    const student = students.find((s) => s.id === r.studentId || s.name.toLowerCase() === r.studentName.toLowerCase());
    const sProgram = student ? student.program : '';
    const matchesProgram = !filterProgram || sProgram === filterProgram;
    const matchesType = !filterPointType || r.type === filterPointType;
    const matchesStart = !startDate || r.date >= startDate;
    const matchesEnd = !endDate || r.date <= endDate;
    return matchesName && matchesClass && matchesProgram && matchesType && matchesStart && matchesEnd;
  });

  // Reset Filters
  const handleResetFilters = () => {
    setFilterName('');
    setFilterClass('');
    setFilterProgram('');
    setFilterSifatSetoran('');
    setFilterPointType('');
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
  };

  // CSV Exporter for each specific view (incorporates current active filters only!)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    if (activeTab === 'students') {
      filename = `Laporan_Keseluruhan_Santri_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['NIS', 'NIP', 'Nama Santri', 'Tempat Lahir', 'Tgl Lahir', 'Kelas', 'Gender', 'Orangtua/Wali', 'No HP', 'Alamat', 'Tahun Masuk', 'Program', 'Status'];
      rows = filteredStudents.map((s) => [
        s.nis || '-',
        s.nip || '-',
        s.name,
        s.birthPlace || '-',
        s.birthDate || '-',
        s.class,
        s.gender,
        s.parentName || '-',
        s.phoneNumber || '-',
        s.address || '-',
        s.entryYear || '-',
        s.program,
        s.status,
      ]);
    } else if (activeTab === 'tahfidz') {
      filename = `Laporan_Pencapaian_Tahfidz_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Tanggal', 'Nama Santri', 'Kelas', 'Program', 'Ustadz', 'Sifat Setoran', 'Juz', 'Surah', 'Halaman', 'Baris', 'Tajwid', 'Tartil', 'Nilai Akhir', 'Grade', 'Catatan'];
      rows = filteredTahfidz.map((r) => {
        const student = students.find((s) => s.id === r.studentId || s.name === r.studentName);
        return [
          r.date,
          r.studentName,
          student ? student.class : '-',
          student ? student.program : '-',
          r.ustadz,
          r.type,
          r.juz,
          r.surah,
          r.page,
          r.line,
          r.tajwidScore,
          r.tartilScore,
          r.finalScore,
          r.grade,
          r.predikat || '-',
        ];
      });
    } else if (activeTab === 'attendance') {
      filename = `Laporan_Presensi_Pengajar_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Nama Ustadz', 'Tanggal', 'Kelas', 'Jam Pelajaran', 'Status Kehadiran', 'Jam Masuk', 'Catatan'];
      rows = filteredAttendance.map((r) => [
        r.teacherName,
        r.date,
        r.class || '-',
        r.lessonHour || '-',
        r.status,
        r.timeIn || '-',
        r.notes || '-',
      ]);
    } else if (activeTab === 'student_attendance') {
      filename = `Laporan_Kehadiran_Santri_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Nama Santri', 'Tanggal', 'Kelas', 'Status Kehadiran', 'Catatan/Keterangan'];
      rows = filteredStudentAttendance.map((r) => [
        r.studentName,
        r.date,
        r.class,
        r.status,
        r.notes || '-',
      ]);
    } else if (activeTab === 'points') {
      filename = `Laporan_Catatan_Poin_Santri_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Tanggal', 'Nama Santri', 'Kelas', 'Tipe Poin', 'Kategori', 'Poin', 'Ustadz Pelapor', 'Catatan Evaluasi'];
      rows = filteredPoints.map((r) => [
        r.date,
        r.studentName,
        r.class,
        r.type,
        r.categoryName,
        r.points,
        r.teacherName,
        r.notes || '-',
      ]);
    } else if (activeTab === 'grades') {
      filename = `Laporan_Penilaian_Ujian_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Nama Santri', 'Kelas', 'Mata Pelajaran', 'Nilai Tugas (30%)', 'Nilai UTS (30%)', 'Nilai UAS (40%)', 'Nilai Akhir', 'Grade', 'Catatan'];
      rows = filteredGrades.map((g) => [
        g.studentName,
        g.class,
        g.subjectName,
        g.assignmentScore,
        g.utsScore,
        g.uasScore,
        g.finalScore,
        g.grade,
        g.notes || '-',
      ]);
    }

    // Process and trigger download
    const csvContent = [
      headers.join(','),
      ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up diperbolehkan.');
      return;
    }

    let tabTitle = '';
    let tableHeaders = '';
    let tableRows = '';
    let summaryHtml = '';

    const filterDetails = [];
    if (filterName) filterDetails.push(`Nama/Pencarian: "${filterName}"`);
    if (filterClass) filterDetails.push(`Kelas: ${filterClass}`);
    if (filterProgram) filterDetails.push(`Program: ${filterProgram}`);
    if (filterSifatSetoran && activeTab === 'tahfidz') filterDetails.push(`Sifat Setoran: ${filterSifatSetoran}`);
    if (filterPointType && activeTab === 'points') filterDetails.push(`Jenis Poin: ${filterPointType}`);
    if (filterStatus && activeTab === 'students') filterDetails.push(`Status Keaktifan: ${filterStatus}`);
    if (startDate) filterDetails.push(`Mulai: ${startDate}`);
    if (endDate) filterDetails.push(`Selesai: ${endDate}`);

    const filterString = filterDetails.length > 0 ? filterDetails.join(' | ') : 'Semua Data (Tanpa Filter)';

    if (activeTab === 'students') {
      tabTitle = 'LAPORAN DATA LENGKAP SANTRI';
      tableHeaders = `
        <tr>
          <th style="width: 40px;" class="text-center">No</th>
          <th style="width: 90px;">NIS</th>
          <th style="width: 90px;">NIP</th>
          <th>Nama Lengkap</th>
          <th>Kelas</th>
          <th>Program</th>
          <th>Gender</th>
          <th>Wali Santri</th>
          <th>No. HP</th>
          <th>Status</th>
        </tr>
      `;
      tableRows = filteredStudents.map((s, idx) => `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td class="font-mono">${s.nis || '-'}</td>
          <td class="font-mono">${s.nip || '-'}</td>
          <td><strong>${s.name}</strong></td>
          <td class="text-center">${s.class}</td>
          <td class="text-center">${s.program}</td>
          <td>${s.gender}</td>
          <td>${s.parentName || '-'}</td>
          <td class="font-mono">${s.phoneNumber || '-'}</td>
          <td class="text-center font-bold">${s.status}</td>
        </tr>
      `).join('');
    } else if (activeTab === 'tahfidz') {
      tabTitle = 'LAPORAN PENCAPAIAN TAHFIDZ SANTRI';
      tableHeaders = `
        <tr>
          <th style="width: 40px;" class="text-center">No</th>
          <th style="width: 90px;">Tanggal</th>
          <th>Nama Santri</th>
          <th>Sifat Setoran</th>
          <th class="text-center">Juz</th>
          <th>Surah</th>
          <th class="text-center">Hal.</th>
          <th class="text-center">Baris</th>
          <th class="text-center">Nilai Akhir</th>
          <th class="text-center">Grade</th>
          <th>Penyimak (Ustadz)</th>
        </tr>
      `;
      tableRows = filteredTahfidz.map((r, idx) => `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td class="font-mono">${r.date}</td>
          <td><strong>${r.studentName}</strong></td>
          <td>${r.type}</td>
          <td class="text-center font-bold font-mono">${r.juz}</td>
          <td>${r.surah}</td>
          <td class="text-center font-mono">${r.page}</td>
          <td class="text-center font-mono">${r.line}</td>
          <td class="text-center font-mono font-bold" style="color: #1e3a8a;">${r.finalScore}</td>
          <td class="text-center font-bold">${r.grade}</td>
          <td>${r.ustadz}</td>
        </tr>
      `).join('');

      summaryHtml = `
        <div class="summary-box">
          <p><strong>Total Akumulasi Setoran:</strong> ${totalTahfidzLines} Baris | <strong>Rata-rata Nilai:</strong> ${averageTahfidzScore} / 100</p>
        </div>
      `;
    } else if (activeTab === 'attendance') {
      tabTitle = 'LAPORAN PRESENSI KEHADIRAN GURU / STAFF';
      tableHeaders = `
        <tr>
          <th style="width: 40px;" class="text-center">No</th>
          <th>Nama Ustadz / Pengajar</th>
          <th style="width: 90px;">Tanggal</th>
          <th>Kelas</th>
          <th>Jam Pelajaran</th>
          <th>Status Kehadiran</th>
          <th class="text-center">Jam Masuk</th>
          <th>Catatan / Keterangan</th>
        </tr>
      `;
      tableRows = filteredAttendance.map((r, idx) => `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td><strong>${r.teacherName}</strong></td>
          <td class="font-mono">${r.date}</td>
          <td class="text-center font-bold">${r.class || '-'}</td>
          <td>${r.lessonHour || '-'}</td>
          <td class="text-center font-bold" style="color: ${
            r.status === 'Hadir' ? '#047857' : r.status === 'Izin' ? '#d97706' : r.status === 'Sakit' ? '#2563eb' : '#dc2626'
          };">${r.status}</td>
          <td class="text-center font-mono">${r.timeIn || '--:--'}</td>
          <td>${r.notes || '-'}</td>
        </tr>
      `).join('');
    } else if (activeTab === 'student_attendance') {
      tabTitle = 'LAPORAN PRESENSI KEHADIRAN SANTRI';
      tableHeaders = `
        <tr>
          <th style="width: 40px;" class="text-center">No</th>
          <th>Nama Santri</th>
          <th class="text-center">Kelas</th>
          <th style="width: 90px;" class="text-center">Tanggal</th>
          <th class="text-center">Status Kehadiran</th>
          <th>Catatan / Keterangan</th>
        </tr>
      `;
      tableRows = filteredStudentAttendance.map((r, idx) => `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td><strong>${r.studentName}</strong></td>
          <td class="text-center font-bold">${r.class}</td>
          <td class="text-center font-mono">${r.date}</td>
          <td class="text-center font-bold" style="color: ${
            r.status === 'Hadir' ? '#047857' : r.status === 'Izin' ? '#d97706' : r.status === 'Sakit' ? '#2563eb' : '#dc2626'
          };">${r.status}</td>
          <td>${r.notes || '-'}</td>
        </tr>
      `).join('');

      const sPresent = filteredStudentAttendance.filter(r => r.status === 'Hadir').length;
      const sIzin = filteredStudentAttendance.filter(r => r.status === 'Izin').length;
      const sSakit = filteredStudentAttendance.filter(r => r.status === 'Sakit').length;
      const sAlpa = filteredStudentAttendance.filter(r => r.status === 'Alpa').length;

      summaryHtml = `
        <div class="summary-box">
          <p><strong>Total Rekor Presensi Santri:</strong> ${filteredStudentAttendance.length} | Hadir: <strong>${sPresent}</strong> | Izin: <strong>${sIzin}</strong> | Sakit: <strong>${sSakit}</strong> | Alpa: <strong>${sAlpa}</strong></p>
        </div>
      `;
    } else if (activeTab === 'points') {
      tabTitle = 'LAPORAN CATATAN POIN KEDISIPLINAN & PRESTASI';
      tableHeaders = `
        <tr>
          <th style="width: 40px;" class="text-center">No</th>
          <th style="width: 90px;">Tanggal</th>
          <th>Nama Santri</th>
          <th class="text-center">Kelas</th>
          <th class="text-center">Jenis</th>
          <th>Kategori Pelanggaran / Prestasi</th>
          <th class="text-center">Poin</th>
          <th>Ustadz Pelapor</th>
          <th>Keterangan Evaluasi</th>
        </tr>
      `;
      tableRows = filteredPoints.map((r, idx) => `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td class="font-mono">${r.date}</td>
          <td><strong>${r.studentName}</strong></td>
          <td class="text-center">${r.class}</td>
          <td class="text-center" style="font-weight: bold; color: ${r.type === 'Prestasi' ? '#047857' : '#dc2626'};">${r.type}</td>
          <td>${r.categoryName}</td>
          <td class="text-center font-bold font-mono" style="color: ${r.points > 0 ? '#047857' : '#dc2626'};">${r.points > 0 ? `+${r.points}` : r.points}</td>
          <td>${r.teacherName}</td>
          <td>${r.notes || '-'}</td>
        </tr>
      `).join('');

      summaryHtml = `
        <div class="summary-box">
          <p><strong>Total Poin Prestasi:</strong> <span style="color:#047857; font-weight:bold;">+${totalPrestasiPoints}</span> | <strong>Total Poin Pelanggaran:</strong> <span style="color:#dc2626; font-weight:bold;">-${totalPelanggaranPoints}</span> | <strong>Sisa Akumulasi Bersih:</strong> <span style="font-weight:bold; color:${netPointsScore >= 0 ? '#047857' : '#dc2626'}">${netPointsScore >= 0 ? `+${netPointsScore}` : netPointsScore}</span></p>
        </div>
      `;
    } else if (activeTab === 'grades') {
      tabTitle = 'LAPORAN REKAPITULASI PENILAIAN UJIAN SANTRI';
      tableHeaders = `
        <tr>
          <th style="width: 40px;" class="text-center">No</th>
          <th>Nama Santri</th>
          <th class="text-center">Kelas</th>
          <th>Mata Pelajaran</th>
          <th class="text-center">Tugas (30%)</th>
          <th class="text-center">UTS (30%)</th>
          <th class="text-center">UAS (40%)</th>
          <th class="text-center">Nilai Akhir</th>
          <th class="text-center">Grade</th>
          <th>Catatan</th>
        </tr>
      `;
      tableRows = filteredGrades.map((g, idx) => `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td><strong>${g.studentName}</strong></td>
          <td class="text-center">${g.class}</td>
          <td>${g.subjectName}</td>
          <td class="text-center font-mono">${g.assignmentScore}</td>
          <td class="text-center font-mono">${g.utsScore}</td>
          <td class="text-center font-mono">${g.uasScore}</td>
          <td class="text-center font-mono font-bold" style="color: #1e3a8a;">${g.finalScore.toFixed(1)}</td>
          <td class="text-center font-bold">${g.grade}</td>
          <td>${g.notes || '-'}</td>
        </tr>
      `).join('');

      const avgGradeScore = filteredGrades.length > 0
        ? Number((filteredGrades.reduce((sum, g) => sum + g.finalScore, 0) / filteredGrades.length).toFixed(1))
        : 0;

      summaryHtml = `
        <div class="summary-box">
          <p><strong>Total Record Penilaian:</strong> ${filteredGrades.length} Siswa | <strong>Rata-rata Nilai Akhir Kelas:</strong> ${avgGradeScore} / 100</p>
        </div>
      `;
    }

    const html = `
      <html>
        <head>
          <title>${tabTitle}</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #333; line-height: 1.4; }
            .header-container { border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
            h2 { text-align: center; color: #1e3a8a; margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
            h3 { text-align: center; color: #1e293b; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
            p.meta-info { text-align: center; color: #64748b; margin: 0; font-size: 11px; }
            .filter-info { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 15px; margin-bottom: 20px; font-size: 11px; color: #334155; }
            .filter-info strong { color: #1e293b; }
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
            <h2>Laporan Madrasah Ummi</h2>
            <h3>${tabTitle}</h3>
            <p class="meta-info">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Waktu: ${new Date().toLocaleTimeString('id-ID')}</p>
          </div>
          
          <div class="filter-info">
            <strong>Kriteria Pencarian / Filter Aktif:</strong> ${filterString}
          </div>

          <table>
            <thead>
              ${tableHeaders}
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="20" style="text-align:center; padding: 20px; color:#64748b; font-style:italic;">Tidak ada data yang ditampilkan dengan filter saat ini.</td></tr>'}
            </tbody>
          </table>

          ${summaryHtml}

          <div class="footer">
            Laporan ini digenerate secara otomatis oleh modul rekapitulasi terpadu SIAKAD • Halaman 1 dari 1
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

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintPointsCharts = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up diperbolehkan.');
      return;
    }

    const studentStats: { [name: string]: { prestasi: number; pelanggaran: number; net: number; class: string } } = {};
    filteredPoints.forEach((p) => {
      if (!studentStats[p.studentName]) {
        studentStats[p.studentName] = { prestasi: 0, pelanggaran: 0, net: 0, class: p.class };
      }
      if (p.type === 'Prestasi') {
        studentStats[p.studentName].prestasi += p.points;
      } else {
        studentStats[p.studentName].pelanggaran += Math.abs(p.points);
      }
      studentStats[p.studentName].net += p.points;
    });

    const studentStatsList = Object.entries(studentStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.net - a.net);

    const maxNet = Math.max(...studentStatsList.map(s => Math.abs(s.net)), 1);

    const categoryStats: { [cat: string]: { count: number; totalPoints: number; type: string } } = {};
    filteredPoints.forEach((p) => {
      if (!categoryStats[p.categoryName]) {
        categoryStats[p.categoryName] = { count: 0, totalPoints: 0, type: p.type };
      }
      categoryStats[p.categoryName].count += 1;
      categoryStats[p.categoryName].totalPoints += p.points;
    });

    const categoryStatsList = Object.entries(categoryStats)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.count - a.count);

    const maxCount = Math.max(...categoryStatsList.map(s => s.count), 1);

    const html = `
      <html>
        <head>
          <title>Laporan Grafik Akumulasi Poin Santri</title>
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; background-color: #ffffff; }
            .header { text-align: center; border-bottom: 3px double #0f766e; padding-bottom: 12px; margin-bottom: 25px; }
            .header h1 { color: #0f766e; font-size: 20px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
            .header p { font-size: 11px; color: #64748b; margin: 4px 0 0 0; }
            
            .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background: #f8fafc; text-align: left; }
            .card-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .card-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
            .text-emerald { color: #047857; }
            .text-red { color: #b91c1c; }
            .text-primary { color: #0f766e; }

            .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
            .section-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
            .section-title { font-size: 12px; font-weight: bold; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
            
            .progress-item { margin-bottom: 12px; text-align: left; }
            .progress-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; margin-bottom: 4px; }
            .progress-sub { display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-top: 2px; }
            .bar-bg { background-color: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden; display: flex; width: 100%; border: 1px solid #e2e8f0; }
            .bar-fill { height: 100%; border-radius: 4px; }
            .bg-emerald { background-color: #10b981; }
            .bg-red { background-color: #ef4444; }

            .badge { display: inline-block; font-size: 8px; font-weight: bold; padding: 1px 5px; border-radius: 3px; border: 1px solid; text-transform: uppercase; vertical-align: middle; }
            .badge-emerald { background-color: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
            .badge-red { background-color: #fef2f2; color: #991b1b; border-color: #fecaca; }

            .footer { margin-top: 40px; text-align: right; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Grafik Akumulasi Poin & Kedisiplinan Santri</h1>
            <p>Sistem Informasi Akademik Pesantren • Hasil Filter Grafik Tampil Aktif</p>
          </div>

          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Total Poin Prestasi</div>
              <div class="card-val text-emerald">+${totalPrestasiPoints} Poin</div>
            </div>
            <div class="card">
              <div class="card-title">Total Poin Pelanggaran</div>
              <div class="card-val text-red">-${totalPelanggaranPoints} Poin</div>
            </div>
            <div class="card">
              <div class="card-title">Akumulasi Skor Akhir</div>
              <div class="card-val text-primary">${netPointsScore >= 0 ? `+${netPointsScore}` : netPointsScore} Skor</div>
            </div>
          </div>

          <div class="section-grid">
            <div class="section-box">
              <div class="section-title">Akumulasi Skor Per Santri (Tampil)</div>
              <div>
                ${studentStatsList.length > 0 ? studentStatsList.map((st) => {
                  const percentage = Math.min(100, Math.round((Math.abs(st.net) / maxNet) * 100));
                  const isPositive = st.net >= 0;
                  return `
                    <div class="progress-item">
                      <div class="progress-header">
                        <span>${st.name} <span style="font-size: 8px; color: #64748b; background: #e2e8f0; padding: 1px 4px; border-radius: 3px;">${st.class}</span></span>
                        <span class="${isPositive ? 'text-emerald' : 'text-red'}" style="font-family: monospace; font-weight: bold;">${isPositive ? `+${st.net}` : st.net} Poin</span>
                      </div>
                      <div class="bar-bg">
                        <div class="bar-fill ${isPositive ? 'bg-emerald' : 'bg-red'}" style="width: ${percentage}%;"></div>
                      </div>
                      <div class="progress-sub">
                        <span>+${st.prestasi} Prestasi</span>
                        <span>-${st.pelanggaran} Pelanggaran</span>
                      </div>
                    </div>
                  `;
                }).join('') : '<p style="font-size:11px;color:#94a3b8;font-style:italic;">Tidak ada data santri</p>'}
              </div>
            </div>

            <div class="section-box">
              <div class="section-title">Distribusi Kategori Reward / Pelanggaran (Tampil)</div>
              <div>
                ${categoryStatsList.length > 0 ? categoryStatsList.map((cat) => {
                  const percentage = Math.round((cat.count / maxCount) * 100);
                  const isPrestasi = cat.type === 'Prestasi';
                  return `
                    <div class="progress-item">
                      <div class="progress-header">
                        <span>
                          <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; display: inline-block; white-space: nowrap; vertical-align: middle;">${cat.category}</span>
                          <span class="badge ${isPrestasi ? 'badge-emerald' : 'badge-red'}">${cat.type}</span>
                        </span>
                        <span style="font-family: monospace; font-weight: bold;">${cat.count}x kejadian</span>
                      </div>
                      <div class="bar-bg">
                        <div class="bar-fill ${isPrestasi ? 'bg-emerald' : 'bg-red'}" style="width: ${percentage}%;"></div>
                      </div>
                      <div class="progress-sub">
                        <span>Akumulasi Poin:</span>
                        <span style="font-weight:bold;">${cat.totalPoints >= 0 ? `+${cat.totalPoints}` : cat.totalPoints} Poin</span>
                      </div>
                    </div>
                  `;
                }).join('') : '<p style="font-size:11px;color:#94a3b8;font-style:italic;">Tidak ada data kategori</p>'}
              </div>
            </div>
          </div>

          <div class="footer">
            Dicetak otomatis via Sistem Informasi Akademik Pesantren • Tanggal Cetak: ${new Date().toLocaleString('id-ID')}
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

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Calculations for Tahfidz tab
  const totalTahfidzLines = filteredTahfidz.reduce((sum, r) => {
    const num = parseInt(r.line);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const averageTahfidzScore = filteredTahfidz.length > 0
    ? Number((filteredTahfidz.reduce((sum, r) => sum + r.finalScore, 0) / filteredTahfidz.length).toFixed(1))
    : 0;

  // Calculations for Point tab based strictly on currently filtered/visible data
  const totalPrestasiPoints = filteredPoints
    .filter((r) => r.type === 'Prestasi')
    .reduce((sum, r) => sum + r.points, 0);

  const totalPelanggaranPoints = filteredPoints
    .filter((r) => r.type === 'Pelanggaran')
    .reduce((sum, r) => sum + Math.abs(r.points), 0);

  const netPointsScore = totalPrestasiPoints - totalPelanggaranPoints;

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in print:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Rekapitulasi Laporan Terpadu</h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Sistem rekapitulasi data santri, pencapaian setoran tahfidz harian, presensi mengajar guru, dan pencatatan poin kedisiplinan.
          </p>
        </div>

        {/* Global Export actions */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 border border-outline-variant/60 bg-white text-on-surface font-semibold rounded-lg hover:bg-surface-container-low transition-colors shadow-3xs cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Cetak PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-all shadow-3xs cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-outline-variant/40 gap-1 overflow-x-auto pb-px print:hidden">
        <button
          onClick={() => { setActiveTab('students'); handleResetFilters(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'students'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Data Lengkap Santri ({filteredStudents.length})
        </button>
        <button
          onClick={() => { setActiveTab('tahfidz'); handleResetFilters(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'tahfidz'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Pencapaian Tahfidz ({filteredTahfidz.length})
        </button>
        <button
          onClick={() => { setActiveTab('attendance'); handleResetFilters(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'attendance'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Kehadiran Ustadz ({filteredAttendance.length})
        </button>
        <button
          onClick={() => { setActiveTab('student_attendance'); handleResetFilters(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'student_attendance'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Kehadiran Santri ({filteredStudentAttendance.length})
        </button>
        <button
          onClick={() => { setActiveTab('points'); handleResetFilters(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'points'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Catatan Poin ({filteredPoints.length})
        </button>
        <button
          onClick={() => { setActiveTab('grades'); handleResetFilters(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'grades'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Penilaian Ujian ({filteredGrades.length})
        </button>
      </div>

      {/* Multi-Filter Panel */}
      <div className="bg-white border border-outline-variant/60 p-4 rounded-xl space-y-3.5 shadow-3xs print:hidden">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
          <span className="font-display font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">filter_alt</span>
            <span>Filter Laporan Terpadu</span>
          </span>
          {(filterName || filterClass || filterProgram || filterSifatSetoran || filterPointType || filterStatus || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-primary hover:text-primary-container font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Filter Nama */}
          <div className="space-y-1">
            <label className="block text-on-surface-variant font-bold text-[10px] uppercase">Nama Santri / Guru</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[15px]">search</span>
              <input
                type="text"
                placeholder="Cari nama..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Filter Kelas */}
          <div className="space-y-1">
            <label className="block text-on-surface-variant font-bold text-[10px] uppercase">Kelas</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filter Program */}
          {(activeTab === 'students' || activeTab === 'tahfidz' || activeTab === 'student_attendance' || activeTab === 'grades' || activeTab === 'points') && (
            <div className="space-y-1">
              <label className="block text-on-surface-variant font-bold text-[10px] uppercase">Program Studi</label>
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer"
              >
                <option value="">Semua Program</option>
                {programs.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tab Specific Filter: Sifat Setoran */}
          {activeTab === 'tahfidz' && (
            <div className="space-y-1">
              <label className="block text-on-surface-variant font-bold text-[10px] uppercase">Sifat Setoran</label>
              <select
                value={filterSifatSetoran}
                onChange={(e) => setFilterSifatSetoran(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer"
              >
                <option value="">Semua Sifat</option>
                <option value="Murojaah">Murojaah</option>
                <option value="Ziyadah">Ziyadah</option>
                <option value="Perbaikan">Perbaikan</option>
                <option value="Tasmi 1 Dudukan">Tasmi 1 Dudukan</option>
              </select>
            </div>
          )}

          {/* Tab Specific Filter: Point Type */}
          {activeTab === 'points' && (
            <div className="space-y-1">
              <label className="block text-on-surface-variant font-bold text-[10px] uppercase">Jenis Poin</label>
              <select
                value={filterPointType}
                onChange={(e) => setFilterPointType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer"
              >
                <option value="">Semua Jenis</option>
                <option value="Prestasi">Prestasi</option>
                <option value="Pelanggaran">Pelanggaran</option>
              </select>
            </div>
          )}

          {/* Tab Specific Filter: Student Status */}
          {activeTab === 'students' && (
            <div className="space-y-1">
              <label className="block text-on-surface-variant font-bold text-[10px] uppercase">Status Keaktifan</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
          )}

          {/* Date Range: Start */}
          {activeTab !== 'students' && (
            <div className="space-y-1">
              <label className="block text-on-surface-variant font-bold text-[10px] uppercase">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-[11px] outline-none cursor-pointer font-mono"
              />
            </div>
          )}

          {/* Date Range: End */}
          {activeTab !== 'students' && (
            <div className="space-y-1">
              <label className="block text-on-surface-variant font-bold text-[10px] uppercase">Tanggal Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-[11px] outline-none cursor-pointer font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Meta Header (Only visible on PDF Print) */}
      <div className="hidden print:block border-b-2 border-primary pb-3 mb-4">
        <h2 className="text-center font-display text-xl font-bold text-primary uppercase">Laporan Madrasah Ummi</h2>
        <p className="text-center text-xs font-medium text-on-surface-variant">Laporan Rekapitulasi Terpadu • Tanggal: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-on-surface border border-outline-variant/60 p-2 rounded">
          <div><strong>Kategori Laporan:</strong> {activeTab === 'students' ? 'Data Lengkap Santri' : activeTab === 'tahfidz' ? 'Pencapaian Tahfidz' : activeTab === 'attendance' ? 'Presensi Mengajar' : 'Catatan Poin Kedisiplinan'}</div>
          <div><strong>Jumlah Baris Data:</strong> {activeTab === 'students' ? filteredStudents.length : activeTab === 'tahfidz' ? filteredTahfidz.length : activeTab === 'attendance' ? filteredAttendance.length : filteredPoints.length} Rekor</div>
          <div>
            <strong>Status Filter:</strong> {filterName || filterClass || filterProgram || filterSifatSetoran || filterPointType || startDate || endDate ? 'Filtered Subset' : 'Seluruh Data'}
          </div>
        </div>
      </div>

      {/* TABLE 1: STUDENT DATA TABLE */}
      {activeTab === 'students' && (
        <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
          <div className="p-3 bg-surface-container-low border-b border-outline-variant/40 flex justify-between items-center print:hidden">
            <span className="font-sans font-bold text-primary">Menampilkan {filteredStudents.length} dari {students.length} Total Santri</span>
          </div>
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                  <th className="p-3 pl-4">Foto</th>
                  <th className="p-3">NIS / NIP</th>
                  <th className="p-3">Nama Santri</th>
                  <th className="p-3">Lahir</th>
                  <th className="p-3">Kelas / Program</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Orangtua / Wali</th>
                  <th className="p-3">No HP</th>
                  <th className="p-3">Alamat</th>
                  <th className="p-3 pr-4">Masuk / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="p-3 pl-4">
                      {s.photoUrl ? (
                        <img alt={s.name} src={s.photoUrl} className="w-9 h-9 rounded-full object-cover border border-outline-variant" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-container-high border flex items-center justify-center font-bold text-on-surface-variant">
                          {s.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      <div>NIS: {s.nis || '-'}</div>
                      <div className="text-on-surface-variant mt-0.5">ID: {s.nip || '-'}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-primary">{s.name}</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">Asrama: {s.dorm || '-'}</div>
                    </td>
                    <td className="p-3">
                      <div>{s.birthPlace || '-'}</div>
                      <div className="text-on-surface-variant text-[10px] mt-0.5">{s.birthDate || '-'}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold">{s.class}</div>
                      <span className="inline-block bg-primary/10 text-primary font-bold text-[9px] px-1.5 py-0.5 rounded-full mt-0.5">{s.program}</span>
                    </td>
                    <td className="p-3">{s.gender}</td>
                    <td className="p-3">{s.parentName || '-'}</td>
                    <td className="p-3 font-mono">{s.phoneNumber || '-'}</td>
                    <td className="p-3 max-w-40 truncate" title={s.address}>{s.address || '-'}</td>
                    <td className="p-3 pr-4">
                      <div>Th: {s.entryYear || '-'}</div>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        s.status === 'Aktif' ? 'bg-[#e2f5ec] text-[#0d5c3a] border border-[#a3e0c1]' : 'bg-red-50 text-red-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE 2: TAHFIDZ ACHIEVEMENT REPORT TABLE */}
      {activeTab === 'tahfidz' && (
        <div className="space-y-4">
          {/* Calculated KPI Tahfidz Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter bg-white border border-outline-variant/60 rounded-xl p-4 shadow-3xs">
            <div className="text-left">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Total Setoran Hafalan</span>
              <h3 className="font-display text-xl font-bold text-primary mt-1">{filteredTahfidz.length} Rekor</h3>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Berdasarkan filter aktif</p>
            </div>
            <div className="text-left border-t sm:border-t-0 sm:border-x border-outline-variant/40 pt-2 sm:pt-0 sm:px-4">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Kalkulasi Total Baris</span>
              <h3 className="font-display text-xl font-bold text-emerald-700 mt-1">{totalTahfidzLines} Baris</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Est. {Math.round(totalTahfidzLines / 15)} Halaman penuh (15 b/h)</p>
            </div>
            <div className="text-left border-t sm:border-t-0 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Rata-rata Nilai</span>
              <h3 className="font-display text-xl font-bold text-primary mt-1">{averageTahfidzScore} / 100</h3>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Sifat: {filterSifatSetoran || 'Semua Sifat'}</p>
            </div>
          </div>

          <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                    <th className="p-3 pl-4">Tanggal</th>
                    <th className="p-3">Santri</th>
                    <th className="p-3">Pengajar</th>
                    <th className="p-3">Sifat Setoran</th>
                    <th className="p-3 text-center">Juz</th>
                    <th className="p-3">Surat</th>
                    <th className="p-3 text-center">Hal / Baris</th>
                    <th className="p-3 text-right">Makhraj / Tajwid / Tartil</th>
                    <th className="p-3 text-center">Nilai</th>
                    <th className="p-3 pr-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
                  {filteredTahfidz.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-on-surface-variant">{r.date}</td>
                      <td className="p-3">
                        <div className="font-bold text-primary">{r.studentName}</div>
                      </td>
                      <td className="p-3 font-semibold text-on-surface-variant">{r.ustadz}</td>
                      <td className="p-3">
                        <span className="bg-secondary-fixed text-primary font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          {r.type}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-primary text-sm">{r.juz}</td>
                      <td className="p-3 font-semibold">{r.surah}</td>
                      <td className="p-3 text-center font-mono">
                        <div>Hal: {r.page}</div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">{r.line} Baris</div>
                      </td>
                      <td className="p-3 text-right font-mono text-[10px] text-on-surface-variant">
                        <div>Makhraj: Lulus</div>
                        <div>Tajwid: {r.tajwidScore}</div>
                        <div>Tartil: {r.tartilScore}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mx-auto text-white ${
                          r.grade === 'A' ? 'bg-emerald-600' : r.grade === 'B' ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                          {r.grade}
                        </div>
                        <span className="text-[9px] text-on-surface-variant mt-0.5 font-mono">{r.finalScore}</span>
                      </td>
                      <td className="p-3 pr-4 max-w-40 truncate" title={r.predikat}>{r.predikat || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TABLE 3: TEACHER ATTENDANCE REPORT TABLE */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
          <div className="p-3 bg-surface-container-low border-b border-outline-variant/40 flex justify-between items-center print:hidden">
            <span className="font-sans font-bold text-primary">Menampilkan {filteredAttendance.length} Log Kehadiran Guru</span>
          </div>
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                  <th className="p-3 pl-4">Pengajar / Ustadz</th>
                  <th className="p-3 font-mono">Tanggal</th>
                  <th className="p-3">Kelas &amp; Jam Mengajar</th>
                  <th className="p-3">Status Kehadiran</th>
                  <th className="p-3 text-center">Waktu Log Masuk</th>
                  <th className="p-3 pr-4">Catatan Kegiatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
                {filteredAttendance.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="p-3 pl-4">
                      <div className="font-bold text-primary">{r.teacherName}</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">Guru Pembimbing</div>
                    </td>
                    <td className="p-3 font-mono">{r.date}</td>
                    <td className="p-3">
                      <div className="font-bold text-on-surface">{r.class || 'Pagi / Umum'}</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">{r.lessonHour || '-'}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold ${
                        r.status === 'Hadir'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : r.status === 'Izin'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : r.status === 'Sakit'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-primary">{r.timeIn || '--:--'}</td>
                    <td className="p-3 pr-4">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE 3B: STUDENT ATTENDANCE REPORT TABLE */}
      {activeTab === 'student_attendance' && (
        <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
          <div className="p-3 bg-surface-container-low border-b border-outline-variant/40 flex justify-between items-center print:hidden">
            <span className="font-sans font-bold text-primary">Menampilkan {filteredStudentAttendance.length} Log Kehadiran Santri</span>
          </div>
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                  <th className="p-3 pl-4">Nama Santri</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3 font-mono">Tanggal</th>
                  <th className="p-3">Status Kehadiran</th>
                  <th className="p-3 pr-4">Catatan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
                {filteredStudentAttendance.length > 0 ? (
                  filteredStudentAttendance.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="font-bold text-primary">{r.studentName}</div>
                      </td>
                      <td className="p-3 font-bold text-on-surface">{r.class}</td>
                      <td className="p-3 font-mono text-on-surface-variant">{r.date}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold ${
                          r.status === 'Hadir'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : r.status === 'Izin'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : r.status === 'Sakit'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-on-surface-variant">{r.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant font-medium">
                      Tidak ada data kehadiran santri yang sesuai kriteria pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE 4: POINT RECORDS REPORT TABLE */}
      {activeTab === 'points' && (
        <div className="space-y-4">
          {/* Dynamic Filtered Header: Total Points, Total Violations, and Final Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter bg-white border border-outline-variant/60 rounded-xl p-4 shadow-3xs">
            <div className="text-left">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Total Poin Prestasi</span>
              <h3 className="font-display text-xl font-bold text-emerald-700 mt-1">+{totalPrestasiPoints} Poin</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Dihasilkan dari tindakan terpuji</p>
            </div>
            <div className="text-left border-t sm:border-t-0 sm:border-x border-outline-variant/40 pt-2 sm:pt-0 sm:px-4">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Total Poin Pelanggaran</span>
              <h3 className="font-display text-xl font-bold text-red-700 mt-1">-{totalPelanggaranPoints} Poin</h3>
              <p className="text-[10px] text-red-500 font-semibold mt-0.5">Konsekuensi indisipliner santri</p>
            </div>
            <div className="text-left border-t sm:border-t-0 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Akumulasi Skor Akhir</span>
              <h3 className={`font-display text-xl font-bold mt-1 ${netPointsScore >= 0 ? 'text-primary' : 'text-error'}`}>
                {netPointsScore >= 0 ? `+${netPointsScore}` : netPointsScore} Skor Net
              </h3>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Poin santri aktif yang ter-filter</p>
            </div>
          </div>

          {/* Visual Charts: Student Points & Categories based strictly on filtered data */}
          {filteredPoints.length > 0 ? (
            <div className="space-y-3">
              {/* Visual Charts Header with Print Action */}
              <div className="flex justify-between items-center bg-teal-50/50 border border-teal-100/65 rounded-xl px-4 py-3 shadow-3xs text-left">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-800 text-[18px]">query_stats</span>
                  <span className="font-sans font-bold text-xs text-teal-900">Analisis Grafik Akumulasi & Distribusi Poin</span>
                </div>
                <button
                  onClick={handlePrintPointsCharts}
                  className="inline-flex items-center gap-1.5 text-primary hover:text-primary-container bg-primary/10 hover:bg-primary/15 transition-all font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer shadow-3xs"
                >
                  <span className="material-symbols-outlined text-[14px]">print</span>
                  <span>Cetak Grafik Poin</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter text-left">
              {/* Chart 1: Student Accumulation */}
              <div className="bg-white border border-outline-variant/60 rounded-xl p-4 shadow-3xs">
                <div className="flex items-center gap-1.5 border-b border-outline-variant/30 pb-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
                  <h4 className="font-display font-bold text-xs text-primary">Akumulasi Skor per Santri (Tampil)</h4>
                </div>
                <div className="space-y-3 px-1 max-h-[260px] overflow-y-auto">
                  {(() => {
                    const studentStats: { [name: string]: { prestasi: number; pelanggaran: number; net: number; class: string } } = {};
                    filteredPoints.forEach((p) => {
                      if (!studentStats[p.studentName]) {
                        studentStats[p.studentName] = { prestasi: 0, pelanggaran: 0, net: 0, class: p.class };
                      }
                      if (p.type === 'Prestasi') {
                        studentStats[p.studentName].prestasi += p.points;
                      } else {
                        studentStats[p.studentName].pelanggaran += Math.abs(p.points);
                      }
                      studentStats[p.studentName].net += p.points;
                    });

                    const statsList = Object.entries(studentStats)
                      .map(([name, stats]) => ({ name, ...stats }))
                      .sort((a, b) => b.net - a.net);

                    const maxNet = Math.max(...statsList.map(s => Math.abs(s.net)), 1);

                    return statsList.map((st) => {
                      const percentage = Math.min(100, Math.round((Math.abs(st.net) / maxNet) * 100));
                      return (
                        <div key={st.name} className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <div className="font-semibold text-on-surface flex items-center gap-1.5">
                              <span>{st.name}</span>
                              <span className="text-[9px] text-on-surface-variant font-medium bg-surface px-1.5 py-0.5 rounded border border-outline-variant/30">
                                {st.class}
                              </span>
                            </div>
                            <span className={`font-mono font-extrabold ${st.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {st.net >= 0 ? `+${st.net}` : st.net} Poin
                            </span>
                          </div>
                          <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2 overflow-hidden flex">
                            {st.net >= 0 ? (
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            ) : (
                              <div
                                className="bg-red-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            )}
                          </div>
                          <div className="flex justify-between text-[9px] text-on-surface-variant/85 font-mono">
                            <span>+{st.prestasi} Prestasi</span>
                            <span>-{st.pelanggaran} Pelanggaran</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Chart 2: Category Frequency */}
              <div className="bg-white border border-outline-variant/60 rounded-xl p-4 shadow-3xs">
                <div className="flex items-center gap-1.5 border-b border-outline-variant/30 pb-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">category</span>
                  <h4 className="font-display font-bold text-xs text-primary">Distribusi Kategori Reward / Pelanggaran (Tampil)</h4>
                </div>
                <div className="space-y-3 px-1 max-h-[260px] overflow-y-auto">
                  {(() => {
                    const categoryStats: { [cat: string]: { count: number; totalPoints: number; type: string } } = {};
                    filteredPoints.forEach((p) => {
                      if (!categoryStats[p.categoryName]) {
                        categoryStats[p.categoryName] = { count: 0, totalPoints: 0, type: p.type };
                      }
                      categoryStats[p.categoryName].count += 1;
                      categoryStats[p.categoryName].totalPoints += p.points;
                    });

                    const statsList = Object.entries(categoryStats)
                      .map(([category, stats]) => ({ category, ...stats }))
                      .sort((a, b) => b.count - a.count);

                    const maxCount = Math.max(...statsList.map(s => s.count), 1);

                    return statsList.map((cat) => {
                      const percentage = Math.round((cat.count / maxCount) * 100);
                      return (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <div className="font-semibold text-on-surface flex items-center gap-1.5">
                              <span className="line-clamp-1 max-w-[150px]">{cat.category}</span>
                              <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                cat.type === 'Prestasi' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                              }`}>
                                {cat.type}
                              </span>
                            </div>
                            <span className="font-mono text-on-surface-variant font-bold">
                              {cat.count}x kejadian ({cat.totalPoints >= 0 ? `+${cat.totalPoints}` : cat.totalPoints} Poin)
                            </span>
                          </div>
                          <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                cat.type === 'Prestasi' ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
          ) : null}

          <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                    <th className="p-3 pl-4">Tanggal</th>
                    <th className="p-3">Santri</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Tipe Poin</th>
                    <th className="p-3">Kategori Reward / Pelanggaran</th>
                    <th className="p-3 text-center">Skor Poin</th>
                    <th className="p-3">Ustadz Pelapor</th>
                    <th className="p-3 pr-4">Catatan Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
                  {filteredPoints.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-3 pl-4 font-mono">{r.date}</td>
                      <td className="p-3">
                        <div className="font-bold text-primary">{r.studentName}</div>
                      </td>
                      <td className="p-3">{r.class}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          r.type === 'Prestasi' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-on-surface">{r.categoryName}</td>
                      <td className="p-3 text-center font-mono font-extrabold">
                        <span className={r.points > 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {r.points > 0 ? `+${r.points}` : r.points} Poin
                        </span>
                      </td>
                      <td className="p-3 text-on-surface-variant">{r.teacherName}</td>
                      <td className="p-3 pr-4 text-on-surface-variant/80">{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TABLE 5: GRADES REPORT TABLE */}
      {activeTab === 'grades' && (
        <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
          <div className="p-3 bg-surface-container-low border-b border-outline-variant/40 flex justify-between items-center print:hidden">
            <span className="font-sans font-bold text-primary">Menampilkan {filteredGrades.length} Lembar Penilaian Ujian</span>
          </div>
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                  <th className="p-3 pl-4">No</th>
                  <th className="p-3">Santri</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3 text-center">Tugas (30%)</th>
                  <th className="p-3 text-center">UTS (30%)</th>
                  <th className="p-3 text-center">UAS (40%)</th>
                  <th className="p-3 text-center">Nilai Akhir</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 pr-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
                {filteredGrades.length > 0 ? (
                  filteredGrades.map((g, idx) => (
                    <tr key={g.id || idx} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-3 pl-4 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-primary">{g.studentName}</div>
                      </td>
                      <td className="p-3">{g.class}</td>
                      <td className="p-3 font-semibold">{g.subjectName}</td>
                      <td className="p-3 text-center font-mono">{g.assignmentScore}</td>
                      <td className="p-3 text-center font-mono">{g.utsScore}</td>
                      <td className="p-3 text-center font-mono">{g.uasScore}</td>
                      <td className="p-3 text-center font-mono font-bold text-primary">{g.finalScore.toFixed(1)}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                          g.grade === 'A' ? 'bg-emerald-600' : g.grade === 'B' ? 'bg-indigo-600' : g.grade === 'C' ? 'bg-amber-600' : 'bg-red-500'
                        }`}>
                          {g.grade}
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-on-surface-variant/80">{g.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-on-surface-variant font-medium">
                      Tidak ada data penilaian untuk kriteria pencarian ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. PENGATURAN VIEW & USER MANAGEMENT
// ==========================================

export function PengaturanView({
  students,
  currentUser,
  onUpdateCurrentUser,
  users: usersProp,
  onUpdateUsers,
}: OtherViewsProps) {
  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // State for dark mode / light mode
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('siakad_dark_mode') === 'true');

  // User logs state
  const [userLogs, setUserLogs] = useState<UserLog[]>(() => {
    const cached = localStorage.getItem('siakad_user_logs');
    return cached ? JSON.parse(cached) : [
      { id: 'log_1', timestamp: new Date(Date.now() - 3600000).toLocaleString('id-ID'), username: 'kiai_abdullah', fullName: 'KH. Abdullah, M.Pd.I', role: 'super_admin', action: 'Mengakses Menu Pengaturan' },
      { id: 'log_2', timestamp: new Date(Date.now() - 7200000).toLocaleString('id-ID'), username: 'ust_ahmad', fullName: 'Ust. Ahmad Baihaqi', role: 'ustadz', action: 'Melakukan Input Setoran Tahfidz Santri' },
      { id: 'log_3', timestamp: new Date(Date.now() - 10800000).toLocaleString('id-ID'), username: 'kiai_abdullah', fullName: 'KH. Abdullah, M.Pd.I', role: 'super_admin', action: 'Mengubah Hak Akses Pengguna ust_ahmad' },
      { id: 'log_4', timestamp: new Date(Date.now() - 18000000).toLocaleString('id-ID'), username: 'wali_fathanah', fullName: 'Wali Ahmad Fathanah', role: 'wali_santri', action: 'Melihat Laporan Perkembangan Santri' },
    ];
  });

  const handleSetDarkMode = (val: boolean) => {
    setIsDarkMode(val);
    localStorage.setItem('siakad_dark_mode', String(val));
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Add log
    const log: UserLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      username: currentUser?.username || 'system',
      fullName: currentUser?.fullName || 'Sistem',
      role: currentUser?.role || 'super_admin',
      action: `Mengubah mode tampilan aplikasi ke Mode ${val ? 'Gelap' : 'Terang'}`,
    };
    const updated = [log, ...userLogs];
    setUserLogs(updated);
    localStorage.setItem('siakad_user_logs', JSON.stringify(updated));
  };

  useEffect(() => {
    const isDark = localStorage.getItem('siakad_dark_mode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // State for inline edit mode on user accounts list
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Persistence for user management system with props sync
  const [localUsers, setLocalUsers] = useState<UserAccount[]>([]);
  const users = onUpdateUsers && usersProp && usersProp.length > 0 ? usersProp : localUsers;
  
  const setUsers = (val: UserAccount[] | ((prev: UserAccount[]) => UserAccount[])) => {
    const nextUsers = typeof val === 'function' ? val(users) : val;
    if (onUpdateUsers) {
      onUpdateUsers(nextUsers);
    } else {
      setLocalUsers(nextUsers);
      localStorage.setItem('siakad_users', JSON.stringify(nextUsers));
    }
  };

  useEffect(() => {
    if (!onUpdateUsers) {
      const cached = localStorage.getItem('siakad_users');
      if (cached) {
        setLocalUsers(JSON.parse(cached));
      } else {
        setLocalUsers([
          { id: 'usr_1', fullName: 'KH. Abdullah, M.Pd.I', username: 'kiai_abdullah', password: 'admin123', email: 'kiai@madrasah.id', role: 'super_admin', status: 'Aktif', permittedViews: ['dashboard', 'students', 'kelas_program', 'tahfidz_input', 'tahfidz_history', 'absensi_pengajar', 'penilaian_ujian', 'poin_kedisiplinan', 'laporan', 'pengaturan'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCT6NXmNPs8fpwE88VxNJVMhwFUOQoNeheJsGxQ70-1Y5tYXP10y7dwfl43EW6J3tnUfqH3Mg5lMVkJGhiM11Pqjy-ufWSHFCQmzpRe9BlY5CdzpcnmdWPdH_JJ95B18EFcIfjBtXjSDayMkWX_0gSHiUzZJ3zbbcKemk9Ax77T6dFsYMJahcL7SHAOp7PGZ8EIv1tJZ7gZZQsraKNliWXlPtXW_FcFNDmPieof4P6L0Fu1f6_AKqU3' },
          { id: 'usr_2', fullName: 'Ust. Ahmad Baihaqi', username: 'ust_ahmad', password: 'ahmad123', email: 'ahmad@madrasah.id', role: 'ustadz', status: 'Aktif', permittedViews: ['dashboard', 'tahfidz_input', 'tahfidz_history', 'absensi_pengajar', 'penilaian_ujian', 'poin_kedisiplinan'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkLYXeLgpBsZWbBC8F6MHXFF40RID1YkqZxXrsP-H0Fbc2i6FRGU5MdMW47p6gSBNGUTFfcOxtK4ad4zdQb1uPKsU8QPZLRsw0N_eRN2nGl-jYeYqCnnYLH5ajiDH7hSrKl8YCSBLFTos7hWz65yS-Q6Pk7agAo3GUYYVPKihODvnjhD64eygg9QNugdZ4HPEsUlWvFJTOXyCv013c9pRr8AIf8RLXPJYoP9yC43dtDquPvx6b1Yyw' },
          { id: 'usr_3', fullName: 'Wali Ahmad Fathanah', username: 'wali_fathanah', password: 'wali123', email: 'wali.fathanah@gmail.com', role: 'wali_santri', status: 'Aktif', permittedViews: ['dashboard', 'tahfidz_history'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWm4KibatigPk2YlT4VSXuchCtAGmxn4rboR2upZPNUS_KrT-oNdadIaHBrvLzv3TjijYw3wHHerP4gUwuQcO7OOgvWY7SfUnMpw1iCO_2TP3L2Gm3YsXqdRmOWRxgsDoxO2ToruXaxrhbWfIwh8Z814Mx2uXq8IZPVa_qwOIPcv0fXdPLBg7klwYW8ENSObxGX2juxunP-LrC850vZB0HtUxW8KIroHw2WIUVGTBXrP32NyNWEg6g' },
        ]);
      }
    }
  }, [onUpdateUsers]);

  useEffect(() => {
    if (onUpdateUsers && usersProp && usersProp.length > 0) {
      localStorage.setItem('siakad_users', JSON.stringify(usersProp));
    }
    if (currentUser) {
      const match = users.find(u => u.id === currentUser.id);
      if (match && JSON.stringify(match) !== JSON.stringify(currentUser) && onUpdateCurrentUser) {
        onUpdateCurrentUser(match);
      }
    }
  }, [users, currentUser, onUpdateCurrentUser, onUpdateUsers, usersProp]);

  // Account creation form state
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'ustadz' | 'wali_santri'>('ustadz');
  const [newStatus, setNewStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [newPermittedViews, setNewPermittedViews] = useState<string[]>([]);

  // Sync default permitted views based on role selection
  useEffect(() => {
    if (newRole === 'super_admin') {
      setNewPermittedViews([
        'dashboard',
        'students',
        'kelas_program',
        'tahfidz_input',
        'tahfidz_history',
        'absensi_pengajar',
        'penilaian_ujian',
        'poin_kedisiplinan',
        'laporan',
        'pengaturan'
      ]);
    } else if (newRole === 'ustadz') {
      setNewPermittedViews([
        'dashboard',
        'tahfidz_input',
        'tahfidz_history',
        'absensi_pengajar',
        'penilaian_ujian',
        'poin_kedisiplinan'
      ]);
    } else if (newRole === 'wali_santri') {
      setNewPermittedViews([
        'dashboard',
        'tahfidz_history'
      ]);
    }
  }, [newRole]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newUsername || !newEmail || !newPassword) {
      alert('Mohon lengkapi semua field!');
      return;
    }

    const isUsernameTaken = users.some((u) => u.username.toLowerCase() === newUsername.toLowerCase());
    if (isUsernameTaken) {
      alert('Username tersebut sudah terdaftar! Gunakan username lain.');
      return;
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      fullName: newFullName,
      username: newUsername.toLowerCase().trim(),
      password: newPassword,
      email: newEmail.trim(),
      role: newRole,
      status: newStatus,
      permittedViews: newPermittedViews,
    };

    setUsers([...users, newUser]);

    // Log the action
    const log: UserLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      username: currentUser?.username || 'system',
      fullName: currentUser?.fullName || 'Sistem',
      role: currentUser?.role || 'super_admin',
      action: `Membuat akun pengguna baru: ${newUsername} (${newRole})`,
    };
    const updatedLogs = [log, ...userLogs];
    setUserLogs(updatedLogs);
    localStorage.setItem('siakad_user_logs', JSON.stringify(updatedLogs));

    // Reset Form
    setNewFullName('');
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');
    setNewRole('ustadz');
    setNewStatus('Aktif');

    alert('Sukses! Akun pengguna baru dengan hak akses terpilih berhasil dibuat.');
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) {
      setUsers(users.filter((u) => u.id !== id));

      // Log the action
      const log: UserLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        username: currentUser?.username || 'system',
        fullName: currentUser?.fullName || 'Sistem',
        role: currentUser?.role || 'super_admin',
        action: `Menghapus akun pengguna: ${targetUser?.username || id}`,
      };
      const updatedLogs = [log, ...userLogs];
      setUserLogs(updatedLogs);
      localStorage.setItem('siakad_user_logs', JSON.stringify(updatedLogs));
    }
  };

  const handleToggleUserStatus = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    const newStatusVal = targetUser?.status === 'Aktif' ? 'Nonaktif' as const : 'Aktif' as const;
    const updated = users.map((u) => {
      if (u.id === id) {
        return { ...u, status: newStatusVal };
      }
      return u;
    });
    setUsers(updated);

    // Log the action
    const log: UserLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      username: currentUser?.username || 'system',
      fullName: currentUser?.fullName || 'Sistem',
      role: currentUser?.role || 'super_admin',
      action: `Mengubah status akun ${targetUser?.username} menjadi ${newStatusVal}`,
    };
    const updatedLogs = [log, ...userLogs];
    setUserLogs(updatedLogs);
    localStorage.setItem('siakad_user_logs', JSON.stringify(updatedLogs));
  };

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Pengaturan Sistem &amp; Portal</h1>
        <p className="text-on-surface-variant text-xs mt-1">
          Sesuaikan profil lembaga madrasah, hak akses portal, dan mode penggunaan tampilan aplikasi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Profile Card & Info */}
        <div className="lg:col-span-12 bg-white border border-outline-variant/60 rounded-xl p-5 space-y-4 shadow-3xs">
          <h3 className="font-display text-sm font-bold text-primary border-b border-outline-variant/30 pb-2">
            Profil Lembaga (Madrasah)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-on-surface-variant font-semibold mb-1">Nama Madrasah</label>
              <input type="text" className="w-full px-3 py-1.5 border border-outline-variant rounded-md font-medium" defaultValue="Madrasah Aliyah Al-Fatih" />
            </div>
            <div>
              <label className="block text-on-surface-variant font-semibold mb-1">Nomor Statistik Madrasah (NSM)</label>
              <input type="text" className="w-full px-3 py-1.5 border border-outline-variant rounded-md font-medium font-mono" defaultValue="121235060002" />
            </div>
            <div className="col-span-2">
              <label className="block text-on-surface-variant font-semibold mb-1">Alamat Kampus Pondok</label>
              <input type="text" className="w-full px-3 py-1.5 border border-outline-variant rounded-md font-medium" defaultValue="Jl. Pesantren No. 45, Kebon Jeruk, Jakarta Barat, DKI Jakarta" />
            </div>
            <div>
              <label className="block text-on-surface-variant font-semibold mb-1">Kepala Madrasah</label>
              <input type="text" className="w-full px-3 py-1.5 border border-outline-variant rounded-md font-medium" defaultValue="KH. Abdullah, M.Pd.I" />
            </div>
            <div>
              <label className="block text-on-surface-variant font-semibold mb-1">Ustadz Kepala Tahfidz</label>
              <input type="text" className="w-full px-3 py-1.5 border border-outline-variant rounded-md font-medium" defaultValue="Ust. Ahmad Baihaqi" />
            </div>
          </div>
          <button
            onClick={() => alert('Profil madrasah berhasil diperbarui!')}
            className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-all text-xs shadow-3xs cursor-pointer"
          >
            Simpan Perubahan Profil
          </button>
        </div>
      </div>

      {/* USER ACCOUNTS & MANAGEMENT CONTAINER - ONLY FOR SUPER ADMIN */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter pt-2">
          {/* Create Account Form */}
          <div className="lg:col-span-4 bg-white border border-outline-variant/60 rounded-xl p-5 shadow-3xs text-left flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-primary border-b border-outline-variant/30 pb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Buat Akun Akses Baru</span>
              </h3>

              <form onSubmit={handleCreateAccount} className="space-y-3.5 pt-3">
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Nama Lengkap Pengguna</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Yusuf, S.Pd"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant rounded-md bg-surface text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Username Unik</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: yusuf_shiddiq"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant rounded-md bg-surface text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Password Akses</label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant rounded-md bg-surface text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Alamat Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: yusuf@madrasah.id"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant rounded-md bg-surface text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-on-surface font-semibold mb-1">Level Akses</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="ustadz">Ustadz / Pengajar</option>
                      <option value="wali_santri">Wali Santri</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-on-surface font-semibold mb-1">Status Awal</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                {/* Checklist for menu items permitted view */}
                <div className="bg-surface p-3 border border-outline-variant rounded-lg space-y-1.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Checklist Menu Akses Pengguna
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 font-sans font-medium text-on-surface">
                    {ALL_MENU_VIEWS.map((item) => (
                      <label key={item.view} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPermittedViews.includes(item.view)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPermittedViews([...newPermittedViews, item.view]);
                            } else {
                              setNewPermittedViews(newPermittedViews.filter(v => v !== item.view));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-primary cursor-pointer rounded border-outline-variant"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-primary text-on-primary py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer uppercase tracking-wider text-center"
                >
                  Buat Pengguna Baru
                </button>
              </form>
            </div>
          </div>

          {/* List of Registered Accounts */}
          <div className="lg:col-span-8 bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs">
            <div className="p-4 border-b border-outline-variant/40 bg-surface-container-lowest">
              <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                <span>Hak Akses &amp; Manajemen Akun Terdaftar</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3 pl-4">Pengguna</th>
                    <th className="p-3">Kredensial Login &amp; Email</th>
                    <th className="p-3">Level Hak Akses</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 pr-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-secondary-fixed text-primary flex items-center justify-center font-bold">
                            {user.fullName.replace('KH. ', '').replace('Ust. ', '').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface">{user.fullName}</div>
                            <div className="text-[10px] text-on-surface-variant/75 mt-0.5">SIAKAD Account ID</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {editingUserId === user.id ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-on-surface-variant font-semibold w-8">User:</span>
                              <input
                                type="text"
                                value={user.username}
                                onChange={(e) => {
                                  const val = e.target.value.toLowerCase().trim();
                                  setUsers(users.map(u => u.id === user.id ? { ...u, username: val } : u));
                                }}
                                className="font-mono bg-surface-container-low border border-outline-variant rounded px-2 py-0.5 text-[10px] outline-none focus:ring-1 focus:ring-primary text-primary w-32"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-on-surface-variant font-semibold w-8">Pass:</span>
                              <input
                                type="text"
                                value={user.password}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setUsers(users.map(u => u.id === user.id ? { ...u, password: val } : u));
                                }}
                                className="font-mono bg-surface-container-low border border-outline-variant rounded px-2 py-0.5 text-[10px] outline-none focus:ring-1 focus:ring-primary text-primary w-32"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-mono text-on-surface font-semibold">User: {user.username}</div>
                            <div className="font-mono text-on-surface-variant text-[10px] mt-1">Pass: {user.password}</div>
                          </div>
                        )}
                        <div className="text-[10px] text-on-surface-variant mt-1.5">{user.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.role === 'super_admin'
                              ? 'bg-red-50 text-red-800 border border-red-100'
                              : user.role === 'ustadz'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              : 'bg-blue-50 text-blue-800 border border-blue-100'
                          }`}>
                            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'ustadz' ? 'Ustadz / Pengajar' : 'Wali Santri'}
                          </span>
                          
                          {editingUserId === user.id ? (
                            <div className="bg-surface p-2 border border-outline-variant/50 rounded space-y-1 mt-1 max-h-[140px] overflow-y-auto w-44">
                              <span className="block text-[9px] font-bold uppercase text-on-surface-variant">Izin Menu:</span>
                              {ALL_MENU_VIEWS.map((item) => {
                                const isPermitted = user.permittedViews ? user.permittedViews.includes(item.view) : true;
                                return (
                                  <label key={item.view} className="flex items-center gap-1.5 text-[10px] font-medium cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isPermitted}
                                      onChange={(e) => {
                                        const currentPerms = user.permittedViews || ALL_MENU_VIEWS.map(v => v.view);
                                        const updatedPerms = e.target.checked
                                          ? [...currentPerms, item.view]
                                          : currentPerms.filter(v => v !== item.view);
                                        setUsers(users.map(u => u.id === user.id ? { ...u, permittedViews: updatedPerms } : u));
                                      }}
                                      className="w-3.5 h-3.5 accent-primary cursor-pointer rounded border-outline-variant"
                                    />
                                    <span>{item.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {ALL_MENU_VIEWS.map((item) => {
                                const isPermitted = user.permittedViews ? user.permittedViews.includes(item.view) : true;
                                if (!isPermitted) return null;
                                return (
                                  <span key={item.view} className="inline-block bg-surface-container-high/60 px-1.5 py-0.2 rounded text-[9px] text-on-surface-variant leading-none border border-outline-variant/30">
                                    {item.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          disabled={!isSuperAdmin}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            user.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          {user.status}
                        </button>
                      </td>
                      <td className="p-3 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {editingUserId === user.id ? (
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                alert('Kredensial login berhasil diperbarui secara permanen.');
                              }}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                              title="Selesai Mengedit"
                            >
                              <span className="material-symbols-outlined text-[18px]">done</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingUserId(user.id)}
                              className="p-1 text-primary hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
                              title="Edit Username & Password"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.role === 'super_admin' && users.filter((u) => u.role === 'super_admin').length <= 1}
                            className="p-1 text-on-surface-variant hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
                            title="Hapus Akun"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* USER USAGE LOGS CARD */}
          <div className="lg:col-span-12 bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-3xs mt-2">
            <div className="p-4 border-b border-outline-variant/40 bg-surface-container-lowest flex justify-between items-center">
              <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
                <span>Riwayat Penggunaan Pengguna (Log Audit)</span>
              </h3>
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin menghapus semua riwayat log?')) {
                    setUserLogs([]);
                    localStorage.setItem('siakad_user_logs', JSON.stringify([]));
                  }
                }}
                className="text-[10px] text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200/50 hover:underline cursor-pointer font-bold uppercase tracking-wider"
              >
                Hapus Semua Log
              </button>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3 pl-4" style={{ width: '160px' }}>Waktu Log</th>
                    <th className="p-3" style={{ width: '180px' }}>Nama Pengguna</th>
                    <th className="p-3">Tindakan / Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs font-mono text-on-surface font-medium">
                  {userLogs.length > 0 ? (
                    userLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="p-3 pl-4 text-on-surface-variant">{log.timestamp}</td>
                        <td className="p-3">
                          <span className="font-sans font-bold text-primary">{log.fullName}</span>
                          <span className="block text-[10px] text-on-surface-variant font-mono mt-0.5">@{log.username}</span>
                        </td>
                        <td className="p-3 font-sans text-[11px] text-on-surface">{log.action}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-on-surface-variant font-sans font-semibold">
                        <span className="material-symbols-outlined text-[36px] text-primary/30 block mb-1">
                          history
                        </span>
                        <span>Tidak ada catatan riwayat aktivitas pengguna saat ini.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
