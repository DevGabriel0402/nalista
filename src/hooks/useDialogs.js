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
    (message, title = 'Confirmação') =>
      new Promise((resolve) => {
        setDialogState({
          type: 'confirm',
          title,
          message,
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
    (message, defaultValue = '', title = 'Preencher') =>
      new Promise((resolve) => {
        setDialogInput(defaultValue);
        setDialogState({
          type: 'prompt',
          title,
          message,
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
