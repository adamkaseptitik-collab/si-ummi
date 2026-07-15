import React, { useState, useEffect } from 'react';
import { Student, PointCategory, PointRecord, Teacher } from '../types';
import { CLASSES, USTADZ_LIST } from '../data';

interface CatatanPoinViewProps {
  students: Student[];
  classes?: string[];
  categories: PointCategory[];
  records: PointRecord[];
  teachers?: Teacher[];
  onAddRecord: (record: PointRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateCategories: (categories: PointCategory[]) => void;
  onUpdateStudents: (updated: Student[]) => void;
}

export default function CatatanPoinView({
  students,
  classes = [],
  categories,
  records,
  teachers = [],
  onAddRecord,
  onDeleteRecord,
  onUpdateCategories,
  onUpdateStudents,
}: CatatanPoinViewProps) {
  const [activeTab, setActiveTab] = useState<'log' | 'categories'>('log');

  // Tab 1: Log State
  const [formSelectedClass, setFormSelectedClass] = useState('');
  const [formSelectedProgram, setFormSelectedProgram] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [recordType, setRecordType] = useState<'Pelanggaran' | 'Prestasi'>('Pelanggaran');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordTeacher, setRecordTeacher] = useState('');

  // Active teacher list from registered teachers or static list fallback
  const activeTeachers = teachers.length > 0 ? teachers.map((t) => t.name) : USTADZ_LIST;

  useEffect(() => {
    if (activeTeachers.length > 0 && !recordTeacher) {
      setRecordTeacher(activeTeachers[0]);
    }
  }, [activeTeachers, recordTeacher]);

  // Tab 2: Category Management State
  const [editingCategory, setEditingCategory] = useState<PointCategory | null>(null);
  const [catType, setCatType] = useState<'Pelanggaran' | 'Prestasi'>('Pelanggaran');
  const [catName, setCatName] = useState('');
  const [catPoints, setCatPoints] = useState<number>(-10);

  const [showImportBox, setShowImportBox] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const handleExportCategories = () => {
    const headers = ['No', 'Tipe', 'Nama Sub Kategori', 'Bobot Poin'];
    const rows = categories.map((cat, index) => [
      index + 1,
      cat.type,
      cat.name,
      cat.points > 0 ? `+${cat.points}` : `${cat.points}`
    ]);
    const csvLines = [
      'sep=,',
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ];
    const csvContent = "\uFEFF" + csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "kategori_poin_siakad.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCategoriesCSV = (text: string) => {
    try {
      setImportError('');
      setImportSuccess('');
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setImportError('Data tidak valid atau kosong.');
        return;
      }

      let startIdx = 0;
      // Skip Excel separator if present
      if (lines[0].toLowerCase().startsWith('sep=')) {
        startIdx = 1;
      }

      if (lines.length <= startIdx + 1) {
        setImportError('Data tidak memiliki baris konten.');
        return;
      }

      // Helper to parse single CSV line supporting quotes and escaped quotes
      const parseCSVLine = (line: string): string[] => {
        const cols: string[] = [];
        let cur = '';
        let insideQuote = false;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            cols.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        cols.push(cur.trim());
        return cols.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
      };

      const headerLine = lines[startIdx];
      const headerCols = parseCSVLine(headerLine);

      let typeIdx = -1;
      let nameIdx = -1;
      let pointsIdx = -1;

      headerCols.forEach((col, idx) => {
        const lowerCol = col.toLowerCase();
        if (lowerCol.includes('tipe') || lowerCol.includes('type')) {
          typeIdx = idx;
        } else if (lowerCol.includes('nama') || lowerCol.includes('sub') || lowerCol.includes('kategori')) {
          nameIdx = idx;
        } else if (lowerCol.includes('bobot') || lowerCol.includes('poin') || lowerCol.includes('points') || lowerCol.includes('skor') || lowerCol.includes('score')) {
          pointsIdx = idx;
        }
      });

      // Fallback indices if header names couldn't be auto-detected
      if (typeIdx === -1 || nameIdx === -1 || pointsIdx === -1) {
        if (headerCols.length >= 4) {
          typeIdx = 1;
          nameIdx = 2;
          pointsIdx = 3;
        } else {
          typeIdx = 0;
          nameIdx = 1;
          pointsIdx = 2;
        }
      }

      const newCats: PointCategory[] = [];
      
      for (let i = startIdx + 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length <= Math.max(typeIdx, nameIdx, pointsIdx)) continue;

        const typeRaw = cols[typeIdx];
        const nameVal = cols[nameIdx];
        const pointsRaw = cols[pointsIdx];

        if (!nameVal) continue;

        const type: 'Pelanggaran' | 'Prestasi' = (typeRaw.toLowerCase() === 'prestasi' || typeRaw.toLowerCase() === 'skor plus' || typeRaw.toLowerCase() === 'bonus' || typeRaw.toLowerCase() === 'reward') 
          ? 'Prestasi' 
          : 'Pelanggaran';
        
        const pointsClean = pointsRaw.replace(/^\+/, '');
        const points = parseInt(pointsClean, 10);

        if (isNaN(points)) continue;

        newCats.push({
          id: 'cat_' + Math.random().toString(36).substr(2, 9),
          type,
          name: nameVal,
          points
        });
      }

