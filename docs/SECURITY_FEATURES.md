# Security Features Documentation

## Overview

This document describes the security features implemented in Promotion CBT to prevent subscription sharing and improve account security.

## Table of Contents

1. [Device Fingerprinting](#device-fingerprinting)
2. [OTP Verification](#otp-verification)
3. [Device Trust System](#device-trust-system)
4. [Login Alerts](#login-alerts)
5. [Admin Panel Security](#admin-panel-security)
6. [API Reference](#api-reference)

---

## Device Fingerprinting

### What It Does

Device fingerprinting generates a unique identifier for each device/browser combination. This allows the system to recognize trusted devices and require verification for new ones.

### How It Works

1. **Signal Collection**: The system collects browser signals including:
   - User agent (browser, OS)
   - Screen resolution
   - Timezone
   - Language settings
   - Hardware concurrency
   - Canvas fingerprint
   - WebGL renderer

2. **Hash Generation**: These signals are combined and hashed to create a 32-character unique fingerprint.

3. **Caching**: The fingerprint is cached in sessionStorage for the browser session.

### Implementation

**Client-side**: `js/deviceFingerprint.js`

```javascript
import { generateDeviceFingerprint, getDeviceName } from './deviceFingerprint.js';

// Get device fingerprint
const fingerprint = await generateDeviceFingerprint();

// Get human-readable device name
const deviceName = await getDeviceName(); // "Chrome on Windows 11"
```

### Device Name Examples

| Browser | OS | Device Name |
|---------|-----|-------------|
| Chrome | Windows 11 | "Chrome on Windows 11/10" |
| Safari | macOS | "Safari on macOS" |
| Chrome | Android | "Chrome on Android (Mobile)" |
| Safari | iOS | "Safari on iOS (Mobile)" |

---

## OTP Verification

### What It Does

OTP (One-Time Password) verification sends a 6-digit code to the user's email when they log in from a new device. This ensures that only the email owner can access the account.

### How It Works

1. **Login Attempt**: User enters email and password
2. **Device Check**: System checks if the device is trusted
3. **OTP Generation**: If device is not trusted, a 6-digit OTP is generated
4. **Email Delivery**: OTP is sent to the user's email via Resend
5. **Verification**: User enters the OTP to complete login

### OTP Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| OTP Length | 6 digits | Numeric code |
| Expiry | 10 minutes | Code expires after 10 minutes |
| Max Attempts | 5 | Locks after 5 failed attempts |
| Resend Cooldown | 60 seconds | Can't resend within 60 seconds |
| Rate Limit | 3 per 15 minutes | Max OTP requests per email |

### Email Template

The OTP email includes:
- Branded header with Promotion CBT logo
- 6-digit verification code
- Expiry warning (10 minutes)
- Security notice if user didn't request the code

### Implementation

**Worker Endpoint**: `/otp/request`

```javascript
// Request OTP
const response = await fetch('/otp/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    deviceFingerprint: 'abc123...',
    deviceName: 'Chrome on Windows 11'
  })
});

// Response
{
  "ok": true,
  "message": "Verification code sent.",
  "email": "u***@example.com",
  "expiresAt": "2026-08-24T21:50:07.819Z",
  "emailSent": true
}
```

---

## Device Trust System

### What It Does

The device trust system allows users to trust their devices for 30 days, so they don't need to verify with OTP on every login.

### How It Works

1. **First Login**: User logs in from a new device
2. **OTP Verification**: User verifies with OTP
3. **Trust Option**: User can check "Trust this device for 30 days"
4. **Device Storage**: Device fingerprint is stored as trusted
5. **Subsequent Logins**: Trusted devices skip OTP verification

### Trust Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Trust Duration | 30 days | Default trust period |
| Max Devices | 3 | Maximum trusted devices per user |
| Auto-revoke | Yes | Oldest device revoked when limit exceeded |

### Device Management

**Profile Page Features:**
- View all trusted devices
- See device name, last seen, expiry date
- Revoke individual devices
- Revoke all devices at once

**Admin Panel Features:**
- View all devices across users
- Search and filter devices
- Revoke any device
- Device status (Active/Expired)

### Implementation

**Worker Endpoints:**

```javascript
// Check if device is trusted
POST /device/check
{
  "email": "user@example.com",
  "deviceFingerprint": "abc123..."
}

// Trust a device
POST /device/trust
{
  "email": "user@example.com",
  "deviceFingerprint": "abc123...",
  "deviceName": "Chrome on Windows 11",
  "trustDays": 30
}

// Revoke a device
POST /device/revoke
{
  "email": "user@example.com",
  "deviceId": "dev_abc123"
}

// List all devices
GET /device/list?email=user@example.com
```

---

## Login Alerts

### What It Does

Login alerts send an email notification to users when a new device logs into their account. This helps users detect unauthorized access.

### Alert Content

The login alert email includes:
- Device name
- IP address
- Login time
- Security warning if activity not recognized

### When Alerts Are Sent

- Login from a new (untrusted) device
- Login after device trust has expired
- Login from a different geographic location (future enhancement)

### Implementation

**Worker Endpoint**: `/login/alert`

```javascript
// Send login alert
POST /login/alert
{
  "email": "user@example.com",
  "deviceName": "Chrome on Windows 11",
  "ipAddress": "192.168.1.1",
  "loginTime": "2026-08-24T21:50:07.819Z"
}
```

---

## Admin Panel Security

### Device Management

The admin panel includes a "Security & Devices" section with:

1. **Device Management**
   - View all trusted devices across users
   - Search by email or device name
   - Filter by status (Active/Expired)
   - Revoke individual devices

2. **Login Audit Log**
   - View security events
   - Filter by event type
   - Event types: OTP sent, OTP verified, Device trusted, Device revoked

3. **Dashboard Summary**
   - Total users count
   - Premium users count
   - Trusted devices count
   - Recent logins count

### Bulk Operations

Admins can perform bulk operations on users:

1. **Bulk Plan Change**
   - Select multiple users
   - Change plan for all selected users
   - Confirmation required

2. **CSV Export**
   - Export user list to CSV
   - Includes: Email, Plan, Status, Role, Verified, Created, Last Seen

---

## API Reference

### Authentication

All API endpoints require proper origin headers:

```
Origin: https://timdasa75.github.io
```

### Endpoints

#### Device Trust

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/device/check` | POST | Check if device is trusted |
| `/device/trust` | POST | Add device to trusted list |
| `/device/revoke` | POST | Revoke a device |
| `/device/revoke-all` | POST | Revoke all devices |
| `/device/list` | GET | List all trusted devices |

#### OTP Verification

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/otp/request` | POST | Request OTP code |
| `/otp/verify` | POST | Verify OTP code |
| `/otp/resend` | POST | Resend OTP code |

#### Login Alerts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login/alert` | POST | Send login alert email |

### Response Format

All endpoints return JSON responses:

```json
{
  "ok": true,
  "message": "Success message",
  "data": { ... }
}
```

Error responses:

```json
{
  "ok": false,
  "error": "Error message"
}
```

---

## Security Best Practices

### For Users

1. **Trust Only Your Devices**: Only check "Trust this device" on personal devices
2. **Review Trusted Devices**: Regularly review and revoke unused devices
3. **Report Suspicious Activity**: Contact support if you receive unexpected login alerts
4. **Use Strong Passwords**: Combine with strong, unique passwords

### For Administrators

1. **Monitor Audit Logs**: Regularly review login and device events
2. **Revoke Suspicious Devices**: Immediately revoke devices that seem unauthorized
3. **Bulk Operations**: Use bulk operations carefully to avoid accidental changes
4. **Export Regularly**: Export user data for backup and analysis

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| OTP not received | Check spam folder, wait 60 seconds, try resend |
| Device not trusted | Re-verify with OTP, ensure "Trust this device" is checked |
| Login alert not received | Check email settings, verify email address |
| Admin panel not loading | Ensure admin email is configured in Worker env vars |

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Invalid request parameters |
| 401 | Invalid or expired OTP |
| 403 | Origin not allowed |
| 404 | User not found |
| 429 | Rate limit exceeded |

---

## Future Enhancements

1. **Geo-velocity Check**: Detect logins from distant locations
2. **Session Management**: View and manage active sessions
3. **Suspicious Activity Detection**: Automatically flag unusual patterns
4. **Two-Factor Authentication**: Optional TOTP-based 2FA
5. **Device Fingerprinting Improvements**: More robust fingerprinting techniques

---

## Support

For security-related issues, contact:
- Email: support@promotioncbt.com
- In-app feedback form

---

*Last updated: August 24, 2026*
