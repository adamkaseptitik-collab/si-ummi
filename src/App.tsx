import { useState, useEffect, useRef } from 'react';
import { AppView, UserRole, Student, MemorizationRecord, TeacherAttendance, TeachingJournal, PointCategory, PointRecord, UserAccount, AcademicGrade, StudentAttendance, Teacher } from './types';
import { INITIAL_STUDENTS, INITIAL_MEMORIZATION, INITIAL_TEACHER_ATTENDANCE, INITIAL_TEACHING_JOURNALS, INITIAL_POINT_CATEGORIES, INITIAL_POINT_RECORDS } from './data';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import StudentListView from './components/StudentListView';
import StudentPortalView from './components/StudentPortalView';
import SetoranFormView from './components/SetoranFormView';
import { AkademikView, LaporanView, PengaturanView } from './components/OtherViews';
import AbsensiPengajarView from './components/AbsensiPengajarView';
import LaporanPengajarView from './components/LaporanPengajarView';
import LaporanPencapaianView from './components/LaporanPencapaianView';
import CatatanPoinView from './components/CatatanPoinView';
import KelasProgramView from './components/KelasProgramView';
import LoginScreen from './components/LoginScreen';
import TeacherListView from './components/TeacherListView';
import PenilaianUjianView from './components/PenilaianUjianView';

