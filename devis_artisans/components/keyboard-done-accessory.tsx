import { useEffect, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export const doneAccessoryId = 'doneAccessory';

export function KeyboardDoneAccessory() {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={doneAccessoryId}>
      <View style={styles.container}>
        <Pressable style={styles.doneButton} onPress={() => Keyboard.dismiss()}>
          <Text style={styles.doneButtonText}>Terminer</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

export function KeyboardDoneToolbar() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'ios') return undefined;

    const showEvent = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideEvent = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showEvent.remove();
      hideEvent.remove();
    };
  }, []);

  if (Platform.OS === 'ios' || keyboardHeight === 0) return null;

  return (
    <View style={[styles.androidContainer, { bottom: keyboardHeight }]}>
      <Pressable style={styles.doneButton} onPress={() => Keyboard.dismiss()}>
        <Text style={styles.doneButtonText}>Terminer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3A2F1F',
    borderTopWidth: 1,
    borderTopColor: '#4A3F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  androidContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#3A2F1F',
    borderTopWidth: 1,
    borderTopColor: '#4A3F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneButtonText: {
    color: '#D4A574',
    fontSize: 16,
    fontWeight: '600',
  },
});
