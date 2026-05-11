import { atom } from 'nanostores';

/** Timestamp (ms) of the last successful message save — read by the chat toolbar indicator. */
export const chatSavedAt = atom<number | undefined>(undefined);
