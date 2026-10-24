import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { Mic } from 'lucide-react';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { TourSpotlight } from './components/tutorial/TourSpotlight';
import { useTutorial } from './components/tutorial/useTutorial';
import { VoiceNoteModal } from './components/kinship/VoiceNoteModal';
import { applyVoiceNote, VoiceNoteResult } from './services/voiceNoteService';
import { ContactsFilter } from './utils/contactFilters';
import { remapAssociations } from './services/labelService';
import { AppUpdateModal } from './components/ui/AppUpdateModal';
import { checkForAppUpdate, dismissUpdate, CURRENT_APP_VERSION, type UpdateCheckResult } from './services/updateService';
import { RadarNavIcon, ContactsNavIcon, ScheduleNavIcon, SettingsNavIcon } from './components/ui/NavIcons';
import { initTheme, setThemePreference, getThemePreference, applyTheme, type ThemePreference } from './services/themeService';
import { crmDb } from './db/crmDatabase';
import type { Contact, InteractionLog, InteractionType } from './types/crm';
import { deleteContacts, markChatCompleted, resyncPhoneContacts } from './services/contactService';
import { getDeviceContactsWithStatus } from './services/nativeContactsAdapter';
import { exportBackup, restoreBackup } from './services/backupService';
import { getDefaultCycleDays } from './services/settingsService';
import {
  initNotificationService,
  scheduleDailyMorningDigest,
  scheduleTargetedFollowUpAlarm,
  getUpcomingAlarms,
} from './services/notificationService';
import { successHaptic, tapHaptic } from './services/haptics';
import { KinshipDashboardView } from './components/kinship/KinshipDashboardView';
import { KinshipContactDossierModal } from './components/kinship/KinshipContactDossierModal';
import { KinshipLogInteractionModal } from './components/kinship/KinshipLogInteractionModal';
import { KinshipNotificationsView } from './components/kinship/KinshipNotificationsView';
import { KinshipPhonebookSyncView } from './components/kinship/KinshipPhonebookSyncView';
import { ContactsView } from './components/kinship/ContactsView';
import { SapaActionSheet } from './components/kinship/SapaActionSheet';
import { LabelPickerSheet } from './components/kinship/LabelPickerSheet';
import { ResyncDialog } from './components/kinship/ResyncDialog';
import { SettingsView } from './components/settings/SettingsView';
import { LabelManagerSheet } from './components/settings/LabelManagerSheet';
import { AiDraftModal } from './components/crm/AiDraftModal';
import { EditContactModal } from './components/crm/EditContactModal';
import { DeviceEmulatorFrame } from './components/ui/DeviceEmulatorFrame';
import { BottomNavBar, NavTabItem } from './components/ui/BottomNavBar';
import { SplashScreen } from './components/ui/SplashScreen';
import { Toast, ToastType } from './components/ui/Toast';
import { useAndroidBack } from './hooks/useAndroidBack';

const STORAGE_API_KEY = 'growSphere_gemini_api_key';
const DIGEST_TIME_KEY = 'kinship_digest_time';

