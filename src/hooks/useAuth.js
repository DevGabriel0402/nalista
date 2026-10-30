import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase.js';

const firebaseErrors = {
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes do login.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.',
  'auth/network-request-failed': 'Não foi possível conectar. Verifique sua internet.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
};

export function getAuthErrorMessage(error) {
  return firebaseErrors[error?.code] || 'Não foi possível concluir a autenticação. Tente novamente.';
}

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const run = async (operation) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Configure as variáveis do Firebase para habilitar a autenticação.');
    }
    return operation(auth);
  };

  return {
    user,
    loading,
    isConfigured: isFirebaseConfigured && Boolean(auth),
    signIn: (email, password) => run((currentAuth) => signInWithEmailAndPassword(currentAuth, email, password)),
    signUp: (email, password) => run((currentAuth) => createUserWithEmailAndPassword(currentAuth, email, password)),
    signInWithGoogle: () => run((currentAuth) => signInWithPopup(currentAuth, new GoogleAuthProvider())),
    resetPassword: (email) => run((currentAuth) => sendPasswordResetEmail(currentAuth, email)),
    signOut: () => run((currentAuth) => signOut(currentAuth))
  };
}
