import React, { useState, useEffect } from 'react';
import { TeachingJournal, Teacher } from '../types';
import { USTADZ_LIST, CLASSES } from '../data';

interface LaporanPengajarViewProps {
  journals: TeachingJournal[];
  onAddJournal: (newJournal: TeachingJournal) => void;
  onDeleteJournal: (id: string) => void;
  classes?: string[];
  teachers?: Teacher[];
}

export default function LaporanPengajarView({
  journals,
  onAddJournal,
  onDeleteJournal,
  classes = CLASSES,
  teachers = [],
}: LaporanPengajarViewProps) {
  const activeTeachers = teachers.length > 0 ? teachers.map((t) => t.name) : USTADZ_LIST;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Form States for New Journal
  const [formOpen, setFormOpen] = useState(false);
  const [formTeacher, setFormTeacher] = useState('');
  const [formSubject, setFormSubject] = useState('Aqidah Akhlaq');
  const [formClass, setFormClass] = useState(classes[0] || '10 IPA 1');
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [formTopic, setFormTopic] = useState('');

  useEffect(() => {
    if (activeTeachers.length > 0 && !formTeacher) {
      setFormTeacher(activeTeachers[0]);
    }
  }, [activeTeachers, formTeacher]);
  const [formPresent, setFormPresent] = useState(25);
  const [formTotal, setFormTotal] = useState(25);
  const [formNotes, setFormNotes] = useState('');

  // Filter journals
  const filteredJournals = journals.filter((j) => {
    const matchesSearch =
      j.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || j.class === selectedClass;
    const matchesTeacher = !selectedTeacher || j.teacherName === selectedTeacher;

    return matchesSearch && matchesClass && matchesTeacher;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTopic.trim()) {
      alert('Mohon isi materi/pembahasan!');
      return;
    }

    const newJournal: TeachingJournal = {
      id: `tj_${Date.now()}`,
      teacherName: formTeacher,
      subject: formSubject,
      class: formClass,
      date: formDate,
      topic: formTopic,
      presentStudents: Number(formPresent),
      totalStudents: Number(formTotal),
      notes: formNotes,
    };

    onAddJournal(newJournal);
    setFormTopic('');
    setFormNotes('');
    setFormOpen(false);
    alert('Jurnal KBM Mengajar berhasil disimpan!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jurnal mengajar ini?')) {
      onDeleteJournal(id);
    }
  };

  // Compute stats
  const totalLogs = journals.length;
  const totalPresentStudents = journals.reduce((acc, curr) => acc + curr.presentStudents, 0);
  const totalStudents = journals.reduce((acc, curr) => acc + curr.totalStudents, 0);
  const avgAttendance = totalStudents > 0 ? Math.round((totalPresentStudents / totalStudents) * 100) : 100;

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredJournals.map((j, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(j.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #004b39;">${j.subject}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${j.teacherName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${j.class}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <strong>${j.topic}</strong>
          ${j.notes ? `<br/><small style="color: #666;">Catatan: ${j.notes}</small>` : ''}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${j.presentStudents} / ${j.totalStudents}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Jurnal & Laporan Mengajar - Madrasah Ummi</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 3px double #004b39; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 22px; color: #004b39; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0 0; font-size: 11px; color: #666; }
            .title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 20px; text-transform: uppercase; color: #004b39; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background-color: #f2f2f2; padding: 10px; border: 1px solid #ddd; text-align: left; }
            .footer { margin-top: 50px; font-size: 11px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MADRASAH UMMI</h1>
            <p>Pendidikan Agama Diniyah & Pondok Pesantren Terpadu</p>
            <p>Email: akademik@madrasahummi.sch.id | Website: www.madrasahummi.sch.id</p>
          </div>
          <div class="title">Laporan Jurnal KBM Pembelajaran Pengajar</div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>Tanggal</th>
                <th>Mata Pelajaran (Kitab)</th>
                <th>Pengajar</th>
                <th>Kelas</th>
                <th>Materi / Bahasan</th>
                <th style="text-align: center;">Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 20px;">Tidak ada data jurnal.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            <br/><br/><br/>
            <p>__________________________</p>
            <p>Admin Akademik Madrasah Ummi</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintSingle = (j: TeachingJournal) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Detail Jurnal Mengajar - ${j.teacherName}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 3px double #004b39; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 22px; color: #004b39; text-transform: uppercase; }
            .header p { margin: 5px 0 0 0; font-size: 11px; color: #666; }
            .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; line-height: 1.8; font-size: 13px; }
            .card-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; color: #004b39; }
            .row { display: flex; border-bottom: 1px solid #f9f9f9; padding: 8px 0; }
            .label { width: 180px; font-weight: bold; color: #555; }
            .value { flex: 1; }
            .footer { margin-top: 50px; font-size: 11px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MADRASAH UMMI</h1>
            <p>Pendidikan Agama Diniyah & Pondok Pesantren Terpadu</p>
            <p>Email: akademik@madrasahummi.sch.id | Website: www.madrasahummi.sch.id</p>
          </div>
          <div class="card">
            <div class="card-title">RINCIAN JURNAL BELAJAR MENGAJAR (KBM)</div>
            <div class="row"><div class="label">Nama Pengajar:</div><div class="value">${j.teacherName}</div></div>
            <div class="row"><div class="label">Tanggal KBM:</div><div class="value">${new Date(j.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
            <div class="row"><div class="label">Mata Pelajaran (Kitab):</div><div class="value">${j.subject}</div></div>
            <div class="row"><div class="label">Kelas:</div><div class="value">${j.class}</div></div>
            <div class="row"><div class="label">Materi / Bahasan:</div><div class="value"><strong>${j.topic}</strong></div></div>
            <div class="row"><div class="label">Kehadiran Santri:</div><div class="value">${j.presentStudents} hadir dari ${j.totalStudents} total santri (${Math.round((j.presentStudents / j.totalStudents) * 100)}%)</div></div>
            <div class="row"><div class="label">Catatan Tambahan:</div><div class="value">${j.notes || '-'}</div></div>
          </div>
          <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            <br/><br/><br/>
            <p>__________________________</p>
            <p>Admin Akademik Madrasah Ummi</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Jurnal &amp; Laporan Mengajar</h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Pantau laporan Kegiatan Belajar Mengajar (KBM) diniyah, materi kitab kuning yang dibahas, dan tingkat kehadiran santri di kelas.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 hover:bg-primary-container transition-all hover-elevate shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Tulis Jurnal Mengajar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Total Jurnal Terisi</span>
          <h4 className="font-display text-xl font-bold text-primary mt-2">{totalLogs} KBM Sesi</h4>
          <span className="text-emerald-600 font-bold text-[9px] mt-1">▲ Aktif mencatat</span>
        </div>

        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Rata-rata Presensi Santri</span>
          <h4 className="font-display text-xl font-bold text-emerald-700 mt-2">{avgAttendance}% Kehadiran</h4>
          <span className="text-on-surface-variant text-[9px] mt-1">Dari seluruh sesi KBM</span>
        </div>

        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Jam Pelajaran Terpancar</span>
          <h4 className="font-display text-xl font-bold text-amber-600 mt-2">{totalLogs * 2} JP</h4>
          <span className="text-on-surface-variant text-[9px] mt-1">Estimasi jam tatap muka</span>
        </div>

        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Buku/Kitab Terbahas</span>
          <h4 className="font-display text-xl font-bold text-blue-600 mt-2">6 Kitab</h4>
          <span className="text-on-surface-variant text-[9px] mt-1">Kurikulum Diniyah Terpadu</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-outline-variant/60 p-4 rounded-xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-on-surface-variant font-sans text-[10px] font-bold tracking-wider mr-2 uppercase">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          <span>CARI LOG</span>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Cari materi bahasan, kitab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-outline-variant/60 bg-surface-container-low text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        {/* Teacher select */}
        <div className="relative min-w-[140px] flex-1 sm:flex-none">
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full appearance-none bg-surface-container-low border border-outline-variant/60 rounded-md py-1.5 pl-3 pr-8 text-xs font-sans text-on-surface outline-none cursor-pointer"
          >
            <option value="">Semua Pengajar</option>
            {activeTeachers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">expand_more</span>
        </div>

        {/* Class select */}
        <div className="relative min-w-[140px] flex-1 sm:flex-none">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full appearance-none bg-surface-container-low border border-outline-variant/60 rounded-md py-1.5 pl-3 pr-8 text-xs font-sans text-on-surface outline-none cursor-pointer"
          >
            <option value="">Semua Kelas</option>
            {classes.filter((c) => c !== 'Semua Kelas').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">expand_more</span>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setSearchTerm('');
            setSelectedClass('');
            setSelectedTeacher('');
          }}
          className="text-primary font-sans text-xs font-semibold hover:bg-primary/5 px-3 py-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Journal Table/List */}
      <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-lowest">
          <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">assignment</span>
            <span>Daftar Jurnal Pembelajaran Terbaru</span>
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handlePrintAll}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md font-sans text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Cetak Seluruh Jurnal Terfilter"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Cetak Laporan Jurnal</span>
            </button>
            <span className="text-[10px] bg-secondary-fixed text-primary font-bold px-2.5 py-0.5 rounded-full uppercase leading-none">
              {filteredJournals.length} Jurnal
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                <th className="p-3 pl-4 w-12 text-center">No</th>
                <th className="p-3">Hari &amp; Tanggal</th>
                <th className="p-3">Mata Pelajaran (Kitab)</th>
                <th className="p-3">Pengajar</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Materi / Bahasan</th>
                <th className="p-3 text-center">Kehadiran Santri</th>
                <th className="p-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
              {filteredJournals.length > 0 ? (
                filteredJournals.map((j, idx) => {
                  const attendanceRateSesi = Math.round((j.presentStudents / j.totalStudents) * 100);
                  return (
                    <tr key={j.id} className="hover:bg-surface-container-low/30 transition-colors group">
                      <td className="p-3 pl-4 text-center text-on-surface-variant">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-on-surface-variant">
                        {new Date(j.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-primary">{j.subject}</div>
                      </td>
                      <td className="p-3 font-semibold text-on-surface">{j.teacherName}</td>
                      <td className="p-3 font-semibold text-on-surface-variant">{j.class}</td>
                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-on-surface leading-tight">{j.topic}</div>
                        {j.notes && (
                          <div className="text-[10px] text-on-surface-variant mt-1 leading-relaxed bg-surface-container-low/50 p-1.5 rounded border-l-2 border-primary">
                            <strong>Catatan:</strong> {j.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-mono font-bold text-on-surface">
                          {j.presentStudents} / {j.totalStudents} <span className="text-[10px] text-on-surface-variant">({attendanceRateSesi}%)</span>
                        </div>
                        <div className="w-16 bg-surface-container-high h-1.5 rounded-full mx-auto mt-1 relative overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${Math.min(attendanceRateSesi, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePrintSingle(j)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest rounded-md transition-colors cursor-pointer"
                            title="Cetak Jurnal"
                          >
                            <span className="material-symbols-outlined text-[16px]">print</span>
                          </button>
                          <button
                            onClick={() => handleDelete(j.id)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-on-surface-variant">
                    Tidak ada jurnal pembelajaran yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Writing Report Drawer / Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 bg-[#003527]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-outline-variant max-w-lg w-full p-6 shadow-xl relative animate-fade-in overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-2">
              <span className="material-symbols-outlined text-primary">edit_document</span>
              <span>Buat Jurnal Pembelajaran Baru</span>
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface font-semibold mb-1">Nama Pengajar (Ustadz)</label>
                  <select
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary outline-none cursor-pointer font-medium"
                  >
                    {activeTeachers.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Hari &amp; Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Mata Pelajaran / Kitab</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary outline-none cursor-pointer font-medium"
                  >
                    <option value="Aqidah Akhlaq">Aqidah Akhlaq (Kitab Aqidatul Awam)</option>
                    <option value="Fiqih Ibadah">Fiqih Ibadah (Kitab Safinatun Najah)</option>
                    <option value="Bahasa Arab (Nahwu)">Bahasa Arab Nahwu (Kitab Al-Ajurrumiyyah)</option>
                    <option value="Shorof &amp; Tashrif">Shorof &amp; Tashrif (Kitab Al-Amtsilah At-Tashrifiyyah)</option>
                    <option value="Tajwid &amp; Makharij">Tajwid &amp; Makharij (Kitab Tuhfatul Athfal)</option>
                    <option value="Tafsir &amp; Al-Quran">Tafsir &amp; Al-Quran (Kitab Jalalain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Kelas Mengajar</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary outline-none cursor-pointer font-medium"
                  >
                    {classes.filter((c) => c !== 'Semua Kelas').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-on-surface font-semibold mb-1">Materi / Pokok Bahasan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembahasan syarat-syarat wudhu, Isim Isyarah"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Jumlah Santri Hadir</label>
                  <input
                    type="number"
                    min="0"
                    max={formTotal}
                    value={formPresent}
                    onChange={(e) => setFormPresent(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-on-surface font-semibold mb-1">Total Santri di Kelas</label>
                  <input
                    type="number"
                    min="1"
                    value={formTotal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormTotal(val);
                      if (formPresent > val) setFormPresent(val);
                    }}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-on-surface font-semibold mb-1">Catatan Evaluasi / Hambatan KBM (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Mayoritas santri sudah faham, 2 santri butuh bimbingan tambahan dalam makhraj."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-semibold shadow-xs cursor-pointer"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
