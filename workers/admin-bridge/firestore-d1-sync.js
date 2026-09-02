/**
 * Firestore-to-D1 Sync Module
 * 
 * Strategy: Dual-write + Read-through
 * 1. WRITE: Write to both Firestore AND D1 simultaneously
 * 2. READ: Read from D1 first; fall back to Firestore if not found
 * 3. MIGRATE: Background one-time sync of existing Firestore data to D1
 * 4. CUTOVER: Once all data is in D1, remove Firestore reads
 */

// ============================================================
// D1 Read/Write Helpers
// ============================================================

/**
 * Upsert a user profile into D1
 */
export async function upsertUserProfile(database, profile) {
  if (!database || !profile?.userId) return;
  const now = new Date().toISOString();
  await database.prepare(`
    INSERT INTO user_profiles (
      user_id, email, plan, plan_source, status, plan_expires_at,
      billing_cycle, last_payment_at, flw_transaction_id, flw_customer_email,
      flw_payment_plan, selar_order_ref, selar_product_name, last_seen_at,
      created_at, updated_at, synced_from_firestore
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
    ON CONFLICT(user_id) DO UPDATE SET
      email = CASE WHEN excluded.email != '' THEN excluded.email ELSE user_profiles.email END,
      plan = CASE WHEN excluded.plan != '' THEN excluded.plan ELSE user_profiles.plan END,
      plan_source = CASE WHEN excluded.plan_source != '' THEN excluded.plan_source ELSE user_profiles.plan_source END,
      status = CASE WHEN excluded.status != '' THEN excluded.status ELSE user_profiles.status END,
      plan_expires_at = CASE WHEN excluded.plan_expires_at != '' THEN excluded.plan_expires_at ELSE user_profiles.plan_expires_at END,
      billing_cycle = CASE WHEN excluded.billing_cycle != '' THEN excluded.billing_cycle ELSE user_profiles.billing_cycle END,
      last_payment_at = CASE WHEN excluded.last_payment_at != '' THEN excluded.last_payment_at ELSE user_profiles.last_payment_at END,
      flw_transaction_id = CASE WHEN excluded.flw_transaction_id != '' THEN excluded.flw_transaction_id ELSE user_profiles.flw_transaction_id END,
      flw_customer_email = CASE WHEN excluded.flw_customer_email != '' THEN excluded.flw_customer_email ELSE user_profiles.flw_customer_email END,
      flw_payment_plan = CASE WHEN excluded.flw_payment_plan != '' THEN excluded.flw_payment_plan ELSE user_profiles.flw_payment_plan END,
      selar_order_ref = CASE WHEN excluded.selar_order_ref != '' THEN excluded.selar_order_ref ELSE user_profiles.selar_order_ref END,
      selar_product_name = CASE WHEN excluded.selar_product_name != '' THEN excluded.selar_product_name ELSE user_profiles.selar_product_name END,
      last_seen_at = CASE WHEN excluded.last_seen_at != '' THEN excluded.last_seen_at ELSE user_profiles.last_seen_at END,
      updated_at = ?16,
      synced_from_firestore = CASE WHEN excluded.synced_from_firestore = 1 THEN 1 ELSE user_profiles.synced_from_firestore END
  `).bind(
    profile.userId, profile.email || '', profile.plan || 'free',
    profile.planSource || '', profile.status || 'active',
    profile.planExpiresAt || '', profile.billingCycle || '',
    profile.lastPaymentAt || '', profile.flwTransactionId || '',
    profile.flwCustomerEmail || '', profile.flwPaymentPlan || '',
    profile.selarOrderRef || '', profile.selarProductName || '',
    profile.lastSeenAt || '', profile.createdAt || now,
    now, profile.syncedFromFirestore ? 1 : 0
  ).run();
}

/**
 * Get a user profile from D1
 */
