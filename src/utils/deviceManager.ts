/**
 * Device & Machine Fingerprinting and Authorization Manager
 * KHBD AI PRO
 * 
 * Accurately identifies physical computers/machines so that:
 * - Different browsers on the SAME machine (e.g. Chrome, Edge, Firefox, CocCoc) share the machine fingerprint.
 * - Multiple web applications or windows on the SAME physical computer count as ONLY 1 machine (never 2 machines).
 * - Each physical machine counts as 1 device toward the account's allowed device limit (default 2 machines).
 */

export interface DeviceInfo {
  machineId: string;
  deviceName: string;
  os: string;
  browser: string;
  screenResolution: string;
  physicalResolution: string;
  cpuCores: number;
  gpuModel: string;
  hardwareSig: string;
  appName: string;
}

export interface MinimalDeviceRecord {
  deviceId?: string;
  deviceName?: string;
  os?: string;
  browser?: string;
  appName?: string;
  usedApps?: string[];
  hardwareSig?: string;
  firstLogin?: string;
  lastActive?: string;
}

/**
 * Normalizes WebGL GPU renderer string to isolate the physical GPU chip.
 * Removes browser-specific engine wrappers like ANGLE, Direct3D11, Direct3D12, PCI IDs, etc.
 * E.g.:
 * - Chrome: "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)" -> "intel uhd graphics 620"
 * - Edge:   "ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00003EA0) Direct3D11 vs_5_0 ps_5_0, D3D11)" -> "intel uhd graphics 620"
 * - Firefox:"Intel(R) UHD Graphics 620" -> "intel uhd graphics 620"
 */
export function normalizeGpuRenderer(raw: string): string {
  if (!raw) return 'generic_gpu';
  let cleaned = raw;
  // Remove ANGLE (...) wrapper
  cleaned = cleaned.replace(/^ANGLE\s*\((.*)\)$/i, '$1');
  // Remove vendor prefix duplicated inside ANGLE like "Intel, " or "Google, "
  cleaned = cleaned.replace(/^(Intel|NVIDIA|AMD|Apple|Google|Microsoft|Qualcomm),\s*/i, '');
  // Remove PCI / device addresses like (0x00003EA0)
  cleaned = cleaned.replace(/\(0x[0-9a-fA-F]+\)/g, '');
  // Remove Direct3D / OpenGL / Metal / Vulkan engine identifiers
  cleaned = cleaned.replace(/Direct3D\d*(\.\d+)?/gi, '');
  cleaned = cleaned.replace(/D3D\d*/gi, '');
  cleaned = cleaned.replace(/OpenGL(\s*ES)?(\s*\d+(\.\d+)?)?/gi, '');
  cleaned = cleaned.replace(/Metal/gi, '');
  cleaned = cleaned.replace(/Vulkan/gi, '');
  cleaned = cleaned.replace(/vs_\d+_\d+/gi, '');
  cleaned = cleaned.replace(/ps_\d+_\d+/gi, '');
  // Remove trademark symbols (R), (TM)
  cleaned = cleaned.replace(/\([R|TM]\)/gi, '');
  // Normalize whitespace and punctuation
  cleaned = cleaned.replace(/[,;|_]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
  return cleaned || 'generic_gpu';
}

// Helper to get WebGL GPU renderer string
function getGpuHardwareRenderer(): { raw: string; normalized: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const raw = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        return { raw, normalized: normalizeGpuRenderer(raw) };
      }
    }
  } catch {}
  return { raw: '', normalized: 'generic_gpu' };
}