// Firebase imports
import { db, saveDocument, deleteDocument, listenCollection } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const cached = localStorage.getItem('siakad_logged_in_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [currentView, setView] = useState<AppView>('dashboard');
  const [userRole, setRole] = useState<UserRole>('super_admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync logged in user and update active role
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('siakad_logged_in_user', JSON.stringify(currentUser));
      setRole(currentUser.role);
    } else {
      localStorage.removeItem('siakad_logged_in_user');
    }
  }, [currentUser]);

  // Force student portal view for non-admin roles
  useEffect(() => {
    if (userRole === 'ustadz' || userRole === 'wali_santri') {
      setView('student_portal');
    }
  }, [userRole]);

  // Apply dark/light theme on startup
  useEffect(() => {
    const isDark = localStorage.getItem('siakad_dark_mode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load classes and programs from localStorage, fallback to initial mock data
  const [classes, setClasses] = useState<string[]>(() => {
    const cached = localStorage.getItem('siakad_classes');
    return cached ? JSON.parse(cached) : [
      '10 IPA 1',
      '10 MIPA A',
      '10 IPS B',
      '11 MIPA A',
      '11A',
      '11C',
      '12B',
      '9A'
    ];
  });

  const [programs, setPrograms] = useState<string[]>(() => {
    const cached = localStorage.getItem('siakad_programs');
    return cached ? JSON.parse(cached) : [
      'Pondok',
      'Madrasah'
    ];
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const cached = localStorage.getItem('siakad_students');
    return cached ? JSON.parse(cached) : INITIAL_STUDENTS;
  });

  const [records, setRecords] = useState<MemorizationRecord[]>(() => {
    const cached = localStorage.getItem('siakad_memorization');
    return cached ? JSON.parse(cached) : INITIAL_MEMORIZATION;
  });

  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>(() => {
    const cached = localStorage.getItem('siakad_teacher_attendance');
    return cached ? JSON.parse(cached) : INITIAL_TEACHER_ATTENDANCE;
  });

  const [teachingJournals, setTeachingJournals] = useState<TeachingJournal[]>(() => {
    const cached = localStorage.getItem('siakad_teaching_journals');
    return cached ? JSON.parse(cached) : INITIAL_TEACHING_JOURNALS;
  });

  const [pointCategories, setPointCategories] = useState<PointCategory[]>(() => {
    const cached = localStorage.getItem('siakad_point_categories');
    return cached ? JSON.parse(cached) : INITIAL_POINT_CATEGORIES;
  });

  const [pointRecords, setPointRecords] = useState<PointRecord[]>(() => {
    const cached = localStorage.getItem('siakad_point_records');
    return cached ? JSON.parse(cached) : INITIAL_POINT_RECORDS;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const cached = localStorage.getItem('siakad_teachers');
    return cached ? JSON.parse(cached) : [
      {
        id: 't_1',
        nip: '19840212001',
        name: 'Ust. Ahmad Baihaqi, S.Pd.I.',
        gender: 'Laki-laki',
        phone: '081234567890',
        email: 'ahmad.baihaqi@gmail.com',
        subject: 'Aqidah Akhlaq',
        status: 'Aktif',
        address: 'Sumber, Cirebon',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60'
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
        address: 'Kedawung, Cirebon',
        photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=60'
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
        address: 'Weru, Cirebon',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60'
      }
    ];
  });

  const [grades, setGrades] = useState<AcademicGrade[]>(() => {
    const cached = localStorage.getItem('siakad_academic_grades');
    return cached ? JSON.parse(cached) : [
      { id: 'g1', studentId: 's1', studentName: 'Ahmad Fathanah', class: '10 IPA 1', subjectCode: 'MD01', subjectName: 'Aqidah Akhlaq', assignmentScore: 85, utsScore: 90, uasScore: 92, finalScore: 89.3, grade: 'A', notes: 'Sangat baik pengetahuannya', date: '2026-07-16' },
      { id: 'g2', studentId: 's2', studentName: 'Ahmad Rizqi Maulana', class: '10 MIPA A', subjectCode: 'MD01', subjectName: 'Aqidah Akhlaq', assignmentScore: 80, utsScore: 85, uasScore: 82, finalScore: 82.6, grade: 'B', notes: 'Pertahankan prestasinya', date: '2026-07-16' },
      { id: 'g3', studentId: 's3', studentName: 'Siti Aisyah Azzahra', class: '10 IPS B', subjectCode: 'MD03', subjectName: 'Bahasa Arab (Nahwu)', assignmentScore: 95, utsScore: 92, uasScore: 90, finalScore: 92.1, grade: 'A', notes: 'Luar biasa pemahaman dars', date: '2026-07-16' }
    ];
  });

  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>(() => {
    const cached = localStorage.getItem('siakad_student_attendance');
    const todayStr = new Date().toISOString().split('T')[0];
    return cached ? JSON.parse(cached) : [
      { id: 'sa1', studentId: 's1', studentName: 'Ahmad Fathanah', class: '10 IPA 1', date: todayStr, status: 'Hadir', notes: 'Datang pagi' },
      { id: 'sa2', studentId: 's2', studentName: 'Ahmad Rizqi Maulana', class: '10 MIPA A', date: todayStr, status: 'Izin', notes: 'Sakit gigi' },
      { id: 'sa3', studentId: 's3', studentName: 'Siti Aisyah Azzahra', class: '10 IPS B', date: todayStr, status: 'Hadir' }
    ];
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const cached = localStorage.getItem('siakad_users');
    return cached ? JSON.parse(cached) : [
      { id: 'usr_1', fullName: 'KH. Abdullah, M.Pd.I', username: 'kiai_abdullah', password: 'admin123', email: 'kiai@madrasah.id', role: 'super_admin', status: 'Aktif', permittedViews: ['dashboard', 'students', 'kelas_program', 'tahfidz_input', 'tahfidz_history', 'absensi_pengajar', 'penilaian_ujian', 'poin_kedisiplinan', 'laporan', 'pengaturan', 'data_pengajar', 'laporan_pengajar'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCT6NXmNPs8fpwE88VxNJVMhwFUOQoNeheJsGxQ70-1Y5tYXP10y7dwfl43EW6J3tnUfqH3Mg5lMVkJGhiM11Pqjy-ufWSHFCQmzpRe9BlY5CdzpcnmdWPdH_JJ95B18EFcIfjBtXjSDayMkWX_0gSHiUzZJ3zbbcKemk9Ax77T6dFsYMJahcL7SHAOp7PGZ8EIv1tJZ7gZZQsraKNliWXlPtXW_FcFNDmPieof4P6L0Fu1f6_AKqU3' },
      { id: 'usr_2', fullName: 'Ust. Ahmad Baihaqi', username: 'ust_ahmad', password: 'ahmad123', email: 'ahmad@madrasah.id', role: 'ustadz', status: 'Aktif', permittedViews: ['dashboard', 'tahfidz_input', 'tahfidz_history', 'absensi_pengajar', 'penilaian_ujian', 'poin_kedisiplinan'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkLYXeLgpBsZWbBC8F6MHXFF40RID1YkqZxXrsP-H0Fbc2i6FRGU5MdMW47p6gSBNGUTFfcOxtK4ad4zdQb1uPKsU8QPZLRsw0N_eRN2nGl-jYeYqCnnYLH5ajiDH7hSrKl8YCSBLFTos7hWz65yS-Q6Pk7agAo3GUYYVPKihODvnjhD64eygg9QNugdZ4HPEsUlWvFJTOXyCv013c9pRr8AIf8RLXPJYoP9yC43dtDquPvx6b1Yyw' },
      { id: 'usr_3', fullName: 'Wali Ahmad Fathanah', username: 'wali_fathanah', password: 'wali123', email: 'wali.fathanah@gmail.com', role: 'wali_santri', status: 'Aktif', permittedViews: ['dashboard', 'tahfidz_history'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWm4KibatigPk2YlT4VSXuchCtAGmxn4rboR2upZPNUS_KrT-oNdadIaHBrvLzv3TjijYw3wHHerP4gUwuQcO7OOgvWY7SfUnMpw1iCO_2TP3L2Gm3YsXqdRmOWRxgsDoxO2ToruXaxrhbWfIwh8Z814Mx2uXq8IZPVa_qwOIPcv0fXdPLBg7klwYW8ENSObxGX2juxunP-LrC850vZB0HtUxW8KIroHw2WIUVGTBXrP32NyNWEg6g' },
    ];
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>('s1'); // Ahmad Fathanah as default
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  // References to keep listeners synchronized without re-registration
  const classesRef = useRef(classes);
  const programsRef = useRef(programs);
  const studentsRef = useRef(students);
  const recordsRef = useRef(records);
  const teacherAttendanceRef = useRef(teacherAttendance);
  const teachingJournalsRef = useRef(teachingJournals);
  const pointCategoriesRef = useRef(pointCategories);
  const pointRecordsRef = useRef(pointRecords);
  const gradesRef = useRef(grades);
  const studentAttendanceRef = useRef(studentAttendance);
  const usersRef = useRef(users);
  const teachersRef = useRef(teachers);

  useEffect(() => { classesRef.current = classes; }, [classes]);
  useEffect(() => { programsRef.current = programs; }, [programs]);
  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { recordsRef.current = records; }, [records]);
  useEffect(() => { teacherAttendanceRef.current = teacherAttendance; }, [teacherAttendance]);
  useEffect(() => { teachingJournalsRef.current = teachingJournals; }, [teachingJournals]);
  useEffect(() => { pointCategoriesRef.current = pointCategories; }, [pointCategories]);
  useEffect(() => { pointRecordsRef.current = pointRecords; }, [pointRecords]);
  useEffect(() => { gradesRef.current = grades; }, [grades]);
  useEffect(() => { studentAttendanceRef.current = studentAttendance; }, [studentAttendance]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { teachersRef.current = teachers; }, [teachers]);

  // Real-time Firestore synchronizer on startup
  useEffect(() => {
    // 1. Synchronize config (classes and programs)
    const configDocRef = doc(db, 'config', 'general');
    
    // Set up real-time listener immediately
    const unsubscribeConfig = onSnapshot(configDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.classes && JSON.stringify(data.classes) !== JSON.stringify(classesRef.current)) {
          setClasses(data.classes);
        }
        if (data.programs && JSON.stringify(data.programs) !== JSON.stringify(programsRef.current)) {
          setPrograms(data.programs);
        }
      }
    }, (error) => {
      console.warn("Config snapshot listener error (usually harmless if offline):", error);
    });

    const seedConfig = async () => {
      try {
        const snap = await getDoc(configDocRef);
        if (!snap.exists()) {
          await setDoc(configDocRef, {
            classes: [
              '10 IPA 1', '10 MIPA A', '10 IPS B', '11 MIPA A', '11A', '11C', '12B', '9A'
            ],
            programs: ['Pondok', 'Madrasah']
          });
        }
      } catch (error) {
        console.warn("Could not check or seed configuration from Firestore (harmless if offline):", error);
      }
    };

    seedConfig();

    // 2. Synchronize all other collections
    listenCollection<Student>('students', (data) => {
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      if (JSON.stringify(sorted) !== JSON.stringify(studentsRef.current)) {
        setStudents(sorted);
      }
    }, INITIAL_STUDENTS);

    listenCollection<MemorizationRecord>('memorization_records', (data) => {
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      if (JSON.stringify(sorted) !== JSON.stringify(recordsRef.current)) {
        setRecords(sorted);
      }
    }, INITIAL_MEMORIZATION);

    listenCollection<TeacherAttendance>('teacher_attendance', (data) => {
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      if (JSON.stringify(sorted) !== JSON.stringify(teacherAttendanceRef.current)) {
        setTeacherAttendance(sorted);
      }
    }, INITIAL_TEACHER_ATTENDANCE);

    listenCollection<TeachingJournal>('teaching_journals', (data) => {
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      if (JSON.stringify(sorted) !== JSON.stringify(teachingJournalsRef.current)) {
        setTeachingJournals(sorted);
      }
    }, INITIAL_TEACHING_JOURNALS);

    listenCollection<PointCategory>('point_categories', (data) => {
      if (JSON.stringify(data) !== JSON.stringify(pointCategoriesRef.current)) {
        setPointCategories(data);
      }
    }, INITIAL_POINT_CATEGORIES);

    listenCollection<PointRecord>('point_records', (data) => {
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      if (JSON.stringify(sorted) !== JSON.stringify(pointRecordsRef.current)) {
        setPointRecords(sorted);
      }
    }, INITIAL_POINT_RECORDS);

    listenCollection<AcademicGrade>('academic_grades', (data) => {
      if (JSON.stringify(data) !== JSON.stringify(gradesRef.current)) {
        setGrades(data);
      }
    }, [
      { id: 'g1', studentId: 's1', studentName: 'Ahmad Fathanah', class: '10 IPA 1', subjectCode: 'MD01', subjectName: 'Aqidah Akhlaq', assignmentScore: 85, utsScore: 90, uasScore: 92, finalScore: 89.3, grade: 'A', notes: 'Sangat baik pengetahuannya' },
      { id: 'g2', studentId: 's2', studentName: 'Ahmad Rizqi Maulana', class: '10 MIPA A', subjectCode: 'MD01', subjectName: 'Aqidah Akhlaq', assignmentScore: 80, utsScore: 85, uasScore: 82, finalScore: 82.6, grade: 'B', notes: 'Pertahankan prestasinya' },
      { id: 'g3', studentId: 's3', studentName: 'Siti Aisyah Azzahra', class: '10 IPS B', subjectCode: 'MD03', subjectName: 'Bahasa Arab (Nahwu)', assignmentScore: 95, utsScore: 92, uasScore: 90, finalScore: 92.1, grade: 'A', notes: 'Luar biasa pemahaman dars' }
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    listenCollection<StudentAttendance>('student_attendance', (data) => {
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      if (JSON.stringify(sorted) !== JSON.stringify(studentAttendanceRef.current)) {
        setStudentAttendance(sorted);
      }
    }, [
      { id: 'sa1', studentId: 's1', studentName: 'Ahmad Fathanah', class: '10 IPA 1', date: todayStr, status: 'Hadir', notes: 'Datang pagi' },
      { id: 'sa2', studentId: 's2', studentName: 'Ahmad Rizqi Maulana', class: '10 MIPA A', date: todayStr, status: 'Izin', notes: 'Sakit gigi' },
      { id: 'sa3', studentId: 's3', studentName: 'Siti Aisyah Azzahra', class: '10 IPS B', date: todayStr, status: 'Hadir' }
    ]);

    listenCollection<UserAccount>('users', (data) => {
      if (JSON.stringify(data) !== JSON.stringify(usersRef.current)) {
        setUsers(data);
        localStorage.setItem('siakad_users', JSON.stringify(data));
      }
    }, [
      { id: 'usr_1', fullName: 'KH. Abdullah, M.Pd.I', username: 'kiai_abdullah', password: 'admin123', email: 'kiai@madrasah.id', role: 'super_admin', status: 'Aktif', permittedViews: ['dashboard', 'students', 'kelas_program', 'tahfidz_input', 'tahfidz_history', 'absensi_pengajar', 'penilaian_ujian', 'poin_kedisiplinan', 'laporan', 'pengaturan', 'data_pengajar', 'laporan_pengajar'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCT6NXmNPs8fpwE88VxNJVMhwFUOQoNeheJsGxQ70-1Y5tYXP10y7dwfl43EW6J3tnUfqH3Mg5lMVkJGhiM11Pqjy-ufWSHFCQmzpRe9BlY5CdzpcnmdWPdH_JJ95B18EFcIfjBtXjSDayMkWX_0gSHiUzZJ3zbbcKemk9Ax77T6dFsYMJahcL7SHAOp7PGZ8EIv1tJZ7gZZQsraKNliWXlPtXW_FcFNDmPieof4P6L0Fu1f6_AKqU3' },
      { id: 'usr_2', fullName: 'Ust. Ahmad Baihaqi', username: 'ust_ahmad', password: 'ahmad123', email: 'ahmad@madrasah.id', role: 'ustadz', status: 'Aktif', permittedViews: ['dashboard', 'tahfidz_input', 'tahfidz_history', 'absensi_pengajar', 'penilaian_ujian', 'poin_kedisiplinan'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkLYXeLgpBsZWbBC8F6MHXFF40RID1YkqZxXrsP-H0Fbc2i6FRGU5MdMW47p6gSBNGUTFfcOxtK4ad4zdQb1uPKsU8QPZLRsw0N_eRN2nGl-jYeYqCnnYLH5ajiDH7hSrKl8YCSBLFTos7hWz65yS-Q6Pk7agAo3GUYYVPKihODvnjhD64eygg9QNugdZ4HPEsUlWvFJTOXyCv013c9pRr8AIf8RLXPJYoP9yC43dtDquPvx6b1Yyw' },
      { id: 'usr_3', fullName: 'Wali Ahmad Fathanah', username: 'wali_fathanah', password: 'wali123', email: 'wali.fathanah@gmail.com', role: 'wali_santri', status: 'Aktif', permittedViews: ['dashboard', 'tahfidz_history'], photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWm4KibatigPk2YlT4VSXuchCtAGmxn4rboR2upZPNUS_KrT-oNdadIaHBrvLzv3TjijYw3wHHerP4gUwuQcO7OOgvWY7SfUnMpw1iCO_2TP3L2Gm3YsXqdRmOWRxgsDoxO2ToruXaxrhbWfIwh8Z814Mx2uXq8IZPVa_qwOIPcv0fXdPLBg7klwYW8ENSObxGX2juxunP-LrC850vZB0HtUxW8KIroHw2WIUVGTBXrP32NyNWEg6g' },
    ]);

    listenCollection<Teacher>('teachers', (data) => {
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      if (JSON.stringify(sorted) !== JSON.stringify(teachersRef.current)) {
        setTeachers(sorted);
        localStorage.setItem('siakad_teachers', JSON.stringify(sorted));
      }
    }, [
      {
        id: 't_1',
        nip: '19840212001',
        name: 'Ust. Ahmad Baihaqi, S.Pd.I.',
        gender: 'Laki-laki',
        phone: '081234567890',
        email: 'ahmad.baihaqi@gmail.com',
        subject: 'Aqidah Akhlaq',
        status: 'Aktif',
        address: 'Sumber, Cirebon',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60'
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
        address: 'Kedawung, Cirebon',
        photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=60'
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
        address: 'Weru, Cirebon',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60'
      }
    ]);
  }, []);

  // Write-through synchronization wrappers to write updates directly to Firestore
  const handleUpdateClasses = async (updated: string[]) => {
    setClasses(updated);
    const configDocRef = doc(db, 'config', 'general');
    await setDoc(configDocRef, { classes: updated }, { merge: true });
  };

  const handleUpdatePrograms = async (updated: string[]) => {
    setPrograms(updated);
    const configDocRef = doc(db, 'config', 'general');
    await setDoc(configDocRef, { programs: updated }, { merge: true });
  };

  const handleUpdateStudents = async (updated: Student[]) => {
    setStudents(updated);
    updated.forEach(async (item) => {
      const existing = studentsRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('students', item.id, item);
      }
    });
    studentsRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('students', item.id);
      }
    });
  };

  const handleUpdateTeachers = async (updated: Teacher[]) => {
    setTeachers(updated);
    localStorage.setItem('siakad_teachers', JSON.stringify(updated));
    updated.forEach(async (item) => {
      const existing = teachersRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('teachers', item.id, item);
      }
    });
    teachersRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('teachers', item.id);
      }
    });
  };

  const handleUpdateRecords = async (updated: MemorizationRecord[]) => {
    setRecords(updated);
    updated.forEach(async (item) => {
      const existing = recordsRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('memorization_records', item.id, item);
      }
    });
    recordsRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('memorization_records', item.id);
      }
    });
  };

  const handleAddRecord = async (newRecord: MemorizationRecord) => {
    const updated = [newRecord, ...records];
    setRecords(updated);
    await saveDocument('memorization_records', newRecord.id, newRecord);
  };

  const handleUpdateTeacherAttendance = async (updated: TeacherAttendance[]) => {
    setTeacherAttendance(updated);
    updated.forEach(async (item) => {
      const existing = teacherAttendanceRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('teacher_attendance', item.id, item);
      }
    });
    teacherAttendanceRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('teacher_attendance', item.id);
      }
    });
  };

  const handleUpdateTeachingJournals = async (updated: TeachingJournal[]) => {
    setTeachingJournals(updated);
    updated.forEach(async (item) => {
      const existing = teachingJournalsRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('teaching_journals', item.id, item);
      }
    });
    teachingJournalsRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('teaching_journals', item.id);
      }
    });
  };

  const handleUpdatePointCategories = async (updated: PointCategory[]) => {
    setPointCategories(updated);
    updated.forEach(async (item) => {
      const existing = pointCategoriesRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('point_categories', item.id, item);
      }
    });
    pointCategoriesRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('point_categories', item.id);
      }
    });
  };

  const handleUpdatePointRecords = async (updated: PointRecord[]) => {
    setPointRecords(updated);
    updated.forEach(async (item) => {
      const existing = pointRecordsRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('point_records', item.id, item);
      }
    });
    pointRecordsRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('point_records', item.id);
      }
    });
  };

  const handleUpdateGrades = async (updated: AcademicGrade[]) => {
    setGrades(updated);
    updated.forEach(async (item) => {
      const existing = gradesRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('academic_grades', item.id, item);
      }
    });
    gradesRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('academic_grades', item.id);
      }
    });
  };

  const handleUpdateStudentAttendance = async (updated: StudentAttendance[]) => {
    setStudentAttendance(updated);
    updated.forEach(async (item) => {
      const existing = studentAttendanceRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('student_attendance', item.id, item);
      }
    });
    studentAttendanceRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('student_attendance', item.id);
      }
    });
  };

  const handleUpdateUsers = async (updated: UserAccount[]) => {
    setUsers(updated);
    updated.forEach(async (item) => {
      const existing = usersRef.current.find(x => x.id === item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        await saveDocument('users', item.id, item);
      }
    });
    usersRef.current.forEach(async (item) => {
      if (!updated.some(x => x.id === item.id)) {
        await deleteDocument('users', item.id);
      }
    });
  };

  // Keep localStorage sync as immediate fallback for offline/instant-load experience
  useEffect(() => {
    localStorage.setItem('siakad_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('siakad_programs', JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    localStorage.setItem('siakad_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('siakad_memorization', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('siakad_teacher_attendance', JSON.stringify(teacherAttendance));
  }, [teacherAttendance]);

  useEffect(() => {
    localStorage.setItem('siakad_teaching_journals', JSON.stringify(teachingJournals));
  }, [teachingJournals]);

  useEffect(() => {
    localStorage.setItem('siakad_point_categories', JSON.stringify(pointCategories));
  }, [pointCategories]);

  useEffect(() => {
    localStorage.setItem('siakad_point_records', JSON.stringify(pointRecords));
  }, [pointRecords]);

  useEffect(() => {
    localStorage.setItem('siakad_academic_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('siakad_student_attendance', JSON.stringify(studentAttendance));
  }, [studentAttendance]);

  useEffect(() => {
    localStorage.setItem('siakad_users', JSON.stringify(users));
  }, [users]);


  // Handle addition of a setoran record
  const handleCustomAddRecord = (newRecord: MemorizationRecord) => {
    handleAddRecord(newRecord);
  };

  // Handle updating student general metrics based on successful setoran
  const handleUpdateStudentStats = (
    studentId: string,
    juzCount: number,
    detail: string,
    score: number
  ) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        // Only update if the new juz count is higher or equal
        const newJuz = Math.max(s.tahfidzJuz, juzCount);
        // Calculate new moving average totalScore
        const newScore = Number(((s.totalScore * 4 + score) / 5).toFixed(1));
        return {
          ...s,
          tahfidzJuz: newJuz,
          tahfidzDetail: detail,
          totalScore: newScore,
        };
      }
      return s;
    });
    handleUpdateStudents(updated);
  };

  const getActiveStudent = () => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'SISTEM INFORMASI UMMI';
      case 'penilaian_ujian':
        return 'Penilaian Ujian';
      case 'students':
        return 'Data Santri';
      case 'tahfidz_input':
        return 'Input Setoran Hafalan';
      case 'student_portal':
        return 'Portal Wali Santri';
      case 'akademik':
        return 'Akademik';
      case 'keuangan':
        return 'Keuangan';
      case 'laporan':
        return 'Laporan';
      case 'pengaturan':
        return 'Pengaturan';
      case 'absensi_pengajar':
        return 'Absensi';
      case 'laporan_pengajar':
        return 'Jurnal & Laporan Mengajar';
      case 'laporan_pencapaian':
        return 'Laporan Pencapaian Hafalan';
      case 'kelas_program':
        return 'Manajemen Kelas & Program';
      case 'catatan_poin':
        return 'Catatan Poin Pelanggaran & Prestasi';
    }
  };

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setView(user.role === 'wali_santri' ? 'student_portal' : 'dashboard');
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        userRole={userRole}
        setRole={setRole}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={() => setCurrentUser(null)}
        currentUser={currentUser}
      />

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[280px] print:pl-0">
        {/* Top Header Navigation Bar */}
        <header className="flex justify-between items-center h-16 w-full px-6 sticky top-0 z-30 bg-white border-b border-outline-variant/30 shadow-2xs print:hidden">
          <div className="flex items-center gap-4">
            {/* Hamburger Mobile Menu Toggle Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-full hover:bg-surface-container-high text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <h2 className="font-display text-lg md:text-xl font-bold text-primary transition-all">
              {getViewTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Avatar & User Info */}
            <div className="flex items-center gap-3 ml-1">
              <div className="text-right hidden md:block">
                <span className="block text-xs font-bold text-primary leading-tight">{currentUser?.fullName}</span>
                <span className="block text-[10px] text-on-surface-variant uppercase font-bold leading-none mt-0.5">
                  {currentUser?.role === 'super_admin' ? 'Super Admin' : currentUser?.role === 'ustadz' ? 'Ustadz' : 'Wali Santri'}
                </span>
              </div>
              
              <div className="w-8.5 h-8.5 rounded-full border border-outline-variant/50 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all shadow-2xs">
                {currentUser?.photoUrl ? (
                  <img
                    alt={currentUser?.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    src={currentUser.photoUrl}
                  />
                ) : (
                  <div className="w-full h-full bg-secondary-fixed text-primary flex items-center justify-center font-bold text-xs">
                    {currentUser?.fullName ? currentUser.fullName.replace('KH. ', '').replace('Ust. ', '').substring(0, 2).toUpperCase() : 'AD'}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                    setCurrentUser(null);
                  }
                }}
                className="p-1.5 rounded-full hover:bg-red-50 text-on-surface-variant hover:text-red-700 transition-colors cursor-pointer flex items-center justify-center"
                title="Keluar (Log Out)"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Section Area Container */}
        <main className="flex-1 p-6 pb-12 max-w-7xl w-full mx-auto space-y-section-gap overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          {currentView === 'dashboard' && (
            <DashboardView
              students={students}
              records={records}
              currentUser={currentUser}
              setView={setView}
              setSelectedStudentId={setSelectedStudentId}
              classes={classes}
              onAddStudent={() => {
                setView('students');
                setAddStudentOpen(true);
              }}
            />
          )}

          {currentView === 'students' && (
            <StudentListView
              students={students}
              classes={classes}
              programs={programs}
              setView={setView}
              setSelectedStudentId={setSelectedStudentId}
              onUpdateStudents={handleUpdateStudents}
              addStudentOpen={addStudentOpen}
              setAddStudentOpen={setAddStudentOpen}
            />
          )}

          {currentView === 'kelas_program' && (
            <KelasProgramView
              classes={classes}
              setClasses={handleUpdateClasses}
              programs={programs}
              setPrograms={handleUpdatePrograms}
              students={students}
              setStudents={handleUpdateStudents}
              setView={setView}
            />
          )}

          {currentView === 'tahfidz_input' && (
            <SetoranFormView
              students={students}
              teachers={teachers}
              classes={classes}
              onAddRecord={handleAddRecord}
              onUpdateStudentStats={handleUpdateStudentStats}
              setView={setView}
            />
          )}

          {currentView === 'student_portal' && (
            <StudentPortalView
              student={getActiveStudent()}
              allStudents={students}
              records={records}
              pointRecords={pointRecords}
              grades={grades}
              studentAttendance={studentAttendance}
              onSelectStudent={setSelectedStudentId}
              setView={setView}
              userRole={userRole}
            />
          )}

          {currentView === 'akademik' && (
            <AkademikView 
              students={students} 
              classes={classes}
              programs={programs}
              teachers={teachers}
            />
          )}
          {currentView === 'laporan' && (
            <LaporanView 
              students={students} 
              classes={classes}
              programs={programs}
              records={records}
              pointRecords={pointRecords}
              attendance={teacherAttendance}
              studentAttendance={studentAttendance}
              grades={grades}
            />
          )}
          {currentView === 'penilaian_ujian' && (
            <PenilaianUjianView
              students={students}
              classes={classes}
              grades={grades}
              onUpdateGrades={handleUpdateGrades}
            />
          )}
          {currentView === 'pengaturan' && (
            <PengaturanView 
              students={students} 
              currentUser={currentUser} 
              onUpdateCurrentUser={setCurrentUser} 
              users={users}
              onUpdateUsers={handleUpdateUsers}
            />
          )}

          {currentView === 'absensi_pengajar' && (
            <AbsensiPengajarView
              attendance={teacherAttendance}
              onUpdateAttendance={handleUpdateTeacherAttendance}
              classes={classes}
              students={students}
              studentAttendance={studentAttendance}
              onUpdateStudentAttendance={handleUpdateStudentAttendance}
              teachers={teachers}
            />
          )}

          {currentView === 'laporan_pengajar' && (
            <LaporanPengajarView
              journals={teachingJournals}
              onAddJournal={(newJournal) => handleUpdateTeachingJournals([newJournal, ...teachingJournals])}
              onDeleteJournal={(id) => handleUpdateTeachingJournals(teachingJournals.filter((j) => j.id !== id))}
              classes={classes}
              teachers={teachers}
            />
          )}

          {currentView === 'laporan_pencapaian' && (
            <LaporanPencapaianView
              students={students}
              records={records}
              classes={classes}
              setView={setView}
              setSelectedStudentId={setSelectedStudentId}
              onDeleteRecord={(id) => handleUpdateRecords(records.filter((r) => r.id !== id))}
            />
          )}

          {currentView === 'catatan_poin' && (
            <CatatanPoinView
              students={students}
              classes={classes}
              categories={pointCategories}
              records={pointRecords}
              teachers={teachers}
              onAddRecord={(newRec) => handleUpdatePointRecords([newRec, ...pointRecords])}
              onDeleteRecord={(id) => handleUpdatePointRecords(pointRecords.filter((r) => r.id !== id))}
              onUpdateCategories={handleUpdatePointCategories}
              onUpdateStudents={handleUpdateStudents}
            />
          )}

          {currentView === 'data_pengajar' && (
            <TeacherListView
              teachers={teachers}
              onUpdateTeachers={handleUpdateTeachers}
            />
          )}
        </main>
      </div>
    </div>
  );
}