      if (newCats.length === 0) {
        setImportError('Tidak ada data kategori valid yang ditemukan.');
        return;
      }

      onUpdateCategories([...categories, ...newCats]);
      setImportSuccess(`Berhasil mengimpor ${newCats.length} sub-kategori poin.`);
      setPasteData('');
      setTimeout(() => {
        setShowImportBox(false);
        setImportSuccess('');
      }, 2000);
    } catch (err) {
      setImportError('Format CSV salah atau tidak dapat dibaca.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleImportCategoriesCSV(text);
      }
    };
    reader.readAsText(file);
  };

  // Search/Filters for Logs
  const [logSearch, setLogSearch] = useState('');
  const [logClass, setLogClass] = useState('');

  // Filter students by formSelectedClass and formSelectedProgram for Tab 1 student selector
  const formFilteredStudents = students.filter((s) => {
    const matchClass = !formSelectedClass || s.class === formSelectedClass;
    const matchProgram = !formSelectedProgram || s.program === formSelectedProgram;
    return matchClass && matchProgram;
  });

  // Filter categories by selected recordType for Tab 1 dropdown
  const filteredCategoriesForType = categories.filter((c) => c.type === recordType);

  // Update default selected category if type changes
  React.useEffect(() => {
    if (filteredCategoriesForType.length > 0) {
      setSelectedCategoryId(filteredCategoriesForType[0].id);
    } else {
      setSelectedCategoryId('');
    }
  }, [recordType, categories]);

  // Handle Recording point log
  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    const category = categories.find((c) => c.id === selectedCategoryId);

    if (!student || !category) {
      alert('Mohon pilih santri dan sub kategori poin yang valid.');
      return;
    }

    const newRecord: PointRecord = {
      id: 'pr_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      class: student.class,
      date: recordDate,
      type: recordType,
      categoryName: category.name,
      points: category.points,
      notes: recordNotes,
      teacherName: recordTeacher,
    };

    onAddRecord(newRecord);

    // Update Student score as well! (Decrease or increase totalScore based on points)
    const updatedStudents = students.map((s) => {
      if (s.id === student.id) {
        // Map points directly, ensuring it stays between 0 and 100
        const currentScore = s.totalScore || 85.0;
        const newScore = Math.min(100, Math.max(0, currentScore + category.points));
        return {
          ...s,
          totalScore: Number(newScore.toFixed(1)),
        };
      }
      return s;
    });
    onUpdateStudents(updatedStudents);

    // Reset Form
    setRecordNotes('');
    alert(`Berhasil mencatat poin ${recordType} (${category.name}) untuk ${student.name}!`);
  };

  // Handle Category Submit (Add / Edit)
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) {
      alert('Mohon masukkan nama sub kategori.');
      return;
    }

    if (editingCategory) {
      // Edit
      const updated = categories.map((c) => {
        if (c.id === editingCategory.id) {
          return {
            ...c,
            type: catType,
            name: catName,
            points: Number(catPoints),
          };
        }
        return c;
      });
      onUpdateCategories(updated);
      setEditingCategory(null);
      alert('Berhasil memperbarui kategori poin!');
    } else {
      // Add
      const newCat: PointCategory = {
        id: 'pc_' + Date.now(),
        type: catType,
        name: catName,
        points: Number(catPoints),
      };
      onUpdateCategories([...categories, newCat]);
      alert('Berhasil menambahkan kategori poin baru!');
    }

    // Reset Form
    setCatName('');
    setCatPoints(catType === 'Pelanggaran' ? -10 : 10);
  };

  const handleEditCategoryClick = (cat: PointCategory) => {
    setEditingCategory(cat);
    setCatType(cat.type);
    setCatName(cat.name);
    setCatPoints(cat.points);
  };

  const handleDeleteCategoryClick = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori poin ini?')) {
      onUpdateCategories(categories.filter((c) => c.id !== id));
    }
  };

  const handleDeleteRecordClick = (record: PointRecord) => {
    if (confirm('Apakah Anda yakin ingin membatalkan catatan poin ini? Poin santri akan dikembalikan.')) {
      onDeleteRecord(record.id);

      // Revert student score
      const updatedStudents = students.map((s) => {
        if (s.id === record.studentId) {
          const currentScore = s.totalScore || 85.0;
          const revertedScore = Math.min(100, Math.max(0, currentScore - record.points));
          return {
            ...s,
            totalScore: Number(revertedScore.toFixed(1)),
          };
        }
        return s;
      });
      onUpdateStudents(updatedStudents);
    }
  };

  // Filter logs for display
  const filteredRecords = records.filter((r) => {
    const matchesSearch = r.studentName.toLowerCase().includes(logSearch.toLowerCase()) ||
                          r.categoryName.toLowerCase().includes(logSearch.toLowerCase());
    const matchesClass = !logClass || logClass === 'Semua Kelas' || r.class === logClass;
    return matchesSearch && matchesClass;
  });

  // Calculate Prestasi, Pelanggaran, and Final Score based on filtered records
  const totalPrestasiPoints = filteredRecords
    .filter((r) => r.type === 'Prestasi')
    .reduce((sum, r) => sum + r.points, 0);

  const totalPelanggaranPoints = filteredRecords
    .filter((r) => r.type === 'Pelanggaran')
    .reduce((sum, r) => sum + Math.abs(r.points), 0);

  const netPoints = totalPrestasiPoints - totalPelanggaranPoints;

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Catatan Poin Pelanggaran &amp; Prestasi</h1>
        <p className="text-on-surface-variant text-xs mt-1">
          Kelola pelanggaran (penalti skor) dan prestasi (bonus skor) santri, serta sesuaikan opsi dropdown sub-kategori poin secara dinamis.
        </p>
      </div>

      {/* Point Balance Header Dashboard - Hidden when selectedStudentId is empty */}
      {selectedStudentId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Prestasi */}
          <div className="bg-white border border-outline-variant/60 rounded-xl p-4 flex items-center gap-4 shadow-3xs">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Total Poin Prestasi (+)</span>
              <h4 className="font-display text-lg font-extrabold text-green-700 mt-0.5">+{totalPrestasiPoints} Poin</h4>
            </div>
          </div>

          {/* Total Pelanggaran */}
          <div className="bg-white border border-outline-variant/60 rounded-xl p-4 flex items-center gap-4 shadow-3xs">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div>
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Total Poin Pelanggaran (-)</span>
              <h4 className="font-display text-lg font-extrabold text-red-700 mt-0.5">-{totalPelanggaranPoints} Poin</h4>
            </div>
          </div>

          {/* Net / Final Score Balance */}
          <div className="bg-white border border-outline-variant/60 rounded-xl p-4 flex items-center gap-4 shadow-3xs ring-1 ring-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">balance</span>
            </div>
            <div>
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Skor Akhir Bersih (Prestasi - Pelanggaran)</span>
              <h4 className={`font-display text-lg font-extrabold mt-0.5 ${netPoints >= 0 ? 'text-primary' : 'text-red-700'}`}>
                {netPoints > 0 ? `+${netPoints}` : netPoints} Poin
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/60">
        <button
          onClick={() => setActiveTab('log')}
          className={`px-5 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'log'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            Catat &amp; Riwayat Poin Santri
          </span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
            Atur Dropdown Kategori Poin
          </span>
        </button>
      </div>

      {/* TAB 1: LOG POINTS & HISTORY */}
      {activeTab === 'log' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Side */}
          <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-2xs col-span-1">
            <h3 className="font-display text-sm font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">add_task</span>
              Formulir Pencatatan Poin
            </h3>

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              {/* Kelas */}
              <div>
                <label className="block font-semibold mb-1 text-on-surface">Pilih Kelas</label>
                <select
                  value={formSelectedClass}
                  onChange={(e) => {
                    setFormSelectedClass(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer"
                >
                  <option value="">-- Semua Kelas --</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Studi */}
              <div>
                <label className="block font-semibold mb-1 text-on-surface">Pilih Program Studi</label>
                <select
                  value={formSelectedProgram}
                  onChange={(e) => {
                    setFormSelectedProgram(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer"
                >
                  <option value="">-- Semua Program Studi --</option>
                  <option value="Pondok">Pondok</option>
                  <option value="Madrasah">Madrasah</option>
                </select>
              </div>

              {/* Santri */}
              <div>
                <label className="block font-semibold mb-1 text-on-surface">Pilih Santri</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Santri --</option>
                  {formFilteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class} - {s.program})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentId ? (
                <>
                  {/* Tipe Kategori */}
                  <div>
                    <label className="block font-semibold mb-1 text-on-surface">Tipe Poin</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRecordType('Pelanggaran');
                        }}
                        className={`py-2 px-3 border rounded-md font-semibold text-center transition-all cursor-pointer ${
                          recordType === 'Pelanggaran'
                            ? 'bg-red-50 text-red-800 border-red-200 ring-2 ring-red-100'
                            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        Pelanggaran (Penalti)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordType('Prestasi');
                        }}
                        className={`py-2 px-3 border rounded-md font-semibold text-center transition-all cursor-pointer ${
                          recordType === 'Prestasi'
                            ? 'bg-green-50 text-green-800 border-green-200 ring-2 ring-green-100'
                            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        Prestasi (Bonus)
                      </button>
                    </div>
                  </div>

                  {/* Sub Kategori (Dropdown updated by rules) */}
                  <div>
                    <label className="block font-semibold mb-1 text-on-surface">
                      Pilih Sub Kategori {recordType} (Dropdown)
                    </label>
                    {filteredCategoriesForType.length > 0 ? (
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer font-medium text-primary"
                      >
                        {filteredCategoriesForType.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.points > 0 ? `+${c.points}` : c.points} Poin)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 text-center bg-surface border border-dashed rounded-md text-on-surface-variant">
                        Belum ada sub-kategori {recordType}. Silakan tambahkan di tab "Atur Dropdown Kategori Poin" terlebih dahulu.
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block font-semibold mb-1 text-on-surface">Keterangan / Catatan Tambahan</label>
                    <textarea
                      required
                      rows={3}
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none"
                      placeholder="Contoh: Terlambat datang shalat magrib 10 menit."
                    />
                  </div>

                  {/* Date & Teacher */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-on-surface">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={recordDate}
                        onChange={(e) => setRecordDate(e.target.value)}
                        className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-on-surface">Guru / Ustadz</label>
                      <select
                        value={recordTeacher}
                        onChange={(e) => setRecordTeacher(e.target.value)}
                        className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer"
                      >
                        {activeTeachers.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={filteredCategoriesForType.length === 0}
                    className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-semibold hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                  >
                    Simpan Catatan Poin
                  </button>
                </>
              ) : (
                <div className="p-4 text-center border border-dashed border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] font-medium leading-relaxed">
                  <span className="material-symbols-outlined text-[32px] text-primary/40 block mb-1">person_search</span>
                  Silakan pilih santri terlebih dahulu untuk menampilkan panel pencatatan poin &amp; penilaian.
                </div>
              )}
            </form>
          </div>

          {/* Table Side */}
          <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-2xs col-span-2 flex flex-col h-full">
            <div className="p-4 border-b border-outline-variant/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-primary">Riwayat Catatan Poin Santri</h3>
                <p className="text-on-surface-variant text-[11px] mt-0.5">Penalti dan bonus yang terekam pada santri aktif</p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Cari santri..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-outline-variant/60 rounded-md outline-none focus:ring-1 focus:ring-primary w-full sm:w-36"
                />

                <select
                  value={logClass}
                  onChange={(e) => setLogClass(e.target.value)}
                  className="px-2 py-1 text-xs border border-outline-variant/60 rounded-md bg-surface outline-none cursor-pointer"
                >
                  <option value="">Semua Kelas</option>
                  {(classes.length > 0 ? classes : CLASSES).filter(c => c !== 'Semua Kelas').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60">
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">Tanggal</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">Santri</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">Tipe</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">Sub Kategori</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider text-center">Poin</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">Catatan</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">Ustadz</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-xs text-on-surface divide-y divide-outline-variant/30">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-on-surface-variant">{rec.date}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{rec.studentName}</div>
                          <div className="text-[10px] text-on-surface-variant">{rec.class}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.type === 'Pelanggaran'
                              ? 'bg-red-50 text-red-700 border border-red-100'
                              : 'bg-green-50 text-green-700 border border-green-100'
                          }`}>
                            {rec.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-on-surface">{rec.categoryName}</td>
                        <td className={`px-4 py-3 text-center font-mono font-bold text-xs ${
                          rec.points < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {rec.points > 0 ? `+${rec.points}` : rec.points}
                        </td>
                        <td className="px-4 py-3 max-w-[150px] truncate" title={rec.notes}>{rec.notes}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">{rec.teacherName}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteRecordClick(rec)}
                            className="text-error hover:bg-error-container/20 p-1.5 rounded transition-colors cursor-pointer"
                            title="Hapus / Batalkan Catatan Poin"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
                        Belum ada riwayat catatan poin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEFINE/EDIT DROPDOWN CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Create/Edit dropdown option form */}
          <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-2xs col-span-1">
            <h3 className="font-display text-sm font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                {editingCategory ? 'edit_note' : 'add_circle'}
              </span>
              <span>{editingCategory ? 'Edit Sub Kategori' : 'Tambah Sub Kategori Poin'}</span>
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block font-semibold mb-1 text-on-surface">Tipe Sub Kategori</label>
                <select
                  value={catType}
                  onChange={(e) => {
                    const selectedType = e.target.value as 'Pelanggaran' | 'Prestasi';
                    setCatType(selectedType);
                    // Autofill sensible default points
                    setCatPoints(selectedType === 'Pelanggaran' ? -10 : 15);
                  }}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none cursor-pointer"
                >
                  <option value="Pelanggaran">Pelanggaran (Skor Minus)</option>
                  <option value="Prestasi">Prestasi (Skor Plus)</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold mb-1 text-on-surface">Nama Sub Kategori (Opsi Dropdown)</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none"
                  placeholder="Contoh: Berkelahi, Hafal 1 Juz, Terlambat Berjamaah"
                />
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                  Nama ini akan muncul sebagai opsi dropdown saat guru mencatat poin di Tab 1.
                </p>
              </div>

              {/* Point Value */}
              <div>
                <label className="block font-semibold mb-1 text-on-surface">Nilai Poin (Penalti / Bonus)</label>
                <input
                  type="number"
                  required
                  value={catPoints}
                  onChange={(e) => setCatPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-xs outline-none font-mono"
                  placeholder="Gunakan minus (-) untuk Pelanggaran"
                />
              </div>

              <div className="flex gap-2">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCatName('');
                      setCatPoints(-10);
                    }}
                    className="flex-1 py-2 border border-outline-variant rounded-lg font-semibold hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 bg-primary text-on-primary py-2 rounded-lg font-semibold hover:bg-primary-container transition-all shadow-xs cursor-pointer"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Tambah Opsi Dropdown'}
                </button>
              </div>
            </form>
          </div>

          {/* List of current Dropdowns */}
          <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-2xs col-span-2">
            <div className="p-4 border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/20">
              <div>
                <h3 className="font-display text-sm font-bold text-primary">Daftar Opsi Dropdown Saat Ini</h3>
                <p className="text-on-surface-variant text-[11px] mt-0.5">Ubah atau hapus sub-kategori poin yang tersedia untuk ustadz</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportCategories}
                  className="px-3 py-1.5 bg-primary text-on-primary rounded-lg font-semibold text-[11px] flex items-center gap-1.5 hover:bg-primary-container transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportBox(!showImportBox)}
                  className="px-3 py-1.5 bg-secondary text-on-secondary rounded-lg font-semibold text-[11px] flex items-center gap-1.5 hover:bg-secondary-container transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">upload</span>
                  Import CSV
                </button>
              </div>
            </div>

            {showImportBox && (
              <div className="p-4 bg-surface-container-low border-b border-outline-variant/60 animate-fade-in text-xs space-y-3">
                <div className="font-bold text-primary">Formulir Import Kategori Poin</div>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  Pilih file CSV dengan baris pertama sebagai header. Anda dapat langsung mengunggah file hasil export sebelumnya, atau menggunakan format kolom berikut: <br />
                  <code className="bg-white px-1 py-0.5 border rounded font-mono text-[10px]">No, Tipe, Nama Sub Kategori, Bobot Poin</code> atau <code className="bg-white px-1 py-0.5 border rounded font-mono text-[10px]">Tipe, Nama Sub Kategori, Bobot Poin</code><br />
                  Contoh isi baris: <code className="bg-white px-1 py-0.5 border rounded font-mono text-[10px]">1, Pelanggaran, "Tidak Salat Berjamaah", -15</code>
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <label className="bg-white border border-outline-variant px-3 py-2 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    Pilih File CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-on-surface-variant/70 text-[10px]">Atau tempel data CSV langsung di bawah:</span>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    placeholder="No, Tipe, Nama Sub Kategori, Bobot Poin&#10;1, Pelanggaran, Terlambat Masuk Kelas, -10&#10;2, Prestasi, Membantu Guru, +15"
                    className="w-full p-2.5 bg-white border border-outline-variant/80 rounded-md font-mono text-[11px] outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  {pasteData && (
                    <button
                      type="button"
                      onClick={() => handleImportCategoriesCSV(pasteData)}
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container transition-all cursor-pointer"
                    >
                      Proses Impor Teks
                    </button>
                  )}
                </div>

                {importError && (
                  <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[11px] font-medium animate-fade-in">
                    {importError}
                  </div>
                )}
                {importSuccess && (
                  <div className="p-2.5 bg-green-50 text-green-700 border border-green-200 rounded-md text-[11px] font-medium animate-fade-in">
                    {importSuccess}
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60">
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">No</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">Tipe</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider">Nama Sub Kategori</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider text-center">Bobot Poin</th>
                    <th className="font-sans text-[10px] font-bold text-on-surface-variant px-4 py-3 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-xs text-on-surface divide-y divide-outline-variant/30">
                  {categories.map((cat, index) => (
                    <tr key={cat.id} className="hover:bg-surface-container-low/20 transition-colors">
                      <td className="px-4 py-3 text-on-surface-variant font-mono">{index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cat.type === 'Pelanggaran'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {cat.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-on-surface">{cat.name}</td>
                      <td className={`px-4 py-3 text-center font-mono font-bold ${
                        cat.points < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {cat.points > 0 ? `+${cat.points}` : cat.points}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditCategoryClick(cat)}
                            className="p-1.5 text-on-surface-variant hover:text-tertiary hover:bg-surface-container-highest rounded transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategoryClick(cat.id)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
