import React, { useState, useEffect } from 'react';
import { Student, MemorizationRecord, AppView, Teacher } from '../types';
import { SURAHS, USTADZ_LIST } from '../data';

const JUZ_SURAHS: Record<number, string[]> = {
  1: ['Al-Baqarah'],
  2: ['Al-Baqarah'],
  3: ['Al-Baqarah', "Ali 'Imran"],
  4: ["Ali 'Imran", "An-Nisa'"],
  5: ["An-Nisa'"],
  6: ["An-Nisa'", "Al-Ma'idah"],
  7: ["Al-Ma'idah", "Al-An'am"],
  8: ["Al-An'am", "Al-A'raf"],
  9: ["Al-A'raf", "Al-Anfal"],
  10: ["Al-Anfal", "At-Taubah"],
  11: ["At-Taubah", "Yunus", "Hud"],
  12: ["Hud", "Yusuf"],
  13: ["Yusuf", "Ar-Ra'd", "Ibrahim"],
  14: ["Al-Hijr", "An-Nahl"],
  15: ["Al-Isra'", "Al-Kahfi"],
  16: ["Al-Kahfi", "Maryam", "Thaha"],
  17: ["Al-Anbiya'", "Al-Hajj"],
  18: ["Al-Mu'minun", "An-Nur", "Al-Furqan"],
  19: ["Al-Furqan", "Asy-Syu'ara'", "An-Naml"],
  20: ["An-Naml", "Al-Qashash", "Al-Ankabut"],
  21: ["Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab"],
  22: ["Al-Ahzab", "Saba'", "Fathir", "Yasin"],
  23: ["Yasin", "Ash-Shaffat", "Shad", "Az-Zumar"],
  24: ["Az-Zumar", "Ghafir", "Fushshilat"],
  25: ["Fushshilat", "Asy-Syura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jatsiyah"],
  26: ["Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adz-Dzariyat"],
  27: ["Adz-Dzariyat", "At-Thur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid"],
  28: ["Al-Mujadilah", "Al-Hasyr", "Al-Mumtahanah", "Ash-Shaff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Thalaq", "At-Tahrim"],
  29: ["Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jin", "Al-Muzzammil", "Al-Muddatstsir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"],
  30: [
    "An-Naba'", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infithar", "Al-Muthaffifin", "Al-Insyiqaq", "Al-Buruj", "At-Thariq",
    "Al-A'la", "Al-Ghasyiyah", "Al-Fajr", "Al-Balad", "Asy-Syams", "Al-Lail", "Ad-Dhuha", "Asy-Syarh", "At-Tin", "Al-'Alaq",
    "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takatsur", "Al-'Ashr", "Al-Humazah", "Al-Fil",
    "Quraisy", "Al-Ma'un", "Al-Kautsar", "Al-Kafirun", "An-Nashr", "Al-Lahab", "Al-Ikhlash", "Al-Falaq", "An-Nas"
  ]
};

interface SetoranFormViewProps {
  students: Student[];
  teachers: Teacher[];
  classes?: string[];
  onAddRecord: (record: MemorizationRecord) => void;
  onUpdateStudentStats: (studentId: string, juzCount: number, detail: string, score: number) => void;
  setView: (view: AppView) => void;
}