function newId(prefix: string): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export const App: React.FC = () => {
  // Navigation State: 'radar' | 'contacts' | 'notifications' | 'settings'
  const [activeTab, setActiveTab] = useState<string>('radar');

  // Database Entities State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Screens and sheets
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [logEncounterContact, setLogEncounterContact] = useState<Contact | null>(null);
  const [draftContact, setDraftContact] = useState<Contact | null>(null);
  const [sapaContact, setSapaContact] = useState<Contact | null>(null);
  const [labelContact, setLabelContact] = useState<Contact | null>(null);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState<boolean>(false);
  const [isSyncOpen, setIsSyncOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [voiceNote, setVoiceNote] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });
  const [resyncResult, setResyncResult] = useState<{ newCount: number; missing: Contact[] } | null>(null);
  const [isResyncing, setIsResyncing] = useState<boolean>(false);

  // In-App Software Update State
  const [appUpdate, setAppUpdate] = useState<UpdateCheckResult | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);

  // Contacts list search and filter
  const [contactsSearch, setContactsSearch] = useState<string>('');
  const [contactsFilter, setContactsFilter] = useState<ContactsFilter | null>(null);

  const [digestTime, setDigestTime] = useState<string>(() => readStorage(DIGEST_TIME_KEY, '08:00'));

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Optional personal AI key (Groq / Gemini)
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isApiKeySaved, setIsApiKeySaved] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // First-run guided tutorial (intro + spotlight tour over the real UI)
  const contactExists = useCallback((id: string) => contacts.some((c) => c.id === id), [contacts]);
  const tutorial = useTutorial({
    context: voiceNote.open
      ? 'other'
      : draftContact
        ? 'draft'
        : selectedContact
          ? 'dossier'
          : isEditModalOpen || isSyncOpen || logEncounterContact || isUpdateModalOpen || sapaContact || labelContact || isLabelManagerOpen || resyncResult
            ? 'other'
            : 'shell',
    ready: !loading,
    selectedContactId: selectedContact?.id ?? null,
    contactExists,
    setActiveTab,
    openContact: (id) => {
      const contact = contacts.find((c) => c.id === id);
      if (contact) setSelectedContact(contact);
    },
    closeContact: () => setSelectedContact(null),
    onComplete: () => showToast('Tutorial selesai. Selamat menyapa!', 'success'),
  });

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(hideToast, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, hideToast]);

  useEffect(() => {
    const saved = readStorage(STORAGE_API_KEY, '') || readStorage('gemini_api_key', '');
    if (saved) {
      setApiKey(saved);
      setApiKeyInput(saved);
      setIsApiKeySaved(true);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setContacts(await crmDb.contacts.toArray());
      setInteractions(await crmDb.interactions.toArray());
    } catch (err) {
      console.error('Failed to load contacts from database', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    initNotificationService().catch((err) => console.error('Failed to initialize notification service:', err));
  }, []);

  useEffect(() => {
    if (contacts.length > 0) {
      scheduleDailyMorningDigest(contacts).catch((err) => console.error('Failed to schedule daily morning digest:', err));
    }
  }, [contacts]);

  const upcomingAlarms = useMemo(() => getUpcomingAlarms(contacts, 48), [contacts]);

  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => getThemePreference());
  useEffect(() => initTheme(), []);

  useEffect(() => {
    checkForAppUpdate()
      .then((res) => {
        if (res.hasUpdate) {
          setAppUpdate(res);
          setIsUpdateModalOpen(true);
        }
      })
      .catch((err) => console.warn('Startup app update check failed:', err));
  }, []);

  const handleCheckAppUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await checkForAppUpdate({ force: true });
      setAppUpdate(res);
      if (res.hasUpdate) {
        setIsUpdateModalOpen(true);
        showToast(`Versi baru v${res.latestVersion} tersedia`, 'success');
      } else {
        showToast(`Sapa sudah versi terbaru (v${CURRENT_APP_VERSION})`, 'info');
      }
    } catch {
      showToast('Gagal memeriksa pembaruan. Periksa internet, lalu coba lagi.', 'error');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleThemeChange = (newTheme: ThemePreference) => {
    setThemePreference(newTheme);
    setThemePreferenceState(newTheme);
    applyTheme(newTheme);
  };

  const handleDigestTimeChange = async (time: string) => {
    setDigestTime(time);
    try {
      localStorage.setItem(DIGEST_TIME_KEY, time);
    } catch {
      // Ignore localStorage failures
    }
    const [hour, minute] = time.split(':').map(Number);
    if (!isNaN(hour) && !isNaN(minute)) {
      await scheduleDailyMorningDigest(contacts, { hour, minute }).catch(() => {});
      showToast(`Pengingat harian jam ${time}`, 'success');
    }
  };

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

  // Android back button closes the top-most screen first, then returns to Radar.
  useAndroidBack(() => {
    if (resyncResult) return setResyncResult(null), true;
    if (labelContact) return setLabelContact(null), true;
    if (sapaContact) return setSapaContact(null), true;
    if (voiceNote.open) return setVoiceNote({ open: false, contact: null }), true;
    if (draftContact) return setDraftContact(null), true;
    if (logEncounterContact) return setLogEncounterContact(null), true;
    if (isEditModalOpen) return setIsEditModalOpen(false), setEditingContact(null), true;
    if (isLabelManagerOpen) return setIsLabelManagerOpen(false), true;
    if (isUpdateModalOpen) return setIsUpdateModalOpen(false), true;
    if (isSyncOpen) return setIsSyncOpen(false), true;
    if (selectedContact) return setSelectedContact(null), true;
    if (activeTab !== 'radar') return setActiveTab('radar'), true;
    return false;
  });

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
        await crmDb.contacts.update(editingContact.id, { ...contactData, updatedAt: nowIso });
        const updated = await crmDb.contacts.get(editingContact.id);
        if (updated) await scheduleTargetedFollowUpAlarm(updated);
        showToast(`Kontak ${contactData.name || editingContact.name} diperbarui`, 'success');
      } else {
        const newContact: Contact = {
          id: newId('c'),
          name: (contactData.name || '').trim(),
          phoneNumber: (contactData.phoneNumber || '').trim(),
          associations: contactData.associations && contactData.associations.length > 0 ? contactData.associations : ['Teman'],
          isProfessional: contactData.isProfessional ?? false,
          lastContactedDate: contactData.lastContactedDate || null,
          followUpCycleDays: contactData.followUpCycleDays || getDefaultCycleDays(),
          nextSpecificFollowUp: contactData.nextSpecificFollowUp || null,
          metContext: contactData.metContext || '',
          lastUpdateNotes: contactData.lastUpdateNotes || '',
          possibleFollowUpTopic: contactData.possibleFollowUpTopic || '',
          source: 'manual',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await crmDb.contacts.add(newContact);
        await scheduleTargetedFollowUpAlarm(newContact);
        showToast(`${newContact.name} ditambahkan`, 'success');
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
      await deleteContacts([contactId]);
      await refreshData();
      setIsEditModalOpen(false);
      setEditingContact(null);
      setSelectedContact(null);
      showToast('Kontak dihapus', 'info');
    } catch (err) {
      console.error('Failed to delete contact', err);
      showToast('Gagal menghapus kontak', 'error');
    }
  };

  const handleLogChat = async (contact: Contact, notes?: string) => {
    try {
      await markChatCompleted(contact.id, notes || 'Selesai berinteraksi via WhatsApp');
      const updated = await crmDb.contacts.get(contact.id);
      if (updated) await scheduleTargetedFollowUpAlarm(updated);
      await refreshData();
      successHaptic();
      showToast(`${contact.name} sudah disapa`, 'success');
    } catch (err) {
      console.error('Failed to log chat', err);
      showToast('Gagal mencatat interaksi', 'error');
    }
  };

  // Inline edits from the profile and other sheets. The profile shows its own "Tersimpan".
  const handleUpdateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      const nowIso = new Date().toISOString();
      await crmDb.contacts.update(contactId, { ...updates, updatedAt: nowIso });
      const updated = await crmDb.contacts.get(contactId);
      if (updated) await scheduleTargetedFollowUpAlarm(updated);
      await refreshData();
      const merge = (prev: Contact | null) => (prev && prev.id === contactId ? { ...prev, ...updates, updatedAt: nowIso } : prev);
      setSelectedContact(merge);
      setLabelContact(merge);
    } catch (err) {
      console.error('Failed to update contact inline', err);
      showToast('Gagal memperbarui kontak', 'error');
    }
  };

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
      const noteParts: string[] = [];
      if (encounter.location) noteParts.push(`Lokasi: ${encounter.location}`);
      if (encounter.talkingPoints) noteParts.push(encounter.talkingPoints);
      if (encounter.newFacts && encounter.newFacts.length > 0) noteParts.push(`Fakta baru: ${encounter.newFacts.join(', ')}`);

      await crmDb.interactions.add({
        id: newId('int'),
        contactId: encounter.contactId,
        date: encounter.date || nowIso.split('T')[0],
        type: encounter.type,
        notes: noteParts.join(' • '),
        createdAt: nowIso,
      });

      const contact = contacts.find((c) => c.id === encounter.contactId);
      if (contact) {
        const contactUpdates: Partial<Contact> = {
          lastContactedDate: encounter.date || nowIso.split('T')[0],
          updatedAt: nowIso,
        };
        if (encounter.talkingPoints) contactUpdates.lastUpdateNotes = encounter.talkingPoints;
        if (encounter.newFacts && encounter.newFacts.length > 0) {
          const date = contactUpdates.lastContactedDate as string;
          const known = new Set((contact.facts ?? []).map((f) => f.text.toLowerCase()));
          contactUpdates.facts = [
            ...(contact.facts ?? []),
            ...encounter.newFacts.filter((t) => !known.has(t.toLowerCase())).map((text) => ({ text, date })),
          ];
        }
        await crmDb.contacts.update(contact.id, contactUpdates);
        await scheduleTargetedFollowUpAlarm({ ...contact, ...contactUpdates });
      }

      await refreshData();
      setLogEncounterContact(null);
      successHaptic();
      showToast('Interaksi dicatat', 'success');
    } catch (err) {
      console.error('Failed to save encounter', err);
      showToast('Gagal mencatat interaksi', 'error');
    }
  };

  // Save a reviewed voice note: old kabar goes to the timeline, then the contact is updated.
  const handleSaveVoiceNote = async (contact: Contact, note: Pick<VoiceNoteResult, 'kabar' | 'facts' | 'topic' | 'followUpDate'>) => {
    try {
      const { updates, archivedKabar } = applyVoiceNote(contact, note);
      await crmDb.interactions.add({
        id: newId('int'),
        contactId: contact.id,
        date: updates.lastContactedDate as string,
        type: 'other',
        notes: archivedKabar ? `Catatan suara • Kabar sebelumnya: ${archivedKabar}` : 'Catatan suara',
        createdAt: new Date().toISOString(),
      });
      await handleUpdateContact(contact.id, updates);
      setVoiceNote({ open: false, contact: null });
      successHaptic();
      showToast(`Kabar ${contact.name} diperbarui`, 'success');
    } catch (err) {
      console.error('Failed to save voice note', err);
      showToast('Gagal menyimpan catatan suara', 'error');
    }
  };

  const handleExportBackup = async () => {
    try {
      const count = await exportBackup();
      showToast(`Cadangan dibuat (${count} kontak)`, 'success');
    } catch (err) {
      console.error('Failed to export backup', err);
      showToast('Gagal membuat cadangan', 'error');
    }
  };

  const handleRestoreBackup = async (jsonText: string) => {
    try {
      const count = await restoreBackup(jsonText);
      await refreshData();
      showToast(`${count} kontak dipulihkan dari cadangan`, 'success');
    } catch (err: any) {
      console.error('Failed to restore backup', err);
      showToast(err?.message || 'Gagal memulihkan cadangan', 'error');
    }
  };

  // Compare with the phone's contact list. Removing contacts is only offered on the phone,
  // where the full list is available, and always waits for the user's confirmation.
  const handleResync = async () => {
    setIsResyncing(true);
    try {
      const device = await getDeviceContactsWithStatus();
      if (device.permissionStatus === 'denied') {
        showToast('Izin kontak belum diberikan. Buka Pengaturan HP untuk mengizinkan.', 'error');
        return;
      }
      const full = Capacitor.isNativePlatform() && device.permissionStatus === 'granted';
      const result = await resyncPhoneContacts(device.contacts, full);
      await refreshData();
      if (result.newOnPhone.length === 0 && result.missing.length === 0) {
        showToast('Kontak sudah sinkron dengan HP', 'success');
      } else {
        setResyncResult({ newCount: result.newOnPhone.length, missing: result.missing });
      }
    } catch (err) {
      console.error('Failed to resync contacts', err);
      showToast('Gagal membaca kontak HP', 'error');
    } finally {
      setIsResyncing(false);
    }
  };

  const handleDeleteMissing = async (ids: string[]) => {
    try {
      await deleteContacts(ids);
      await refreshData();
      setResyncResult(null);
      showToast(`${ids.length} kontak dihapus`, 'info');
    } catch (err) {
      console.error('Failed to delete contacts', err);
      showToast('Gagal menghapus kontak', 'error');
    }
  };

  const showContactsWith = (filter: ContactsFilter | null) => {
    setContactsFilter(filter);
    setContactsSearch('');
    setActiveTab('contacts');
  };

  // Rename (to) or remove (null) a label on every contact that has it.
  const handleRemapLabel = async (from: string, to: string | null) => {
    try {
      const nowIso = new Date().toISOString();
      const affected = contacts.filter((c) => c.associations.includes(from));
      for (const c of affected) {
        await crmDb.contacts.update(c.id, { associations: remapAssociations(c.associations, from, to), updatedAt: nowIso });
      }
      if (contactsFilter?.kind === 'label' && contactsFilter.label === from) {
        setContactsFilter(to ? { kind: 'label', label: to } : null);
      }
      await refreshData();
      showToast(to ? `Label "${from}" diubah menjadi "${to}"` : `Label "${from}" dihapus`, 'success');
    } catch (err) {
      console.error('Failed to update label', err);
      showToast('Gagal memperbarui label', 'error');
    }
  };

  const handleResetData = async () => {
    try {
      await crmDb.contacts.clear();
      await crmDb.interactions.clear();
      await refreshData();
      showToast('Semua data dihapus', 'info');
    } catch (err) {
      console.error('Failed to reset database', err);
      showToast('Gagal menghapus data', 'error');
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    try {
      if (trimmed) localStorage.setItem(STORAGE_API_KEY, trimmed);
      else localStorage.removeItem(STORAGE_API_KEY);
    } catch {
      // Ignore localStorage failures
    }
    setApiKey(trimmed);
    setIsApiKeySaved(Boolean(trimmed));
    showToast(trimmed ? 'Kunci AI pribadi disimpan' : 'Kembali memakai AI bawaan', trimmed ? 'success' : 'info');
  };

  const openSapa = (contact: Contact) => {
    tapHaptic();
    setSapaContact(contact);
  };

  const activeInteractionsForSelected = useMemo(
    () => (selectedContact ? interactions.filter((i) => i.contactId === selectedContact.id) : []),
    [interactions, selectedContact]
  );

  const tabKey = activeTab === 'home' || activeTab === 'dashboard' ? 'radar' : activeTab === 'calendar' || activeTab === 'schedules' ? 'notifications' : activeTab;

  return (
    <MotionConfig reducedMotion="user">
      <DeviceEmulatorFrame>
        <div className="min-h-screen max-w-full w-full overflow-x-hidden bg-[#F2F2F7] dark:bg-[#090A0F] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors">
          <main className="flex-1 w-full max-w-full overflow-x-hidden pt-[env(safe-area-inset-top,0px)]">
            {loading ? (
              <div className="min-h-[60vh]" />
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tabKey}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                  transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                >
                  {tabKey === 'radar' && (
                    <KinshipDashboardView
                      contacts={contacts}
                      onSelectContact={setSelectedContact}
                      onOpenNotifications={() => showContactsWith({ kind: 'overdue' })}
                      onSapa={openSapa}
                      onLogChat={(c) => handleLogChat(c)}
                      onAddContact={handleOpenAddContact}
                    />
                  )}

                  {tabKey === 'contacts' && (
                    <ContactsView
                      contacts={contacts}
                      filter={contactsFilter}
                      onFilterChange={setContactsFilter}
                      search={contactsSearch}
                      onSearchChange={setContactsSearch}
                      onSelectContact={setSelectedContact}
                      onSapa={openSapa}
                      onEditLabels={(c) => {
                        tapHaptic();
                        setLabelContact(c);
                      }}
                      onAddContact={handleOpenAddContact}
                      onResync={handleResync}
                      isSyncing={isResyncing}
                    />
                  )}

                  {tabKey === 'notifications' && (
                    <KinshipNotificationsView contacts={contacts} onSelectContact={setSelectedContact} onSapa={openSapa} />
                  )}

                  {tabKey === 'settings' && (
                    <SettingsView
                      contactsCount={contacts.length}
                      themePreference={themePreference}
                      onThemeChange={handleThemeChange}
                      digestTime={digestTime}
                      onDigestTimeChange={handleDigestTimeChange}
                      hasUpdate={Boolean(appUpdate?.hasUpdate)}
                      latestVersion={appUpdate?.latestVersion}
                      isCheckingUpdate={isCheckingUpdate}
                      onCheckUpdate={handleCheckAppUpdate}
                      onOpenUpdate={() => setIsUpdateModalOpen(true)}
                      onOpenLabels={() => setIsLabelManagerOpen(true)}
                      onImportPhone={() => setIsSyncOpen(true)}
                      onExportBackup={handleExportBackup}
                      onRestoreBackup={handleRestoreBackup}
                      onReplayTutorial={() => {
                        tutorial.replay();
                        setActiveTab('radar');
                      }}
                      onResetData={handleResetData}
                      apiKeyInput={apiKeyInput}
                      onApiKeyInputChange={setApiKeyInput}
                      isApiKeySaved={isApiKeySaved}
                      onSaveApiKey={handleSaveApiKey}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>

          <BottomNavBar
            tabs={navTabs}
            activeTab={tabKey}
            onTabChange={(tabId) => {
              if (tabId !== tabKey) tapHaptic();
              setActiveTab(tabId);
            }}
            centerAction={{
              label: 'Catat Kabar dengan Suara',
              icon: <Mic className="w-6 h-6" />,
              onClick: () => {
                tapHaptic('medium');
                setVoiceNote({ open: true, contact: null });
              },
              tourId: 'voice-global',
            }}
          />

          <KinshipContactDossierModal
            contact={selectedContact}
            isOpen={Boolean(selectedContact)}
            onClose={() => setSelectedContact(null)}
            onEditContact={handleOpenEditContact}
            onSapa={openSapa}
            onOpenAiDraft={(c) => {
              setSelectedContact(null);
              setDraftContact(c);
            }}
            onOpenLogEncounter={(c) => {
              setSelectedContact(null);
              setLogEncounterContact(c);
            }}
            onOpenVoiceNote={(c) => setVoiceNote({ open: true, contact: c })}
            onUpdateContact={handleUpdateContact}
            interactions={activeInteractionsForSelected}
          />

          <SapaActionSheet
            contact={sapaContact}
            onClose={() => setSapaContact(null)}
            onWriteWithAi={(c) => {
              setSapaContact(null);
              setSelectedContact(null);
              setDraftContact(c);
            }}
          />

          <LabelPickerSheet contact={labelContact} onClose={() => setLabelContact(null)} onChange={handleUpdateContact} />

          <LabelManagerSheet
            isOpen={isLabelManagerOpen}
            onClose={() => setIsLabelManagerOpen(false)}
            contacts={contacts}
            onRemapLabel={handleRemapLabel}
          />

          <ResyncDialog
            result={resyncResult}
            onClose={() => setResyncResult(null)}
            onPickNew={() => {
              setResyncResult(null);
              setIsSyncOpen(true);
            }}
            onDeleteMissing={handleDeleteMissing}
          />

          <KinshipLogInteractionModal
            contact={logEncounterContact}
            isOpen={Boolean(logEncounterContact)}
            onClose={() => setLogEncounterContact(null)}
            onSave={handleSaveEncounter}
          />

          {isSyncOpen && (
            <div className="fixed inset-0 z-50 bg-[#f8f9ff] dark:bg-[#090A0F] flex flex-col animate-rise">
              <KinshipPhonebookSyncView
                isOpen={isSyncOpen}
                onClose={() => setIsSyncOpen(false)}
                onImportComplete={(result) => {
                  refreshData();
                  setIsSyncOpen(false);
                  showToast(`${result.importedCount} kontak baru ditambahkan`, 'success');
                }}
              />
            </div>
          )}

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

          <VoiceNoteModal
            isOpen={voiceNote.open}
            contact={voiceNote.contact}
            contacts={contacts}
            onClose={() => setVoiceNote({ open: false, contact: null })}
            onSave={handleSaveVoiceNote}
          />
          <OnboardingModal isOpen={tutorial.showIntro} onClose={tutorial.skip} onFinish={tutorial.finishIntro} />
          {tutorial.showTour && tutorial.currentStep && (
            <TourSpotlight
              step={tutorial.currentStep}
              stepIndex={tutorial.stepIndex}
              total={tutorial.total}
              onNext={tutorial.next}
              onSkip={tutorial.skip}
            />
          )}

          <AppUpdateModal
            isOpen={isUpdateModalOpen}
            update={appUpdate}
            onClose={() => setIsUpdateModalOpen(false)}
            onDismissForever={(ver) => dismissUpdate(ver)}
          />

          <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={hideToast} />
          <SplashScreen />
        </div>
      </DeviceEmulatorFrame>
    </MotionConfig>
  );
};
