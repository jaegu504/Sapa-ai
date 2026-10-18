import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Settings as SettingsIcon,
  Plus,
  Download,
  Key,
  Database,
  Sparkles,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Search,
  Menu,
  Smartphone,
  SunMoon,
  HelpCircle,
} from 'lucide-react';
import { OnboardingModal, ONBOARDING_STORAGE_KEY } from './components/onboarding/OnboardingModal';
import {
  RadarNavIcon,
  ContactsNavIcon,
  ScheduleNavIcon,
  SettingsNavIcon,
  AppleThemeIcon,
  VisionOsThemeIcon,
  SystemThemeIcon,
} from './components/ui/NavIcons';
import {
  initTheme,
  setThemePreference,
  getThemePreference,
  applyTheme,
  type ThemePreference,
} from './services/themeService';
import { crmDb } from './db/crmDatabase';
import type { Contact, InteractionLog, InteractionType } from './types/crm';
import { markChatCompleted } from './services/contactService';
import {
  initNotificationService,
  scheduleDailyMorningDigest,
  scheduleTargetedFollowUpAlarm,
  getUpcomingAlarms,
} from './services/notificationService';
import { calculateContactStatus, getDaysLeftOrOverdue } from './utils/status';
import sapaLogo from './assets/logo.png';
import { KinshipDashboardView } from './components/kinship/KinshipDashboardView';
import { KinshipContactDossierModal } from './components/kinship/KinshipContactDossierModal';
import { KinshipLogInteractionModal } from './components/kinship/KinshipLogInteractionModal';
import { KinshipNotificationsView } from './components/kinship/KinshipNotificationsView';
import { KinshipPhonebookSyncView } from './components/kinship/KinshipPhonebookSyncView';
import { CadenceBadge } from './components/kinship/CadenceBadge';
import { NotionTableView } from './components/crm/NotionTableView';
import { AiDraftModal } from './components/crm/AiDraftModal';
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

