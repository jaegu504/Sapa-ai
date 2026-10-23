import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_LABELS,
  LABELS_STORAGE_KEY,
  getLabels,
  saveLabels,
  addLabel,
  renameLabel,
  removeLabel,
  remapAssociations,
} from '../../src/services/labelService';

describe('labelService', () => {
  beforeEach(() => localStorage.clear());

  it('falls back to defaults for empty or corrupt storage and round-trips saves', () => {
    expect(getLabels()).toEqual(DEFAULT_LABELS);
    localStorage.setItem(LABELS_STORAGE_KEY, '{oops');
    expect(getLabels()).toEqual(DEFAULT_LABELS);
    saveLabels(['Tetangga']);
    expect(getLabels()).toEqual(['Tetangga']);
  });

  it('rejects empty or duplicate names when adding or renaming', () => {
    expect(addLabel(['Teman'], ' Tetangga ')).toEqual(['Teman', 'Tetangga']);
    expect(addLabel(['Teman'], 'teman')).toBeNull();
    expect(addLabel(['Teman'], '  ')).toBeNull();
    expect(renameLabel(['Teman', 'Hoca'], 'Teman', 'hoca')).toBeNull();
    expect(renameLabel(['Teman', 'Hoca'], 'Teman', 'Sahabat')).toEqual(['Sahabat', 'Hoca']);
    expect(removeLabel(['Teman', 'Hoca'], 'Teman')).toEqual(['Hoca']);
  });

  it('remaps a contact label on rename and drops it on removal without duplicates', () => {
    expect(remapAssociations(['Teman', 'Hoca'], 'Teman', 'Sahabat')).toEqual(['Sahabat', 'Hoca']);
    expect(remapAssociations(['Teman', 'Sahabat'], 'Teman', 'Sahabat')).toEqual(['Sahabat']);
    expect(remapAssociations(['Teman', 'Hoca'], 'Teman', null)).toEqual(['Hoca']);
  });
});
