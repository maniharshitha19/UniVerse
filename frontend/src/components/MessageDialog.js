import { useState, useEffect } from 'react';
import { Portal, Dialog, Button, TextInput } from 'react-native-paper';

// A small pop-up with a text box, used for "request to join" and "message seller".
export default function MessageDialog({
  visible,
  title,
  placeholder,
  initialText = '',
  confirmLabel = 'Send',
  loading = false,
  onDismiss,
  onConfirm,
}) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (visible) setText(initialText);
  }, [visible, initialText]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={3}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button loading={loading} disabled={loading} onPress={() => onConfirm(text.trim())}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