export async function getUserProfile(database, userId) {
  if (!database || !userId) return null;
  const result = await database.prepare(
    'SELECT * FROM user_profiles WHERE user_id = ?1'
  ).bind(userId).first();
  return result || null;
}

/**
 * Get a user profile by email from D1
 */
export async function getUserProfileByEmail(database, email) {
  if (!database || !email) return null;
  const result = await database.prepare(
    'SELECT * FROM user_profiles WHERE email = ?1'
  ).bind(email).first();
  return result || null;
}

/**
 * Upsert a payment receipt into D1
 */
export async function upsertPaymentReceipt(database, payment) {
  if (!database || !payment?.paymentId) return;
  await database.prepare(`
    INSERT INTO payment_receipts (
      payment_id, user_id, email, amount, currency, billing_cycle,
      plan, status, flw_transaction_id, flw_customer_email, flw_tx_ref,
      selar_order_ref, selar_product_name, created_at, expires_at,
      raw_json, synced_from_firestore
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
    ON CONFLICT(payment_id) DO UPDATE SET
      amount = excluded.amount,
      status = excluded.status,
      expires_at = CASE WHEN excluded.expires_at != '' THEN excluded.expires_at ELSE payment_receipts.expires_at END,
      synced_from_firestore = CASE WHEN excluded.synced_from_firestore = 1 THEN 1 ELSE payment_receipts.synced_from_firestore END
  `).bind(
    payment.paymentId, payment.userId || '', payment.email || '',
    payment.amount || 0, payment.currency || 'NGN',
    payment.billingCycle || '', payment.plan || 'premium',
    payment.status || 'successful', payment.flwTransactionId || '',
    payment.flwCustomerEmail || '', payment.flwTxRef || '',
    payment.selarOrderRef || '', payment.selarProductName || '',
    payment.createdAt || '', payment.expiresAt || '',
    payment.rawJson || '{}', payment.syncedFromFirestore ? 1 : 0
  ).run();
}

/**
 * List payment receipts from D1
 */
export async function listPaymentReceipts(database, filters = {}) {
  if (!database) return [];
  let query = 'SELECT * FROM payment_receipts WHERE 1=1';
  const params = [];
  let idx = 1;
  
  if (filters.email) {
    query += ` AND email = ?${idx}`;
    params.push(filters.email);
    idx++;
  }
  if (filters.userId) {
    query += ` AND user_id = ?${idx}`;
    params.push(filters.userId);
    idx++;
  }
  if (filters.status && filters.status !== 'all') {
    query += ` AND status = ?${idx}`;
    params.push(filters.status);
    idx++;
  }
  
  query += ' ORDER BY created_at DESC';
  
  const limit = Math.min(200, Math.max(1, filters.pageSize || 100));
  query += ` LIMIT ?${idx}`;
  params.push(limit);
  
  const result = await database.prepare(query).bind(...params).all();
  return (result?.results || []).map(row => ({
    paymentId: row.payment_id,
    userId: row.user_id,
    email: row.email,
    amount: row.amount,
    currency: row.currency,
    billingCycle: row.billing_cycle,
    plan: row.plan,
    status: row.status,
    flwTransactionId: row.flw_transaction_id,
    flwCustomerEmail: row.flw_customer_email,
    flwTxRef: row.flw_tx_ref,
    selarOrderRef: row.selar_order_ref,
    selarProductName: row.selar_product_name,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    deletedAt: '',
  }));
}

/**
 * Delete a payment receipt from D1 (soft delete marker)
 */
export async function markPaymentDeleted(database, paymentId) {
  if (!database || !paymentId) return;
  await database.prepare(`
    INSERT OR REPLACE INTO deleted_payments (payment_id, deleted_at)
    VALUES (?1, ?2)
  `).bind(paymentId, new Date().toISOString()).run();
}

// ============================================================
// Dual-Write Helpers (write to both Firestore + D1)
// ============================================================

/**
 * Dual-write user profile: Firestore + D1
 */
