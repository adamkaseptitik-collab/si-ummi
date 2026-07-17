import { AppView, UserRole, UserAccount } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  userRole: UserRole;
  setRole: (role: UserRole) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout?: () => void;
  currentUser?: UserAccount | null;
}

export default function Sidebar({
  currentView,
  setView,
  userRole,
  setRole,
  isOpen,
  setIsOpen,
  onLogout,
  currentUser,
}: SidebarProps) {
  const menuItems = [
    { view: 'dashboard' as AppView, label: 'Dashboard', icon: 'dashboard' },
    { view: 'students' as AppView, label: 'Data Santri', icon: 'group' },
    { view: 'kelas_program' as AppView, label: 'Kelas & Program', icon: 'category' },
    { view: 'tahfidz_input' as AppView, label: 'Input Setoran', icon: 'menu_book' },
    { view: 'laporan_pencapaian' as AppView, label: 'Laporan Pencapaian', icon: 'workspace_premium' },
    { view: 'catatan_poin' as AppView, label: 'Catatan Poin', icon: 'stars' },
    { view: 'akademik' as AppView, label: 'Akademik', icon: 'school' },
    { view: 'penilaian_ujian' as AppView, label: 'Penilaian Ujian', icon: 'rule' },
    { view: 'absensi_pengajar' as AppView, label: 'Absensi', icon: 'how_to_reg' },
    { view: 'laporan' as AppView, label: 'Laporan', icon: 'description' },
    { view: 'laporan_pengajar' as AppView, label: 'Laporan Pengajar', icon: 'assignment' },
    { view: 'data_pengajar' as AppView, label: 'Data Pengajar', icon: 'badge' },
    { view: 'pengaturan' as AppView, label: 'Pengaturan', icon: 'settings' },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    // 1. If we have custom permitted views for this specific user, use them as absolute truth!
    if (currentUser?.permittedViews && currentUser.permittedViews.length > 0) {
      const checkViews: string[] = [item.view];
      if (item.view === 'laporan_pencapaian') checkViews.push('tahfidz_history');
      if (item.view === 'catatan_poin') checkViews.push('poin_kedisiplinan');
      return checkViews.some((v) => currentUser.permittedViews!.includes(v));
    }

    // 2. Otherwise fallback to the role based defaults
    if (userRole === 'super_admin' || currentUser?.role === 'super_admin') {
      return true;
    }
    if (userRole === 'wali_santri') {
      return false; // Wali Santri only gets Portal Madrasah
    }
    if (userRole === 'ustadz') {
      // Ustadz gets access to standard teacher and student tracking views
      const ustadzViews = [
        'dashboard',
        'students',
        'tahfidz_input',
        'laporan_pencapaian',
        'catatan_poin',
        'penilaian_ujian',
        'absensi_pengajar'
      ];
      return ustadzViews.includes(item.view);
    }
    return true;
  });

  if (userRole === 'ustadz' || userRole === 'wali_santri' || (userRole === 'super_admin' && currentUser?.permittedViews?.includes('student_portal'))) {
    const isPermitted = currentUser?.permittedViews && currentUser.permittedViews.length > 0
      ? currentUser.permittedViews.includes('student_portal')
      : true;

    if (isPermitted && !filteredMenuItems.some(item => item.view === 'student_portal')) {
      filteredMenuItems.push({
        view: 'student_portal' as AppView,
        label: 'Portal Madrasah',
        icon: 'door_open',
      });
    }
  }

  const handleRoleToggle = () => {
    if (userRole === 'super_admin') {
      setRole('wali_santri');
      setView('student_portal'); // parent role goes straight to student portal
    } else if (userRole === 'wali_santri') {
      setRole('ustadz');
      setView('student_portal');
    } else {
      setRole('super_admin');
      setView('dashboard');
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'super_admin': return 'Super Admin';
      case 'wali_santri': return 'Wali Santri';
      case 'ustadz': return 'Ustadz / Pengajar';
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'super_admin': return 'admin_panel_settings';
      case 'wali_santri': return 'family_history';
      case 'ustadz': return 'record_voice_over';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 bg-[#003527]/40 backdrop-blur-xs z-40 md:hidden print:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Drawer */}
      <aside
        id="sidebar-container"
        className={`fixed left-0 top-0 h-screen w-[280px] bg-primary text-on-primary border-r border-outline-variant/30 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0 border border-primary-fixed/20 shadow-xs">
              <span className="material-symbols-outlined text-primary text-[24px] font-bold">mosque</span>
            </div>
            <div>
              <h1 className="font-display text-[16px] font-bold leading-tight tracking-tight text-white uppercase">
                Sistem Informasi Ummi
              </h1>
              <p className="font-sans text-[11px] text-on-primary-container uppercase tracking-wider mt-0.5">
                Sistem Informasi Terpadu
              </p>
            </div>
          </div>

          {/* Active Role Badge */}
          <div className="bg-on-primary-fixed-variant/20 border border-outline-variant/20 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                {getRoleIcon()}
              </span>
              <div className="text-left">
                <span className="block text-[10px] text-on-primary/60 uppercase tracking-wider leading-none">Akses Aktif</span>
                <span className="font-sans text-xs font-semibold text-white leading-normal">
                  {getRoleLabel()}
                </span>
              </div>
            </div>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                id={`sidebar-link-${item.view}`}
                onClick={() => {
                  setView(item.view);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-sans text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border-l-4 border-tertiary-fixed text-tertiary-fixed bg-on-primary-fixed-variant/20 font-bold'
                    : 'border-l-4 border-transparent text-on-primary/75 hover:text-on-primary hover:bg-on-primary-fixed-variant/10'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer with Log Out */}
        <div className="p-4 border-t border-outline-variant/20 mt-auto bg-[#002b20] space-y-2">
          {onLogout && (
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                  onLogout();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-950/40 text-red-100 hover:bg-red-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all font-sans text-xs font-semibold uppercase tracking-wider border border-red-900/20 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Log Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
