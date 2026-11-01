import { useCallback, useState } from 'react';

export default function useDialogs() {
  const [dialogState, setDialogState] = useState(null);
  const [dialogInput, setDialogInput] = useState('');

  const showAlert = useCallback(
    (message, title = 'Aviso') =>
      new Promise((resolve) => {
        setDialogState({
          type: 'alert',
          title,
          message,
          onConfirm: () => {
            setDialogState(null);
            resolve(true);
          },
        });
      }),
    [],
  );

  const showConfirm = useCallback(
    (message, title = 'Confirmação', options = {}) =>
      new Promise((resolve) => {
        setDialogState({
          type: 'confirm',
          title,
          message,
          danger: options.danger,
          confirmLabel: options.confirmLabel,
          onConfirm: () => {
            setDialogState(null);
            resolve(true);
          },
          onCancel: () => {
            setDialogState(null);
            resolve(false);
          },
        });
      }),
    [],
  );

  const showPrompt = useCallback(
    (message, defaultValue = '', title = 'Preencher', options = {}) =>
      new Promise((resolve) => {
        setDialogInput(defaultValue);
        setDialogState({
          type: 'prompt',
          title,
          message,
          danger: options.danger,
          requiredKeyword: options.requiredKeyword,
          confirmLabel: options.confirmLabel,
          onConfirm: (value) => {
            setDialogState(null);
            resolve(value);
          },
          onCancel: () => {
            setDialogState(null);
            resolve(null);
          },
        });
      }),
    [],
  );

  return {
    dialogState,
    dialogInput,
    setDialogInput,
    showAlert,
    showConfirm,
    showPrompt,
  };
}
