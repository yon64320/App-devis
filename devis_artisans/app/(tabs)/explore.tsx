import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  withSpring,
} from 'react-native-reanimated';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Comment puis-je vous aider avec vos devis aujourd\'hui ?',
      sender: 'other',
      timestamp: '09:30',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputText('');

      // Simuler une réponse automatique après 1 seconde
      setTimeout(() => {
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Merci pour votre message. Je vais examiner votre demande et vous répondre rapidement.',
          sender: 'other',
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 1000);
    }
  };

  useEffect(() => {
    // Scroll vers le bas quand un nouveau message arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <AnimatedBackground />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <Text style={styles.headerSubtitle}>Support client</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tapez votre message..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <SendButton onPress={sendMessage} disabled={!inputText.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

function AnimatedBackground() {
  const progress1 = useSharedValue(0);
  const progress2 = useSharedValue(0);
  const progress3 = useSharedValue(0);

  useEffect(() => {
    progress1.value = withRepeat(
      withTiming(1, { duration: 8000 }),
      -1,
      true
    );
    progress2.value = withRepeat(
      withTiming(1, { duration: 10000 }),
      -1,
      true
    );
    progress3.value = withRepeat(
      withTiming(1, { duration: 12000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => {
    const translateX = interpolate(progress1.value, [0, 1], [-100, 100]);
    const translateY = interpolate(progress1.value, [0, 1], [-50, 50]);
    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  const animatedStyle2 = useAnimatedStyle(() => {
    const translateX = interpolate(progress2.value, [0, 1], [100, -100]);
    const translateY = interpolate(progress2.value, [0, 1], [50, -50]);
    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  const animatedStyle3 = useAnimatedStyle(() => {
    const translateX = interpolate(progress3.value, [0, 1], [-50, 50]);
    const translateY = interpolate(progress3.value, [0, 1], [100, -100]);
    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  return (
    <View style={styles.backgroundContainer}>
      <Animated.View style={[styles.gradientBlob1, animatedStyle1]} />
      <Animated.View style={[styles.gradientBlob2, animatedStyle2]} />
      <Animated.View style={[styles.gradientBlob3, animatedStyle3]} />
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === 'user';

  return (
    <View
      style={[
        styles.messageWrapper,
        isUser ? styles.userMessageWrapper : styles.otherMessageWrapper,
      ]}>
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.otherMessage,
        ]}>
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.otherMessageText,
          ]}>
          {message.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.otherTimestamp,
          ]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

function SendButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      style={[styles.sendButton, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}>
      <Text style={styles.sendButtonText}>➤</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientBlob1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#D4A574',
    opacity: 0.25,
    top: -100,
    left: -100,
  },
  gradientBlob2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#C9A961',
    opacity: 0.22,
    top: 200,
    right: -150,
  },
  gradientBlob3: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#E8C5A0',
    opacity: 0.2,
    bottom: -100,
    left: 50,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5C4A2F',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8B7A5F',
    fontWeight: '400',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userMessage: {
    backgroundColor: '#D4A574',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 2,
    borderColor: '#E8DDD0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#5C4A2F',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  userTimestamp: {
    color: '#FFF8E7',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#8B7A5F',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#F5F0E8',
    borderTopWidth: 2,
    borderTopColor: '#E8DDD0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#5C4A2F',
    borderWidth: 2,
    borderColor: '#E8DDD0',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4A574',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
