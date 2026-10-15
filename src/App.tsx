import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar as CalendarIcon,
  Settings as SettingsIcon,
  Plus,
  Download,
  Key,
  Database,
  Sparkles,
  Clock,
  CheckCircle2,
  Trash2,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Menu,
} from 'lucide-react';
import { crmDb } from './db/crmDatabase';
import type { Contact, InteractionLog } from './types/crm';
import { markChatCompleted } from './services/contactService';
import { getUpcomingAlarms, getDailyDigestItems } from './services/notificationService';
import { DashboardView } from './components/crm/DashboardView';
import { NotionTableView } from './components/crm/NotionTableView';
import { ContactDetailModal } from './components/crm/ContactDetailModal';
import { AiDraftModal } from './components/crm/AiDraftModal';
import { ContactImportModal } from './components/crm/ContactImportModal';
import { EditContactModal } from './components/crm/EditContactModal';
import { NavigationDrawer } from './components/crm/NavigationDrawer';
import { DeviceEmulatorFrame } from './components/ui/DeviceEmulatorFrame';
import { BottomNavBar, NavTabItem } from './components/ui/BottomNavBar';
import { Toast, ToastType } from './components/ui/Toast';

const STORAGE_API_KEY = 'growSphere_gemini_api_key';

// Realistic sample contacts for instant demo seeding
const SEED_CONTACTS: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Ustadz Danu Hasan',
    phoneNumber: '+6281234567891',
    associations: ['Hoca', 'Ihvan'],
    isProfessional: false,
    followUpCycleDays: 7,
    lastContactedDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], // 10 days ago (overdue)
    nextSpecificFollowUp: null,
    metContext: 'Kajian Rutin Masjid Al-Ikhlas',
    lastUpdateNotes: 'Sedang mempersiapkan materi kajian kitab hadits Arbain',
    possibleFollowUpTopic: 'Menanyakan kabar kesehatan dan kitab kajian pekan depan',
  },
  {
    name: 'Bunda Sarah',
    phoneNumber: '+6281234567892',
    associations: ['Keluarga'],
    isProfessional: false,
    followUpCycleDays: 5,
    lastContactedDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // 2 days ago (aman)
    nextSpecificFollowUp: null,
    metContext: 'Keluarga besar pihak Ibu',
    lastUpdateNotes: 'Kabar keluarga sehat, cucu baru masuk TK',
    possibleFollowUpTopic: 'Kirim kabar anak-anak dan silaturahmi akhir pekan',
  },
  {
    name: 'dr. Farhan Rizki',
    phoneNumber: '+6281234567893',
    associations: ['Profesional', 'Teman'],
    isProfessional: true,
    followUpCycleDays: 30,
    lastContactedDate: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0], // 45 days ago (overdue)
    nextSpecificFollowUp: null,
    metContext: 'Konferensi Medika Nusantara Bandung',
    lastUpdateNotes: 'Baru menyelesaikan residensi spesialis',
    possibleFollowUpTopic: 'Diskusi kolaborasi seminar kesehatan masyarakat',
  },
  {
    name: 'Ahmad Fauzi',
    phoneNumber: '+6281234567894',
    associations: ['Ihvan', 'Teman'],
    isProfessional: false,
    followUpCycleDays: 14,
    lastContactedDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    nextSpecificFollowUp: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Besok (alarm target)
    metContext: 'Halaqah Pekanan & Alumni Kampus',
    lastUpdateNotes: 'Baru pindah rumah di area BSD',
    possibleFollowUpTopic: 'Konfirmasi kehadiran agenda rihlah akhir pekan',
  },
  {
    name: 'Emre Yilmaz',
    phoneNumber: '+905551234567',
    associations: ['Hoca', 'Zahiri'],
    isProfessional: false,
    followUpCycleDays: 21,
    lastContactedDate: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0], // 28 days ago (overdue)
    nextSpecificFollowUp: null,
    metContext: 'Pertukaran Budaya & Studi di Istanbul',
    lastUpdateNotes: 'Aktif mengajar di yayasan sosial',
    possibleFollowUpTopic: 'Silaturahmi dan menanyakan kabar kursus bahasa Turki',
  },
];

