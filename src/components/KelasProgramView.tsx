import React, { useState } from 'react';
import { Student, AppView } from '../types';

interface KelasProgramViewProps {
  classes: string[];
  setClasses: React.Dispatch<React.SetStateAction<string[]>>;
  programs: string[];
  setPrograms: React.Dispatch<React.SetStateAction<string[]>>;
  students: Student[];
  setStudents: (updated: Student[]) => void;
  setView?: (view: AppView) => void;
}

export default function KelasProgramView({
  classes,
  setClasses,
  programs,
  setPrograms,
  students,
  setStudents,
}: KelasProgramViewProps) {
  // Class edit state
  const [newClassInput, setNewClassInput] = useState('');
  const [editingClassIndex, setEditingClassIndex] = useState<number | null>(null);
  const [editingClassValue, setEditingClassValue] = useState('');

  // Program edit state
  const [newProgramInput, setNewProgramInput] = useState('');
  const [editingProgramIndex, setEditingProgramIndex] = useState<number | null>(null);
  const [editingProgramValue, setEditingProgramValue] = useState('');

  // ------------------------------------
  // CLASS HANDLERS
  // ------------------------------------
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassInput.trim();
    if (!trimmed) return;
    if (classes.includes(trimmed)) {
      alert('Nama kelas sudah ada!');
      return;
    }
    setClasses([...classes, trimmed]);
    setNewClassInput('');
  };

  const handleStartEditClass = (index: number, val: string) => {
    setEditingClassIndex(index);
    setEditingClassValue(val);
  };

  const handleSaveEditClass = (index: number) => {
    const oldValue = classes[index];
    const newValue = editingClassValue.trim();
    if (!newValue) return;
    if (oldValue === newValue) {
      setEditingClassIndex(null);
      return;
    }

    if (classes.includes(newValue) && classes.indexOf(newValue) !== index) {
      alert('Nama kelas sudah digunakan!');
      return;
    }

    // Update classes array
    const updatedClasses = [...classes];
    updatedClasses[index] = newValue;
    setClasses(updatedClasses);

    // Sync with student list
    const updatedStudents = students.map((student) => {
      if (student.class === oldValue) {
        return { ...student, class: newValue };
      }
      return student;
    });
    setStudents(updatedStudents);

    setEditingClassIndex(null);
    alert(`Berhasil memperbarui kelas "${oldValue}" menjadi "${newValue}". ${updatedStudents.filter(s => s.class === newValue).length} data santri telah disinkronisasikan.`);
  };

  const handleDeleteClass = (val: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kelas "${val}"? Santri di kelas ini akan dipindahkan ke "Belum Ditentukan".`)) {
      setClasses(classes.filter((c) => c !== val));

      // Sync with student list
      const updatedStudents = students.map((student) => {
        if (student.class === val) {
          return { ...student, class: 'Belum Ditentukan' };
        }
        return student;
      });
      setStudents(updatedStudents);
      alert(`Kelas "${val}" dihapus. Santri di kelas ini telah diperbarui.`);
    }
  };

  // ------------------------------------
  // PROGRAM HANDLERS
  // ------------------------------------
  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProgramInput.trim();
    if (!trimmed) return;
    if (programs.includes(trimmed)) {
      alert('Nama program sudah ada!');
      return;
    }
    setPrograms([...programs, trimmed]);
    setNewProgramInput('');
  };

  const handleStartEditProgram = (index: number, val: string) => {
    setEditingProgramIndex(index);
    setEditingProgramValue(val);
  };

  const handleSaveEditProgram = (index: number) => {
    const oldValue = programs[index];
    const newValue = editingProgramValue.trim();
    if (!newValue) return;
    if (oldValue === newValue) {
      setEditingProgramIndex(null);
      return;
    }

    if (programs.includes(newValue) && programs.indexOf(newValue) !== index) {
      alert('Nama program sudah digunakan!');
      return;
    }

    // Update programs array
    const updatedPrograms = [...programs];
    updatedPrograms[index] = newValue;
    setPrograms(updatedPrograms);

    // Sync with student list
    const updatedStudents = students.map((student) => {
      if (student.program === oldValue) {
        return { ...student, program: newValue as any };
      }
      return student;
    });
    setStudents(updatedStudents);

    setEditingProgramIndex(null);
    alert(`Berhasil memperbarui program "${oldValue}" menjadi "${newValue}". ${updatedStudents.filter(s => s.program === newValue).length} data santri telah disinkronisasikan.`);
  };

  const handleDeleteProgram = (val: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus program "${val}"? Santri di program ini akan dipindahkan ke "Pondok".`)) {
      setPrograms(programs.filter((p) => p !== val));

      // Sync with student list
      const updatedStudents = students.map((student) => {
        if (student.program === val) {
          return { ...student, program: 'Pondok' as any };
        }
        return student;
      });
      setStudents(updatedStudents);
      alert(`Program "${val}" dihapus. Santri di program ini telah disinkronisasikan ke program "Pondok".`);
    }
  };

  // Helper to count students
  const countStudentsInClass = (className: string) => {
    return students.filter((s) => s.class === className).length;
  };

  const countStudentsInProgram = (progName: string) => {
    return students.filter((s) => s.program === progName).length;
  };

  return (
    <div className="space-y-section-gap font-sans text-xs text-left animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Manajemen Kelas &amp; Program</h1>
        <p className="text-on-surface-variant text-xs mt-1">
          Kelola daftar kelas dan program jenjang pendidikan santri. Semua perubahan nama akan langsung disinkronkan ke database santri secara realtime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* PANEL KELAS */}
        <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3 mb-4">
              <span className="material-symbols-outlined text-primary text-[22px]">class</span>
              <div>
                <h3 className="font-display text-sm font-bold text-primary">Daftar Kelas</h3>
                <p className="text-[10px] text-on-surface-variant">Atur pengelompokan kelas KBM santri</p>
              </div>
            </div>

            {/* Form Tambah Kelas */}
            <form onSubmit={handleAddClass} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nama Kelas Baru (contoh: 12 IPA 2)"
                value={newClassInput}
                onChange={(e) => setNewClassInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Tambah</span>
              </button>
            </form>

            {/* List of classes */}
            <div className="divide-y divide-outline-variant/30 max-h-96 overflow-y-auto pr-1">
              {classes.map((cls, idx) => {
                const count = countStudentsInClass(cls);
                const isEditing = editingClassIndex === idx;

                return (
                  <div key={cls + idx} className="py-3 flex items-center justify-between gap-3 hover:bg-surface-container-low/30 px-2 rounded-lg transition-colors">
                    {isEditing ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingClassValue}
                          onChange={(e) => setEditingClassValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 border border-outline-variant rounded bg-surface font-semibold text-primary"
                        />
                        <button
                          onClick={() => handleSaveEditClass(idx)}
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                          title="Simpan"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                        <button
                          onClick={() => setEditingClassIndex(null)}
                          className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded cursor-pointer"
                          title="Batal"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-bold text-primary text-xs">{cls}</span>
                          <span className="ml-2.5 inline-block bg-primary/10 text-primary font-bold text-[9px] px-2 py-0.5 rounded-full">
                            {count} Santri
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditClass(idx, cls)}
                            className="p-1.5 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded cursor-pointer transition-colors"
                            title="Edit nama kelas"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls)}
                            className="p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-error rounded cursor-pointer transition-colors"
                            title="Hapus kelas"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL PROGRAM */}
        <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3 mb-4">
              <span className="material-symbols-outlined text-primary text-[22px]">category</span>
              <div>
                <h3 className="font-display text-sm font-bold text-primary">Daftar Program</h3>
                <p className="text-[10px] text-on-surface-variant">Jenjang pendidikan santri (Pondok, Madrasah, dll)</p>
              </div>
            </div>

            {/* Form Tambah Program */}
            <form onSubmit={handleAddProgram} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nama Program Baru (contoh: Tahfidz Khusus)"
                value={newProgramInput}
                onChange={(e) => setNewProgramInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Tambah</span>
              </button>
            </form>

            {/* List of programs */}
            <div className="divide-y divide-outline-variant/30 max-h-96 overflow-y-auto pr-1">
              {programs.map((prog, idx) => {
                const count = countStudentsInProgram(prog);
                const isEditing = editingProgramIndex === idx;

                return (
                  <div key={prog + idx} className="py-3 flex items-center justify-between gap-3 hover:bg-surface-container-low/30 px-2 rounded-lg transition-colors">
                    {isEditing ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingProgramValue}
                          onChange={(e) => setEditingProgramValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 border border-outline-variant rounded bg-surface font-semibold text-primary"
                        />
                        <button
                          onClick={() => handleSaveEditProgram(idx)}
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                          title="Simpan"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                        <button
                          onClick={() => setEditingProgramIndex(null)}
                          className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded cursor-pointer"
                          title="Batal"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-bold text-primary text-xs">{prog}</span>
                          <span className="ml-2.5 inline-block bg-primary/10 text-primary font-bold text-[9px] px-2 py-0.5 rounded-full">
                            {count} Santri
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditProgram(idx, prog)}
                            className="p-1.5 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded cursor-pointer transition-colors"
                            title="Edit nama program"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProgram(prog)}
                            className="p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-error rounded cursor-pointer transition-colors"
                            title="Hapus program"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