export async function dualWriteUserProfile(env, userId, firestoreFields) {
  const database = env.AUTH_DB;
  const profile = {
    userId,
    email: firestoreFields.email?.stringValue || '',
    plan: firestoreFields.plan?.stringValue || 'free',
    planSource: firestoreFields.planSource?.stringValue || '',
    status: firestoreFields.status?.stringValue || 'active',
    planExpiresAt: firestoreFields.planExpiresAt?.stringValue || firestoreFields.subscriptionExpiresAt?.stringValue || '',
    billingCycle: firestoreFields.flwPaymentPlan?.stringValue || '',
    lastPaymentAt: firestoreFields.lastPaymentAt?.timestampValue || '',
    flwTransactionId: firestoreFields.flwTransactionId?.stringValue || '',
    flwCustomerEmail: firestoreFields.flwCustomerEmail?.stringValue || '',
    flwPaymentPlan: firestoreFields.flwPaymentPlan?.stringValue || '',
    selarOrderRef: firestoreFields.selarOrderRef?.stringValue || '',
    selarProductName: firestoreFields.selarProductName?.stringValue || '',
    lastSeenAt: firestoreFields.lastSeenAt?.timestampValue || '',
    createdAt: firestoreFields.createdAt?.timestampValue || '',
  };
  await upsertUserProfile(database, profile).catch(err => {
    console.error('[sync] Failed to upsert user profile to D1:', err?.message);
  });
}

/**
 * Dual-write payment receipt: Firestore + D1
 */
export async function dualWritePaymentReceipt(env, receipt) {
  const database = env.AUTH_DB;
  await upsertPaymentReceipt(database, {
    ...receipt,
    syncedFromFirestore: false,
  }).catch(err => {
    console.error('[sync] Failed to upsert payment to D1:', err?.message);
  });
}

// ============================================================
// One-time Migration: Firestore -> D1
// ============================================================

/**
 * Migrate all Firestore profiles to D1
 */
export async function migrateProfilesToD1(env) {
  const database = env.AUTH_DB;
  if (!database) throw new Error('AUTH_DB not configured');
  
  const { firestoreDocumentUrl, firestoreRequest } = await import('./worker.js');
  
  let migrated = 0;
  let errors = 0;
  let nextPageToken = '';
  
  do {
    const baseUrl = firestoreDocumentUrl(env, 'profiles');
    const url = nextPageToken ? `${baseUrl}?pageSize=100&pageToken=${nextPageToken}` : `${baseUrl}?pageSize=100`;
    
    let payload;
    try {
      payload = await firestoreRequest(env, url, { method: 'GET' });
    } catch (err) {
      console.error('[migrate] Failed to list profiles:', err?.message);
      break;
    }
    
    const documents = Array.isArray(payload?.documents) ? payload.documents : [];
    
    for (const doc of documents) {
      try {
        const userId = doc.name?.split('/')?.pop() || '';
        if (!userId) continue;
        
        const fields = doc.fields || {};
        const profile = {
          userId,
          email: fields.email?.stringValue || '',
          plan: fields.plan?.stringValue || 'free',
          planSource: fields.planSource?.stringValue || '',
          status: fields.status?.stringValue || 'active',
          planExpiresAt: fields.planExpiresAt?.stringValue || fields.subscriptionExpiresAt?.stringValue || '',
          billingCycle: fields.flwPaymentPlan?.stringValue || '',
          lastPaymentAt: fields.lastPaymentAt?.timestampValue || '',
          flwTransactionId: fields.flwTransactionId?.stringValue || '',
          flwCustomerEmail: fields.flwCustomerEmail?.stringValue || '',
          flwPaymentPlan: fields.flwPaymentPlan?.stringValue || '',
          selarOrderRef: fields.selarOrderRef?.stringValue || '',
          selarProductName: fields.selarProductName?.stringValue || '',
          lastSeenAt: fields.lastSeenAt?.timestampValue || '',
          createdAt: fields.createdAt?.timestampValue || '',
          syncedFromFirestore: true,
        };
        
        await upsertUserProfile(database, profile);
        migrated++;
      } catch (err) {
        errors++;
        console.error('[migrate] Failed to migrate profile:', err?.message);
      }
    }
    
    nextPageToken = String(payload?.nextPageToken || '');
  } while (nextPageToken);
  
  return { migrated, errors, collection: 'profiles' };
}

