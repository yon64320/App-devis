import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompanyProfile } from '@/contexts/CompanyProfileContext';

export default function ProfileScreen() {
  const { profile, saveProfile } = useCompanyProfile();
  const insets = useSafeAreaInsets();
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companySiret, setCompanySiret] = useState('');
  const [companySectionY, setCompanySectionY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setCompanyName(profile.name);
    setCompanyEmail(profile.email);
    setCompanyPhone(profile.phone);
    setCompanyAddress(profile.address);
    setCompanySiret(profile.siret);
  }, [profile]);

  const handleSave = async () => {
    try {
      await saveProfile({
        name: companyName.trim(),
        email: companyEmail.trim(),
        phone: companyPhone.trim(),
        address: companyAddress.trim(),
        siret: companySiret.trim(),
      });
      Alert.alert('Succès', 'Profil entreprise enregistré.', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le profil.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: 10,
              paddingBottom: 140,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (event.nativeEvent.contentOffset.y < 0) {
              scrollRef.current?.scrollTo({ y: 0, animated: false });
            }
          }}
          scrollEventThrottle={16}>
          <View style={styles.header}>
            <Text style={styles.title}>Mon profil</Text>
            <Text style={styles.subtitle}>
              Renseignez votre entreprise pour pré-remplir les devis.
            </Text>
          </View>

          <View style={styles.quickActions}>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => scrollRef.current?.scrollTo({ y: companySectionY, animated: true })}>
              <Text style={styles.quickActionTitle}>Mon entreprise</Text>
              <Text style={styles.quickActionDetail}>
                {companyName ? companyName : 'Ajoutez le nom de votre entreprise'}
              </Text>
              <Text style={styles.quickActionDetail}>
                {companyEmail ? companyEmail : 'Email non renseigné'}
              </Text>
              <Text style={styles.quickActionDetail}>
                {companyPhone ? companyPhone : 'Téléphone non renseigné'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.quickActionCard, styles.secondaryCard]}
              onPress={() => router.push('/prestations')}>
              <Text style={styles.quickActionTitle}>Mes prestations</Text>
              <Text style={styles.quickActionDetail}>
                Consultez la liste de vos prestations enregistrées.
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre entreprise</Text>
            <View
              style={styles.card}
              onLayout={(event) => setCompanySectionY(event.nativeEvent.layout.y)}>
              <Text style={styles.label}>Nom de l'entreprise</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom de l'entreprise"
                placeholderTextColor="#B8A896"
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@entreprise.fr"
                placeholderTextColor="#B8A896"
                value={companyEmail}
                onChangeText={setCompanyEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="06 00 00 00 00"
                placeholderTextColor="#B8A896"
                value={companyPhone}
                onChangeText={setCompanyPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Adresse</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Adresse complète"
                placeholderTextColor="#B8A896"
                value={companyAddress}
                onChangeText={setCompanyAddress}
                multiline
              />

              <Text style={styles.label}>SIRET</Text>
              <TextInput
                style={styles.input}
                placeholder="SIRET"
                placeholderTextColor="#B8A896"
                value={companySiret}
                onChangeText={setCompanySiret}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#5C4A2F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8C7A6B',
  },
  quickActions: {
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  secondaryCard: {
    backgroundColor: '#FFF6F0',
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5C4A2F',
    marginBottom: 6,
  },
  quickActionDetail: {
    fontSize: 13,
    color: '#8C7A6B',
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D5B4B',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5D5C6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#5C4A2F',
    backgroundColor: '#FFFDFB',
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#7A1F2B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
