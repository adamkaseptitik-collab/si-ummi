import React, { useState } from 'react';
import { Student, MemorizationRecord, AppView } from '../types';
import { CLASSES, PROGRAMS } from '../data';

interface LaporanPencapaianViewProps {
  students: Student[];
  records: MemorizationRecord[];
  classes?: string[];
  setView: (view: AppView) => void;
  setSelectedStudentId: (id: string | null) => void;
}

export default function LaporanPencapaianView({
  students,
  records,
  classes = [],
  setView,
  setSelectedStudentId,
}: LaporanPencapaianViewProps) {
  // Filters State
  const [filterName, setFilterName] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Helper to translate Date to Indonesian Day Name
  const getHariIndo = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '-';
      return days[d.getDay()];
    } catch {
      return '-';
    }
  };

  // List of unique categories for setoran
  const categories = ['Ziyadah', 'Murojaah', 'Perbaikan', 'Tasmi 1 Dudukan'];

  // Reset Filters handler
  const handleResetFilters = () => {
    setFilterName('');
    setFilterClass('');
    setFilterProgram('');
    setFilterCategory('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  // Filter the memorization records based on user input
  const filteredRecords = records.filter((record) => {
    const student = students.find(
      (s) => s.id === record.studentId || s.name.toLowerCase() === record.studentName.toLowerCase()
    );
    const studentClass = student ? student.class : '';
    const studentProgram = student ? student.program : '';

    const matchesName =
      !filterName ||
      record.studentName.toLowerCase().includes(filterName.toLowerCase()) ||
      (student && student.name.toLowerCase().includes(filterName.toLowerCase()));

    const matchesClass =
      !filterClass ||
      filterClass === 'Semua Kelas' ||
      studentClass === filterClass;

    const matchesProgram =
      !filterProgram ||
      filterProgram === 'Semua Program' ||
      studentProgram === filterProgram;

    const matchesCategory =
      !filterCategory ||
      filterCategory === 'Semua Kategori' ||
      record.type.toLowerCase() === filterCategory.toLowerCase();

    let matchesDate = true;
    if (filterStartDate) {
      matchesDate = matchesDate && record.date >= filterStartDate;
    }
    if (filterEndDate) {
      matchesDate = matchesDate && record.date <= filterEndDate;
    }

    return matchesName && matchesClass && matchesProgram && matchesCategory && matchesDate;
  });

  // Calculate stats based on currently filtered records
  const totalSubmissions = filteredRecords.length;
  const averageScore = totalSubmissions
    ? Number((filteredRecords.reduce((sum, r) => sum + r.finalScore, 0) / totalSubmissions).toFixed(1))
    : 0;

  const totalLines = filteredRecords.reduce((sum, r) => {
    const lNum = parseInt(String(r.line));
    return sum + (isNaN(lNum) ? 0 : lNum);
  }, 0);

  const countGradeA = filteredRecords.filter((r) => r.grade === 'A').length;
  const countGradeB = filteredRecords.filter((r) => r.grade === 'B').length;
  const countGradeC = filteredRecords.filter((r) => r.grade === 'C').length;

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = [
      'Hari',
      'Tanggal',
      'Nama Santri',
      'Kelas',
      'Program',
      'Pengajar',
      'Juz',
      'Surat',
      'Kategori',
      'Halaman',
      'Total Baris',
      'Tajwid',
      'Tartil',
      'Nilai',
      'Catatan',
    ];

    const rows = filteredRecords.map((record) => {
      const student = students.find(
        (s) => s.id === record.studentId || s.name.toLowerCase() === record.studentName.toLowerCase()
      );
      const studentClass = student ? student.class : '-';
      const studentProgram = student ? student.program : '-';
      const day = getHariIndo(record.date);

      const makharijul = record.notesChecklist?.makharijulHuruf ? 'Perbaikan Makharijul' : '';
      const mad = record.notesChecklist?.madConsistency ? 'Kurang konsisten Mad' : '';
      const ghunnah = record.notesChecklist?.ghunnahHold ? 'Ghunnah kurang ditahan' : '';
      const notes = [makharijul, mad, ghunnah].filter(Boolean).join('; ') || '-';

      return [
        day,
        record.date,
        record.studentName,
        studentClass,
        studentProgram,
        record.ustadz,
        record.juz,
        record.surah,
        record.type,
        record.page,
        record.line,
        record.tajwidScore,
        record.tartilScore,
        record.finalScore,
        notes,
      ];
    });

    // Handle CSV generation safely with escape quotes
    const csvRows = [headers.join(',')];
    rows.forEach((row) => {
      const formattedRow = row.map((val) => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(formattedRow.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Pencapaian_Hafalan_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom PDF print window using a hidden iframe for 100% reliable printing in sandbox environments
  const handlePrintPDF = () => {
    const filterDetails = [];
    if (filterName) filterDetails.push(`Nama: "${filterName}"`);
    if (filterClass) filterDetails.push(`Kelas: ${filterClass}`);
    if (filterProgram) filterDetails.push(`Program: ${filterProgram}`);
    if (filterCategory) filterDetails.push(`Kategori: ${filterCategory}`);
    if (filterStartDate) filterDetails.push(`Mulai: ${filterStartDate}`);
    if (filterEndDate) filterDetails.push(`Sampai: ${filterEndDate}`);
    const filterString = filterDetails.length > 0 ? filterDetails.join(' | ') : 'Semua Data';

    const tableRows = filteredRecords.map((record, index) => {
      const student = students.find(
        (s) => s.id === record.studentId || s.name.trim().toLowerCase() === record.studentName.trim().toLowerCase()
      );
      const studentClass = student ? student.class : '-';
      const studentProgram = student ? student.program : '-';
      const day = getHariIndo(record.date);

      const makharijul = record.notesChecklist?.makharijulHuruf ? 'Perbaikan Makharijul' : '';
      const mad = record.notesChecklist?.madConsistency ? 'Kurang konsisten Mad' : '';
      const ghunnah = record.notesChecklist?.ghunnahHold ? 'Ghunnah kurang ditahan' : '';
      const notesStr = [makharijul, mad, ghunnah].filter(Boolean).join('; ') || '-';

      return `
        <tr>
          <td class="text-center font-mono">${index + 1}</td>
          <td>${day}, ${record.date}</td>
          <td><strong>${record.studentName}</strong></td>
          <td class="text-center font-semibold">${studentClass}</td>
          <td>${studentProgram}</td>
          <td>${record.ustadz}</td>
          <td class="text-center font-bold">${record.juz}</td>
          <td>${record.surah}</td>
          <td class="text-center font-semibold">${record.type}</td>
          <td class="text-center font-mono">${record.page}</td>
          <td class="text-center font-mono font-bold" style="color: #047857;">${record.line} Baris</td>
          <td class="text-center font-mono">${record.tajwidScore}</td>
          <td class="text-center font-mono">${record.tartilScore}</td>
          <td class="text-center font-mono font-bold" style="color: #1e3a8a;">${record.finalScore}</td>
          <td class="text-center font-bold">${record.grade}</td>
          <td>${notesStr}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Laporan Pencapaian Hafalan Santri</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #333; line-height: 1.4; }
            .header-container { border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 20px; }
            h2 { text-align: center; color: #047857; margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
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
            <h3>LAPORAN PENCAPAIAN HAFALAN SANTRI</h3>
            <p class="meta-info">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Waktu: ${new Date().toLocaleTimeString('id-ID')}</p>
          </div>
          
          <div class="filter-info">
            <strong>Kriteria Filter Aktif:</strong> ${filterString}
          </div>

          <div class="summary-box" style="margin-bottom: 20px; border-color: #047857; background-color: #f0fdf4; color: #14532d;">
            <p style="margin: 0;"><strong>REKAPITULASI DATA TAMPIL:</strong></p>
            <p style="margin: 5px 0 0 0;">Total Setoran: <strong>${filteredRecords.length} Transaksi</strong> | Jumlah Baris Hafalan: <strong>${totalLines} Baris</strong> | Rerata Nilai: <strong>${averageScore} / 100</strong></p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">No</th>
                <th style="width: 100px;">Tanggal</th>
                <th>Nama Santri</th>
                <th class="text-center">Kelas</th>
                <th>Program</th>
                <th>Pengajar</th>
                <th class="text-center">Juz</th>
                <th>Surah</th>
                <th class="text-center">Kategori</th>
                <th class="text-center">Hal</th>
                <th class="text-center">Total Baris</th>
                <th class="text-center">Tajwid</th>
                <th class="text-center">Tartil</th>
                <th class="text-center">Nilai</th>
                <th class="text-center">Grade</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="16" style="text-align:center; padding: 20px; color:#64748b; font-style:italic;">Tidak ada data yang ditampilkan.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Laporan ini digenerate secara otomatis oleh Sistem Informasi Ummi
          </div>

          <script>
            window.onload = function() {
              window.print();
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
      // Fallback: use hidden iframe
      let printIframe = document.getElementById('print-pdf-iframe') as HTMLIFrameElement;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'print-pdf-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);
      }

      const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      } else {
        alert('Gagal melakukan cetak PDF.');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs text-left animate-fade-in print:p-0 print:m-0">
      {/* Header - Hides on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Laporan Pencapaian Hafalan Keseluruhan</h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Pantau dan analisis setoran harian, nilai tajwid/tartil, dan statistik kelancaran seluruh santri secara realtime.
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={exportToCSV}
            className="flex-1 md:flex-none py-2 px-4 rounded-lg bg-surface border border-primary text-primary hover:bg-primary/5 font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Simpan CSV</span>
          </button>
          
          <button
            onClick={handlePrintPDF}
            className="flex-1 md:flex-none py-2 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Header for print only */}
      <div className="hidden print:block border-b-2 border-primary pb-3 mb-4">
        <h1 className="text-xl font-bold text-primary text-center">Laporan Pencapaian Hafalan Santri</h1>
        <p className="text-center text-[10px] text-gray-600 mt-1">
          Tanggal Cetak: {new Date().toLocaleDateString('id-ID')} | Diunduh melalui Sistem Informasi Ummi
        </p>
      </div>

      {/* Filter Card - Hides on Print */}
      <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-3xs print:hidden space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
          <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">filter_alt</span>
            <span>Filter Pencarian Laporan</span>
          </h3>
          <button
            onClick={handleResetFilters}
            className="text-primary hover:text-primary-container font-bold flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            <span>Reset Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Filter Nama */}
          <div>
            <label className="block text-on-surface font-semibold mb-1 uppercase text-[9px] tracking-wide">Nama Santri</label>
            <input
              type="text"
              placeholder="Cari nama santri..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block text-on-surface font-semibold mb-1 uppercase text-[9px] tracking-wide">Kelas</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Program */}
          <div>
            <label className="block text-on-surface font-semibold mb-1 uppercase text-[9px] tracking-wide">Program</label>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              <option value="">Semua Program</option>
              {PROGRAMS.filter((p) => p !== 'Semua Program').map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block text-on-surface font-semibold mb-1 uppercase text-[9px] tracking-wide">Kategori Setoran</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-on-surface font-semibold mb-1 uppercase text-[9px] tracking-wide">Dari Tanggal</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-on-surface font-semibold mb-1 uppercase text-[9px] tracking-wide">Sampai Tanggal</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline-variant/80 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-center shadow-3xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Total Setoran</span>
          <h4 className="font-display text-sm md:text-base font-extrabold text-primary mt-1">{totalSubmissions} Transaksi</h4>
        </div>

        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-center shadow-3xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Jumlah Baris Hafalan</span>
          <h4 className="font-display text-sm md:text-base font-extrabold text-emerald-700 mt-1">{totalLines} Baris</h4>
        </div>

        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-center shadow-3xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Rerata Nilai</span>
          <h4 className="font-display text-sm md:text-base font-extrabold text-primary mt-1">{averageScore} / 100</h4>
        </div>

        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-center shadow-3xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Skor Grade A</span>
          <h4 className="font-display text-sm md:text-base font-extrabold text-green-700 mt-1">{countGradeA} Rekor</h4>
        </div>

        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-center shadow-3xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Skor Grade B</span>
          <h4 className="font-display text-sm md:text-base font-extrabold text-indigo-700 mt-1">{countGradeB} Rekor</h4>
        </div>

        <div className="bg-white border border-outline-variant/60 p-4 rounded-xl flex flex-col justify-center shadow-3xs">
          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Skor Grade C</span>
          <h4 className="font-display text-sm md:text-base font-extrabold text-amber-700 mt-1">{countGradeC} Rekor</h4>
        </div>
      </div>

      {/* Main Achievement Report Table */}
      <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center print:hidden">
          <div>
            <h3 className="font-display text-sm font-bold text-primary">Hasil Setoran Hafalan Santri secara Keseluruhan</h3>
            <p className="text-on-surface-variant text-[11px] mt-0.5">
              Menampilkan {filteredRecords.length} dari total {records.length} data riwayat transaksi setoran.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-3xs">
              <span className="material-symbols-outlined text-emerald-700 text-[16px]">menu_book</span>
              <span>Jumlah Hafalan Terfilter:</span>
              <span className="font-extrabold text-sm text-emerald-700 font-mono">{totalLines} Baris</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/60 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-3.5 w-12 text-center font-bold">No</th>
                <th className="px-4 py-3.5 font-bold">Hari</th>
                <th className="px-4 py-3.5 font-bold">Tanggal</th>
                <th className="px-4 py-3.5 font-bold">Nama Santri</th>
                <th className="px-4 py-3.5 font-bold text-center">Kelas</th>
                <th className="px-4 py-3.5 font-bold">Program</th>
                <th className="px-4 py-3.5 font-bold">Pengajar</th>
                <th className="px-4 py-3.5 font-bold text-center">Juz</th>
                <th className="px-4 py-3.5 font-bold">Surat</th>
                <th className="px-4 py-3.5 font-bold text-center">Kategori</th>
                <th className="px-4 py-3.5 font-bold text-center">Halaman</th>
                <th className="px-4 py-3.5 font-bold text-center">Total Baris</th>
                <th className="px-4 py-3.5 font-bold text-center">Tajwid</th>
                <th className="px-4 py-3.5 font-bold text-center">Tartil</th>
                <th className="px-4 py-3.5 font-bold text-center">Nilai</th>
                <th className="px-4 py-3.5 font-bold">Catatan</th>
              </tr>
            </thead>
            <tbody className="font-sans text-xs text-on-surface divide-y divide-outline-variant/30">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => {
                  const student = students.find(
                    (s) => s.id === record.studentId || s.name.trim().toLowerCase() === record.studentName.trim().toLowerCase()
                  );
                  const studentClass = student ? student.class : '-';
                  const studentProgram = student ? student.program : '-';
                  const day = getHariIndo(record.date);

                  // Extract notes nicely
                  const makharijul = record.notesChecklist?.makharijulHuruf ? 'Perbaikan Makharijul' : '';
                  const mad = record.notesChecklist?.madConsistency ? 'Kurang konsisten Mad' : '';
                  const ghunnah = record.notesChecklist?.ghunnahHold ? 'Ghunnah kurang ditahan' : '';
                  const notesStr = [makharijul, mad, ghunnah].filter(Boolean).join('; ') || '-';

                  return (
                    <tr key={record.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-4 py-3 text-center text-on-surface-variant font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-on-surface">{day}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-on-surface-variant">{record.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-primary">{record.studentName}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium">{studentClass}</td>
                      <td className="px-4 py-3 font-medium text-on-surface-variant">{studentProgram}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{record.ustadz}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono font-bold text-primary bg-primary-container/10 px-2 py-0.5 rounded text-xs">
                          {record.juz}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-on-surface">{record.surah}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-sm font-semibold text-[10px] ${
                          record.type === 'Ziyadah'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.type === 'Murojaah'
                            ? 'bg-blue-100 text-blue-800'
                            : record.type === 'Perbaikan'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium">{record.page}</td>
                      <td className="px-4 py-3 text-center font-mono font-medium">{record.line}</td>
                      <td className="px-4 py-3 text-center font-mono">{record.tajwidScore}</td>
                      <td className="px-4 py-3 text-center font-mono">{record.tartilScore}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-extrabold text-primary leading-tight">
                            {record.finalScore.toFixed(1)}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 rounded-sm mt-0.5 ${
                            record.grade === 'A'
                              ? 'bg-green-100 text-green-800'
                              : record.grade === 'B'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {record.grade}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant max-w-[250px] truncate" title={notesStr}>
                        {notesStr}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={16} className="px-4 py-12 text-center text-on-surface-variant">
                    Tidak ada data rekor setoran yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-surface-container-low border-t border-outline-variant font-bold text-xs">
              <tr className="bg-emerald-50/20">
                <td colSpan={11} className="px-4 py-3 text-right font-semibold text-on-surface">Total Baris Hafalan Terfilter:</td>
                <td className="px-4 py-3 text-center text-emerald-800 font-extrabold font-mono text-sm">{totalLines}</td>
                <td colSpan={4} className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