/**
 * Migrate all Firestore payments to D1
 */
export async function migratePaymentsToD1(env) {
  const database = env.AUTH_DB;
  if (!database) throw new Error('AUTH_DB not configured');
  
  const { firestoreDocumentUrl, firestoreRequest } = await import('./worker.js');
  
  let migrated = 0;
  let errors = 0;
  let nextPageToken = '';
  
  do {
    const baseUrl = firestoreDocumentUrl(env, 'payments');
    const url = nextPageToken ? `${baseUrl}?pageSize=100&pageToken=${nextPageToken}` : `${baseUrl}?pageSize=100`;
    
    let payload;
    try {
      payload = await firestoreRequest(env, url, { method: 'GET' });
    } catch (err) {
      console.error('[migrate] Failed to list payments:', err?.message);
      break;
    }
    
    const documents = Array.isArray(payload?.documents) ? payload.documents : [];
    
    for (const doc of documents) {
      try {
        const paymentId = doc.name?.split('/')?.pop() || '';
        if (!paymentId) continue;
        
        const fields = doc.fields || {};
        const payment = {
          paymentId,
          userId: fields.userId?.stringValue || '',
          email: fields.email?.stringValue || '',
          amount: Number(fields.amount?.doubleValue || fields.amount?.integerValue || 0),
          currency: fields.currency?.stringValue || 'NGN',
          billingCycle: fields.billingCycle?.stringValue || '',
          plan: fields.plan?.stringValue || 'premium',
          status: fields.status?.stringValue || 'successful',
          flwTransactionId: fields.flwTransactionId?.stringValue || '',
          flwCustomerEmail: fields.flwCustomerEmail?.stringValue || '',
          flwTxRef: fields.flwTxRef?.stringValue || '',
          selarOrderRef: fields.selarOrderRef?.stringValue || '',
          selarProductName: fields.selarProductName?.stringValue || '',
          createdAt: fields.createdAt?.timestampValue || '',
          expiresAt: fields.expiresAt?.timestampValue || '',
          rawJson: JSON.stringify(fields),
          syncedFromFirestore: true,
        };
        
        await upsertPaymentReceipt(database, payment);
        migrated++;
      } catch (err) {
        errors++;
        console.error('[migrate] Failed to migrate payment:', err?.message);
      }
    }
    
    nextPageToken = String(payload?.nextPageToken || '');
  } while (nextPageToken);
  
  return { migrated, errors, collection: 'payments' };
}

/**
 * Get migration status
 */
export async function getMigrationStatus(database) {
  if (!database) return { profiles: 0, payments: 0, syncedProfiles: 0, syncedPayments: 0 };
  
  const [totalProfiles, syncedProfiles, totalPayments, syncedPayments] = await Promise.all([
    database.prepare('SELECT COUNT(*) as cnt FROM user_profiles').first(),
    database.prepare('SELECT COUNT(*) as cnt FROM user_profiles WHERE synced_from_firestore = 1').first(),
    database.prepare('SELECT COUNT(*) as cnt FROM payment_receipts').first(),
    database.prepare('SELECT COUNT(*) as cnt FROM payment_receipts WHERE synced_from_firestore = 1').first(),
  ]);
  
  return {
    profiles: totalProfiles?.cnt || 0,
    syncedProfiles: syncedProfiles?.cnt || 0,
    payments: totalPayments?.cnt || 0,
    syncedPayments: syncedPayments?.cnt || 0,
  };
}
