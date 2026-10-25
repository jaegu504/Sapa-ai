import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { crmDb } from '../db/crmDatabase';
import type { Contact, InteractionLog } from '../types/crm';
import { getLabels, saveLabels } from './labelService';
import { t } from '../i18n';

export interface BackupFile {
  version: string;
  exportedAt: string;
  contacts: Contact[];
  interactions: InteractionLog[];
  labels?: string[];
}

export async function buildBackup(): Promise<BackupFile> {
  return {
    version: '2',
    exportedAt: new Date().toISOString(),
    contacts: await crmDb.contacts.toArray(),
    interactions: await crmDb.interactions.toArray(),
    labels: getLabels(),
  };
}

/**
 * Saves a backup file. On the phone it opens the share sheet (save to Files/Drive or
 * send to yourself on WhatsApp), because a WebView cannot download files directly.
 * Returns the number of contacts saved.
 */
export async function exportBackup(): Promise<number> {
  const backup = await buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const fileName = `sapa-cadangan-${backup.exportedAt.split('T')[0]}.json`;

  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({ path: fileName, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: t('Cadangan Sapa'), text: t('File cadangan data Sapa'), files: [uri], dialogTitle: t('Simpan cadangan Sapa') });
  } else {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  return backup.contacts.length;
}

/**
 * Restores a backup on top of the current data: records with the same id are replaced
 * by the backup copy, everything else stays. Returns the number of contacts restored.
 */
export async function restoreBackup(jsonText: string): Promise<number> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('File ini bukan file cadangan Sapa.');
  }
  const data = parsed as Partial<BackupFile> | Contact[];
  const contacts = (Array.isArray(data) ? data : Array.isArray(data?.contacts) ? data.contacts : []).filter(
    (c): c is Contact => Boolean(c && typeof c.id === 'string' && typeof c.name === 'string')
  );
  const interactions = (!Array.isArray(data) && Array.isArray(data?.interactions) ? data.interactions : []).filter(
    (i): i is InteractionLog => Boolean(i && typeof i.id === 'string' && typeof i.contactId === 'string')
  );
  if (contacts.length === 0 && interactions.length === 0) {
    throw new Error('Tidak ada data kontak di file cadangan ini.');
  }

  await crmDb.transaction('rw', crmDb.contacts, crmDb.interactions, async () => {
    await crmDb.contacts.bulkPut(contacts);
    await crmDb.interactions.bulkPut(interactions);
  });

  if (!Array.isArray(data) && Array.isArray(data?.labels)) {
    const current = getLabels();
    const extra = data.labels.filter((l) => typeof l === 'string' && !current.includes(l));
    if (extra.length) saveLabels([...current, ...extra]);
  }
  return contacts.length;
}
