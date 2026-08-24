/**
 * Device Fingerprint Module
 * 
 * Generates unique device identifiers for trusted device management.
 * Used to identify user devices and prevent subscription sharing.
 */

const FINGERPRINT_CACHE_KEY = 'cbt_device_fingerprint';
const DEVICE_NAME_CACHE_KEY = 'cbt_device_name';

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
  // Check cache first
  const cached = sessionStorage.getItem(FINGERPRINT_CACHE_KEY);
  if (cached) return cached;
  
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
  
  // Cache the fingerprint
  try {
    sessionStorage.setItem(FINGERPRINT_CACHE_KEY, hash);
  } catch (e) {
    // Storage might be full or disabled
  }
  
  return hash;
}

/**
 * Get or generate device name with caching
 * @returns {string} - Device name
 */
export function getDeviceName() {
  const cached = sessionStorage.getItem(DEVICE_NAME_CACHE_KEY);
  if (cached) return cached;
  
  const name = generateDeviceName();
  try {
    sessionStorage.setItem(DEVICE_NAME_CACHE_KEY, name);
  } catch (e) {
    // Storage might be full or disabled
  }
  
  return name;
}

/**
 * Clear fingerprint cache (for testing or forced re-verification)
 */
export function clearFingerprintCache() {
  try {
    sessionStorage.removeItem(FINGERPRINT_CACHE_KEY);
    sessionStorage.removeItem(DEVICE_NAME_CACHE_KEY);
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
  generateDeviceName,
  getDeviceName,
  getDeviceInfo,
  clearFingerprintCache,
  isFingerprintingSupported,
};
