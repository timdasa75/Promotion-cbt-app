/**
 * Device Fingerprint Module
 * 
 * Generates unique device identifiers for trusted device management.
 * Used to identify user devices and prevent subscription sharing.
 */

const FINGERPRINT_CACHE_KEY = 'cbt_device_fingerprint';
const DEVICE_NAME_CACHE_KEY = 'cbt_device_name';

/**
 * Read a cached value with localStorage first (stable across tabs and browser
 * restarts), falling back to the legacy sessionStorage cache so an identity
 * minted before this change survives. A value found only in sessionStorage is
 * promoted to localStorage by the matching write path below.
 */
function cachedGet(key) {
  try {
    const local = window.localStorage.getItem(key);
    if (local) return local;
  } catch (e) {
    // localStorage unavailable (private mode / blocked) — fall through.
  }
  try {
    return window.sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

/**
 * Persist a cached value to localStorage when possible, mirroring it into
 * sessionStorage. Mirroring keeps the value identical across all tabs of the
 * same browser profile even if localStorage is later blocked.
 */
function cachedSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    // localStorage unavailable — sessionStorage mirror below still applies.
  }
  try {
    window.sessionStorage.setItem(key, value);
  } catch (e) {
    // Storage might be full or disabled.
  }
}

/**
 * Simple hash function for fingerprint generation
 * @param {string} str - String to hash
 * @returns {string} - 32-character hash
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate a canvas fingerprint for unique identification
 * @returns {string} - Canvas hash
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('PromotionCBT', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('PromotionCBT', 4, 17);
    
    return canvas.toDataURL().slice(-32);
  } catch (e) {
    return 'canvas-error';
  }
}

/**
 * Get WebGL renderer info
 * @returns {string} - WebGL renderer string
 */
function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';
    
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).slice(0, 50);
  } catch (e) {
    return 'webgl-error';
  }
}

/**
 * Detect browser name from user agent
 * @param {string} userAgent - Navigator user agent string
 * @returns {string} - Browser name
 */
function detectBrowser(userAgent) {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('edg/') || ua.includes('edge/')) return 'Edge';
  if (ua.includes('opr/') || ua.includes('opera/')) return 'Opera';
  if (ua.includes('chrome') && !ua.includes('edg/')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('msie') || ua.includes('trident/')) return 'IE';
  
  return 'Unknown';
}

/**
 * Detect the OS family from user agent + platform, WITHOUT browser identity.
 * All browsers on one physical device report the same OS family, so this is a
 * device-level signal (unlike detectBrowser).
 * @param {string} userAgent - Navigator user agent string
 * @param {string} platform - Navigator platform string
 * @returns {string} - OS family name
 */
function getOsFamily(userAgent, platform) {
  const ua = userAgent.toLowerCase();
  const plat = platform.toLowerCase();
  
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipod') || ua.includes('ipad')) return 'iOS';
  if (ua.includes('windows') || plat.includes('win')) return 'Windows';
  if (ua.includes('mac') || plat.includes('mac')) return 'macOS';
  if (ua.includes('cros')) return 'ChromeOS';
  if (ua.includes('linux') || plat.includes('linux')) return 'Linux';
  
  return 'Unknown';
}

/**
 * Extract a browser-agnostic device model / OS-version token from the UA.
 * Android exposes the device model (e.g. SM-S918B, Pixel 7); iOS exposes the
 * OS version; Windows/macOS expose kernel versions. Browser identifiers such
 * as "Chrome/125" or "Mobile Safari/17.0" are never included.
 * @param {string} userAgent - Navigator user agent string
 * @returns {string} - Device model token or ''
 */
