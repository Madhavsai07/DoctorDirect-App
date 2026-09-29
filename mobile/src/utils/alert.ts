import { Alert as RNAlert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Cross-platform alert utility that safely works on Web (where react-native-web
 * provides an empty Alert.alert stub) as well as native iOS/Android.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    const fullMsg = `${title}${message ? '\n\n' + message : ''}`;

    if (!buttons || buttons.length === 0) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(fullMsg);
      }
      return;
    }

    if (buttons.length === 1) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(fullMsg);
      }
      buttons[0].onPress?.();
      return;
    }

    // Multiple buttons (e.g. Cancel and Confirm)
    const cancelBtn = buttons.find((b) => b.style === 'cancel');
    const confirmBtn =
      buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

    if (typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(fullMsg);
      if (ok) {
        confirmBtn.onPress?.();
      } else {
        cancelBtn?.onPress?.();
      }
    } else {
      confirmBtn.onPress?.();
    }
  } else {
    RNAlert.alert(title, message, buttons);
  }
}
