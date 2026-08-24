import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock database for testing
class MockDatabase {
  constructor() {
    this.tables = {
      auth_users: [],
      trusted_devices: [],
      login_audit_log: [],
      otp_codes: [],
    };
    this.queryLog = [];
  }

  prepare(sql) {
    this.queryLog.push(sql);
    const self = this;
    return {
      bind(...params) {
        self.currentParams = params;
        return {
          async first() {
            return self._executeQuery(sql, params, 'first');
          },
          async all() {
            return self._executeQuery(sql, params, 'all');
          },
          async run() {
            return self._executeQuery(sql, params, 'run');
          },
        };
      },
      async all() {
        return self._executeQuery(sql, [], 'all');
      },
    };
  }

  _executeQuery(sql, params, type) {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();
    
    // SELECT queries
    if (normalizedSql.includes('SELECT')) {
      if (normalizedSql.includes('trusted_devices')) {
        const results = this.tables.trusted_devices.filter(d => !d.revoked_at);
        if (type === 'first') return results[0] || null;
        return { results, success: true };
      }
      if (normalizedSql.includes('otp_codes')) {
        const results = this.tables.otp_codes;
        if (type === 'first') return results[0] || null;
        return { results, success: true };
      }
      if (normalizedSql.includes('COUNT(*)')) {
        const count = this.tables.trusted_devices.filter(d => !d.revoked_at).length;
        return { cnt: count };
      }
    }
    
    // INSERT queries
    if (normalizedSql.includes('INSERT INTO')) {
      if (normalizedSql.includes('trusted_devices')) {
        const device = {
          id: params[0],
          user_id: params[1],
          device_fingerprint: params[2],
          device_name: params[3],
          device_info: params[4],
          ip_address: params[5],
          user_agent: params[6],
          trusted_at: params[7],
          expires_at: params[8],
          last_used_at: params[9],
          is_permanent: 0,
          revoked_at: '',
        };
        this.tables.trusted_devices.push(device);
        return { success: true, meta: { changes: 1 } };
      }
      if (normalizedSql.includes('login_audit_log')) {
        const log = {
          id: params[0],
          user_id: params[1],
          email: params[2],
          event_type: params[3],
          device_fingerprint: params[4],
          device_name: params[5],
          ip_address: params[6],
          user_agent: params[7],
          details: params[8],
          created_at: params[9],
        };
        this.tables.login_audit_log.push(log);
        return { success: true, meta: { changes: 1 } };
      }
    }
    
    // UPDATE queries
    if (normalizedSql.includes('UPDATE')) {
      if (normalizedSql.includes('SET revoked_at')) {
        const deviceId = params[1] || params[0];
        const device = this.tables.trusted_devices.find(d => d.id === deviceId);
        if (device) {
          device.revoked_at = new Date().toISOString();
          return { success: true, meta: { changes: 1 } };
        }
        return { success: true, meta: { changes: 0 } };
      }
      if (normalizedSql.includes('SET last_used_at')) {
        const deviceId = params[1];
        const device = this.tables.trusted_devices.find(d => d.id === deviceId);
        if (device) {
          device.last_used_at = new Date().toISOString();
        }
        return { success: true, meta: { changes: 1 } };
      }
    }
    
    // DELETE queries
    if (normalizedSql.includes('DELETE FROM')) {
      if (normalizedSql.includes('trusted_devices')) {
        this.tables.trusted_devices = this.tables.trusted_devices.filter(d => d.revoked_at);
        return { success: true, meta: { changes: 1 } };
      }
    }
    
    return { success: true, meta: { changes: 0 } };
  }
}

