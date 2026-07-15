import React, { useState, useEffect } from 'react';
import { Teacher, AppView } from '../types';

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't_1',
    nip: '19840212001',
    name: 'Ust. Ahmad Baihaqi, S.Pd.I.',
    gender: 'Laki-laki',
    phone: '081234567890',
    email: 'ahmad.baihaqi@gmail.com',
    subject: 'Aqidah Akhlaq',
    status: 'Aktif',
    address: 'Sumber, Cirebon'
  },
  {
    id: 't_2',
    nip: '19890520002',
    name: 'Ustdh. Fatimah Az-Zahra, S.Ag.',
    gender: 'Perempuan',
    phone: '081398765432',
    email: 'fatimah.zahra@gmail.com',
    subject: 'Fiqih Wadlih',
    status: 'Aktif',
    address: 'Kedawung, Cirebon'
  },
  {
    id: 't_3',
    nip: '19821105003',
    name: 'Ust. Muhammad Kamaluddin, Lc.',
    gender: 'Laki-laki',
    phone: '085712345678',
    email: 'kamal.lc@gmail.com',
    subject: 'Tafsir Jalalain',
    status: 'Aktif',
    address: 'Weru, Cirebon'
  }
];

interface TeacherListViewProps {
  teachers?: Teacher[];
  onUpdateTeachers?: (teachers: Teacher[]) => void;
}