function getDeviceModelToken(userAgent) {
  const ua = userAgent || '';
  
  // Android: (Linux; Android 13; SM-S918B Build/TP1A.220624.014)
  const android = ua.match(/\(Linux; Android [\d.]+; ([^;)]+)/);
  if (android) {
    const model = android[1].replace(/\s*Build\/.*$/i, '').trim();
    return model ? `Android ${model}` : 'Android';
  }
  // iOS: (iPhone; CPU iPhone OS 17_5 like Mac OS X)
  const ios = ua.match(/\(([^;]+); CPU (?:iPhone|iPad|iPod) OS (\d+)_(\d+)/);
  if (ios) return `iOS ${ios[2]}.${ios[3]}`;
  // Windows NT kernel version (device-family level info)
  const win = ua.match(/Windows NT ([\d.]+)/);
  if (win) return `Windows NT ${win[1]}`;
  // macOS
  const mac = ua.match(/Mac OS X ([\d_]+)/);
  if (mac) return `macOS ${mac[1].replace(/_/g, '.')}`;
  
  return '';
}

/**
 * Normalized GPU identifier that matches across browsers on the same device.
 * Chrome renders "ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 ...)"
 * while Firefox reports "NVIDIA Corporation -- NVIDIA GeForce GTX 1060 6GB --
 * GLSL..."; both are normalized to the shared chip token so the device hash
 * agrees. Returns '' when WebGL is unavailable.
 * @returns {string} - Normalized GPU key or ''
 */
function getGpuKey() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    const vendor = String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '');
    if (!renderer && !vendor) return '';
    
    // Flatten ANGLE wrappers and split on comma / ' -- ' segment boundaries.
    const combined = `${renderer} | ${vendor}`;
    const flattened = combined.replace(/^ANGLE\s*[\( ]*/i, '').replace(/\)+/g, '');
    const parts = flattened.split(/\s*(?:--|,)\s*/).map((p) => p.trim()).filter(Boolean);
    
    // Drop standalone vendor-only segments (Chrome blends them into one part;
    // Firefox separates "NVIDIA Corporation").
    const vendorOnly = /^(NVIDIA|Qualcomm|AMD|ATI|Intel|ARM|Google|Apple|Mesa|Microsoft)$/i;
    const family = /(GeForce|Radeon|Adreno|Mali|Apple\s*M\d|Intel|Arc|Snapdragon|PowerVR|Tegra|Vivante|Mesa\s*\()/i;
    const meaningful = parts.filter((p) => !vendorOnly.test(p.trim()));
    let chip = meaningful.find((p) => family.test(p)) || meaningful[0] || '';
    
    // Strip API/runtime suffixes that differ between browsers.
    chip = chip.split(/\s+(?:Direct3D|DirectX|OpenGL|GLSL|Vulkan|D3D|d3d|gles|webgl|vs_|ps_)/i)[0];
    // Drop stray Chrome items like "D3D11" segments and trailing punctuation.
    chip = chip.replace(/^\s*D3D\w*\s*/i, '').replace(/[()]/g, '').replace(/[,\s]+$/g, '').trim();
    
    return chip.slice(0, 60);
  } catch (e) {
    return '';
  }
}

/**
 * Detect OS from user agent and platform
 * @param {string} userAgent - Navigator user agent string
 * @param {string} platform - Navigator platform string
 * @returns {string} - OS name
 */
function detectOS(userAgent, platform) {
  const ua = userAgent.toLowerCase();
  const plat = platform.toLowerCase();
  
  if (ua.includes('win') || plat.includes('win')) {
    if (ua.includes('windows nt 10')) return 'Windows 11/10';
    if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
    if (ua.includes('windows nt 6.2')) return 'Windows 8';
    return 'Windows';
  }
  if (ua.includes('mac') || plat.includes('mac')) return 'macOS';
  if (ua.includes('linux') || plat.includes('linux')) return 'Linux';
  if (ua.includes('android') || plat.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  
  return 'Unknown';
}

/**
 * Detect device type
 * @param {string} userAgent - Navigator user agent string
 * @returns {string} - Device type
 */
function detectDeviceType(userAgent) {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  }
  if (ua.includes('ipad') || ua.includes('tablet')) {
    return 'Tablet';
  }
  return 'Desktop';
}

/**
 * Generate a browser-agnostic hash of the PHYSICAL DEVICE: screen geometry,
 * hardware concurrency, touch capability, OS family + device model, GPU and
 * timezone. Browser-specific signals (user agent browser token, languages,
 * canvas rendering, cookie state) are deliberately excluded so every browser
 * on the same device produces the same hash — this is what lets the Worker
 * treat "Chrome" and "Firefox on the same phone" as one device while still
 * OTP-gating genuinely different hardware.
 * @returns {string} - 16-character device-signals hash
 */
export function generateDeviceSignalsHash() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  
  const signals = {
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    cores: String(navigator.hardwareConcurrency || 0),
    touch: String(navigator.maxTouchPoints || 0),
    os: getOsFamily(ua, platform),
    model: getDeviceModelToken(ua),
    gpu: getGpuKey(),
    tz: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      } catch (e) {
        return '';
      }
    })(),
  };
  
  const combined = Object.values(signals).join('|');
  const hash = simpleHash(combined) + simpleHash(signals.os + signals.model + signals.gpu + signals.screen).slice(0, 8);
  return hash.padEnd(16, '0').slice(0, 16);
}