// Generate a deterministic hardware machine fingerprint
export function getMachineHardwareFingerprint(appName: string = 'KHBD AI PRO'): DeviceInfo {
  // 1. Detect OS
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  let os = 'Máy tính';
  if (ua.indexOf('Win') !== -1) os = 'Windows PC';
  else if (ua.indexOf('Mac') !== -1) os = 'macOS Apple';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux PC';
  else if (ua.indexOf('Android') !== -1) os = 'Điện thoại Android';
  else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'Thiết bị iOS';

  // 2. Detect Browser
  let browser = 'Trình duyệt';
  if (ua.indexOf('Edg') !== -1) browser = 'Edge';
  else if (ua.indexOf('CocCoc') !== -1 || ua.indexOf('coc_coc') !== -1) browser = 'Cốc Cốc';
  else if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('Safari') !== -1) browser = 'Safari';
  else if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) browser = 'Opera';

  // 3. Physical Screen Specs & Resolution Normalization
  // Different browser zoom or display scaling (100%, 125%, 150%) on Windows will report different window.screen.width,
  // but multiplying by devicePixelRatio gives the physical native display resolution (e.g. 1920x1080)
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
  const rawW = typeof window !== 'undefined' && window.screen ? window.screen.width : 1920;
  const rawH = typeof window !== 'undefined' && window.screen ? window.screen.height : 1080;
  const colorDepth = typeof window !== 'undefined' && window.screen ? (window.screen.colorDepth || 24) : 24;
  const screenResolution = `${rawW}x${rawH}`;

  const physicalW = Math.round(rawW * dpr);
  const physicalH = Math.round(rawH * dpr);
  // Sort max x min so orientation doesn't change resolution
  const physicalResolution = `${Math.max(physicalW, physicalH)}x${Math.min(physicalW, physicalH)}`;

  const cpuCores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
  const timeZone = typeof Intl !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh') : 'Asia/Ho_Chi_Minh';
  const gpuInfo = getGpuHardwareRenderer();

  // 4. Combine deterministic physical hardware components into canonical stable hash
  // Using normalized GPU + Physical Resolution + CPU Cores + TimeZone ensures:
  // - Chrome and Edge on the same computer produce the exact same fingerprint.
  // - 2 different web applications or PWAs on the same computer produce the exact same fingerprint.
  const hardwareSig = `${os}|${physicalResolution}|${cpuCores}|${timeZone}|${gpuInfo.normalized}`;

  let hash1 = 5381;
  let hash2 = 0;
  for (let i = 0; i < hardwareSig.length; i++) {
    const char = hardwareSig.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = (hash2 << 5) - hash2 + char;
    hash1 |= 0;
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).toUpperCase().padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).toUpperCase().padStart(6, '0');
  const persistentId = `MC-${hex1}-${hex2}`;

  try {
    localStorage.setItem('khbd_machine_identifier', persistentId);
    localStorage.setItem('khbd_hardware_sig', hardwareSig);
  } catch {}

  const deviceName = `${os} (${screenResolution}, ${cpuCores} Cores)`;

  return {
    machineId: persistentId,
    deviceName,
    os,
    browser,
    screenResolution,
    physicalResolution,
    cpuCores,
    gpuModel: gpuInfo.normalized,
    hardwareSig,
    appName,
  };
}

export function getCurrentMachineId(): string {
  const info = getMachineHardwareFingerprint();
  return info.machineId;
}

/**
 * Robust check to determine if two device records correspond to the SAME physical machine.
 * This handles:
 * - Direct deviceId match
 * - Canonical hardware signature match
 * - Cross-application match: Multiple apps (e.g. App 1 & App 2) on the same computer
 * - Cross-browser match (e.g. Chrome, Edge, Cốc Cốc, Firefox)
 * - Display scaling variations (100%, 125%, 150% scaling on Windows)
 */
