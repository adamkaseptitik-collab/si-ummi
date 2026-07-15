export interface Student {
  id: string;
  name: string;
  nisn: string;
  nis?: string; // Nomor Induk Santri
  nip: string; // NIP or local ID
  gender: 'Laki-laki' | 'Perempuan';
  class: string;
  program: 'Pondok' | 'Madrasah';
  status: 'Aktif' | 'Alumni';
  dorm: string;
  tahfidzJuz: number;
  tahfidzDetail: string; // e.g. "Al-Ma'idah (120)" or "Al-Baqarah (252)"
  totalScore: number;
  photoUrl: string;
  initials?: string;
  attendanceRate: number; // e.g. 98
  latestAchievement?: string; // e.g. "Juara 1 MTQ"
  dormRoom?: string; // e.g. "Asrama A-01"
  birthPlace?: string; // Tempat Lahir
  birthDate?: string; // Tanggal Lahir
  parentName?: string; // Nama Orang Tua / Wali
  phoneNumber?: string; // No HP Wali
  address?: string; // Alamat
  entryYear?: string; // Tahun Masuk
}

export interface MemorizationRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  ustadz: string;
  type: string;
  juz: number;
  surah: string;
  startAyat: number;
  endAyat: number;
  page: number;
  line: string;
  fluencyScore: number;
  tajwidScore: number;
  tartilScore: number;
  notesChecklist: {
    makharijulHuruf: boolean;
    madConsistency: boolean;
    ghunnahHold: boolean;
  };
  finalScore: number;
  grade: 'A' | 'B' | 'C';
  predikat: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  icon: string;
  isCurrent?: boolean;
  isPast?: boolean;
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  date: string;
  label?: 'Penting' | 'Informasi' | 'Kegiatan';
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface Subject {
  code: string;
  name: string;
  teacher: string;
  hours: number;
  room: string;
}

export interface AcademicGrade {
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

export type AppView = 'dashboard' | 'students' | 'tahfidz_input' | 'student_portal' | 'akademik' | 'keuangan' | 'laporan' | 'pengaturan' | 'absensi_pengajar' | 'laporan_pengajar' | 'laporan_pencapaian' | 'catatan_poin' | 'kelas_program' | 'penilaian_ujian' | 'data_pengajar';

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  phone: string;
  email: string;
  subject: string;
  status: 'Aktif' | 'Nonaktif';
  address: string;
  photoUrl?: string;
}

export type UserRole = 'super_admin' | 'wali_santri' | 'ustadz';

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  status: 'Aktif' | 'Nonaktif';
  permittedViews?: string[]; // Allowed menu/view keys for admin/ustadz/wali
}

export interface UserLog {
  id: string;
  timestamp: string;
  username: string;
  fullName: string;
  role: string;
  action: string;
  details?: string;
}

export interface TeacherAttendance {
  id: string;
  teacherName: string;
  date: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  timeIn?: string;
  timeOut?: string;
  notes?: string;
  lessonHour?: string;
  class?: string;
  subject?: string;
}

export interface TeachingJournal {
  id: string;
  teacherName: string;
  subject: string;
  class: string;
  date: string;
  topic: string;
  presentStudents: number;
  totalStudents: number;
  notes: string;
}

export interface PointCategory {
  id: string;
  type: 'Pelanggaran' | 'Prestasi';
  name: string; // e.g. "Terlambat Berjamaah", "Juara MTQ", "Membantu Kebersihan"
  points: number; // e.g. -10, +15
}

export interface PointRecord {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  date: string;
  type: 'Pelanggaran' | 'Prestasi';
  categoryName: string; // From PointCategory name
  points: number; // point change e.g. -5, +10
  notes?: string;
  teacherName: string;
}

export interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  date: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  notes?: string;
}



