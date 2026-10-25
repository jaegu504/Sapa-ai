import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { TR } from '../src/i18n/tr';
import { t, setUiLanguage } from '../src/i18n';
import { TOUR_STEPS } from '../src/services/tutorialService';
import { dueLabel, formatLongDate } from '../src/utils/display';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
}

describe('Turkish UI translation', () => {
  afterEach(() => setUiLanguage('id'));

  it('has a Turkish entry for every literal t() text in the app', () => {
    const missing: string[] = [];
    for (const file of sourceFiles(join(__dirname, '../src'))) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1/g)) {
        const key = m[2].replace(/\\(['"])/g, '$1');
        if (!(key in TR)) missing.push(`${file.split('src/')[1]}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('translates every tutorial step', () => {
    for (const step of TOUR_STEPS) {
      expect(TR[step.title], step.title).toBeDefined();
      expect(TR[step.body], step.id).toBeDefined();
    }
  });

  it('switches text, variables and dates by language', () => {
    expect(t('Lewat {n} hari', { n: 3 })).toBe('Lewat 3 hari');
    setUiLanguage('tr');
    expect(t('Lewat {n} hari', { n: 3 })).toBe('3 gün geçti');
    expect(t('Teks yang belum ada')).toBe('Teks yang belum ada');
    expect(formatLongDate('2026-10-31')).toBe('Cmt, 31 Eki 2026');
    expect(dueLabel({ isOverdue: false, statusText: '', suggestedDate: null, daysOverdue: 0, daysRemaining: 1 })).toBe('Yarın');
  });
});
