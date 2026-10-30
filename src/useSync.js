// useSync.js — Hook de sincronização LocalStorage ↔ Firestore
//
// Estratégia offline-first:
//   1. Lê o estado inicial do localStorage (instantâneo, sem espera)
//   2. Assina onSnapshot no Firestore → sempre que o dado mudar na nuvem, atualiza o estado local
//   3. Toda vez que o estado muda localmente, salva no localStorage E debounca uma escrita no Firestore
//   4. O Firestore SDK já tem IndexedDB como cache offline, então o onSnapshot funciona mesmo sem internet
//
// Estrutura no Firestore:
//   /users/{uid} → { items, history, pantry, budget, date, market, note, _updatedAt }

import { useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.js';

const LOCAL_KEY = 'nalista-v1';
const DEBOUNCE_MS = 1200; // tempo de espera antes de salvar no Firestore

// ─── Helpers ─────────────────────────────────────────────────────────────────

function saveLocal(state, userId) {
  try {
    localStorage.setItem(userId ? `${LOCAL_KEY}-${userId}` : LOCAL_KEY, JSON.stringify(state));
  } catch {
    console.warn('Não foi possível salvar no localStorage.');
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useSync(state, setState, syncStatus, setSyncStatus)
 *
 * @param {object} state — estado atual da aplicação
 * @param {function} setState — setter do estado
 * @param {function} setSyncStatus — ('idle' | 'saving' | 'saved' | 'offline' | 'error')
 */
export function useSync(state, setState, setSyncStatus, userId) {
  const debounceRef = useRef(null);
  const isRemoteUpdateRef = useRef(false); // evita loop: remoto → local → remoto
  const firestoreDocRef = useRef(
    isFirebaseConfigured && db && userId ? doc(db, 'users', userId) : null
  );

  // ── 1. Salvar no localStorage sempre que o estado mudar ──────────────────
  useEffect(() => {
    saveLocal(state, userId);
  }, [state, userId]);

  // ── 2. Assinar onSnapshot para receber atualizações remotas ──────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !firestoreDocRef.current || !userId) {
      setSyncStatus('offline');
      return;
    }

    const unsub = onSnapshot(
      firestoreDocRef.current,
      { includeMetadataChanges: true },
      (snap) => {
        if (!snap.exists()) {
          // Documento ainda não existe — push dados locais imediatamente
          setSyncStatus('idle');
          return;
        }

        const remoteData = snap.data();

        // Ignora snapshots do cache local para evitar sobrescrever com dado antigo
        if (snap.metadata.fromCache) {
          setSyncStatus('offline');
          return;
        }

        // Compara timestamps: só atualiza local se o remoto for mais recente
        const localUpdatedAt = state._updatedAt || 0;
        const remoteUpdatedAt = remoteData._updatedAt?.toMillis?.() || 0;

        if (remoteUpdatedAt > localUpdatedAt) {
          isRemoteUpdateRef.current = true;
          const { _updatedAt, ...cleanData } = remoteData;
          setState((prev) => ({ ...prev, ...cleanData, _updatedAt: remoteUpdatedAt }));
          setSyncStatus('saved');
        } else {
          setSyncStatus('saved');
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error:', error);
        setSyncStatus('error');
      }
    );

    return () => unsub();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3. Debounce: salvar no Firestore quando o estado mudar ───────────────
  const saveToFirestore = useCallback(
    async (data) => {
      if (!isFirebaseConfigured || !firestoreDocRef.current) return;

      setSyncStatus('saving');
      try {
        const { _updatedAt, ...cleanState } = data;
        await setDoc(
          firestoreDocRef.current,
          {
            ...cleanState,
            _updatedAt: serverTimestamp()
          },
          { merge: false }
        );
        setSyncStatus('saved');
      } catch (err) {
        console.warn('Erro ao salvar no Firestore:', err);
        setSyncStatus('error');
      }
    },
    [setSyncStatus]
  );

  useEffect(() => {
    // Se a atualização veio do remoto, não reenvia ao Firestore
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSyncStatus('saving');
    debounceRef.current = setTimeout(() => {
      saveToFirestore(state);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return { userId };
}
