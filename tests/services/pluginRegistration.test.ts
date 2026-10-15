import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Capacitor Plugins & Android Manifest Declarations', () => {
  it('has contacts and local-notifications declared in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
    expect(pkg.dependencies['@capacitor-community/contacts']).toBeDefined();
    expect(pkg.dependencies['@capacitor/local-notifications']).toBeDefined();
  });

  it('declares READ_CONTACTS and POST_NOTIFICATIONS in AndroidManifest.xml', () => {
    const manifest = fs.readFileSync(path.resolve(__dirname, '../../android/app/src/main/AndroidManifest.xml'), 'utf8');
    expect(manifest).toContain('android.permission.READ_CONTACTS');
    expect(manifest).toContain('android.permission.POST_NOTIFICATIONS');
    expect(manifest).toContain('android.permission.SCHEDULE_EXACT_ALARM');
  });
});