export default function TeacherListView({
  teachers: teachersProp,
  onUpdateTeachers
}: TeacherListViewProps = {}) {
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>(() => {
    const cached = localStorage.getItem('siakad_teachers');
    return cached ? JSON.parse(cached) : INITIAL_TEACHERS;
  });

  const teachers = teachersProp || localTeachers;
  const setTeachers = (val: Teacher[] | ((prev: Teacher[]) => Teacher[])) => {
    const next = typeof val === 'function' ? val(teachers) : val;
    if (onUpdateTeachers) {
      onUpdateTeachers(next);
    } else {
      setLocalTeachers(next);
      localStorage.setItem('siakad_teachers', JSON.stringify(next));
    }
  };

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form Fields
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Sync to localStorage
  useEffect(() => {
    if (!teachersProp) {
      localStorage.setItem('siakad_teachers', JSON.stringify(teachers));
    }
  }, [teachers, teachersProp]);

  const resetForm = () => {
    setNip('');
    setName('');
    setGender('Laki-laki');
    setPhone('');
    setEmail('');
    setSubject('');
    setStatus('Aktif');
    setAddress('');
    setPhotoUrl('');
    setEditingTeacher(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setNip(t.nip);
    setName(t.name);
    setGender(t.gender);
    setPhone(t.phone || '');
    setEmail(t.email || '');
    setSubject(t.subject);
    setStatus(t.status);
    setAddress(t.address || '');
    setPhotoUrl(t.photoUrl || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip.trim() || !name.trim() || !subject.trim()) {
      alert('NIP, Nama Lengkap, dan Mata Pelajaran/Kitab wajib diisi!');
      return;
    }

    if (editingTeacher) {
      // Edit
      const updated = teachers.map((t) => {
        if (t.id === editingTeacher.id) {
          return {
            ...t,
            nip,
            name,
            gender,
            phone,
            email,
            subject,
            status,
            address,
            photoUrl,
          };
        }
        return t;
      });
      setTeachers(updated);
      alert('Berhasil memperbarui data pengajar!');
    } else {
      // Create
      const newTeacher: Teacher = {
        id: 't_' + Date.now(),
        nip,
        name,
        gender,
        phone,
        email,
        subject,
        status,
        address,
        photoUrl,
      };
      setTeachers([newTeacher, ...teachers]);
      alert('Berhasil menambahkan pengajar baru!');
    }

    setModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, teacherName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pengajar "${teacherName}"?`)) {
      setTeachers(teachers.filter((t) => t.id !== id));
    }
  };

  // Filter teachers by name (case-insensitive)
  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nip.includes(searchTerm)
  );

  // Professional print function with header (Kop Surat)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredTeachers.map((t, idx) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace;">${t.nip}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #004b39;">${t.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${t.gender}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${t.subject}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace;">${t.phone || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${t.email || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
          <span style="font-weight: bold; color: ${t.status === 'Aktif' ? '#198754' : '#dc3545'};">
            ${t.status}
          </span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Data Lengkap Ustadz & Pengajar - Madrasah Ummi</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 3px double #004b39; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 22px; color: #004b39; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0 0; font-size: 11px; color: #666; }
            .title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 20px; text-transform: uppercase; color: #004b39; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background-color: #f2f2f2; padding: 12px; border: 1px solid #ddd; text-align: left; }
            .footer { margin-top: 50px; font-size: 11px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MADRASAH UMMI</h1>
            <p>Pendidikan Agama Diniyah & Pondok Pesantren Terpadu</p>
            <p>Email: akademik@madrasahummi.sch.id | Website: www.madrasahummi.sch.id</p>
          </div>
          <div class="title">Daftar Lengkap Ustadz & Pengajar Diniyah</div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>NIP</th>
                <th>Nama Lengkap</th>
                <th>Jenis Kelamin</th>
                <th>Mata Pelajaran (Kitab)</th>
                <th>No. Telepon</th>
                <th>Email</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px;">Tidak ada data pengajar.</td></tr>'}
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

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Data Lengkap Ustadz / Pengajar</h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Kelola data guru, ustadz, dan pengajar Madrasah/Pondok Pesantren secara menyeluruh.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-primary/10 text-primary border border-primary/20 px-4 py-2.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 hover:bg-primary/20 transition-all cursor-pointer shadow-3xs"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Cetak Data Pengajar</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-sans text-xs font-semibold flex items-center gap-2 hover:bg-primary-container transition-all hover-elevate shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Tambah Pengajar Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-outline-variant/60 p-4 rounded-xl flex items-center gap-3">
        <div className="flex items-center gap-2 text-on-surface-variant font-sans text-[10px] font-bold tracking-wider mr-2 uppercase">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          <span>CARI GURU</span>
        </div>
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Cari berdasarkan nama lengkap atau NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-outline-variant/60 bg-surface-container-low text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-on-surface-variant hover:text-primary font-bold text-xs cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-outline-variant/60 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">badge</span>
            <span>Daftar Guru / Ustadz Aktif</span>
          </h3>
          <span className="text-[10px] bg-secondary-fixed text-primary font-bold px-2.5 py-0.5 rounded-full uppercase leading-none">
            {filteredTeachers.length} Pengajar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">
                <th className="p-3 pl-4 w-12 text-center">No</th>
                <th className="p-3">NIP</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Jenis Kelamin</th>
                <th className="p-3">Mata Pelajaran (Kitab)</th>
                <th className="p-3">No. Telp</th>
                <th className="p-3">Email</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-xs font-medium">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="p-3 pl-4 text-center text-on-surface-variant">{idx + 1}</td>
                    <td className="p-3 font-mono text-on-surface-variant">{t.nip}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center border border-primary/20">
                          {t.photoUrl ? (
                            <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                          )}
                        </div>
                        <span className="font-bold text-primary">{t.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-on-surface-variant">{t.gender}</td>
                    <td className="p-3 font-bold text-on-surface">{t.subject}</td>
                    <td className="p-3 font-mono text-on-surface-variant">{t.phone || '-'}</td>
                    <td className="p-3 text-on-surface-variant">{t.email || '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Aktif'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest rounded-md transition-colors cursor-pointer"
                          title="Edit Data"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-on-surface-variant font-medium">
                    Tidak ada data pengajar yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#003527]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-outline-variant max-w-lg w-full p-6 shadow-xl relative animate-fade-in overflow-y-auto max-h-[90vh] text-left">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary cursor-pointer transition-colors p-1 rounded-full hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-display text-base font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-3">
              <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
              <span>{editingTeacher ? 'Ubah Data Pengajar' : 'Tambah Pengajar Baru'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-on-surface">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">NIP / Nomor Pegawai *</label>
                  <input
                    type="text"
                    required
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Contoh: 19840212001"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-1 focus:ring-primary outline-none font-bold"
                    placeholder="Contoh: Ust. Ahmad Baihaqi, S.Pd.I."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">Jenis Kelamin *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">Mata Pelajaran / Kitab Utama *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Contoh: Aqidah Akhlaq"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">No. Telepon / HP</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Contoh: ustadz@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">Status Kepegawaian *</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'Aktif'}
                      onChange={() => setStatus('Aktif')}
                      className="accent-primary"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'Nonaktif'}
                      onChange={() => setStatus('Nonaktif')}
                      className="accent-primary"
                    />
                    <span>Nonaktif</span>
                  </label>
                </div>
              </div>

               <div>
                <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">URL Foto Pengajar</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-1 focus:ring-primary outline-none"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1 uppercase tracking-wider text-[10px]">Alamat Rumah</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Masukkan alamat rumah pengajar..."
                />
              </div>

              <div className="border-t border-outline-variant/30 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-surface-container-highest cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container cursor-pointer transition-all"
                >
                  {editingTeacher ? 'Simpan Perubahan' : 'Tambah Pengajar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