/**
 * Generate a human-readable device name
 * @returns {string} - Device name like "Chrome on Windows 11"
 */
export function generateDeviceName() {
  const browser = detectBrowser(navigator.userAgent);
  const os = detectOS(navigator.userAgent, navigator.platform);
  const deviceType = detectDeviceType(navigator.userAgent);
  
  if (deviceType === 'Mobile') {
    return `${browser} on ${os} (${deviceType})`;
  }
  return `${browser} on ${os}`;
}

/**
 * Generate device fingerprint from browser signals
 * @returns {string} - 32-character fingerprint hash
 */
export function generateDeviceFingerprint() {
  // Check cache first — the cache is persistent (localStorage), so the same
  // browser profile keeps one stable identity across tabs and restarts. A
  // per-tab/session identity made every new tab look like a brand-new device
  // and defeated device capture (the Worker then OTP-gated every login).
  const cached = cachedGet(FINGERPRINT_CACHE_KEY);
  if (cached) {
    cachedSet(FINGERPRINT_CACHE_KEY, cached);
    return cached;
  }
  
  const signals = {
    userAgent: navigator.userAgent || '',
    platform: navigator.platform || '',
    language: navigator.language || '',
    languages: (navigator.languages || []).join(','),
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    timezoneOffset: String(new Date().getTimezoneOffset()),
    hardwareConcurrency: String(navigator.hardwareConcurrency || 0),
    deviceMemory: String(navigator.deviceMemory || 0),
    maxTouchPoints: String(navigator.maxTouchPoints || 0),
    cookieEnabled: String(navigator.cookieEnabled),
    doNotTrack: navigator.doNotTrack || '',
    canvas: getCanvasFingerprint(),
    webgl: getWebGLInfo(),
  };
  
  // Combine all signals into a single string
  const combined = Object.values(signals).join('|');
  
  // Generate hash
  let hash = '';
  const parts = [
    simpleHash(combined),
    simpleHash(navigator.userAgent + navigator.platform),
    simpleHash(screen.width + screen.height + navigator.language),
  ];
  hash = parts.join('');
  
  // Ensure 32 characters
  hash = hash.padEnd(32, '0').slice(0, 32);
  
  // Cache the fingerprint persistently
  cachedSet(FINGERPRINT_CACHE_KEY, hash);
  
  return hash;
}

/**
 * Get or generate device name with caching
 * @returns {string} - Device name
 */
export function getDeviceName() {
  const cached = cachedGet(DEVICE_NAME_CACHE_KEY);
  if (cached) return cached;
  
  const name = generateDeviceName();
  cachedSet(DEVICE_NAME_CACHE_KEY, name);
  
  return name;
}

/**
 * Clear fingerprint cache (for testing or forced re-verification)
 */
export function clearFingerprintCache() {
  try {
    window.localStorage.removeItem(FINGERPRINT_CACHE_KEY);
    window.localStorage.removeItem(DEVICE_NAME_CACHE_KEY);
  } catch (e) {
    // Ignore storage errors
  }
  try {
    window.sessionStorage.removeItem(FINGERPRINT_CACHE_KEY);
    window.sessionStorage.removeItem(DEVICE_NAME_CACHE_KEY);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Check if device fingerprinting is supported
 * @returns {boolean}
 */
export function isFingerprintingSupported() {
  try {
    // Basic checks
    if (!navigator.userAgent) return false;
    if (!navigator.platform) return false;
    if (!screen || !screen.width) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get device info for display purposes
 * @returns {object} - Device information
 */
export function getDeviceInfo() {
  return {
    fingerprint: generateDeviceFingerprint(),
    deviceSignalsHash: generateDeviceSignalsHash(),
    name: getDeviceName(),
    browser: detectBrowser(navigator.userAgent),
    os: detectOS(navigator.userAgent, navigator.platform),
    deviceType: detectDeviceType(navigator.userAgent),
    screen: `${screen.width}x${screen.height}`,
    language: navigator.language || 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
  };
}

export default {
  generateDeviceFingerprint,
  generateDeviceSignalsHash,
  generateDeviceName,
  getDeviceName,
  getDeviceInfo,
  clearFingerprintCache,
  isFingerprintingSupported,
};
