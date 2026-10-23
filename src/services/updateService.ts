import { scheduleAppUpdateNotification } from './notificationService';

export const CURRENT_APP_VERSION = '1.1.0';
export const GITHUB_REPO = 'jaegu504/Sapa-ai';
export const UPDATE_STORAGE_KEY = 'sapa_last_update_check';
export const UPDATE_DISMISSED_KEY = 'sapa_dismissed_update_version';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  releaseUrl: string;
  apkUrl?: string;
  publishedAt?: string;
  checkedAt: number;
}

/**
 * Compares two semantic version strings.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parseParts = (v: string): number[] => {
    return v
      .trim()
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((part) => {
        const num = parseInt(part, 10);
        return isNaN(num) ? 0 : num;
      });
  };

  const p1 = parseParts(v1);
  const p2 = parseParts(v2);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

export interface CheckUpdateOptions {
  force?: boolean;
  currentVersion?: string;
  repo?: string;
  notify?: boolean;
  fetchFn?: typeof fetch;
}

/**
 * Checks GitHub Releases API for a newer version of Sapa-ai.
 * Automatically throttles background requests (4-hour cache) unless `force: true`.
 */
export async function checkForAppUpdate(
  options: CheckUpdateOptions = {}
): Promise<UpdateCheckResult> {
  const currentVersion = options.currentVersion || CURRENT_APP_VERSION;
  const repo = options.repo || GITHUB_REPO;
  const force = Boolean(options.force);
  const notify = options.notify ?? true;
  const fetcher = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);

  const defaultResult: UpdateCheckResult = {
    hasUpdate: false,
    currentVersion,
    latestVersion: currentVersion,
    releaseNotes: '',
    releaseUrl: `https://github.com/${repo}/releases`,
    checkedAt: Date.now(),
  };

  if (!fetcher) {
    return defaultResult;
  }

  // Throttle check if not forced: 4 hours
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  if (!force && typeof localStorage !== 'undefined') {
    try {
      const cachedStr = localStorage.getItem(UPDATE_STORAGE_KEY);
      if (cachedStr) {
        const cached: UpdateCheckResult = JSON.parse(cachedStr);
        // The cache survives an APK upgrade, so only trust it if it was
        // produced by this same installed version.
        if (
          cached.currentVersion === currentVersion &&
          Date.now() - cached.checkedAt < FOUR_HOURS_MS
        ) {
          return {
            ...cached,
            hasUpdate: compareVersions(cached.latestVersion, currentVersion) > 0,
          };
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }

  try {
    const res = await fetcher(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      return defaultResult;
    }

    const data = await res.json();
    const tagName = (data.tag_name || '').trim();
    const cleanLatest = tagName.replace(/^v/i, '');

    const hasNewer = cleanLatest ? compareVersions(cleanLatest, currentVersion) > 0 : false;

    // Locate APK asset in release
    let apkUrl: string | undefined;
    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find(
        (asset: any) =>
          typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.apk')
      );
      if (apkAsset?.browser_download_url) {
        apkUrl = apkAsset.browser_download_url;
      }
    }

    const result: UpdateCheckResult = {
      hasUpdate: hasNewer,
      currentVersion,
      latestVersion: cleanLatest || currentVersion,
      releaseNotes: data.body || '',
      releaseUrl: data.html_url || `https://github.com/${repo}/releases`,
      apkUrl,
      publishedAt: data.published_at,
      checkedAt: Date.now(),
    };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(UPDATE_STORAGE_KEY, JSON.stringify(result));
      } catch {
        // Ignore cache write errors
      }
    }

    // Schedule native notification if an update is found and not disabled
    if (hasNewer && notify) {
      // Check if user already dismissed this specific version to avoid spamming
      let dismissedVersion: string | null = null;
      if (typeof localStorage !== 'undefined') {
        dismissedVersion = localStorage.getItem(UPDATE_DISMISSED_KEY);
      }

      if (dismissedVersion !== result.latestVersion) {
        await scheduleAppUpdateNotification({
          latestVersion: result.latestVersion,
          apkUrl: result.apkUrl,
        });
      }
    }

    return result;
  } catch (err) {
    console.warn('[updateService] Failed to check for app updates:', err);
    return defaultResult;
  }
}

/**
 * Saves a version as dismissed so it doesn't immediately re-prompt on every launch.
 */
export function dismissUpdate(version: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(UPDATE_DISMISSED_KEY, version);
    } catch {
      // Ignore
    }
  }
}

/**
 * Opens the APK download URL or GitHub release page in browser.
 */
export function openUpdateDownload(targetUrl?: string): void {
  const url = targetUrl || `https://github.com/${GITHUB_REPO}/releases/latest`;
  if (typeof window !== 'undefined') {
    window.open(url, '_system') || window.open(url, '_blank');
  }
}
