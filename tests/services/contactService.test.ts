import { describe, it, expect, beforeEach } from 'vitest';
import { crmDb } from '../../src/db/crmDatabase';
import { importContacts, markChatCompleted, resyncPhoneContacts } from '../../src/services/contactService';

describe('ContactService', () => {
  beforeEach(async () => {
    await crmDb.contacts.clear();
    await crmDb.interactions.clear();
  });

  it('imports batch contacts without duplicates', async () => {
    const raw = [
      { name: 'Bu Siti Sarah', phoneNumber: '08123456789' },
      { name: 'Mustafa Mert', phoneNumber: '+905321112233' },
    ];
    const result = await importContacts(raw);
    expect(result.importedCount).toBe(2);

    // Re-importing same phone should update, not create duplicate
    const reImport = await importContacts([{ name: 'Bu Siti Sarah Updated', phoneNumber: '08123456789' }]);
    expect(reImport.importedCount).toBe(0);
    expect(reImport.updatedCount).toBe(1);

    const all = await crmDb.contacts.toArray();
    expect(all.length).toBe(2);
    // Re-import never overwrites the name the user already has.
    expect(all.find(c => c.phoneNumber === '+628123456789')?.name).toBe('Bu Siti Sarah');
  });

  it('markChatCompleted updates lastContactedDate to today and resets specific follow up', async () => {
    await crmDb.contacts.bulkAdd([
      {
        id: 'c1',
        name: 'Necmiye',
        phoneNumber: '+905329998877',
        associations: ['Keluarga'],
        isProfessional: false,
        lastContactedDate: '2026-09-01',
        followUpCycleDays: 15,
        nextSpecificFollowUp: '2026-09-10T10:00:00Z',
        metContext: '',
        lastUpdateNotes: '',
        possibleFollowUpTopic: 'Kabar keluarga',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      }
    ], { allKeys: true });

    const updated = await markChatCompleted('c1', 'Ngobrol santai lewat WA');
    expect(updated.lastContactedDate).toBe(new Date().toISOString().split('T')[0]);
    expect(updated.nextSpecificFollowUp).toBeNull();

    const logs = await crmDb.interactions.where('contactId').equals('c1').toArray();
    expect(logs.length).toBe(1);
    expect(logs[0].notes).toBe('Ngobrol santai lewat WA');
  });

  it('handles intra-batch duplicate phone numbers by importing first and updating subsequent', async () => {
    const raw = [
      { name: 'Ahmad First', phoneNumber: '08551234567' },
      { name: 'Ahmad Updated', phoneNumber: '08551234567', associations: ['Ihvan'] },
    ];
    const result = await importContacts(raw);
    expect(result.importedCount).toBe(1);
    expect(result.updatedCount).toBe(1);

    const all = await crmDb.contacts.where('phoneNumber').equals('+628551234567').toArray();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Ahmad First');
    expect(all[0].associations).toContain('Ihvan');
  });

  it('ignores contacts with empty or invalid phone numbers', async () => {
    const raw = [
      { name: 'Tanpa Nomor', phoneNumber: '' },
      { name: 'Spasi Saja', phoneNumber: '   ' },
      { name: 'Valid User', phoneNumber: '081299998888' },
    ];
    const result = await importContacts(raw);
    expect(result.importedCount).toBe(1);
    expect(result.updatedCount).toBe(0);

    const all = await crmDb.contacts.toArray();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Valid User');
  });

  it('throws error when markChatCompleted is called on non-existent contact', async () => {
    await expect(markChatCompleted('non-existent-id', 'Test note')).rejects.toThrow(
      'Contact with id non-existent-id not found'
    );
  });

  it('resync lists new phone contacts and only proposes removing phone contacts that disappeared', async () => {
    await importContacts([{ name: 'Dari HP', phoneNumber: '081111111111' }, { name: 'Hilang', phoneNumber: '082222222222' }]);
    await importContacts([{ name: 'Dari File', phoneNumber: '083333333333' }], '62', 'manual');
    await crmDb.contacts.add({
      id: 'manual', name: 'Manual', phoneNumber: '+624444', associations: [], isProfessional: false,
      lastContactedDate: null, followUpCycleDays: 15, nextSpecificFollowUp: null, metContext: '',
      lastUpdateNotes: 'catatan', possibleFollowUpTopic: '', createdAt: '', updatedAt: '',
    });
    const device = [{ name: 'Dari HP', phoneNumber: '081111111111' }, { name: 'Baru', phoneNumber: '085555555555' }];

    const res = await resyncPhoneContacts(device, true);
    expect(res.newOnPhone.map((c) => c.name)).toEqual(['Baru']);
    expect(res.missing.map((c) => c.name)).toEqual(['Hilang']);

    // A partial list (web picker) never proposes removals, and nothing is deleted by the resync itself.
    expect((await resyncPhoneContacts(device, false)).missing).toEqual([]);
    expect(await crmDb.contacts.count()).toBe(4);
    expect((await crmDb.contacts.get('manual'))?.lastUpdateNotes).toBe('catatan');
  });
});
