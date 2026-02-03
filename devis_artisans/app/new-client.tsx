import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { KeyboardDoneAccessory, KeyboardDoneToolbar, doneAccessoryId } from '@/components/keyboard-done-accessory';
import { useClients } from '@/contexts/ClientsContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NewClientScreen() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [siret, setSiret] = useState('');
  const { addClient } = useClients();

  const handleSave = async () => {
    if (!nom.trim() || !prenom.trim() || !email.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner le nom, le prénom et le mail');
      return;
    }

    await addClient({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim(),
      siret: siret.trim() || undefined,
    });

    Alert.alert('Succès', 'Client ajouté avec succès !', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <KeyboardDoneAccessory />
      <KeyboardDoneToolbar />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Nouveau client</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Dupont"
              placeholderTextColor="#B8A896"
              value={nom}
              onChangeText={setNom}
              textContentType="familyName"
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Jean"
              placeholderTextColor="#B8A896"
              value={prenom}
              onChangeText={setPrenom}
              textContentType="givenName"
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: jean.dupont@mail.com"
              placeholderTextColor="#B8A896"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>Numéro de SIRET (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 123 456 789 00012"
              placeholderTextColor="#B8A896"
              value={siret}
              onChangeText={setSiret}
              keyboardType="number-pad"
              inputAccessoryViewID={doneAccessoryId}
            />
          </View>
        </View>

        <SaveButton onPress={handleSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BackButton() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      style={[styles.backButton, animatedStyle]}
      onPress={() => router.back()}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Text style={styles.backButtonText}>← Retour</Text>
    </AnimatedPressable>
  );
}

function SaveButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      style={[styles.saveButton, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Text style={styles.saveButtonText}>Enregistrer le client</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5C4A2F',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#E8DDD0',
  },
  backButtonText: {
    color: '#5C4A2F',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#E8DDD0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F2EC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#5C4A2F',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  saveButton: {
    backgroundColor: '#D4A574',
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