export function isSamePhysicalMachine(
  devA: MinimalDeviceRecord,
  devB: MinimalDeviceRecord
): boolean {
  if (!devA || !devB) return false;

  // 1. Direct deviceId match
  if (devA.deviceId && devB.deviceId && devA.deviceId === devB.deviceId) {
    return true;
  }

  // 2. Exact hardware signature match
  if (devA.hardwareSig && devB.hardwareSig && devA.hardwareSig === devB.hardwareSig) {
    return true;
  }

  // Extract structured hardware attributes from hardwareSig, deviceName, or fields
  const parseSig = (dev: MinimalDeviceRecord) => {
    const parts = (dev.hardwareSig || '').split('|');
    const os = dev.os || parts[0] || '';
    const res = (dev as any).physicalResolution || parts[1] || '';
    const cores = (dev as any).cpuCores || Number(parts[2]) || 0;
    const tz = (dev as any).timeZone || parts[3] || '';
    const gpu = (dev as any).gpuModel || parts[4] || '';

    // Also parse from deviceName if available: e.g. "Windows PC (1536x864, 8 Cores)"
    const name = dev.deviceName || '';
    const nameCores = Number((name.match(/(\d+)\s*Cores/i) || [])[1]) || 0;
    const nameRes = (name.match(/(\d+x\d+)/i) || [])[1] || '';

    return {
      os: os.trim().toLowerCase(),
      cores: cores || nameCores,
      res: res || nameRes,
      tz: tz.trim().toLowerCase(),
      gpu: gpu.trim().toLowerCase(),
      appName: (dev.appName || '').trim().toLowerCase(),
      usedApps: Array.isArray(dev.usedApps) ? dev.usedApps.map((a) => a.trim().toLowerCase()) : [],
    };
  };

  const a = parseSig(devA);
  const b = parseSig(devB);

  // Normalize OS family:
  // "windows pc", "windows", "win" -> "win"
  // "macos apple", "mac", "macintosh" -> "mac"
  // "linux pc", "linux" -> "linux"
  // "android" -> "android"
  // "iphone", "ipad", "ios" -> "ios"
  const getOsFamily = (osStr: string) => {
    if (osStr.includes('win')) return 'win';
    if (osStr.includes('mac')) return 'mac';
    if (osStr.includes('linux')) return 'linux';
    if (osStr.includes('android')) return 'android';
    if (osStr.includes('ios') || osStr.includes('iphone') || osStr.includes('ipad')) return 'ios';
    return osStr;
  };

  const osFamA = getOsFamily(a.os);
  const osFamB = getOsFamily(b.os);

  // If OS families are known and explicitly different (e.g. Windows PC vs Android Phone), they are different machines
  if (osFamA && osFamB && osFamA !== osFamB) {
    return false;
  }

  // Helper for screen aspect ratio (e.g. 1920x1080, 1536x864, 1280x720 all have ratio 1.777)
  const getAspect = (resStr: string): number => {
    if (!resStr) return 0;
    const parts = resStr.split('x').map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      return Math.max(parts[0], parts[1]) / Math.min(parts[0], parts[1]);
    }
    return 0;
  };

  const aspectA = getAspect(a.res);
  const aspectB = getAspect(b.res);
  const aspectMatch = aspectA > 0 && aspectB > 0 && Math.abs(aspectA - aspectB) < 0.05;
  const resExactMatch = a.res && b.res && a.res === b.res;

  // Parse GPU core vendor
  const getGpuVendor = (gpuStr: string) => {
    if (!gpuStr || gpuStr === 'generic_gpu') return 'generic';
    if (gpuStr.includes('intel')) return 'intel';
    if (gpuStr.includes('nvidia') || gpuStr.includes('geforce') || gpuStr.includes('rtx') || gpuStr.includes('gtx')) return 'nvidia';
    if (gpuStr.includes('amd') || gpuStr.includes('radeon')) return 'amd';
    if (gpuStr.includes('apple') || gpuStr.includes('m1') || gpuStr.includes('m2') || gpuStr.includes('m3') || gpuStr.includes('m4')) return 'apple';
    return gpuStr;
  };

  const gpuVendA = getGpuVendor(a.gpu);
  const gpuVendB = getGpuVendor(b.gpu);
  const gpuCompatible =
    gpuVendA === 'generic' ||
    gpuVendB === 'generic' ||
    gpuVendA === gpuVendB;

  // 3. High-Confidence Hardware Matching:
  // Both on the same OS (e.g. Windows PC or macOS)
  if (osFamA && osFamB && osFamA === osFamB) {
    // Both have CPU cores and they match (e.g. 8 cores == 8 cores, 4 cores == 4 cores)
    if (a.cores > 0 && b.cores > 0 && a.cores === b.cores) {
      // If GPU vendor is compatible (e.g. both Intel or one generic_gpu)
      if (gpuCompatible) {
        // If aspect ratio matches (e.g. both 16:9), or exact res matches, or timezone matches:
        if (resExactMatch || aspectMatch || (a.tz && b.tz && a.tz === b.tz)) {
          return true;
        }
      }
    }

    // Exact deviceName match (e.g. "Windows PC (1536x864, 8 Cores)")
    if (devA.deviceName && devB.deviceName && devA.deviceName === devB.deviceName) {
      return true;
    }

    // Fallback placeholder names (e.g. "Máy tính #1" or "Máy tính" matched with detected machine info)
    const isPlaceholderA = !devA.deviceName || devA.deviceName.startsWith('Máy tính #') || devA.deviceName === 'Máy tính';
    const isPlaceholderB = !devB.deviceName || devB.deviceName.startsWith('Máy tính #') || devB.deviceName === 'Máy tính';
    if ((isPlaceholderA || isPlaceholderB) && a.cores > 0 && b.cores > 0 && a.cores === b.cores) {
      return true;
    }

    // Cross-Application check:
    // When a user logs in from 2 different applications on the same PC:
    // E.g. App 1 (KHBD AI PRO) and App 2 (another tool/origin), on the same OS and CPU cores:
    if (a.appName !== b.appName || a.usedApps.length > 0 || b.usedApps.length > 0) {
      if (a.cores > 0 && b.cores > 0 && a.cores === b.cores && gpuCompatible) {
        return true;
      }
      if (resExactMatch && (a.cores === b.cores || a.cores === 0 || b.cores === 0)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Deduplicates an authorized devices list by merging records that belong to the SAME physical computer.
 * Consolidates browsers (e.g. "Chrome, Edge") and used apps (e.g. ["KHBD AI PRO", "Soạn đề"]),
 * ensuring 1 computer is only counted as 1 device quota slot.
 */
export function deduplicateAuthorizedDevices<T extends MinimalDeviceRecord>(devices: T[]): T[] {
  if (!Array.isArray(devices) || devices.length <= 1) {
    return Array.isArray(devices) ? devices : [];
  }

  const result: T[] = [];

  for (const dev of devices) {
    const matchIndex = result.findIndex((existing) => isSamePhysicalMachine(existing, dev));
    if (matchIndex >= 0) {
      // Merge with existing device on the same physical computer
      const existing = result[matchIndex];
      // Combine browser names without duplicates
      const browserList = Array.from(
        new Set([
          ...(existing.browser ? existing.browser.split(/[,/]/).map((s) => s.trim()) : []),
          ...(dev.browser ? dev.browser.split(/[,/]/).map((s) => s.trim()) : []),
        ])
      ).filter(Boolean);

      // Combine used apps without duplicates
      const usedAppsList = Array.from(
        new Set([
          ...(existing.usedApps || []),
          ...(dev.usedApps || []),
          existing.appName,
          dev.appName,
        ])
      ).filter(Boolean) as string[];

      result[matchIndex] = {
        ...existing,
        lastActive: dev.lastActive || existing.lastActive,
        browser: browserList.length > 0 ? browserList.join(', ') : (existing.browser || dev.browser),
        appName: dev.appName || existing.appName || 'KHBD AI PRO',
        usedApps: usedAppsList.length > 0 ? usedAppsList : ['KHBD AI PRO'],
        hardwareSig: existing.hardwareSig || dev.hardwareSig,
      };
    } else {
      result.push({
        ...dev,
        usedApps: dev.usedApps || (dev.appName ? [dev.appName] : ['KHBD AI PRO']),
      });
    }
  }

  // Safety check: if 2 entries remain, check if they can be merged under broader physical machine rules
  if (result.length === 2 && isSamePhysicalMachine(result[0], result[1])) {
    const dev0 = result[0];
    const dev1 = result[1];
    const mergedApps = Array.from(
      new Set([
        ...(dev0.usedApps || []),
        ...(dev1.usedApps || []),
        dev0.appName,
        dev1.appName,
      ])
    ).filter(Boolean) as string[];

    const mergedBrowsers = Array.from(
      new Set([
        ...(dev0.browser ? dev0.browser.split(/[,/]/).map((s) => s.trim()) : []),
        ...(dev1.browser ? dev1.browser.split(/[,/]/).map((s) => s.trim()) : []),
      ])
    ).filter(Boolean);

    return [{
      ...dev0,
      lastActive: dev1.lastActive || dev0.lastActive,
      browser: mergedBrowsers.join(', ') || dev0.browser,
      appName: dev1.appName || dev0.appName || 'KHBD AI PRO',
      usedApps: mergedApps.length > 0 ? mergedApps : ['KHBD AI PRO'],
      hardwareSig: dev0.hardwareSig || dev1.hardwareSig,
    }];
  }

  return result;
}

