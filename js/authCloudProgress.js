import {
  fetchCloudflareProgress,
  writeCloudflareProgress,
} from "./authCloudflareClient.js";
import { firestoreRequest } from "./authFirebaseTransport.js";
import { readSession } from "./authStorage.js";
import { ensureCloudSessionActive } from "./authCloudSession.js";
import { getCloudProgressDocument } from "./authCloudFirestore.js";
import {
  buildUpdateMask,
  normalizeProgressSummary,
  normalizeRetryQueue,
  normalizeSpacedQueue,
  parseCloudProgressDocument,
  serializeProgressSummary,
  serializeRetryQueue,
  serializeSpacedQueue,
} from "./authFirestoreModels.js";
import { isCloudProgressSyncEnabled } from "./authRuntime.js";

const CLOUD_PROGRESS_COLLECTION = "progress";
const CLOUD_PROGRESS_SCHEMA_VERSION = 1;

export async function ensureCloudProgressSession({
  getSession = readSession,
  refreshSession = ensureCloudSessionActive,
  cloudProgressEnabled = isCloudProgressSyncEnabled(),
} = {}) {
  if (!cloudProgressEnabled) {
    throw new Error("Cloud progress sync is not enabled.");
  }

  const session = getSession();
  if (!session?.accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  if (session.provider === "firebase") {
    const freshSession = await refreshSession(session, { clearOnFailure: false });
    if (!freshSession?.accessToken || !freshSession?.user?.id) {
      throw new Error("Cloud session is unavailable.");
    }
    return freshSession;
  }

  if (session.provider === "cloudflare") {
    return session;
  }

  throw new Error(`Unsupported cloud provider: ${session.provider}`);
}

export async function readCloudProgressSummary({
  ensureSession = ensureCloudProgressSession,
  getDocument = getCloudProgressDocument,
  fetchCloudflare = fetchCloudflareProgress,
} = {}) {
  const session = await ensureSession();

  if (session.provider === "cloudflare") {
    const payload = await fetchCloudflare(session.accessToken);
    const progress = payload?.progress || {};
    return {
      exists: Boolean(payload?.progress),
      updatedAt: String(progress.updatedAt || ""),
      deviceId: String(progress.deviceId || ""),
      schemaVersion: Number(progress.schemaVersion || CLOUD_PROGRESS_SCHEMA_VERSION),
      summary: normalizeProgressSummary(progress.summary),
      retryQueue: normalizeRetryQueue(progress.retryQueue),
      spacedQueue: normalizeSpacedQueue(progress.spacedQueue),
    };
  }

  const document = await getDocument(session.accessToken, session.user.id);
  if (!document) {
    return {
      exists: false,
      updatedAt: "",
      deviceId: "",
      schemaVersion: CLOUD_PROGRESS_SCHEMA_VERSION,
      summary: { attempts: [] },
      retryQueue: [],
      spacedQueue: [],
    };
  }

  const parsed = parseCloudProgressDocument(document);
  return {
    exists: true,
    updatedAt: String(parsed.updatedAt || ""),
    deviceId: String(parsed.deviceId || ""),
    schemaVersion: Number(parsed.schemaVersion || CLOUD_PROGRESS_SCHEMA_VERSION),
    summary: normalizeProgressSummary(parsed.summary),
    retryQueue: normalizeRetryQueue(parsed.retryQueue),
    spacedQueue: normalizeSpacedQueue(parsed.spacedQueue),
  };
}

export async function writeCloudProgressSummary(
  summary,
  { deviceId = "", retryQueue = [], spacedQueue = [] } = {},
  {
    ensureSession = ensureCloudProgressSession,
    requester = firestoreRequest,
    writeCloudflare = writeCloudflareProgress,
  } = {},
) {
  const session = await ensureSession();
  const { normalized, serialized } = serializeProgressSummary(summary);
  const { normalized: normalizedRetryQueue, serialized: serializedRetryQueue } = serializeRetryQueue(
    retryQueue,
  );
  const { normalized: normalizedSpacedQueue, serialized: serializedSpacedQueue } = serializeSpacedQueue(
    spacedQueue,
  );
  const nowIso = new Date().toISOString();

  if (session.provider === "cloudflare") {
    await writeCloudflare(session.accessToken, {
      progress: {
        schemaVersion: CLOUD_PROGRESS_SCHEMA_VERSION,
        updatedAt: nowIso,
        deviceId: String(deviceId || "").trim(),
        summary: normalized,
        retryQueue: normalizedRetryQueue,
        spacedQueue: normalizedSpacedQueue,
      },
    });
    return {
      saved: true,
      updatedAt: nowIso,
      summary: normalized,
      retryQueue: normalizedRetryQueue,
      spacedQueue: normalizedSpacedQueue,
    };
  }

  const updateMask = buildUpdateMask([
    "schemaVersion",
    "updatedAt",
    "deviceId",
    "progressSummaryJson",
    "retryQueueJson",
    "spacedQueueJson",
  ]);

  await requester(
    `documents/${CLOUD_PROGRESS_COLLECTION}/${encodeURIComponent(session.user.id)}?${updateMask}`,
    {
      method: "PATCH",
      idToken: session.accessToken,
      body: {
        fields: {
          schemaVersion: { integerValue: String(CLOUD_PROGRESS_SCHEMA_VERSION) },
          updatedAt: { timestampValue: nowIso },
          deviceId: { stringValue: String(deviceId || "").trim() },
          progressSummaryJson: { stringValue: serialized },
          retryQueueJson: { stringValue: serializedRetryQueue },
          spacedQueueJson: { stringValue: serializedSpacedQueue },
        },
      },
    },
  );


  return {
    saved: true,
    updatedAt: nowIso,
    summary: normalized,
    retryQueue: normalizedRetryQueue,
    spacedQueue: normalizedSpacedQueue,
  };
}
