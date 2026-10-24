import { describe, it, expect, beforeEach } from 'vitest';
import { crmDb } from '../../src/db/crmDatabase';
import { buildBackup, restoreBackup } from '../../src/services/backupService';
import { getLabels } from '../../src/services/labelService';
import type { Contact } from '../../src/types/crm';

const contact = (id: string, name: string): Contact => ({
  id, name, phoneNumber: `+62${id}`, associations: [], isProfessional: false, lastContactedDate: null,
  followUpCycleDays: 15, nextSpecificFollowUp: null, metContext: '', lastUpdateNotes: '', possibleFollowUpTopic: '',
  createdAt: '', updatedAt: '',
});

describe('backupService', () => {
  beforeEach(async () => {
    await crmDb.contacts.clear();
    await crmDb.interactions.clear();
    localStorage.clear();
  });

  it('restores a backup on top of current data and keeps contacts not in the file', async () => {
    await crmDb.contacts.add(contact('1', 'Lama'));
    await crmDb.contacts.add(contact('2', 'Tetap'));
    const file = {
      version: '2',
      exportedAt: '',
      contacts: [{ ...contact('1', 'Dari Cadangan') }, contact('3', 'Baru')],
      interactions: [{ id: 'i1', contactId: '3', date: '2026-10-01', type: 'whatsapp' }],
      labels: ['Tetangga'],
    };

    expect(await restoreBackup(JSON.stringify(file))).toBe(2);
    expect((await crmDb.contacts.get('1'))?.name).toBe('Dari Cadangan');
    expect(await crmDb.contacts.get('2')).toBeDefined();
    expect(await crmDb.interactions.count()).toBe(1);
    expect(getLabels()).toContain('Tetangga');
  });

  it('rejects files that are not Sapa backups', async () => {
    await expect(restoreBackup('bukan json')).rejects.toThrow('bukan file cadangan');
    await expect(restoreBackup(JSON.stringify({ contacts: [] }))).rejects.toThrow('Tidak ada data');
  });

  it('builds a backup with contacts, interactions and labels', async () => {
    await crmDb.contacts.add(contact('1', 'A'));
    const b = await buildBackup();
    expect(b.contacts).toHaveLength(1);
    expect(b.labels).toEqual(getLabels());
  });
});
