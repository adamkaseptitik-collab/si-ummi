import React, { useState } from 'react';
import { Student, AppView } from '../types';
import { SECTIONS } from '../data';

interface StudentListViewProps {
  students: Student[];
  classes: string[];
  programs: string[];
  setView: (view: AppView) => void;
  setSelectedStudentId: (id: string | null) => void;
  onUpdateStudents: (updated: Student[]) => void;
  addStudentOpen: boolean;
  setAddStudentOpen: (open: boolean) => void;
}

export default function StudentListView({
  students,
  classes,
  programs,
  setView,
  setSelectedStudentId,
  onUpdateStudents,
  addStudentOpen,
  setAddStudentOpen,
}: StudentListViewProps) {
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('aktif'); // Default filter matches "Status: Aktif"

  // Modal State for Edit
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Field State (For Add & Edit)
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formNis, setFormNis] = useState('');
  const [formGender, setFormGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formClass, setFormClass] = useState(classes[0] || '');
  const [formProgram, setFormProgram] = useState<'Pondok' | 'Madrasah'>(programs[0] as any || 'Pondok');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Alumni'>('Aktif');
  const [formDorm, setFormDorm] = useState('Asrama A-01');
  const [formJuz, setFormJuz] = useState(5);
  const [formJuzDetail, setFormJuzDetail] = useState("Al-Ma'idah (120)");
  const [formScore, setFormScore] = useState(88.5);

  // New Fields
  const [formBirthPlace, setFormBirthPlace] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formPhoneNumber, setFormPhoneNumber] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEntryYear, setFormEntryYear] = useState('2024');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Get unique, sorted entrance years dynamically from filtered student list (excluding the year filter itself so you can switch)
  const studentsFilteredForYears = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.nisn && student.nisn.includes(searchTerm)) ||
      (student.nip && student.nip.includes(searchTerm)) ||
      (student.nis && student.nis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClass =
      !selectedClass || selectedClass === 'Semua Kelas' || student.class === selectedClass;

    const matchesProgram =
      !selectedProgram || selectedProgram === 'Semua Program' || student.program === selectedProgram;

    let matchesStatus = true;
    if (selectedStatus === 'aktif') {
      matchesStatus = student.status === 'Aktif';
    } else if (selectedStatus === 'alumni') {
      matchesStatus = student.status === 'Alumni';
    }

    return matchesSearch && matchesClass && matchesProgram && matchesStatus;
  });

  const entryYears = Array.from(
    new Set(studentsFilteredForYears.map((s) => s.entryYear).filter((y): y is string => !!y))
  ).sort((a, b) => b.localeCompare(a));

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedProgram('');
    setSelectedStatus('aktif');
    setCurrentPage(1);
  };

  // Filter students based on all states
  const filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.nisn && student.nisn.includes(searchTerm)) ||
      (student.nip && student.nip.includes(searchTerm)) ||
      (student.nis && student.nis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Class filter
    const matchesClass =
      !selectedClass || selectedClass === 'Semua Kelas' || student.class === selectedClass;

    // Tahun Masuk filter
    const matchesSection =
      !selectedSection || student.entryYear === selectedSection;

    // Program filter
    const matchesProgram =
      !selectedProgram || selectedProgram === 'Semua Program' || student.program === selectedProgram;

    // Status filter
    let matchesStatus = true;
    if (selectedStatus === 'aktif') {
      matchesStatus = student.status === 'Aktif';
    } else if (selectedStatus === 'alumni') {
      matchesStatus = student.status === 'Alumni';
    }

    return matchesSearch && matchesClass && matchesSection && matchesProgram && matchesStatus;
  });

  // Pagination calculation
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Handle Save (Add Student)
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      id: 's_' + Date.now(),
      name: formName || 'Santri Baru',
      nisn: formNisn || '00' + Math.floor(Math.random() * 10000000),
      nip: formNip || '10' + Math.floor(Math.random() * 10000000),
      nis: formNis || 'NIS-' + (formEntryYear || '2024') + Math.floor(Math.random() * 1000),
      gender: formGender,
      class: formClass,
      program: formProgram,
      status: formStatus,
      dorm: formDorm,
      tahfidzJuz: Number(formJuz) || 0,
      tahfidzDetail: formJuzDetail || '-',
      totalScore: Number(formScore) || 80.0,
      attendanceRate: 98,
      birthPlace: formBirthPlace || 'Cirebon',
      birthDate: formBirthDate || '2010-04-12',
      parentName: formParentName || 'Orangtua Santri',
      phoneNumber: formPhoneNumber || '081234567890',
      address: formAddress || 'Jl. Pesantren No. 1, Cirebon',
      entryYear: formEntryYear || '2024',
      photoUrl: formPhotoUrl || (formGender === 'Laki-laki' 
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkLYXeLgpBsZWbBC8F6MHXFF40RID1YkqZxXrsP-H0Fbc2i6FRGU5MdMW47p6gSBNGUTFfcOxtK4ad4zdQb1uPKsU8QPZLRsw0N_eRN2nGl-jYeYqCnnYLH5ajiDH7hSrKl8YCSBLFTos7hWz65yS-Q6Pk7agAo3GUYYVPKihODvnjhD64eygg9QNugdZ4HPEsUlWvFJTOXyCv013c9pRr8AIf8RLXPJYoP9yC43dtDquPvx6b1Yyw'
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUFjYUibwfoObiO0LkgtB7CwJJG9v24SRwrhxRKGKE4rAwYggU9vgvVU03CP9pxjtHvJM3iHfSJNcrDByFnuBmJl9AiJskOKhYoMRRgIf8iPyGko1z2XevqCwFMs2qORbNAwVfKufvGYf_CH4iJFMFc4TihK4gtw5YoGoqkdcRS9ziGvHYMT8TRxApI5qSn-qtcSZNTRpB8p5_pU-ISTj9_E0_Rl1-dQPFyn8hrs4nvkqe3A1ZDHZD'),
    };

    onUpdateStudents([newStudent, ...students]);
    setAddStudentOpen(false);
    resetForm();
  };

  // Handle Edit click
  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormNisn(student.nisn);
    setFormNip(student.nip);
    setFormNis(student.nis || '');
    setFormGender(student.gender);
    setFormClass(student.class);
    setFormProgram(student.program);
    setFormStatus(student.status);
    setFormDorm(student.dorm);
    setFormJuz(student.tahfidzJuz);
    setFormJuzDetail(student.tahfidzDetail);
    setFormScore(student.totalScore);
    
    // Set New fields
    setFormBirthPlace(student.birthPlace || '');
    setFormBirthDate(student.birthDate || '');
    setFormParentName(student.parentName || '');
    setFormPhoneNumber(student.phoneNumber || '');
    setFormAddress(student.address || '');
    setFormEntryYear(student.entryYear || '2024');
    setFormPhotoUrl(student.photoUrl || '');
  };

  // Handle Save (Edit Student)
  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const updated = students.map((s) => {
      if (s.id === editingStudent.id) {
        return {
          ...s,
          name: formName,
          nisn: formNisn,
          nip: formNip,
          nis: formNis,
          gender: formGender,
          class: formClass,
          program: formProgram,
          status: formStatus,
          dorm: formDorm,
          tahfidzJuz: Number(formJuz),
          tahfidzDetail: formJuzDetail,
          totalScore: Number(formScore),
          birthPlace: formBirthPlace,
          birthDate: formBirthDate,
          parentName: formParentName,
          phoneNumber: formPhoneNumber,
          address: formAddress,
          entryYear: formEntryYear,
          photoUrl: formPhotoUrl,
        };
      }
      return s;
    });

    onUpdateStudents(updated);
    setEditingStudent(null);
    resetForm();
  };

  // Handle Delete Click
  const handleDeleteClick = (studentId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data santri ini?')) {
      const updated = students.filter((s) => s.id !== studentId);
      onUpdateStudents(updated);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormNisn('');
    setFormNip('');
    setFormNis('');
    setFormGender('Laki-laki');
    setFormClass(classes[0] || '');
    setFormProgram(programs[0] as any || 'Pondok');
    setFormStatus('Aktif');
    setFormDorm('Asrama A-01');
    setFormJuz(1);
    setFormJuzDetail('');
    setFormScore(85);
    
    setFormBirthPlace('');
    setFormBirthDate('');
    setFormParentName('');
    setFormPhoneNumber('');
    setFormAddress('');
    setFormEntryYear('2024');
    setFormPhotoUrl('');
  };

  const escapeCsvField = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportExcel = () => {
    const headers = [
      'No',
      'NIP',
      'Nama Lengkap',
      'Tempat Lahir',
      'Tgl Lahir',
      'Kelas',
      'JK',
      'Orangtua/Wali',
      'No HP',
      'Alamat Lengkap',
      'Thn Masuk',
      'Program Studi',
      'Status'
    ];

    let csvContent = 'sep=;\r\n';
    csvContent += headers.join(';') + '\r\n';

    filteredStudents.forEach((student, index) => {
      const row = [
        index + 1,
        student.nip || student.id,
        student.name,
        student.birthPlace || '',
        student.birthDate || '',
        student.class || '',
        student.gender || '',
        student.parentName || '',
        student.phoneNumber || '',
        student.address || '',
        student.entryYear || '',
        student.program || '',
        student.status || ''
      ];
      csvContent += row.map(escapeCsvField).join(';') + '\r\n';
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Santri_Ekspor_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        if (lines.length === 0) return;

        let headerLineIndex = 0;
        if (lines[0].startsWith('sep=')) {
          headerLineIndex = 1;
        }

        if (lines.length <= headerLineIndex) {
          alert('File kosong atau format salah.');
          return;
        }

        const rawHeaderLine = lines[headerLineIndex];
        let delimiter = ';';
        if (rawHeaderLine.includes('\t')) {
          delimiter = '\t';
        } else if (rawHeaderLine.includes(';') && !rawHeaderLine.includes(',')) {
          delimiter = ';';
        } else if (rawHeaderLine.includes(',')) {
          const semiCount = (rawHeaderLine.match(/;/g) || []).length;
          const commaCount = (rawHeaderLine.match(/,/g) || []).length;
          delimiter = semiCount >= commaCount ? ';' : ',';
        }

        const parseLine = (lineStr: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < lineStr.length; i++) {
            const char = lineStr[i];
            if (char === '"') {
              if (inQuotes && lineStr[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === delimiter && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const headers = parseLine(rawHeaderLine).map(h => h.trim().toLowerCase());

        const getColIndex = (options: string[]) => {
          return headers.findIndex(h => options.some(opt => h.includes(opt.toLowerCase())));
        };

        const nipIdx = getColIndex(['nip', 'nomor induk', 'id']);
        const nameIdx = getColIndex(['nama', 'name', 'lengkap']);
        const birthPlaceIdx = getColIndex(['tempat lahir', 'tempat', 'lahir tempat']);
        const birthDateIdx = getColIndex(['tgl lahir', 'tanggal lahir', 'birthdate', 'birth date']);
        const classIdx = getColIndex(['kelas', 'class']);
        const genderIdx = getColIndex(['jk', 'gender', 'jenis kelamin', 'kelamin']);
        const parentNameIdx = getColIndex(['orangtua', 'wali', 'parent', 'nama wali']);
        const phoneNumberIdx = getColIndex(['hp', 'telepon', 'phone', 'telp', 'no hp', 'nomor hp']);
        const addressIdx = getColIndex(['alamat', 'address', 'rumah']);
        const entryYearIdx = getColIndex(['thn masuk', 'tahun masuk', 'tahun', 'masuk']);
        const programIdx = getColIndex(['program', 'studi', 'prodi']);
        const statusIdx = getColIndex(['status']);

        if (nameIdx === -1) {
          alert('Format kolom tidak sesuai. Pastikan file memiliki kolom dengan judul "Nama" atau "Nama Lengkap".');
          return;
        }

        const importedStudents: Student[] = [];

        for (let i = headerLineIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = parseLine(line);
          if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

          const name = cols[nameIdx]?.trim() || '';
          if (!name) continue;

          const nip = nipIdx !== -1 ? cols[nipIdx]?.trim() : '';
          const birthPlace = birthPlaceIdx !== -1 ? cols[birthPlaceIdx]?.trim() : 'Cirebon';
          const birthDate = birthDateIdx !== -1 ? cols[birthDateIdx]?.trim() : '2010-04-12';
          const sClass = classIdx !== -1 ? cols[classIdx]?.trim() : (classes[0] || '10A');
          const rawGender = genderIdx !== -1 ? cols[genderIdx]?.trim() : 'Laki-laki';
          const gender = (rawGender.toLowerCase().startsWith('p') || rawGender.toLowerCase().startsWith('w')) ? 'Perempuan' : 'Laki-laki';
          const parentName = parentNameIdx !== -1 ? cols[parentNameIdx]?.trim() : 'Orangtua Santri';
          const phoneNumber = phoneNumberIdx !== -1 ? cols[phoneNumberIdx]?.trim() : '081234567890';
          const address = addressIdx !== -1 ? cols[addressIdx]?.trim() : 'Jl. Pesantren No. 1';
          const entryYear = entryYearIdx !== -1 ? cols[entryYearIdx]?.trim() : '2024';
          const rawProgram = programIdx !== -1 ? cols[programIdx]?.trim() : 'Pondok';
          const program = rawProgram.toLowerCase().includes('madrasah') ? 'Madrasah' : 'Pondok';
          const rawStatus = statusIdx !== -1 ? cols[statusIdx]?.trim() : 'Aktif';
          const status = rawStatus.toLowerCase().startsWith('al') ? 'Alumni' : 'Aktif';

          const newStudent: Student = {
            id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name,
            nisn: '00' + Math.floor(Math.random() * 10000000),
            nip: nip || '10' + Math.floor(Math.random() * 10000000),
            nis: 'NIS-' + entryYear + Math.floor(Math.random() * 1000),
            gender,
            class: sClass,
            program: program as any,
            status: status as any,
            dorm: 'Asrama A-01',
            tahfidzJuz: 0,
            tahfidzDetail: '-',
            totalScore: 80.0,
            attendanceRate: 100,
            birthPlace,
            birthDate,
            parentName,
            phoneNumber,
            address,
            entryYear,
            photoUrl: gender === 'Laki-laki' 
              ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkLYXeLgpBsZWbBC8F6MHXFF40RID1YkqZxXrsP-H0Fbc2i6FRGU5MdMW47p6gSBNGUTFfcOxtK4ad4zdQb1uPKsU8QPZLRsw0N_eRN2nGl-jYeYqCnnYLH5ajiDH7hSrKl8YCSBLFTos7hWz65yS-Q6Pk7agAo3GUYYVPKihODvnjhD64eygg9QNugdZ4HPEsUlWvFJTOXyCv013c9pRr8AIf8RLXPJYoP9yC43dtDquPvx6b1Yyw'
              : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUFjYUibwfoObiO0LkgtB7CwJJG9v24SRwrhxRKGKE4rAwYggU9vgvVU03CP9pxjtHvJM3iHfSJNcrDByFnuBmJl9AiJskOKhYoMRRgIf8iPyGko1z2XevqCwFMs2qORbNAwVfKufvGYf_CH4iJFMFc4TihK4gtw5YoGoqkdcRS9ziGvHYMT8TRxApI5qSn-qtcSZNTRpB8p5_pU-ISTj9_E0_Rl1-dQPFyn8hrs4nvkqe3A1ZDHZD',
          };

          importedStudents.push(newStudent);
        }

        if (importedStudents.length === 0) {
          alert('Tidak ada data santri yang valid untuk dimasukkan.');
          return;
        }

        onUpdateStudents([...importedStudents, ...students]);
        alert(`Sukses! Berhasil mengimpor ${importedStudents.length} data santri.`);
        e.target.value = '';
      } catch (err: any) {
        alert('Gagal membaca file: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="space-y-section-gap">
      <input
        type="file"
        id="import-student-csv"
        accept=".csv,.txt"
        onChange={handleImportExcel}
        className="hidden"
      />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Data Santri</h1>
          <p className="font-sans text-xs text-on-surface-variant mt-1">
            Kelola informasi, status, dan pencapaian seluruh santri.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => document.getElementById('import-student-csv')?.click()}
            className="border border-outline-variant/80 hover:bg-surface-container-low text-on-surface px-4 py-2.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 transition-all hover-elevate shadow-xs cursor-pointer"
            title="Import data dari file CSV / Excel"
          >
            <span className="material-symbols-outlined text-[18px]">publish</span>
            <span>Impor Data</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 transition-all hover-elevate shadow-xs cursor-pointer"
            title="Ekspor data tampil ke format Excel/CSV"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Ekspor Data</span>
          </button>
          <button
            id="btn-tambah-santri-baru"
            onClick={() => {
              resetForm();
              setAddStudentOpen(true);
            }}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 hover:bg-primary-container transition-all hover-elevate shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Tambah Santri Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-outline-variant/60 p-4 rounded-xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-on-surface-variant font-sans text-[10px] font-bold tracking-wider mr-2 uppercase">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          <span>FILTER</span>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Cari nama, NIS, Wali, dll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-outline-variant/60 bg-surface-container-low text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        {/* Class Filter */}
        <div className="relative min-w-[140px] flex-1 sm:flex-none">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full appearance-none bg-surface-container-low border border-outline-variant/60 rounded-md py-1.5 pl-3 pr-8 text-xs font-sans text-on-surface outline-none cursor-pointer"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">expand_more</span>
        </div>

        {/* Tahun Masuk Filter */}
        <div className="relative min-w-[140px] flex-1 sm:flex-none">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full appearance-none bg-surface-container-low border border-outline-variant/60 rounded-md py-1.5 pl-3 pr-8 text-xs font-sans text-on-surface outline-none cursor-pointer"
          >
            <option value="">Semua Tahun Masuk</option>
            {entryYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">expand_more</span>
        </div>

        {/* Program Filter */}
        <div className="relative min-w-[140px] flex-1 sm:flex-none">
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full appearance-none bg-surface-container-low border border-outline-variant/60 rounded-md py-1.5 pl-3 pr-8 text-xs font-sans text-on-surface outline-none cursor-pointer"
          >
            <option value="">Semua Program</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">expand_more</span>
        </div>

        {/* Status Filter */}
        <div className="relative min-w-[140px] flex-1 sm:flex-none">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full appearance-none bg-surface-container-low border border-outline-variant/60 rounded-md py-1.5 pl-3 pr-8 text-xs font-sans text-on-surface outline-none cursor-pointer"
          >
            <option value="aktif">Status: Aktif</option>
            <option value="alumni">Status: Alumni</option>
            <option value="semua">Semua Status</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">expand_more</span>
        </div>

        {/* Reset Button */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={handleResetFilters}
            className="text-primary font-sans text-xs font-semibold hover:bg-primary/5 px-3 py-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Student Table Container */}
      <div className="bg-surface border border-outline-variant/60 rounded-xl overflow-hidden shadow-xs flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/60">
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 w-12 text-center uppercase tracking-wider">No</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Foto</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">NIP</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Nama Lengkap</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Tempat Lahir</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Tgl Lahir</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Kelas</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">JK</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Orangtua/Wali</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">No HP</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Alamat Lengkap</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Thn Masuk</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider">Program Studi</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider text-center">Status</th>
                <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3.5 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="font-sans text-xs text-on-surface divide-y divide-outline-variant/30">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student, index) => {
                  const globalIndex = startIndex + index + 1;
                  return (
                    <tr key={student.id} className="hover:bg-surface-container-low/40 transition-colors group">
                      <td className="px-4 py-3 text-center text-on-surface-variant font-medium">{globalIndex}</td>
                      
                      {/* Foto */}
                      <td className="px-4 py-3">
                        <div className="relative w-10 h-10">
                          {student.photoUrl ? (
                            <img
                              alt={student.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-outline-variant/50 shadow-2xs hover:scale-115 transition-transform duration-200 cursor-zoom-in relative z-10"
                              src={student.photoUrl}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewStudent({ name: student.name, photoUrl: student.photoUrl });
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center font-bold text-on-surface-variant text-[11px] shadow-2xs">
                              {student.initials || student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* NIP */}
                      <td className="px-4 py-3 font-mono text-on-surface font-medium whitespace-nowrap">
                        {student.nip || student.id}
                      </td>

                      {/* Nama Lengkap */}
                      <td className="px-4 py-3">
                        <div className="font-sans font-semibold text-on-surface hover:text-primary cursor-pointer whitespace-nowrap" onClick={() => {
                          setSelectedStudentId(student.id);
                          setView('student_portal');
                        }}>
                          {student.name}
                        </div>
                      </td>

                      {/* Tempat Lahir */}
                      <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">
                        {student.birthPlace || '-'}
                      </td>

                      {/* Tanggal Lahir */}
                      <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant font-mono">
                        {student.birthDate || '-'}
                      </td>

                      {/* Kelas */}
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-on-surface">
                        {student.class}
                      </td>

                      {/* Jenis Kelamin */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-sm font-semibold text-[10px] ${
                          student.gender === 'Laki-laki' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {student.gender === 'Laki-laki' ? 'L' : 'P'}
                        </span>
                      </td>

                      {/* Orangtua/Wali */}
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-on-surface">
                        {student.parentName || '-'}
                      </td>

                      {/* No HP */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-on-surface-variant">
                        {student.phoneNumber || '-'}
                      </td>

                      {/* Alamat Lengkap */}
                      <td className="px-4 py-3 max-w-[200px] truncate text-on-surface-variant" title={student.address}>
                        {student.address || '-'}
                      </td>

                      {/* Tahun Masuk */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-center text-on-surface-variant">
                        {student.entryYear || '-'}
                      </td>

                      {/* Program Studi */}
                      <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant font-medium">
                        {student.program}
                      </td>

                      {/* Status Keaktifan */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                          student.status === 'Aktif'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setView('student_portal');
                            }}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest rounded-md transition-colors cursor-pointer"
                            title="Lihat Profil"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => handleEditClick(student)}
                            className="p-1.5 text-on-surface-variant hover:text-tertiary hover:bg-surface-container-highest rounded-md transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(student.id)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-md transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-on-surface-variant">
                    Tidak ada data santri yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary & Pagination Footer */}
        <div className="bg-surface p-4 border-t border-outline-variant/60 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-on-surface-variant">
            Menampilkan <span className="font-bold text-on-surface">{Math.min(startIndex + 1, totalItems)}</span> -{' '}
            <span className="font-bold text-on-surface">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari{' '}
            <span className="font-bold text-on-surface">{totalItems}</span> santri
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-outline-variant/60 rounded-md text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] mr-1">chevron_left</span>
              <span>Sebelumnya</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 mx-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7.5 h-7.5 rounded text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'hover:bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-outline-variant/60 rounded-md text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center cursor-pointer"
            >
              <span>Selanjutnya</span>
              <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Student Form Modal */}
      {(addStudentOpen || editingStudent) && (
        <div className="fixed inset-0 bg-[#003527]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-outline-variant max-w-2xl w-full p-6 shadow-xl relative animate-fade-in overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => {
                setAddStudentOpen(false);
                setEditingStudent(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-2">
              <span className="material-symbols-outlined text-primary">person_add</span>
              <span>{addStudentOpen ? 'Tambah Santri Baru' : 'Edit Data Santri'}</span>
            </h3>

            <form onSubmit={addStudentOpen ? handleAddStudentSubmit : handleEditStudentSubmit} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Nama Lengkap */}
                <div className="col-span-2">
                  <label className="block text-on-surface font-semibold mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Contoh: Ahmad Rizqi Maulana"
                  />
                </div>

                {/* NIP */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">NIP (Nomor Induk Pondok)</label>
                  <input
                    type="text"
                    required
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                    placeholder="Contoh: 101234567"
                  />
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    required
                    value={formBirthPlace}
                    onChange={(e) => setFormBirthPlace(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Contoh: Cirebon"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                  />
                </div>

                {/* Kelas */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Kelas</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Orangtua / Wali */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Nama Orangtua / Wali</label>
                  <input
                    type="text"
                    required
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Contoh: H. Lukman Fathanah"
                  />
                </div>

                {/* No HP */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">No HP Orangtua / Wali</label>
                  <input
                    type="text"
                    required
                    value={formPhoneNumber}
                    onChange={(e) => setFormPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                    placeholder="Contoh: 081234567890"
                  />
                </div>

                {/* Alamat */}
                <div className="col-span-2">
                  <label className="block text-on-surface font-semibold mb-1">Alamat Lengkap</label>
                  <textarea
                    required
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Contoh: Jl. Pemuda No. 45, Kesambi, Cirebon"
                  />
                </div>

                {/* Tahun Masuk */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Tahun Masuk</label>
                  <input
                    type="text"
                    required
                    value={formEntryYear}
                    onChange={(e) => setFormEntryYear(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                    placeholder="Contoh: 2024"
                  />
                </div>

                {/* Upload Foto & URL */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Upload Foto / Pilih File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormPhotoUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-surface-container-low cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container"
                  />
                  {formPhotoUrl && (
                    <div className="mt-1 text-[10px] text-green-700 font-semibold truncate flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      <span>Foto terpilih (berupa Base64/URL)</span>
                    </div>
                  )}
                </div>

                {/* Program Studi, Status */}
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Program Studi</label>
                  <select
                    value={formProgram}
                    onChange={(e) => setFormProgram(e.target.value as any)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                  >
                    {programs.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Status Keaktifan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => {
                    setAddStudentOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-semibold shadow-xs cursor-pointer"
                >
                  {addStudentOpen ? 'Simpan Santri' : 'Simpan Perubahan'}
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