export default function SetoranFormView({
  students,
  teachers = [],
  classes = [],
  onAddRecord,
  onUpdateStudentStats,
  setView,
}: SetoranFormViewProps) {
  // Form State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [ustadz, setUstadz] = useState('');
  const [setoranType, setSetoranType] = useState<string>('');
  const [juz, setJuz] = useState<number | ''>('');
  const [surah, setSurah] = useState('');
  const [startAyat, setStartAyat] = useState<number | ''>('');
  const [endAyat, setEndAyat] = useState<number | ''>('');
  const [page, setPage] = useState<number | ''>('');
  const [line, setLine] = useState('');

  // Grading Sliders
  const [fluency, setFluency] = useState(85);
  const [tajwid, setTajwid] = useState(90);
  const [tartil, setTartil] = useState(88);

  // Notes Checklist
  const [makharijul, setMakharijul] = useState(false);
  const [mad, setMad] = useState(false);
  const [ghunnah, setGhunnah] = useState(false);
  const [keterangan, setKeterangan] = useState('');

  // Live Calculations
  const [finalScore, setFinalScore] = useState(87.6);
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [predikat, setPredikat] = useState('Sangat Baik (Jayyid Jiddan)');

  // Dynamic search state for Student selector
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const student = students.find(s => s.id === selectedStudentId);
    if (student) {
      setSearchQuery(student.name);
    } else {
      setSearchQuery('');
    }
  }, [selectedStudentId, students]);

  useEffect(() => {
    // Calculate raw weighted score
    const avg = (fluency + tajwid + tartil) / 3;
    setFinalScore(Number(avg.toFixed(1)));

    // Calculate Grade and Predikat (Only A, B, C)
    if (avg >= 85) {
      setGrade('A');
      setPredikat(avg >= 92 ? 'Sangat Baik (Mumtaz)' : 'Sangat Baik (Jayyid Jiddan)');
    } else if (avg >= 70) {
      setGrade('B');
      setPredikat('Baik (Jayyid)');
    } else {
      setGrade('C');
      setPredikat('Cukup (Maqbul)');
    }
  }, [fluency, tajwid, tartil]);

  const filteredStudentsForSearch = searchQuery.trim() === '' 
    ? students 
    : students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.nip && s.nip.includes(searchQuery)) ||
        (s.id && s.id.includes(searchQuery))
      );

  const filteredStudentsByClassAndProgram = students.filter((s) => {
    const matchClass = !selectedClass || s.class === selectedClass;
    const matchProgram = !selectedProgram || s.program === selectedProgram;
    return matchClass && matchProgram;
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Pilih santri terlebih dahulu.');
      return;
    }

    if (!ustadz) {
      alert('Harap pilih Ustadz Penguji terlebih dahulu.');
      return;
    }

    if (!setoranType) {
      alert('Harap pilih Jenis Setoran terlebih dahulu.');
      return;
    }

    if (!juz) {
      alert('Harap pilih Juz terlebih dahulu.');
      return;
    }

    if (!surah) {
      alert('Harap pilih Nama Surat terlebih dahulu.');
      return;
    }

    if (startAyat === '' || Number(startAyat) <= 0) {
      alert('Ayat Awal wajib diisi dan harus lebih besar dari 0.');
      return;
    }

    if (endAyat === '' || Number(endAyat) <= 0) {
      alert('Ayat Akhir wajib diisi dan harus lebih besar dari 0.');
      return;
    }

    if (Number(endAyat) < Number(startAyat)) {
      alert('Ayat Akhir tidak boleh lebih kecil dari Ayat Awal.');
      return;
    }

    if (page === '' || Number(page) <= 0) {
      alert('Nomor Halaman wajib diisi dan harus lebih besar dari 0.');
      return;
    }

    if (!line) {
      alert('Harap pilih Jumlah Baris terlebih dahulu.');
      return;
    }

    const currentStudent = students.find(s => s.id === selectedStudentId);
    if (!currentStudent) return;

    // Create record
    const newRecord: MemorizationRecord = {
      id: 'm_' + Date.now(),
      studentId: selectedStudentId,
      studentName: currentStudent.name,
      date: dateStr,
      ustadz,
      type: setoranType,
      juz: Number(juz),
      surah,
      startAyat: Number(startAyat),
      endAyat: Number(endAyat),
      page: Number(page),
      line,
      fluencyScore: fluency,
      tajwidScore: tajwid,
      tartilScore: tartil,
      notesChecklist: {
        makharijulHuruf: makharijul,
        madConsistency: mad,
        ghunnahHold: ghunnah
      },
      keterangan,
      finalScore,
      grade,
      predikat
    };

    onAddRecord(newRecord);

    // Update Student general statistics automatically!
    // Format: "Surah {SurahName} ({EndAyat})"
    const formattedDetail = `${surah} (${endAyat})`;
    onUpdateStudentStats(selectedStudentId, Number(juz), formattedDetail, finalScore);

    alert(`Hafalan Baru ${currentStudent.name} berhasil disimpan! Status & nilai santri diperbarui.`);
    setView('dashboard');
  };

  return (
    <div className="space-y-section-gap font-sans">
      {/* Header and Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
          <button onClick={() => setView('dashboard')} className="hover:text-primary transition-colors cursor-pointer">
            Tahfidz
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Input Setoran</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-primary">Input Setoran Hafalan Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-section-gap text-left text-xs">
        {/* Left Column: Form Details (8/12 widths) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Student Identification Card */}
          <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-2xs">
            <h3 className="font-display text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">person_search</span>
              <span>Identitas Santri</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1 leading-none uppercase text-[10px] tracking-wider">
                  Pilih Kelas
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudentId('');
                    }}
                    className="w-full pl-3 pr-10 py-2.5 border border-outline-variant/80 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary bg-white outline-none font-medium appearance-none cursor-pointer"
                  >
                    <option value="">-- Semua Kelas --</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1 leading-none uppercase text-[10px] tracking-wider">
                  Pilih Program Studi
                </label>
                <div className="relative">
                  <select
                    value={selectedProgram}
                    onChange={(e) => {
                      setSelectedProgram(e.target.value);
                      setSelectedStudentId('');
                    }}
                    className="w-full pl-3 pr-10 py-2.5 border border-outline-variant/80 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary bg-white outline-none font-medium appearance-none cursor-pointer"
                  >
                    <option value="">-- Semua Program Studi --</option>
                    <option value="Pondok">Pondok</option>
                    <option value="Madrasah">Madrasah</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1 leading-none uppercase text-[10px] tracking-wider">
                  Pilih Santri
                </label>
                <div className="relative">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                    }}
                    className="w-full pl-3 pr-10 py-2.5 border border-outline-variant/80 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary bg-white outline-none font-medium appearance-none cursor-pointer"
                  >
                    <option value="">-- Pilih Santri --</option>
                    {filteredStudentsByClassAndProgram.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.class} - {s.program})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>
            </div>

            {selectedStudent && (
              <div className="mt-4 p-3 bg-secondary-fixed/15 border border-secondary-fixed-dim/40 rounded-lg flex items-center gap-3 animate-fade-in">
                {selectedStudent.photoUrl ? (
                  <img
                    alt={selectedStudent.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-outline-variant/50 shadow-2xs"
                    src={selectedStudent.photoUrl}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center font-bold text-on-surface-variant text-xs shadow-2xs">
                    {selectedStudent.initials || 'ST'}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-primary text-xs leading-none mb-1">{selectedStudent.name}</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    Kelas: {selectedStudent.class} | NISN: {selectedStudent.nisn} | Asrama: {selectedStudent.dormRoom || selectedStudent.dorm}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase tracking-wider text-on-surface-variant font-medium">Hafalan Saat Ini</span>
                  <span className="text-xs font-bold text-primary">Juz {selectedStudent.tahfidzJuz}</span>
                </div>
              </div>
            )}
          </div>

          {selectedStudentId ? (
            /* Setoran Details Card */
            <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-2xs animate-fade-in">
              <h3 className="font-display text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
                <span>Detail Setoran</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Tanggal Setoran</label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Ustadz Penguji *</label>
                  <select
                    required
                    value={ustadz}
                    onChange={(e) => setUstadz(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer bg-white text-on-surface font-medium"
                  >
                    <option value="">-- Pilih Ustadz Penguji --</option>
                    {(teachers || []).map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Jenis Setoran *</label>
                  <select
                    required
                    value={setoranType}
                    onChange={(e) => setSetoranType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer bg-white text-on-surface font-medium"
                  >
                    <option value="">-- Pilih Jenis Setoran --</option>
                    <option value="Ziyadah">Ziyadah</option>
                    <option value="Murojaah">Murojaah</option>
                    <option value="Perbaikan">Perbaikan</option>
                    <option value="Tasmi 1 Dudukan">Tasmi 1 Dudukan</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-5 space-y-4">
                <h4 className="font-display text-xs font-bold text-amber-950 uppercase tracking-wide">Target Mushaf</h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Juz *</label>
                    <select
                      value={juz}
                      required
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setJuz(val);
                        if (val !== '') {
                          const sList = JUZ_SURAHS[val] || [];
                          if (sList.length > 0) {
                            setSurah(sList[0]);
                          } else {
                            setSurah('');
                          }
                        } else {
                          setSurah('');
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary bg-white outline-none font-mono cursor-pointer text-on-surface"
                    >
                      <option value="">-- Pilih Juz --</option>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          Juz {num}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Nama Surat *</label>
                    <select
                      value={surah}
                      required
                      onChange={(e) => setSurah(e.target.value)}
                      className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary bg-white outline-none cursor-pointer text-on-surface"
                    >
                      <option value="">-- Pilih Surat --</option>
                      {juz !== '' && (JUZ_SURAHS[juz] || SURAHS).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Ayat Awal *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={startAyat}
                      onChange={(e) => setStartAyat(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono text-on-surface"
                      placeholder="Contoh: 1"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Ayat Akhir *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={endAyat}
                      onChange={(e) => setEndAyat(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono text-on-surface"
                      placeholder="Contoh: 40"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Halaman *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={page}
                      onChange={(e) => setPage(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono text-on-surface"
                      placeholder="Contoh: 582"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1 uppercase text-[10px] tracking-wider">Baris *</label>
                    <select
                      value={line}
                      required
                      onChange={(e) => setLine(e.target.value)}
                      className="w-full px-3 py-1.5 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary bg-white outline-none font-mono cursor-pointer text-on-surface"
                    >
                      <option value="">-- Pilih Jumlah Baris --</option>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((b) => (
                        <option key={b} value={`${b} Baris`}>
                          {b} Baris
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-outline-variant/40 rounded-xl p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] text-primary/45 block mb-2">person_search</span>
              <h4 className="font-display font-bold text-sm text-primary mb-1">Pilih Santri Terlebih Dahulu</h4>
              <p className="text-[11px] leading-relaxed">Silakan pilih salah satu santri dari dropdown di atas untuk mengaktifkan instrumen input setoran dan tabel penilaian.</p>
            </div>
          )}
        </div>

        {/* Right Column: Grading (4/12 widths) */}
        <div className="lg:col-span-4">
          {selectedStudentId ? (
            <div className="bg-white border border-outline-variant/60 rounded-xl p-5 sticky top-20 space-y-5 animate-fade-in">
              <h3 className="font-display text-sm font-bold text-primary pb-2 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                <span>Penilaian</span>
              </h3>

              {/* Range Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1 font-semibold text-xs">
                    <label className="text-on-surface">Kelancaran (Tahfizh)</label>
                    <span className="font-mono text-primary">{fluency}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fluency}
                    onChange={(e) => setFluency(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1 font-semibold text-xs">
                    <label className="text-on-surface">Tajwid</label>
                    <span className="font-mono text-primary">{tajwid}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tajwid}
                    onChange={(e) => setTajwid(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1 font-semibold text-xs">
                    <label className="text-on-surface">Fashohah / Tartil</label>
                    <span className="font-mono text-primary">{tartil}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tartil}
                    onChange={(e) => setTartil(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <hr className="border-outline-variant/20" />

              {/* Checklist */}
              <div>
                <h4 className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5 leading-none">
                  Catatan Tajwid (Opsional)
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={makharijul}
                      onChange={(e) => setMakharijul(e.target.checked)}
                      className="rounded text-primary focus:ring-primary border-outline-variant/80 bg-surface"
                    />
                    <span className="text-on-surface">Perbaikan Makharijul Huruf</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={mad}
                      onChange={(e) => setMad(e.target.checked)}
                      className="rounded text-primary focus:ring-primary border-outline-variant/80 bg-surface"
                    />
                    <span className="text-on-surface">Kurang konsisten pada Mad</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={ghunnah}
                      onChange={(e) => setGhunnah(e.target.checked)}
                      className="rounded text-primary focus:ring-primary border-outline-variant/80 bg-surface"
                    />
                    <span className="text-on-surface">Ghunnah kurang ditahan</span>
                  </label>
                </div>

                {/* Keterangan Manual */}
                <div className="mt-3.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Keterangan (Tulisan Manual)
                  </label>
                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Masukkan keterangan atau catatan manual mengenai setoran santri..."
                    rows={2}
                    className="w-full px-3 py-1.5 border border-outline-variant rounded bg-surface text-xs outline-none focus:border-primary transition-all font-medium resize-none"
                  />
                </div>
              </div>

              {/* Result Display Card */}
              <div className="bg-secondary-container/20 rounded-lg p-4 flex items-center justify-between border border-secondary-container animate-fade-in">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-secondary-container leading-none mb-1.5">
                    Nilai Akhir
                  </span>
                  <span className="font-sans text-3xl font-extrabold text-primary leading-none">
                    {finalScore.toFixed(1)}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <span className="font-sans text-md font-extrabold text-on-primary">
                    {grade}
                  </span>
                </div>
              </div>

              <p className="text-[11px] font-bold text-primary text-center italic">
                Predikat: {predikat}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-outline-variant/40 rounded-xl p-5 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] text-primary/35 block mb-2">rule</span>
              <p className="font-bold text-xs text-primary mb-1">Tabel Penilaian Kosong</p>
              <p className="text-[10px] leading-relaxed">Pilih santri terlebih dahulu untuk memuat panel instrumen penilaian hafalan.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {selectedStudentId && (
          <div className="col-span-1 lg:col-span-12 flex justify-end gap-3 pt-5 border-t border-outline-variant/30 mt-4 pb-8 animate-fade-in">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 rounded-lg border border-primary text-primary font-sans text-xs font-bold hover:bg-primary/5 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Cetak Bukti Setoran</span>
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary text-on-primary font-sans text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Simpan Data</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
