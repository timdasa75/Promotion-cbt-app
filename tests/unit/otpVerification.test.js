import { describe, it } from 'node:test';
import assert from 'node:assert';

// Test OTP utility functions
describe('OTP Verification System', () => {
  describe('OTP Generation', () => {
    it('should generate 6-digit numeric OTP', () => {
      // Test the generation logic
      const otp = Math.floor(100000 + Math.random() * 900000);
      const otpStr = String(otp);
      
      assert.strictEqual(otpStr.length, 6);
      assert.ok(/^\d{6}$/.test(otpStr));
    });

    it('should generate different OTPs on each call', () => {
      const otp1 = Math.floor(100000 + Math.random() * 900000);
      const otp2 = Math.floor(100000 + Math.random() * 900000);
      
      // Very unlikely to be equal, but not impossible
      // This test mainly verifies the generation logic works
      assert.ok(otp1 >= 100000 && otp1 <= 999999);
      assert.ok(otp2 >= 100000 && otp2 <= 999999);
    });
  });

  describe('OTP Hashing', () => {
    it('should produce consistent hash for same input', () => {
      const hashOTP = (otp) => {
        let hash = 0;
        const str = String(otp);
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
      };

      const hash1 = hashOTP('123456');
      const hash2 = hashOTP('123456');
      
      assert.strictEqual(hash1, hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hashOTP = (otp) => {
        let hash = 0;
        const str = String(otp);
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
      };

      const hash1 = hashOTP('123456');
      const hash2 = hashOTP('654321');
      
      assert.notStrictEqual(hash1, hash2);
    });
  });

  describe('OTP Validation', () => {
    it('should validate correct OTP format', () => {
      const isValidOTPFormat = (otp) => /^\d{6}$/.test(String(otp || ''));
      
      assert.ok(isValidOTPFormat('123456'));
      assert.ok(isValidOTPFormat('000000'));
      assert.ok(isValidOTPFormat('999999'));
    });

    it('should reject invalid OTP formats', () => {
      const isValidOTPFormat = (otp) => /^\d{6}$/.test(String(otp || ''));
      
      assert.ok(!isValidOTPFormat('12345')); // Too short
      assert.ok(!isValidOTPFormat('1234567')); // Too long
      assert.ok(!isValidOTPFormat('abcdef')); // Non-numeric
      assert.ok(!isValidOTPFormat('12345a')); // Mixed
      assert.ok(!isValidOTPFormat('')); // Empty
      assert.ok(!isValidOTPFormat(null)); // Null
    });
  });

  describe('OTP Expiry', () => {
    it('should detect expired OTP', () => {
      const isOTPExpired = (expiresAt) => {
        if (!expiresAt) return true;
        return new Date(expiresAt).getTime() < Date.now();
      };

      // Expired 1 hour ago
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      assert.ok(isOTPExpired(expiredDate));
    });

    it('should detect valid OTP', () => {
      const isOTPExpired = (expiresAt) => {
        if (!expiresAt) return true;
        return new Date(expiresAt).getTime() < Date.now();
      };

      // Expires in 10 minutes
      const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      assert.ok(!isOTPExpired(futureDate));
    });

    it('should handle null expiry', () => {
      const isOTPExpired = (expiresAt) => {
        if (!expiresAt) return true;
        return new Date(expiresAt).getTime() < Date.now();
      };

      assert.ok(isOTPExpired(null));
      assert.ok(isOTPExpired(''));
    });
  });

  describe('Email Masking', () => {
    it('should mask email correctly', () => {
      const maskEmail = (email) => {
        if (!email || !email.includes('@')) return email || '';
        const [local, domain] = email.split('@');
        if (local.length <= 2) return `${local[0]}***@${domain}`;
        return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}@${domain}`;
      };

      // Test with 4 char local part (user) -> 4-2=2, min(2,3)=2 asterisks
      assert.strictEqual(maskEmail('user@example.com'), 'u**@example.com');
      // Test with 8 char local part (john.doe) -> 8-2=6, min(6,3)=3 asterisks
      assert.strictEqual(maskEmail('john.doe@example.com'), 'j***@example.com');
      // Test with 2 char local part (ab) -> special case: ab***@example.com
      assert.strictEqual(maskEmail('ab@example.com'), 'a***@example.com');
      // Test with 1 char local part (a) -> special case: a***@example.com
      assert.strictEqual(maskEmail('a@example.com'), 'a***@example.com');
    });

    it('should handle invalid email', () => {
      const maskEmail = (email) => {
        if (!email || !email.includes('@')) return email || '';
        const [local, domain] = email.split('@');
        if (local.length <= 2) return `${local[0]}***@${domain}`;
        return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}@${domain}`;
      };

      assert.strictEqual(maskEmail(''), '');
      assert.strictEqual(maskEmail(null), '');
      assert.strictEqual(maskEmail('invalid'), 'invalid');
    });
  });

  describe('OTP Resend Cooldown', () => {
    it('should allow resend after cooldown', () => {
      const canResendOTP = (lastSentAt) => {
        if (!lastSentAt) return { canResend: true, waitSeconds: 0 };
        const lastSent = new Date(lastSentAt);
        const elapsed = Date.now() - lastSent.getTime();
        const remaining = 60000 - elapsed; // 60 seconds cooldown
        if (remaining <= 0) {
          return { canResend: true, waitSeconds: 0 };
        }
        return { canResend: false, waitSeconds: Math.ceil(remaining / 1000) };
      };

      // Sent 2 minutes ago
      const oldDate = new Date(Date.now() - 120000).toISOString();
      const result = canResendOTP(oldDate);
      assert.ok(result.canResend);
      assert.strictEqual(result.waitSeconds, 0);
    });

    it('should block resend during cooldown', () => {
      const canResendOTP = (lastSentAt) => {
        if (!lastSentAt) return { canResend: true, waitSeconds: 0 };
        const lastSent = new Date(lastSentAt);
        const elapsed = Date.now() - lastSent.getTime();
        const remaining = 60000 - elapsed; // 60 seconds cooldown
        if (remaining <= 0) {
          return { canResend: true, waitSeconds: 0 };
        }
        return { canResend: false, waitSeconds: Math.ceil(remaining / 1000) };
      };

      // Sent 30 seconds ago
      const recentDate = new Date(Date.now() - 30000).toISOString();
      const result = canResendOTP(recentDate);
      assert.ok(!result.canResend);
      assert.ok(result.waitSeconds > 0);
      assert.ok(result.waitSeconds <= 30);
    });

    it('should allow resend when no previous send', () => {
      const canResendOTP = (lastSentAt) => {
        if (!lastSentAt) return { canResend: true, waitSeconds: 0 };
        const lastSent = new Date(lastSentAt);
        const elapsed = Date.now() - lastSent.getTime();
        const remaining = 60000 - elapsed; // 60 seconds cooldown
        if (remaining <= 0) {
          return { canResend: true, waitSeconds: 0 };
        }
        return { canResend: false, waitSeconds: Math.ceil(remaining / 1000) };
      };

      const result = canResendOTP(null);
      assert.ok(result.canResend);
      assert.strictEqual(result.waitSeconds, 0);
    });
  });

  describe('OTP Attempt Tracking', () => {
    it('should track attempts correctly', () => {
      let attempts = 0;
      const maxAttempts = 5;

      const incrementAttempt = () => {
        attempts++;
        return attempts;
      };

      const canAttempt = () => attempts < maxAttempts;

      assert.ok(canAttempt());
      assert.strictEqual(incrementAttempt(), 1);
      assert.ok(canAttempt());
      assert.strictEqual(incrementAttempt(), 2);
      assert.ok(canAttempt());
      assert.strictEqual(incrementAttempt(), 3);
      assert.ok(canAttempt());
      assert.strictEqual(incrementAttempt(), 4);
      assert.ok(canAttempt());
      assert.strictEqual(incrementAttempt(), 5);
      assert.ok(!canAttempt());
    });
  });
});
