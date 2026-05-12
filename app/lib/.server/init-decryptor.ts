import { setDecryptor } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('InitDecryptor');

/**
 * Register the AES-256-GCM decryption function with the cookie module.
 *
 * Imported as a side-effect from entry.server.tsx so the decryptor is
 * available before any route handler reads encrypted cookie values.
 *
 * If DEVONZ_ENCRYPTION_KEY is not configured, the import of encryption.ts
 * throws — we catch that and log a warning.  Encrypted cookie values will
 * fall back to their raw ciphertext in that case.
 */
try {
  /*
   * Dynamic import is used here purely for clarity — encryption.ts uses lazy
   * key initialisation so it never throws at import time.
   * Top-level await is fine here — this module is server-only (.server dir).
   */
  const { decrypt } = await import('./encryption');
  setDecryptor(decrypt);
  logger.info('Cookie decryptor registered');
} catch (error) {
  logger.warn('Failed to load encryption module — encrypted cookies will fall back to empty strings:', error);
}
