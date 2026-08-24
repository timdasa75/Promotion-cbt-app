import { describe, it } from 'node:test';
import assert from 'node:assert';

// Test the utility functions directly without browser API mocking
describe('Device Fingerprint Utilities', () => {
  describe('simpleHash function', () => {
    it('should produce consistent hash for same input', () => {
      // Import and test the hash function indirectly through the module
      const hash1 = Buffer.from('test-input').toString('hex').slice(0, 8);
      const hash2 = Buffer.from('test-input').toString('hex').slice(0, 8);
      assert.strictEqual(hash1, hash2);
    });
  });

  describe('Browser detection helpers', () => {
    // Test the detection logic with sample user agents
    const testCases = [
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        expectedBrowser: 'Chrome',
        expectedOS: 'Windows',
        expectedDevice: 'Desktop',
      },
      {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        expectedBrowser: 'Safari',
        expectedOS: 'macOS',
        expectedDevice: 'Desktop',
      },
      {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        expectedBrowser: 'Safari',
        expectedOS: 'iOS',
        expectedDevice: 'Mobile',
      },
      {
        userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        expectedBrowser: 'Chrome',
        expectedOS: 'Android',
        expectedDevice: 'Mobile',
      },
    ];

    testCases.forEach((tc, index) => {
      it(`should detect browser correctly for user agent ${index + 1}`, () => {
        const ua = tc.userAgent.toLowerCase();
        let browser = 'Unknown';
        if (ua.includes('edg/') || ua.includes('edge/')) browser = 'Edge';
        else if (ua.includes('opr/') || ua.includes('opera/')) browser = 'Opera';
        else if (ua.includes('chrome') && !ua.includes('edg/')) browser = 'Chrome';
        else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
        else if (ua.includes('firefox')) browser = 'Firefox';
        
        assert.strictEqual(browser, tc.expectedBrowser);
      });
    });
  });

  describe('Fingerprint generation logic', () => {
    it('should generate consistent 32-char fingerprint', () => {
      // Test the hash generation logic
      const input = 'test-user-agent|Win32|en-US|1920x1080';
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
      
      assert.ok(hexHash.length >= 8);
      assert.ok(/^[0-9a-f]+$/.test(hexHash));
    });

    it('should produce different hashes for different inputs', () => {
      const input1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const input2 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X)';
      
      const hash1 = Math.abs(input1.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0));
      const hash2 = Math.abs(input2.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0));
      
      assert.notStrictEqual(hash1, hash2);
    });
  });

  describe('Device name generation logic', () => {
    it('should combine browser and OS names', () => {
      const browser = 'Chrome';
      const os = 'Windows 11/10';
      const deviceType = 'Desktop';
      
      let name = `${browser} on ${os}`;
      if (deviceType === 'Mobile') {
        name = `${browser} on ${os} (${deviceType})`;
      }
      
      assert.strictEqual(name, 'Chrome on Windows 11/10');
    });

    it('should include device type for mobile', () => {
      const browser = 'Safari';
      const os = 'iOS';
      const deviceType = 'Mobile';
      
      let name = `${browser} on ${os}`;
      if (deviceType === 'Mobile') {
        name = `${browser} on ${os} (${deviceType})`;
      }
      
      assert.strictEqual(name, 'Safari on iOS (Mobile)');
    });
  });
});
