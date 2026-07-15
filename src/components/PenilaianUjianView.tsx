import React, { useState, useEffect } from 'react';
import { Student, Subject, AcademicGrade } from '../types';
import { USTADZ_LIST } from '../data';
import { ChevronDown, PlusCircle, Printer, Download, Search, Trash2, X, Plus, Edit } from 'lucide-react';

interface PenilaianUjianViewProps {
  students: Student[];
  classes: string[];
  grades: AcademicGrade[];
  onUpdateGrades: (grades: AcademicGrade[]) => void;
}

export default function PenilaianUjianView({
  students,
  classes,
  grades,
  onUpdateGrades,
}: PenilaianUjianViewProps) {
  // Load subjects
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

  useEffect(() => {
    localStorage.setItem('siakad_academic_subjects', JSON.stringify(subjects));
  }, [subjects]);

  // Selected filters
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [gradeNameSearch, setGradeNameSearch] = useState('');

  // Modal State for Grades Input/Edit
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [assignmentScore, setAssignmentScore] = useState<number | ''>('');
  const [utsScore, setUtsScore] = useState<number | ''>('');
  const [uasScore, setUasScore] = useState<number | ''>('');
  const [gradeNotes, setGradeNotes] = useState('');

  // Dropdown class for adding grade
  const [modalSelectedClass, setModalSelectedClass] = useState('');

  // When adding grade modal opens, synchronize modal selected class
  useEffect(() => {
    if (isAddingGrade && isGradeModalOpen) {
      setModalSelectedClass(selectedClass);
    }
  }, [isAddingGrade, isGradeModalOpen]);

  // Filter students for modal dropdown
  const modalStudents = students.filter(
    (s) => s.class === modalSelectedClass && s.status === 'Aktif'
  );

  // Set student to null when class changes to force user to choose from the dropdown
  useEffect(() => {
    if (isAddingGrade) {
      setActiveStudent(null);
    }
  }, [modalSelectedClass, isAddingGrade]);

  // Selected subject object
  const currentSubjectObj = subjects.find((s) => s.code === selectedSubjectCode) || null;

  // Filter students by selected class, program study and name search for main table list
  const filteredStudents = students.filter(
    (s) =>
      s.class === selectedClass &&
      s.status === 'Aktif' &&
      (!selectedProgram || s.program === selectedProgram) &&
      (!gradeNameSearch || s.name.toLowerCase().includes(gradeNameSearch.toLowerCase()))
  );

  // Open modal for specific student and subject (Edit or Direct Input)
  const handleOpenGradeInput = (stud: Student, sub: Subject) => {
    setIsAddingGrade(false);
    const existingGrade = grades.find(
      (g) => g.studentId === stud.id && g.subjectCode === sub.code
    );
    setActiveStudent(stud);
    setActiveSubject(sub);
    if (existingGrade) {
      setAssignmentScore(existingGrade.assignmentScore);
      setUtsScore(existingGrade.utsScore);
      setUasScore(existingGrade.uasScore);
      setGradeNotes(existingGrade.notes);
    } else {
      setAssignmentScore('');
      setUtsScore('');
      setUasScore('');
      setGradeNotes('');
    }
    setIsGradeModalOpen(true);
  };

  // Open modal for "Tambah Penilaian"
  const handleOpenAddGrade = () => {
    setIsAddingGrade(true);
    setModalSelectedClass('');
    setActiveStudent(null);
    setActiveSubject(null);
    setAssignmentScore('');
    setUtsScore('');
    setUasScore('');
    setGradeNotes('');
    setIsGradeModalOpen(true);
  };

  // Save/Update Assessment
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !activeSubject) {
      alert('Mohon pilih santri dan mata pelajaran!');
      return;
    }

    if (assignmentScore === '' || utsScore === '' || uasScore === '') {
      alert('Mohon lengkapi semua nilai!');
      return;
    }

    const taskVal = Number(assignmentScore);
    const utsVal = Number(utsScore);
    const uasVal = Number(uasScore);

    const final = Number((taskVal * 0.3 + utsVal * 0.3 + uasVal * 0.4).toFixed(1));
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
      assignmentScore: taskVal,
      utsScore: utsVal,
      uasScore: uasVal,
      finalScore: final,
      grade: letterGrade,
      notes: gradeNotes,
    };

    const exists = grades.some(
      (g) => g.studentId === activeStudent.id && g.subjectCode === activeSubject.code
    );
    let updatedGrades: AcademicGrade[] = [];
    if (exists) {
      updatedGrades = grades.map((g) =>
        g.studentId === activeStudent.id && g.subjectCode === activeSubject.code ? newGrade : g
      );
    } else {
      updatedGrades = [...grades, newGrade];
    }

    onUpdateGrades(updatedGrades);
    setSelectedClass(activeStudent.class);
    setSelectedSubjectCode(activeSubject.code);
    setIsGradeModalOpen(false);
    alert('Penilaian ujian santri berhasil disimpan!');
  };

  // Delete Assessment
  const handleDeleteGrade = (studentId: string, subjectCode: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus nilai ujian santri ini?')) {
      const updated = grades.filter(
        (g) => !(g.studentId === studentId && g.subjectCode === subjectCode)
      );
      onUpdateGrades(updated);
    }
  };

  // Print PDF
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
              ${filteredStudents
                .map((stud, idx) => {
                  const scoreData = grades.find(
                    (g) => g.studentId === stud.id && g.subjectCode === selectedSubjectCode
                  );
                  return `
                  <tr>
                    <td class="text-center font-mono">${idx + 1}</td>
                    <td><strong>${stud.name}</strong></td>
                    <td class="text-center font-mono">${scoreData ? scoreData.assignmentScore : '-'}</td>
                    <td class="text-center font-mono">${scoreData ? scoreData.utsScore : '-'}</td>
                    <td class="text-center font-mono">${scoreData ? scoreData.uasScore : '-'}</td>
                    <td class="text-center font-mono" style="font-weight: bold; color: #1e3a8a;">${
                      scoreData ? scoreData.finalScore.toFixed(1) : '-'
                    }</td>
                    <td class="text-center" style="font-weight: bold;">${scoreData ? scoreData.grade : '-'}</td>
                    <td>${scoreData?.notes || '<span style="color:#94a3b8;font-style:italic;">Belum dinilai</span>'}</td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            Dicetak otomatis via Sistem Informasi Akademik Pesantren • Tanggal: ${new Date().toLocaleDateString(
              'id-ID'
            )}
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

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Santri',
      'Kelas',
      'Mata Pelajaran',
      'Nilai Tugas',
      'Nilai UTS',
      'Nilai UAS',
      'Nilai Akhir',
      'Grade',
      'Catatan',
    ];
    const rows = filteredStudents.map((stud, idx) => {
      const scoreData = grades.find(
        (g) => g.studentId === stud.id && g.subjectCode === selectedSubjectCode
      );
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
        scoreData?.notes || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      'download',
      `Laporan_Nilai_${selectedClass.replace(/\s+/g, '_')}_${selectedSubjectCode}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Penilaian Ujian Santri</h1>
        <p className="text-on-surface-variant text-xs mt-1">
          Kelola hasil ujian, nilai harian (tugas), ujian tengah semester, dan ujian akhir semester diniyah santri secara komprehensif.
        </p>
      </div>

      {/* Filtering Header Bar */}
      <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-wrap gap-4 items-end shadow-3xs">
        {/* Dropdown Mata Pelajaran */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
            Pilih Mata Pelajaran
          </label>
          <div className="relative min-w-[200px]">
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
            >
              <option value="">-- Pilih Mata Pelajaran --</option>
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  [{s.code}] {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-4 h-4" />
          </div>
        </div>

        {/* Dropdown Kelas */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
            Pilih Kelas
          </label>
          <div className="relative min-w-[150px]">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-4 h-4" />
          </div>
        </div>

        {/* Dropdown Program Studi */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
            Program Studi
          </label>
          <div className="relative min-w-[140px]">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
            >
              <option value="">Semua Program</option>
              <option value="Pondok">Pondok</option>
              <option value="Madrasah">Madrasah</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-4 h-4" />
          </div>
        </div>

        {/* Search Nama */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
            Cari Nama Santri
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ketik nama santri..."
              value={gradeNameSearch}
              onChange={(e) => setGradeNameSearch(e.target.value)}
              className="pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none w-[180px] font-medium"
            />
            {gradeNameSearch ? (
              <button
                onClick={() => setGradeNameSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-3.5 h-3.5" />
            )}
          </div>
        </div>

        <div className="flex-1 text-right text-[11px] text-on-surface-variant font-medium self-center pb-1">
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
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 bg-secondary-container text-on-secondary-container rounded-full leading-none">
              {currentSubjectObj?.name}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleOpenAddGrade}
              className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-colors text-[10px] uppercase cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Penilaian</span>
            </button>
            <button
              onClick={handlePrintGrades}
              className="px-3 py-1.5 bg-secondary-container text-on-secondary-container font-bold rounded-lg hover:bg-secondary-fixed-dim transition-colors text-[10px] uppercase cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-secondary-container text-on-secondary-container font-bold rounded-lg hover:bg-secondary-fixed-dim transition-colors text-[10px] uppercase cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
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
                  const scoreData = grades.find(
                    (g) => g.studentId === stud.id && g.subjectCode === selectedSubjectCode
                  );
                  return (
                    <tr key={stud.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-3 text-center font-mono text-on-surface-variant">{idx + 1}</td>
                      <td className="p-3 font-semibold text-primary">{stud.name}</td>
                      <td className="p-3 text-center font-mono">
                        {scoreData ? scoreData.assignmentScore : '-'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {scoreData ? scoreData.utsScore : '-'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {scoreData ? scoreData.uasScore : '-'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-primary">
                        {scoreData ? scoreData.finalScore.toFixed(1) : '-'}
                      </td>
                      <td className="p-3 text-center">
                        {scoreData ? (
                          <span
                            className={`inline-block font-sans font-extrabold w-6 h-6 text-center leading-6 rounded-full text-[10px] ${
                              scoreData.grade === 'A'
                                ? 'bg-green-100 text-green-800'
                                : scoreData.grade === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : scoreData.grade === 'C'
                                ? 'bg-yellow-100 text-yellow-800'
                                : scoreData.grade === 'D'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {scoreData.grade}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-on-surface-variant text-[11px] truncate max-w-[200px]">
                        {scoreData?.notes || (
                          <span className="italic text-on-surface-variant/40">Belum dinilai</span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              currentSubjectObj && handleOpenGradeInput(stud, currentSubjectObj)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase cursor-pointer flex items-center gap-1 transition-all ${
                              scoreData
                                ? 'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim'
                                : 'bg-primary text-on-primary hover:bg-primary-container shadow-2xs'
                            }`}
                          >
                            {scoreData ? <Edit className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                            <span>{scoreData ? 'Edit' : 'Nilai'}</span>
                          </button>
                          {scoreData && (
                            <button
                              onClick={() => handleDeleteGrade(stud.id, selectedSubjectCode)}
                              className="p-1 text-error hover:bg-error/5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus Nilai"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
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
                    <span className="material-symbols-outlined text-[36px] text-primary/30 block mb-1">
                      {!selectedClass || !selectedSubjectCode ? 'info' : 'group_off'}
                    </span>
                    <span>
                      {!selectedClass || !selectedSubjectCode
                        ? 'Mohon pilih Mata Pelajaran dan Kelas pada filter di atas untuk menampilkan data penilaian santri.'
                        : `Tidak ada santri aktif di kelas ${selectedClass}`}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Form Modal (Input / Edit) */}
      {isGradeModalOpen && (activeSubject || isAddingGrade) && (
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
                    {/* DROPDOWN KELAS - Added as requested */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Pilih Kelas
                      </label>
                      <div className="relative">
                        <select
                          value={modalSelectedClass}
                          onChange={(e) => {
                            setModalSelectedClass(e.target.value);
                          }}
                          className="w-full appearance-none px-3 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
                        >
                          <option value="" disabled>-- Pilih Kelas --</option>
                          {classes.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-4 h-4" />
                      </div>
                    </div>

                    {/* DROPDOWN SANTRI */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Pilih Santri ({modalStudents.length} Santri)
                      </label>
                      <div className="relative">
                        <select
                          value={activeStudent ? activeStudent.id : ''}
                          onChange={(e) => {
                            const sObj = students.find((s) => s.id === e.target.value);
                            if (sObj) {
                              setActiveStudent(sObj);
                              const existing = grades.find(
                                (g) => g.studentId === sObj.id && g.subjectCode === (activeSubject ? activeSubject.code : '')
                              );
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
                          className="w-full appearance-none px-3 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
                        >
                          <option value="" disabled>-- Pilih Santri --</option>
                          {modalStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-4 h-4" />
                      </div>
                    </div>

                    {/* DROPDOWN PELAJARAN */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Pilih Pelajaran
                      </label>
                      <div className="relative">
                        <select
                          value={activeSubject ? activeSubject.code : ''}
                          onChange={(e) => {
                            const subObj = subjects.find((sub) => sub.code === e.target.value);
                            if (subObj) {
                              setActiveSubject(subObj);
                              if (activeStudent) {
                                const existing = grades.find(
                                  (g) => g.studentId === activeStudent.id && g.subjectCode === subObj.code
                                );
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
                          className="w-full appearance-none px-3 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none cursor-pointer font-semibold"
                        >
                          <option value="" disabled>-- Pilih Pelajaran --</option>
                          {subjects.map((sub) => (
                            <option key={sub.code} value={sub.code}>
                              [{sub.code}] {sub.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    Santri: <strong>{activeStudent?.name}</strong> | Pelajaran: <strong>{activeSubject?.name}</strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsGradeModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
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
                    onChange={(e) => setAssignmentScore(e.target.value === '' ? '' : Number(e.target.value))}
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
                    onChange={(e) => setUtsScore(e.target.value === '' ? '' : Number(e.target.value))}
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
                    onChange={(e) => setUasScore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Calculated projection badge */}
              <div className="bg-secondary-container/10 border border-secondary-container/50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="block text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">
                    Proyeksi Nilai Akhir
                  </span>
                  <span className="font-mono text-lg font-bold text-primary">
                    {((Number(assignmentScore || 0) * 0.3) + (Number(utsScore || 0) * 0.3) + (Number(uasScore || 0) * 0.4)).toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">
                    Grade
                  </span>
                  <span className="font-sans text-md font-extrabold text-primary text-right block uppercase">
                    {Number(assignmentScore || 0) * 0.3 + Number(utsScore || 0) * 0.3 + Number(uasScore || 0) * 0.4 >= 85
                      ? 'A'
                      : Number(assignmentScore || 0) * 0.3 + Number(utsScore || 0) * 0.3 + Number(uasScore || 0) * 0.4 >= 75
                      ? 'B'
                      : Number(assignmentScore || 0) * 0.3 + Number(utsScore || 0) * 0.3 + Number(uasScore || 0) * 0.4 >= 60
                      ? 'C'
                      : Number(assignmentScore || 0) * 0.3 + Number(utsScore || 0) * 0.3 + Number(uasScore || 0) * 0.4 >= 45
                      ? 'D'
                      : 'E'}
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
