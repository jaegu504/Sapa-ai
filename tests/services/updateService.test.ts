import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  compareVersions,
  checkForAppUpdate,
  dismissUpdate,
  openUpdateDownload,
  UPDATE_STORAGE_KEY,
  UPDATE_DISMISSED_KEY,
} from '../../src/services/updateService';
import * as notifModule from '../../src/services/notificationService';

vi.mock('../../src/services/notificationService', () => ({
  scheduleAppUpdateNotification: vi.fn().mockResolvedValue(true),
}));

describe('updateService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('compareVersions', () => {
    it('returns 0 for identical versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('v1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.2.3', 'v1.2.3')).toBe(0);
    });

    it('returns 1 when v1 is newer than v2', () => {
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.9')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(compareVersions('v1.10.0', 'v1.9.0')).toBe(1);
    });

    it('returns -1 when v1 is older than v2', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('0.9.0', '1.0.0')).toBe(-1);
      expect(compareVersions('v1.0.0', '1.1.0')).toBe(-1);
    });

    it('handles extra version parts gracefully', () => {
      expect(compareVersions('1.0.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '1.0.0.2')).toBe(-1);
      expect(compareVersions('1.0.0-beta', '1.0.0')).toBe(0);
    });
  });

  describe('checkForAppUpdate', () => {
    it('detects a newer version from GitHub releases and triggers notification', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.1.0',
          body: 'Added auto-update feature and improvements',
          html_url: 'https://github.com/jaegu504/Sapa-ai/releases/tag/v1.1.0',
          assets: [
            {
              name: 'sapa-ai-v1.1.0.apk',
              browser_download_url: 'https://github.com/jaegu504/Sapa-ai/releases/download/v1.1.0/sapa-ai-v1.1.0.apk',
            },
          ],
        }),
      });

      const result = await checkForAppUpdate({
        currentVersion: '1.0.0',
        fetchFn: mockFetch as any,
        force: true,
      });

      expect(result.hasUpdate).toBe(true);
      expect(result.latestVersion).toBe('1.1.0');
      expect(result.apkUrl).toContain('sapa-ai-v1.1.0.apk');
      expect(result.releaseNotes).toContain('Added auto-update feature');
      expect(notifModule.scheduleAppUpdateNotification).toHaveBeenCalledWith({
        latestVersion: '1.1.0',
        apkUrl: expect.stringContaining('.apk'),
      });
    });

    it('returns hasUpdate: false when version is the same', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0',
          body: 'Initial release',
          html_url: 'https://github.com/jaegu504/Sapa-ai/releases/tag/v1.0.0',
          assets: [],
        }),
      });

      const result = await checkForAppUpdate({
        currentVersion: '1.0.0',
        fetchFn: mockFetch as any,
        force: true,
      });

      expect(result.hasUpdate).toBe(false);
      expect(result.latestVersion).toBe('1.0.0');
      expect(notifModule.scheduleAppUpdateNotification).not.toHaveBeenCalled();
    });

    it('respects cached check when within 4 hours and force is false', async () => {
      const cached = {
        hasUpdate: false,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        releaseNotes: '',
        releaseUrl: 'https://github.com/jaegu504/Sapa-ai/releases',
        checkedAt: Date.now() - 1000 * 60, // 1 minute ago
      };
      localStorage.setItem(UPDATE_STORAGE_KEY, JSON.stringify(cached));

      const mockFetch = vi.fn();
      const result = await checkForAppUpdate({
        currentVersion: '1.0.0',
        fetchFn: mockFetch as any,
        force: false,
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.hasUpdate).toBe(false);
    });

    it('ignores a cached update result from an older installed version', async () => {
      const cached = {
        hasUpdate: true,
        currentVersion: '1.0.1',
        latestVersion: '1.0.2',
        releaseNotes: '',
        releaseUrl: 'https://github.com/jaegu504/Sapa-ai/releases',
        checkedAt: Date.now() - 1000 * 60,
      };
      localStorage.setItem(UPDATE_STORAGE_KEY, JSON.stringify(cached));

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.2',
          body: '',
          html_url: 'https://github.com/jaegu504/Sapa-ai/releases/tag/v1.0.2',
          assets: [],
        }),
      });

      const result = await checkForAppUpdate({
        currentVersion: '1.0.2',
        fetchFn: mockFetch as any,
        force: false,
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(result.hasUpdate).toBe(false);
      expect(notifModule.scheduleAppUpdateNotification).not.toHaveBeenCalled();
    });

    it('does not re-notify if user dismissed this specific version', async () => {
      localStorage.setItem(UPDATE_DISMISSED_KEY, '1.1.0');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.1.0',
          body: 'Release notes',
          html_url: 'https://github.com/jaegu504/Sapa-ai/releases/tag/v1.1.0',
          assets: [],
        }),
      });

      const result = await checkForAppUpdate({
        currentVersion: '1.0.0',
        fetchFn: mockFetch as any,
        force: true,
      });

      expect(result.hasUpdate).toBe(true);
      expect(notifModule.scheduleAppUpdateNotification).not.toHaveBeenCalled();
    });

    it('handles network error safely', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkForAppUpdate({
        currentVersion: '1.0.0',
        fetchFn: mockFetch as any,
        force: true,
      });

      expect(result.hasUpdate).toBe(false);
      expect(result.currentVersion).toBe('1.0.0');
    });
  });

  describe('dismissUpdate & openUpdateDownload', () => {
    it('saves dismissed version to localStorage', () => {
      dismissUpdate('1.2.0');
      expect(localStorage.getItem(UPDATE_DISMISSED_KEY)).toBe('1.2.0');
    });

    it('opens download url using window.open', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openUpdateDownload('https://example.com/download.apk');
      expect(openSpy).toHaveBeenCalledWith('https://example.com/download.apk', '_system');
      openSpy.mockRestore();
    });
  });
});