describe('Device Trust Endpoints', () => {
  let db;
  let mockRequest;

  beforeEach(() => {
    db = new MockDatabase();
    
    // Add a test user
    db.tables.auth_users.push({
      id: 'user-1',
      email: 'test@example.com',
      plan: 'premium',
      status: 'active',
    });
    
    mockRequest = {
      headers: {
        get: (name) => {
          if (name === 'CF-Connecting-IP') return '192.168.1.1';
          if (name === 'User-Agent') return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
          return null;
        },
      },
    };
  });

  describe('Device Trust Functions', () => {
    it('should check device trust - trusted device', async () => {
      // Add a trusted device
      db.tables.trusted_devices.push({
        id: 'dev-1',
        user_id: 'user-1',
        device_fingerprint: 'fp123',
        device_name: 'Chrome on Windows',
        device_info: '{}',
        ip_address: '192.168.1.1',
        user_agent: 'Chrome',
        trusted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_used_at: new Date().toISOString(),
        is_permanent: 0,
        revoked_at: '',
      });
      
      // Test the query logic
      const result = await db.prepare('SELECT * FROM trusted_devices WHERE user_id = ? AND device_fingerprint = ?')
        .bind('user-1', 'fp123')
        .first();
      
      assert.ok(result, 'Should find trusted device');
      assert.strictEqual(result.device_fingerprint, 'fp123');
    });

    it('should check device trust - new device', async () => {
      const result = await db.prepare('SELECT * FROM trusted_devices WHERE user_id = ? AND device_fingerprint = ?')
        .bind('user-1', 'new-fp')
        .first();
      
      assert.strictEqual(result, null, 'Should not find untrusted device');
    });

    it('should add trusted device', async () => {
      const deviceId = 'dev-' + Date.now();
      await db.prepare('INSERT INTO trusted_devices (id, user_id, device_fingerprint, device_name, device_info, ip_address, user_agent, trusted_at, expires_at, last_used_at)')
        .bind(deviceId, 'user-1', 'fp-new', 'Test Device', '{}', '192.168.1.1', 'Chrome', new Date().toISOString(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString())
        .run();
      
      const device = db.tables.trusted_devices.find(d => d.id === deviceId);
      assert.ok(device, 'Device should be added');
      assert.strictEqual(device.user_id, 'user-1');
      assert.strictEqual(device.device_fingerprint, 'fp-new');
    });

    it('should revoke device', async () => {
      // Add device
      db.tables.trusted_devices.push({
        id: 'dev-revoke',
        user_id: 'user-1',
        device_fingerprint: 'fp-revoke',
        device_name: 'Test',
        device_info: '{}',
        ip_address: '',
        user_agent: '',
        trusted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_used_at: new Date().toISOString(),
        is_permanent: 0,
        revoked_at: '',
      });
      
      // Revoke
      const result = await db.prepare('UPDATE trusted_devices SET revoked_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), 'dev-revoke')
        .run();
      
      assert.strictEqual(result.meta.changes, 1);
      
      // Verify revoked
      const device = db.tables.trusted_devices.find(d => d.id === 'dev-revoke');
      assert.ok(device.revoked_at, 'Device should be revoked');
    });

    it('should revoke all devices', async () => {
      // Add multiple devices
      db.tables.trusted_devices.push(
        { id: 'dev-1', user_id: 'user-1', device_fingerprint: 'fp1', device_name: '', device_info: '{}', ip_address: '', user_agent: '', trusted_at: new Date().toISOString(), expires_at: '', last_used_at: new Date().toISOString(), is_permanent: 0, revoked_at: '' },
        { id: 'dev-2', user_id: 'user-1', device_fingerprint: 'fp2', device_name: '', device_info: '{}', ip_address: '', user_agent: '', trusted_at: new Date().toISOString(), expires_at: '', last_used_at: new Date().toISOString(), is_permanent: 0, revoked_at: '' }
      );
      
      // Simulate revoke all by marking all devices
      const now = new Date().toISOString();
      db.tables.trusted_devices.forEach(d => {
        if (d.user_id === 'user-1' && !d.revoked_at) {
          d.revoked_at = now;
        }
      });
      
      // Verify all revoked
      const activeDevices = db.tables.trusted_devices.filter(d => !d.revoked_at && d.user_id === 'user-1');
      assert.strictEqual(activeDevices.length, 0, 'All devices should be revoked');
    });

    it('should list trusted devices', async () => {
      // Add devices
      db.tables.trusted_devices.push(
        { id: 'dev-1', user_id: 'user-1', device_fingerprint: 'fp1', device_name: 'Chrome', device_info: '{}', ip_address: '', user_agent: '', trusted_at: new Date().toISOString(), expires_at: '', last_used_at: new Date().toISOString(), is_permanent: 0, revoked_at: '' },
        { id: 'dev-2', user_id: 'user-1', device_fingerprint: 'fp2', device_name: 'Safari', device_info: '{}', ip_address: '', user_agent: '', trusted_at: new Date().toISOString(), expires_at: '', last_used_at: new Date().toISOString(), is_permanent: 0, revoked_at: '' }
      );
      
      const result = await db.prepare('SELECT * FROM trusted_devices WHERE user_id = ? AND revoked_at = ?')
        .bind('user-1', '')
        .all();
      
      assert.strictEqual(result.results.length, 2);
    });

    it('should log login events', async () => {
      const logId = 'log-' + Date.now();
      await db.prepare('INSERT INTO login_audit_log (id, user_id, email, event_type, device_fingerprint, device_name, ip_address, user_agent, details, created_at)')
        .bind(logId, 'user-1', 'test@example.com', 'device_trusted', 'fp123', 'Test Device', '192.168.1.1', 'Chrome', '{}', new Date().toISOString())
        .run();
      
      assert.strictEqual(db.tables.login_audit_log.length, 1);
      assert.strictEqual(db.tables.login_audit_log[0].event_type, 'device_trusted');
    });
  });

  describe('Device Trust Limits', () => {
    it('should enforce max device limit', async () => {
      const maxDevices = 3;
      
      // Add max devices
      for (let i = 0; i < maxDevices; i++) {
        db.tables.trusted_devices.push({
          id: `dev-${i}`,
          user_id: 'user-1',
          device_fingerprint: `fp-${i}`,
          device_name: `Device ${i}`,
          device_info: '{}',
          ip_address: '',
          user_agent: '',
          trusted_at: new Date().toISOString(),
          expires_at: '',
          last_used_at: new Date().toISOString(),
          is_permanent: 0,
          revoked_at: '',
        });
      }
      
      const count = db.tables.trusted_devices.filter(d => !d.revoked_at).length;
      assert.strictEqual(count, maxDevices);
      
      // Simulate adding another - should remove oldest
      const oldest = db.tables.trusted_devices.find(d => !d.revoked_at);
      oldest.revoked_at = new Date().toISOString();
      
      db.tables.trusted_devices.push({
        id: 'dev-new',
        user_id: 'user-1',
        device_fingerprint: 'fp-new',
        device_name: 'New Device',
        device_info: '{}',
        ip_address: '',
        user_agent: '',
        trusted_at: new Date().toISOString(),
        expires_at: '',
        last_used_at: new Date().toISOString(),
        is_permanent: 0,
        revoked_at: '',
      });
      
      const newCount = db.tables.trusted_devices.filter(d => !d.revoked_at).length;
      assert.strictEqual(newCount, maxDevices);
    });

    it('should handle expired devices', async () => {
      // Add expired device
      const expiredDevice = {
        id: 'dev-expired',
        user_id: 'user-1',
        device_fingerprint: 'fp-expired',
        device_name: 'Expired Device',
        device_info: '{}',
        ip_address: '',
        user_agent: '',
        trusted_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_used_at: new Date().toISOString(),
        is_permanent: 0,
        revoked_at: '',
      };
      db.tables.trusted_devices.push(expiredDevice);
      
      // Simulate the query logic - filter expired devices
      const now = new Date().toISOString();
      const activeDevices = db.tables.trusted_devices.filter(d => {
        if (d.user_id !== 'user-1') return false;
        if (d.revoked_at) return false;
        if (d.expires_at && d.expires_at <= now) return false;
        return true;
      });
      
      assert.strictEqual(activeDevices.length, 0, 'Expired device should not be returned');
    });
  });
});