function getInitials(name: string): string {
  if (!name || !name.trim()) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

function getAssociationBadgeClass(assoc?: string): string {
  switch (assoc?.toLowerCase()) {
    case 'ihvan':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'hoca':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'keluarga':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'zahiri':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'teman':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'profesional':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export const App: React.FC = () => {
  // Navigation State: 'radar' | 'contacts' | 'notifications' | 'settings' (supports legacy 'home' & 'calendar')
  const [activeTab, setActiveTab] = useState<string>('radar');

  // Contacts view mode toggle in Tab 2: 'cards' | 'table'
  const [contactsViewMode, setContactsViewMode] = useState<'cards' | 'table'>('cards');

  // Database Entities State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<InteractionLog[]>([]);
  const [interactionsCount, setInteractionsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Modals State
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [logEncounterContact, setLogEncounterContact] = useState<Contact | null>(null);
  const [draftContact, setDraftContact] = useState<Contact | null>(null);
  const [isSyncOpen, setIsSyncOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // First-time Onboarding Tutorial State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  // Contacts search state
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

  // Initialize notification service on mount
  useEffect(() => {
    initNotificationService().catch((err) => {
      console.error('Failed to initialize notification service:', err);
    });
  }, []);

  // Register daily morning digest whenever contacts change
  useEffect(() => {
    if (contacts.length > 0) {
      scheduleDailyMorningDigest(contacts).catch((err) => {
        console.error('Failed to schedule daily morning digest:', err);
      });
    }
  }, [contacts]);

  // Computed notifications for badge
  const upcomingAlarms = useMemo(() => {
    return getUpcomingAlarms(contacts, 48);
  }, [contacts]);

  // Theme state: 'light' | 'dark' | 'system'
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => getThemePreference());

  // Initialize theme on mount
  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, []);

  const handleThemeChange = (newTheme: ThemePreference) => {
    setThemePreference(newTheme);
    setThemePreferenceState(newTheme);
    applyTheme(newTheme);
    showToast(
      `Tema diubah ke ${newTheme === 'light' ? 'Terang (iOS 18 Glass)' : newTheme === 'dark' ? 'Gelap (VisionOS Glass)' : 'Otomatis (Sistem)'}`,
      'success'
    );
  };

  // Tab definitions with dynamic badge and pure vector SVG icons
  const navTabs: NavTabItem[] = useMemo(
    () => [
      { id: 'radar', label: 'Radar', icon: <RadarNavIcon size={20} /> },
      { id: 'contacts', label: 'Kontak', icon: <ContactsNavIcon size={20} /> },
      {
        id: 'notifications',
        label: 'Jadwal',
        icon: <ScheduleNavIcon size={20} />,
        badge: upcomingAlarms.length > 0 ? upcomingAlarms.length : undefined,
      },
      { id: 'settings', label: 'Pengaturan', icon: <SettingsNavIcon size={20} /> },
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
        const updated = await crmDb.contacts.get(editingContact.id);
        if (updated) {
          await scheduleTargetedFollowUpAlarm(updated);
        }
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
        await scheduleTargetedFollowUpAlarm(newContact);
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
      const updated = await crmDb.contacts.get(contact.id);
      if (updated) {
        await scheduleTargetedFollowUpAlarm(updated);
      }
      await refreshData();
      showToast(`Silaturahmi dengan ${contact.name} dicatat!`, 'success');
    } catch (err) {
      console.error('Failed to log chat', err);
      showToast('Gagal mencatat interaksi', 'error');
    }
  };

  // Handle direct inline update for Contact Dossier
  const handleUpdateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      const nowIso = new Date().toISOString();
      await crmDb.contacts.update(contactId, {
        ...updates,
        updatedAt: nowIso,
      });
      const updated = await crmDb.contacts.get(contactId);
      if (updated) {
        await scheduleTargetedFollowUpAlarm(updated);
      }
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

  // Handle saving an encounter from KinshipLogInteractionModal
  const handleSaveEncounter = async (encounter: {
    contactId: string;
    type: InteractionType;
    date: string;
    location?: string;
    talkingPoints?: string;
    newFacts?: string[];
    resetCadence?: boolean;
  }) => {
    try {
      const nowIso = new Date().toISOString();
      const interactionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Prepare notes string combining location, talkingPoints, and newFacts
      const noteParts: string[] = [];
      if (encounter.location) noteParts.push(`Lokasi: ${encounter.location}`);
      if (encounter.talkingPoints) noteParts.push(encounter.talkingPoints);
      if (encounter.newFacts && encounter.newFacts.length > 0) {
        noteParts.push(`Fakta baru: ${encounter.newFacts.join(', ')}`);
      }
      const combinedNotes = noteParts.join(' • ');

      // Save interaction log into Dexie
      await crmDb.interactions.add({
        id: interactionId,
        contactId: encounter.contactId,
        date: encounter.date || nowIso.split('T')[0],
        type: encounter.type,
        notes: combinedNotes,
        createdAt: nowIso,
      });

      // Update contact's lastContactedDate & lastUpdateNotes
      const contact = contacts.find((c) => c.id === encounter.contactId);
      if (contact) {
        const contactUpdates: Partial<Contact> = {
          lastContactedDate: encounter.date || nowIso.split('T')[0],
          updatedAt: nowIso,
        };
        if (encounter.talkingPoints) {
          contactUpdates.lastUpdateNotes = encounter.talkingPoints;
        }
        await crmDb.contacts.update(contact.id, contactUpdates);
        const updatedContact = { ...contact, ...contactUpdates };
        await scheduleTargetedFollowUpAlarm(updatedContact);
      }

      await refreshData();
      setLogEncounterContact(null);
      showToast('Interaksi berhasil dicatat!', 'success');
    } catch (err) {
      console.error('Failed to save encounter', err);
      showToast('Gagal mencatat interaksi', 'error');
    }
  };

  // Handle snoozing follow-up alarm for a contact
  const handleSnoozeContact = async (contact: Contact, days: number) => {
    try {
      const target = new Date();
      target.setDate(target.getDate() + days);
      const targetDateStr = target.toISOString().split('T')[0];
      const nowIso = new Date().toISOString();

      await crmDb.contacts.update(contact.id, {
        nextSpecificFollowUp: targetDateStr,
        updatedAt: nowIso,
      });

      const updatedContact = {
        ...contact,
        nextSpecificFollowUp: targetDateStr,
        updatedAt: nowIso,
      };

      await scheduleTargetedFollowUpAlarm(updatedContact);
      await refreshData();
      showToast(`Pengingat ${contact.name} ditunda +${days} hari (${targetDateStr})`, 'success');
    } catch (err) {
      console.error('Failed to snooze contact', err);
      showToast('Gagal menunda pengingat', 'error');
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
      setActiveTab('radar');
    } else if (filterType === 'overdue') {
      setActiveTab('radar');
    } else if (filterType === 'week') {
      setActiveTab('notifications');
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

  // Filtered contacts for 'contacts' tab
  const filteredContacts = useMemo(() => {
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

  const activeInteractionsForSelected = useMemo(() => {
    if (!selectedContact) return [];
    return interactions.filter((i) => i.contactId === selectedContact.id);
  }, [interactions, selectedContact]);

  return (
    <DeviceEmulatorFrame>
      <div className="min-h-screen max-w-full w-full overflow-x-hidden bg-[#F2F2F7] dark:bg-[#090A0F] text-slate-900 dark:text-white flex flex-col font-sans pb-28 selection:bg-blue-600 selection:text-white transition-colors">
        {/* Top Application Navbar */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 pt-[env(safe-area-inset-top,0px)] transition-colors">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label="Buka Menu Analitik"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <img
                src={sapaLogo}
                alt="Sapa Logo"
                className="w-8 h-8 rounded-xl shadow-xs object-cover"
              />
              <div>
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  Sapa
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-slate-500 ml-2 font-medium">
                  Rawat & jaga ritme silaturahmi
                </span>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSyncOpen(true)}
                aria-label="Impor Kontak Telepon"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Impor HP</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddContact}
                aria-label="Tambah Kontak Baru"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kontak</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Tab Content */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-600" />
              <p className="text-sm font-medium">Memuat data relasi Sapa...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: RADAR / HOME (KinshipDashboardView) */}
              {(activeTab === 'radar' || activeTab === 'home' || activeTab === 'dashboard') && (
                <KinshipDashboardView
                  contacts={contacts}
                  onSelectContact={(c) => setSelectedContact(c)}
                  onOpenSync={() => setIsSyncOpen(true)}
                  onOpenNotifications={() => setActiveTab('notifications')}
                  onOpenAiDraft={(c) => setDraftContact(c)}
                  onLogChat={(c) => handleLogChat(c)}
                />
              )}

              {/* TAB 2: CONTACTS (Dossier Cards + Notion Table Toggle) */}
              {activeTab === 'contacts' && (
                <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-900 dark:text-white" />
                        <span>Semua Kontak ({filteredContacts.length})</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Kelola relasi personal & pantau ritme silaturahmi berkala
                      </p>
                    </div>

                    {/* View Switcher Toggle & Search */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center bg-slate-200/80 dark:bg-white/10 p-1 rounded-full shadow-inner">
                        <button
                          type="button"
                          aria-label="Tampilan Kartu"
                          onClick={() => setContactsViewMode('cards')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                            contactsViewMode === 'cards'
                              ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Kartu Sapa
                        </button>
                        <button
                          type="button"
                          aria-label="Tampilan Tabel Notion"
                          onClick={() => setContactsViewMode('table')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                            contactsViewMode === 'table'
                              ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Tabel Notion
                        </button>
                      </div>

                      <div className="relative w-full sm:w-60">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={contactsSearch}
                          onChange={(e) => setContactsSearch(e.target.value)}
                          placeholder="Cari kontak..."
                          className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  {contactsViewMode === 'cards' ? (
                    <div className="space-y-3">
                      {filteredContacts.length === 0 ? (
                        <div className="p-8 text-center bg-white dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-3xl border border-dashed border-slate-200 dark:border-white/15">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Tidak ada kontak ditemukan
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Mulai dengan menambahkan kontak baru atau impor dari buku telepon.
                          </p>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={handleOpenAddContact}
                              className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-900 dark:bg-blue-600 text-white"
                            >
                              + Tambah Kontak
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsSyncOpen(true)}
                              className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20"
                            >
                              📱 Impor Buku Telepon
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredContacts.map((contact) => {
                            const status = calculateContactStatus(contact);
                            const cycle = contact.followUpCycleDays || 15;
                            const daysLeftOrOverdue = getDaysLeftOrOverdue(status);
                            const primaryAssoc =
                              contact.associations?.[0] || (contact.isProfessional ? 'Profesional' : 'Relasi');
                            const badgeClass = getAssociationBadgeClass(
                              contact.associations?.[0] || (contact.isProfessional ? 'profesional' : 'relasi')
                            );

                            return (
                              <div
                                key={contact.id}
                                data-testid={`kinship-card-${contact.id}`}
                                onClick={() => setSelectedContact(contact)}
                                className="bg-white dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 dark:border-white/12 shadow-xs hover:border-slate-300 dark:hover:border-white/25 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                                      {getInitials(contact.name)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                          {contact.name}
                                        </h3>
                                        <span
                                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}
                                        >
                                          {primaryAssoc}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                                        {contact.phoneNumber}
                                      </p>
                                    </div>
                                  </div>

                                  <CadenceBadge
                                    cadenceDays={cycle}
                                    isOverdue={status.isOverdue}
                                    daysLeftOrOverdue={daysLeftOrOverdue}
                                  />
                                </div>

                                {contact.possibleFollowUpTopic && (
                                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                                    <span className="font-semibold text-slate-800 dark:text-white">Topik:</span>{' '}
                                    {contact.possibleFollowUpTopic}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10 gap-2">
                                  <button
                                    type="button"
                                    aria-label={`Draf WA untuk ${contact.name}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDraftContact(contact);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Sapa WA</span>
                                  </button>

                                  <button
                                    type="button"
                                    aria-label={`Catat interaksi ${contact.name}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLogEncounterContact(contact);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Catat Interaksi</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <NotionTableView
                      contacts={filteredContacts}
                      onSelectContact={(c) => setSelectedContact(c)}
                      onQuickWhatsApp={(c) => setDraftContact(c)}
                      onLogChat={(c) => handleLogChat(c)}
                    />
                  )}
                </div>
              )}

              {/* TAB 3: NOTIFICATIONS / JADWAL (KinshipNotificationsView) */}
              {(activeTab === 'notifications' || activeTab === 'calendar' || activeTab === 'schedules') && (
                <KinshipNotificationsView
                  contacts={contacts}
                  onSelectContact={(c) => setSelectedContact(c)}
                  onOpenAiDraft={(c) => setDraftContact(c)}
                  onLogChat={(c) => handleLogChat(c)}
                  onSnoozeContact={handleSnoozeContact}
                />
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto px-4 pt-6 pb-36 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                      <span>Pengaturan & Konfigurasi</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Konfigurasi tema tampilan Liquid Glass, AI API Key, dan basis data offline
                    </p>
                  </div>

                  {/* Card 0: Theme & Appearance (Liquid Glass) */}
                  <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/80 dark:border-white/12 rounded-[28px] p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <SunMoon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                          Tampilan & Tema (Liquid Glass)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Pilih gaya antarmuka terang, gelap, atau ikuti tema perangkat Anda
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        aria-label="Mode Terang"
                        onClick={() => handleThemeChange('light')}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border transition-all active:scale-95 ${
                          themePreference === 'light'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-600 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-7 h-7 mb-1.5 flex items-center justify-center">
                          <AppleThemeIcon className="w-5 h-5 text-current" />
                        </div>
                        <span className="text-xs font-semibold block">Terang</span>
                        <span className="text-[10px] text-slate-400 block">iOS 18 Glass</span>
                      </button>

                      <button
                        type="button"
                        aria-label="Mode Gelap"
                        onClick={() => handleThemeChange('dark')}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border transition-all active:scale-95 ${
                          themePreference === 'dark'
                            ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-7 h-7 mb-1.5 flex items-center justify-center">
                          <VisionOsThemeIcon className="w-5 h-5 text-current" />
                        </div>
                        <span className="text-xs font-semibold block">Gelap</span>
                        <span className="text-[10px] text-slate-400 block">VisionOS Glass</span>
                      </button>

                      <button
                        type="button"
                        aria-label="Mode Otomatis"
                        onClick={() => handleThemeChange('system')}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border transition-all active:scale-95 ${
                          themePreference === 'system'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-7 h-7 mb-1.5 flex items-center justify-center">
                          <SystemThemeIcon className="w-5 h-5 text-current" />
                        </div>
                        <span className="text-xs font-semibold block">Otomatis</span>
                        <span className="text-[10px] text-slate-400 block">Ikuti HP</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 1: Gemini API Key */}
                  <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/80 dark:border-white/12 rounded-[28px] p-5 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                            Google Gemini AI API Key & Groq
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Default menggunakan Groq AI kilat via cloud proxy. Masukkan kunci pribadi (Groq / Gemini) jika ingin kuota khusus.
                          </p>
                        </div>
                      </div>
                      {isApiKeySaved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          Aktif
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Masukkan Google Gemini API Key (AIza...) atau Groq Key (gsk_...)"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/30"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Kunci API disimpan secara aman di browser lokal Anda.</span>
                        <button
                          type="button"
                          onClick={handleSaveApiKey}
                          className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-blue-600 text-white font-semibold hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors"
                        >
                          Simpan Kunci
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Database Stats & Management */}
                  <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/80 dark:border-white/12 rounded-[28px] p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                          Basis Data Offline (IndexedDB Dexie)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Penyimpanan lokal di perangkat Anda (100% aman & privat)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-1">
                      <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 text-center">
                        <span className="block text-xl font-extrabold text-slate-800 dark:text-white">
                          {contacts.length}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Total Relasi Tersimpan
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 text-center">
                        <span className="block text-xl font-extrabold text-slate-900 dark:text-white">
                          {interactionsCount}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Log Riwayat Interaksi
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center gap-2 justify-between">
                      <button
                        type="button"
                        onClick={() => setIsSyncOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Sinkronisasi Buku Telepon</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSeedContacts}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Isi Data Contoh (Demo Seed)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Ekspor Backup JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetData}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Semua Data</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: About Application & Tutorial */}
                  <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/80 dark:border-white/12 rounded-[28px] p-5 shadow-xs space-y-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                        Tentang Sapa v2.0
                      </h3>
                      <p>
                        Aplikasi manajemen relasi dan silaturahmi personal yang dirancang dengan filosofi
                        Denyut Sapa & Radar, dual WhatsApp native intent, serta pengingat jam 08:00 WIB otomatis.
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Didukung arsitektur Local-First Dexie.js, Capacitor Native Plugins, Tailwind CSS, dan Google Gemini AI.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Ingin mengulang panduan awal?
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsOnboardingOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Panduan Tutorial</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Global Bottom Navigation Bar */}
        <BottomNavBar
          tabs={navTabs}
          activeTab={
            activeTab === 'home' ? 'radar' : activeTab === 'calendar' ? 'notifications' : activeTab
          }
          onTabChange={(tabId) => setActiveTab(tabId)}
        />

        {/* Kinship Contact Dossier Modal */}
        <KinshipContactDossierModal
          contact={selectedContact}
          isOpen={Boolean(selectedContact)}
          onClose={() => setSelectedContact(null)}
          onEditContact={handleOpenEditContact}
          onOpenAiDraft={(c) => {
            setSelectedContact(null);
            setDraftContact(c);
          }}
          onOpenLogEncounter={(c) => {
            setSelectedContact(null);
            setLogEncounterContact(c);
          }}
          onUpdateContact={handleUpdateContact}
          interactions={activeInteractionsForSelected}
        />

        {/* Kinship Log Interaction Modal */}
        <KinshipLogInteractionModal
          contact={logEncounterContact}
          isOpen={Boolean(logEncounterContact)}
          onClose={() => setLogEncounterContact(null)}
          onSave={handleSaveEncounter}
        />

        {/* Kinship Phonebook Sync Modal / View */}
        {isSyncOpen && (
          <div className="fixed inset-0 z-50 bg-[#f8f9ff] flex flex-col">
            <KinshipPhonebookSyncView
              isOpen={isSyncOpen}
              onClose={() => setIsSyncOpen(false)}
              onImportComplete={(result) => {
                refreshData();
                setIsSyncOpen(false);
                showToast(
                  `Berhasil mengimpor ${result.importedCount} kontak baru, ${result.updatedCount} diperbarui`,
                  'success'
                );
              }}
            />
          </div>
        )}

        {/* AI WhatsApp Draft Modal */}
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

        {/* Contact Edit Modal */}
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

        {/* Navigation Drawer */}
        <NavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          contacts={contacts}
          interactions={interactions}
          onSelectFilter={handleDrawerSelectFilter}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />

        {/* First-time Onboarding Modal */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
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