export const App: React.FC = () => {
  // Navigation State: 'home' | 'contacts' | 'calendar' | 'settings'
  const [activeTab, setActiveTab] = useState<string>('home');

  // Database Entities State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<InteractionLog[]>([]);
  const [interactionsCount, setInteractionsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Modals State
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [draftContact, setDraftContact] = useState<Contact | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Notion Table View search state when on 'contacts' tab
  const [contactsSearch, setContactsSearch] = useState<string>('');

  // Toast Notification State
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Settings State: Gemini API Key
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isApiKeySaved, setIsApiKeySaved] = useState<boolean>(false);

  // Show Toast helper
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // Auto-hide toast after 3.5s
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, hideToast]);

  // Load API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_API_KEY) || localStorage.getItem('gemini_api_key') || '';
    if (saved) {
      setApiKey(saved);
      setApiKeyInput(saved);
      setIsApiKeySaved(true);
    }
  }, []);

  // Reactive DB refresh function
  const refreshData = useCallback(async () => {
    try {
      const allContacts = await crmDb.contacts.toArray();
      setContacts(allContacts);
      const allInteractions = await crmDb.interactions.toArray();
      setInteractions(allInteractions);
      setInteractionsCount(allInteractions.length);
    } catch (err) {
      console.error('Failed to load contacts from database', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Computed notifications for badge
  const upcomingAlarms = useMemo(() => {
    return getUpcomingAlarms(contacts, 48);
  }, [contacts]);

  const dailyDigest = useMemo(() => {
    return getDailyDigestItems(contacts);
  }, [contacts]);

  // Tab definitions with dynamic badge
  const navTabs: NavTabItem[] = useMemo(
    () => [
      { id: 'home', label: 'Beranda', icon: <LayoutDashboard size={20} /> },
      { id: 'contacts', label: 'Kontak', icon: <Users size={20} /> },
      {
        id: 'calendar',
        label: 'Jadwal',
        icon: <CalendarIcon size={20} />,
        badge: upcomingAlarms.length > 0 ? upcomingAlarms.length : undefined,
      },
      { id: 'settings', label: 'Pengaturan', icon: <SettingsIcon size={20} /> },
    ],
    [upcomingAlarms.length]
  );

  // Contact Handlers
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditContact = (contact: Contact) => {
    setSelectedContact(null);
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  const handleSaveContact = async (contactData: Partial<Contact>) => {
    try {
      const nowIso = new Date().toISOString();
      if (editingContact && editingContact.id) {
        await crmDb.contacts.update(editingContact.id, {
          ...contactData,
          updatedAt: nowIso,
        });
        showToast(`Kontak ${contactData.name || editingContact.name} diperbarui`, 'success');
      } else {
        const newContact: Contact = {
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `c_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: (contactData.name || '').trim(),
          phoneNumber: (contactData.phoneNumber || '').trim(),
          associations:
            contactData.associations && contactData.associations.length > 0
              ? contactData.associations
              : ['Teman'],
          isProfessional: contactData.isProfessional ?? false,
          lastContactedDate: contactData.lastContactedDate || null,
          followUpCycleDays: contactData.followUpCycleDays || 15,
          nextSpecificFollowUp: contactData.nextSpecificFollowUp || null,
          metContext: contactData.metContext || '',
          lastUpdateNotes: contactData.lastUpdateNotes || '',
          possibleFollowUpTopic: contactData.possibleFollowUpTopic || '',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await crmDb.contacts.add(newContact);
        showToast(`Kontak ${newContact.name} berhasil ditambahkan`, 'success');
      }
      await refreshData();
      setIsEditModalOpen(false);
      setEditingContact(null);
    } catch (err) {
      console.error('Failed to save contact', err);
      showToast('Gagal menyimpan kontak', 'error');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await crmDb.contacts.delete(contactId);
      await crmDb.interactions.where('contactId').equals(contactId).delete();
      await refreshData();
      setIsEditModalOpen(false);
      setEditingContact(null);
      setSelectedContact(null);
      showToast('Kontak berhasil dihapus', 'info');
    } catch (err) {
      console.error('Failed to delete contact', err);
      showToast('Gagal menghapus kontak', 'error');
    }
  };

  const handleLogChat = async (contact: Contact, notes?: string) => {
    try {
      await markChatCompleted(contact.id, notes || 'Selesai berinteraksi via WhatsApp');
      await refreshData();
      showToast(`Silaturahmi dengan ${contact.name} dicatat!`, 'success');
    } catch (err) {
      console.error('Failed to log chat', err);
      showToast('Gagal mencatat interaksi', 'error');
    }
  };

  // Handle direct inline update for ContactDetailModal
  const handleUpdateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      const nowIso = new Date().toISOString();
      await crmDb.contacts.update(contactId, {
        ...updates,
        updatedAt: nowIso,
      });
      await refreshData();
      setSelectedContact((prev) => {
        if (prev && prev.id === contactId) {
          return {
            ...prev,
            ...updates,
            updatedAt: nowIso,
          };
        }
        return prev;
      });
      showToast('Kontak berhasil diperbarui', 'success');
    } catch (err) {
      console.error('Failed to update contact inline', err);
      showToast('Gagal memperbarui kontak', 'error');
    }
  };

  // Export full CRM database to JSON backup file
  const handleExportBackup = async () => {
    try {
      const allContacts = await crmDb.contacts.toArray();
      const allInteractions = await crmDb.interactions.toArray();
      const backupData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        contacts: allContacts,
        interactions: allInteractions,
      };
      const jsonString = JSON.stringify(backupData, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `growsphere-backup-${dateStr}.json`;

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Backup berhasil diekspor (${allContacts.length} kontak)`, 'success');
    } catch (err) {
      console.error('Failed to export backup', err);
      showToast('Gagal mengekspor data backup', 'error');
    }
  };

  // Import CRM database from JSON backup file
  const handleImportBackup = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Format file backup JSON tidak valid');
      }
      const incomingContacts: Contact[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.contacts)
        ? parsed.contacts
        : [];
      const incomingInteractions: InteractionLog[] = Array.isArray(parsed.interactions)
        ? parsed.interactions
        : [];

      if (incomingContacts.length === 0 && incomingInteractions.length === 0) {
        throw new Error('Tidak ada data kontak atau interaksi dalam file backup');
      }

      for (const c of incomingContacts) {
        if (c && c.id) {
          await crmDb.contacts.put(c);
        }
      }
      for (const log of incomingInteractions) {
        if (log && log.id) {
          await crmDb.interactions.put(log);
        }
      }

      await refreshData();
      showToast(`Berhasil memulihkan ${incomingContacts.length} kontak dari backup!`, 'success');
    } catch (err: any) {
      console.error('Failed to import backup', err);
      showToast(err?.message || 'Gagal mengimpor file backup', 'error');
    }
  };

  // Handle drawer filter shortcut selection
  const handleDrawerSelectFilter = (filterType: 'all' | 'overdue' | 'week' | 'never_contacted') => {
    setIsDrawerOpen(false);
    if (filterType === 'all') {
      setActiveTab('home');
    } else if (filterType === 'overdue') {
      setActiveTab('home');
    } else if (filterType === 'week') {
      setActiveTab('calendar');
    } else if (filterType === 'never_contacted') {
      setActiveTab('contacts');
    }
  };

  // Seed Demo Contacts
  const handleSeedContacts = async () => {
    try {
      const nowIso = new Date().toISOString();
      for (const item of SEED_CONTACTS) {
        const existing = await crmDb.contacts.where('phoneNumber').equals(item.phoneNumber).first();
        if (!existing) {
          await crmDb.contacts.add({
            ...item,
            id:
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `seed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      }
      await refreshData();
      showToast('Data kontak contoh berhasil di-seed!', 'success');
    } catch (err) {
      console.error('Failed to seed contacts', err);
      showToast('Gagal memuat data contoh', 'error');
    }
  };

  // Reset Database
  const handleResetData = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh data kontak dan riwayat CRM? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        await crmDb.contacts.clear();
        await crmDb.interactions.clear();
        await refreshData();
        showToast('Basis data CRM berhasil direset', 'info');
      } catch (err) {
        console.error('Failed to reset database', err);
        showToast('Gagal mereset database', 'error');
      }
    }
  };

  // Save Gemini API Key
  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_API_KEY, trimmed);
      setApiKey(trimmed);
      setIsApiKeySaved(true);
      showToast('Gemini API Key berhasil disimpan!', 'success');
    } else {
      localStorage.removeItem(STORAGE_API_KEY);
      setApiKey('');
      setIsApiKeySaved(false);
      showToast('Gemini API Key dihapus (menggunakan template bawaan)', 'info');
    }
  };

  // Filtered contacts for 'contacts' tab (Notion table)
  const filteredNotionContacts = useMemo(() => {
    const q = contactsSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        (c.possibleFollowUpTopic || '').toLowerCase().includes(q) ||
        c.associations.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [contacts, contactsSearch]);

  return (
    <DeviceEmulatorFrame>
      <div className="min-h-screen bg-surface flex flex-col font-sans pb-20 selection:bg-[#2F54EB] selection:text-white">
        {/* Top Application Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label="Buka Menu Analitik"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-[#2F54EB] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                GS
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  GrowSphere
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 font-medium">
                  Personal Relationship CRM
                </span>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                aria-label="Impor Kontak Telepon"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Impor HP</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddContact}
                aria-label="Tambah Kontak Baru"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#2F54EB] hover:bg-blue-700 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kontak</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Tab Content */}
        <main className="flex-1 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#2F54EB]" />
              <p className="text-sm font-medium">Memuat data relasi CRM...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: HOME / DASHBOARD */}
              {(activeTab === 'home' || activeTab === 'dashboard') && (
                <DashboardView
                  contacts={contacts}
                  onImportClick={() => setIsImportOpen(true)}
                  onAddContactClick={handleOpenAddContact}
                  onSelectContact={(c) => setSelectedContact(c)}
                  onQuickWhatsApp={(c) => setDraftContact(c)}
                  onLogChat={(c) => handleLogChat(c)}
                  onOpenMenu={() => setIsDrawerOpen(true)}
                />
              )}

            {/* TAB 2: CONTACTS (Notion Table View) */}
            {activeTab === 'contacts' && (
              <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#2F54EB]" />
                      <span>Semua Kontak (Tampilan Notion)</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Kelola 10 properti schema relasi lengkap dalam format tabel intuitif
                    </p>
                  </div>

                  {/* Search box for Notion table */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={contactsSearch}
                      onChange={(e) => setContactsSearch(e.target.value)}
                      placeholder="Cari dalam tabel..."
                      className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2F54EB]"
                    />
                  </div>
                </div>

                <NotionTableView
                  contacts={filteredNotionContacts}
                  onSelectContact={(c) => setSelectedContact(c)}
                  onQuickWhatsApp={(c) => setDraftContact(c)}
                  onLogChat={(c) => handleLogChat(c)}
                />
              </div>
            )}

            {/* TAB 3: CALENDAR & ALARMS */}
            {(activeTab === 'calendar' || activeTab === 'schedules') && (
              <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#2F54EB]" />
                    <span>Jadwal & Pengingat Silaturahmi</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Alarm follow-up spesifik dan rangkuman harian relasi yang perlu disapa
                  </p>
                </div>

                {/* Section 1: Upcoming Follow-up Alarms */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Alarm Target Terdekat ({upcomingAlarms.length})</span>
                    </h3>
                  </div>

                  {upcomingAlarms.length === 0 ? (
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                      Tidak ada alarm follow-up terjadwal dalam 48 jam ke depan.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {upcomingAlarms.map((alarm, idx) => (
                        <div
                          key={`${alarm.contactId}-${idx}`}
                          className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-900">
                                {alarm.contactName}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                {alarm.scheduledDate}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {alarm.message}
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                const target = contacts.find((c) => c.id === alarm.contactId);
                                if (target) setDraftContact(target);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Sapa WA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const target = contacts.find((c) => c.id === alarm.contactId);
                                if (target) handleLogChat(target);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tandai Selesai</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Section 2: Daily Digest (Overdue Contacts) */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Rangkuman Silaturahmi Hari Ini ({dailyDigest.totalOverdue})</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">{dailyDigest.date}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <p className="text-xs font-medium text-slate-700 mb-3">
                      {dailyDigest.digestSummary}
                    </p>

                    {dailyDigest.contacts.length === 0 ? (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Alhamdulillah, tidak ada kontak yang jatuh tempo hari ini!</span>
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                        {dailyDigest.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="py-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {contact.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                Siklus {contact.followUpCycleDays} hari • Terakhir:{' '}
                                {contact.lastContactedDate || 'Belum pernah'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setDraftContact(contact)}
                              className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2F54EB] text-white hover:bg-blue-700 shrink-0"
                            >
                              Sapa Sekarang
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* TAB 4: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-[#2F54EB]" />
                    <span>Pengaturan & Konfigurasi</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Konfigurasi Google Gemini AI, basis data offline, dan utilitas aplikasi
                  </p>
                </div>

                {/* Card 1: Gemini API Key */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          Google Gemini AI API Key
                        </h3>
                        <p className="text-xs text-slate-500">
                          Digunakan untuk menyusun draf pesan WhatsApp cerdas dengan etika santun
                        </p>
                      </div>
                    </div>
                    {isApiKeySaved && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Aktif
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Masukkan Google Gemini API Key (AIza...)"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Kunci API disimpan secara aman di browser lokal Anda.</span>
                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        className="px-4 py-1.5 rounded-full bg-[#2F54EB] text-white font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Simpan Kunci
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 2: Database Stats & Management */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2F54EB] flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Basis Data Offline (IndexedDB)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Penyimpanan Dexie lokal di perangkat Anda (100% aman & privat)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="block text-xl font-extrabold text-slate-800">
                        {contacts.length}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Total Relasi Tersimpan
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="block text-xl font-extrabold text-[#2F54EB]">
                        {interactionsCount}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Log Riwayat Interaksi
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 justify-between">
                    <button
                      type="button"
                      onClick={handleSeedContacts}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-[#2F54EB] hover:bg-blue-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Isi Data Contoh (Demo Seed)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetData}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Semua Data</span>
                    </button>
                  </div>
                </div>

                {/* Card 3: About Application */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-xs text-slate-600">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Tentang GrowSphere CRM v1.0.0
                  </h3>
                  <p>
                    Aplikasi manajemen hubungan personal (Personal Relationship CRM) yang dirancang khusus untuk merawat silaturahmi, memperkuat ukhuwah, dan menjaga relasi bermakna.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Didukung arsitektur Local-First IndexedDB Dexie, Tailwind CSS, Google Gemini 1.5 Flash, dan integrasi WhatsApp 1-Click.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Global Bottom Navigation Bar */}
      <BottomNavBar
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Global Modals */}
      <ContactDetailModal
        contact={selectedContact}
        isOpen={Boolean(selectedContact)}
        onClose={() => setSelectedContact(null)}
        onEditContact={handleOpenEditContact}
        onOpenAiDraft={(c) => {
          setSelectedContact(null);
          setDraftContact(c);
        }}
        onLogChat={(c) => handleLogChat(c)}
        onUpdateContact={handleUpdateContact}
      />

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contacts={contacts}
        interactions={interactions}
        onSelectFilter={handleDrawerSelectFilter}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      <AiDraftModal
        contact={draftContact}
        isOpen={Boolean(draftContact)}
        onClose={() => setDraftContact(null)}
        apiKey={apiKey}
        onLogChatCompleted={async (c) => {
          await handleLogChat(c);
          setDraftContact(null);
        }}
      />

      <ContactImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={(result) => {
          refreshData();
          showToast(
            `Berhasil mengimpor ${result.importedCount} kontak baru, ${result.updatedCount} diperbarui`,
            'success'
          );
        }}
      />

      <EditContactModal
        contact={editingContact}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        onDelete={handleDeleteContact}
      />

      {/* Global Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
    </DeviceEmulatorFrame>
  );
};
