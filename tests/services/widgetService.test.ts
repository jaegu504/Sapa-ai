import { describe, expect, it } from 'vitest';
import { buildWidgetData } from '../../src/services/widgetService';
import type { Contact } from '../../src/types/crm';

const base = { phoneNumber: '+62', associations: [], isProfessional: false, nextSpecificFollowUp: null, metContext: '', lastUpdateNotes: '', possibleFollowUpTopic: '', createdAt: '', updatedAt: '' };

describe('buildWidgetData', () => {
  it('gives each contact its next due date: past for overdue, future for later', () => {
    const now = new Date(2026, 10, 20, 10);
    const data = buildWidgetData(
      [
        { ...base, id: 'a', name: 'Lewat', lastContactedDate: '2026-11-01', followUpCycleDays: 14 } as Contact,
        { ...base, id: 'b', name: 'Nanti', lastContactedDate: '2026-11-18', followUpCycleDays: 7 } as Contact,
      ],
      now
    );
    expect(data.items).toEqual([
      { n: 'Lewat', d: '2026-11-15' },
      { n: 'Nanti', d: '2026-11-25' },
    ]);
  });
});
