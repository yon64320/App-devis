import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Client, useClients } from '@/contexts/ClientsContext';
import { useDevis } from '@/contexts/DevisContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ClientsScreen() {
  const router = useRouter();
  const { clients, updateClient } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const selectedClientLabel = useMemo(() => {
    if (!selectedClient) {
      return '';
    }
    return `${selectedClient.prenom} ${selectedClient.nom}`.trim();
  }, [selectedClient]);

  const handleSave = async (client: Client) => {
    await updateClient(client);
    Alert.alert('Succès', 'Client mis à jour.');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>Gérez vos fiches clients</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liste des clients</Text>
          <View style={styles.card}>
            {clients.length === 0 ? (
              <Text style={styles.emptyText}>Aucun client enregistré.</Text>
            ) : (
              <View>
                <Text style={styles.helperText}>
                  Sélectionnez un client dans la liste déroulante.
                </Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setClientPickerOpen((prev) => !prev)}
                >
                  <Text
                    style={
                      selectedClientLabel
                        ? styles.dropdownValue
                        : styles.dropdownPlaceholder
                    }
                  >
                    {selectedClientLabel || 'Choisir un client'}
                  </Text>
                  <Text style={styles.dropdownChevron}>▾</Text>
                </Pressable>
                {clientPickerOpen && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {clients.map((client) => {
                        const label = `${client.prenom} ${client.nom}`.trim();
                        const isActive = selectedClientId === client.id;
                        return (
                          <Pressable
                            key={client.id}
                            style={[
                              styles.dropdownItem,
                              isActive && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              setSelectedClientId(client.id);
                              setClientPickerOpen(false);
                            }}
                          >
                            <View>
                              <Text style={styles.dropdownItemText}>{label}</Text>
                              <Text style={styles.dropdownItemSubText}>
                                {client.email}
                              </Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color="#B49B7E"
                            />
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {selectedClient && (
          <ClientEditor client={selectedClient} onSave={handleSave} />
        )}
      </ScrollView>
    </View>
  );
}

function ClientEditor({
  client,
  onSave,
}: {
  client: Client;
  onSave: (client: Client) => Promise<void>;
}) {
  const router = useRouter();
  const [nom, setNom] = useState(client.nom);
  const [prenom, setPrenom] = useState(client.prenom);
  const [email, setEmail] = useState(client.email);
  const [siret, setSiret] = useState(client.siret ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');
  const [address, setAddress] = useState(client.address ?? '');
  const [activeTab, setActiveTab] = useState<'fiche' | 'recap'>('fiche');

  const { devis } = useDevis();
  const scale = useSharedValue(1);

  useEffect(() => {
    setNom(client.nom);
    setPrenom(client.prenom);
    setEmail(client.email);
    setSiret(client.siret ?? '');
    setPhone(client.phone ?? '');
    setAddress(client.address ?? '');
    setActiveTab('fiche');
  }, [client]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const clientLabel = `${client.prenom} ${client.nom}`.trim();
  const clientDevis = devis.filter((item) => item.client === clientLabel);

  const formatMontant = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const parseMontant = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    if (!digits) {
      return 0;
    }
    const cents = digits.length === 1 ? `0${digits}` : digits;
    const amount = `${cents.slice(0, -2)}.${cents.slice(-2)}`;
    return Number(amount);
  };

  const totalMontant = clientDevis.reduce(
    (total, item) => total + parseMontant(item.montant),
    0
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Fiche client</Text>

      <View style={styles.segmentedControl}>
        <Pressable
          style={[
            styles.segmentButton,
            activeTab === 'fiche' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('fiche')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'fiche' && styles.segmentTextActive,
            ]}
          >
            Fiche client
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentButton,
            activeTab === 'recap' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('recap')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'recap' && styles.segmentTextActive,
            ]}
          >
            Récap devis
          </Text>
        </Pressable>
      </View>

      {activeTab === 'fiche' ? (
        <View style={styles.card}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={nom}
            onChangeText={setNom}
            placeholder="Nom"
            placeholderTextColor="#B8A896"
          />

          <Text style={styles.label}>Prénom</Text>
          <TextInput
            style={styles.input}
            value={prenom}
            onChangeText={setPrenom}
            placeholder="Prénom"
            placeholderTextColor="#B8A896"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#B8A896"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>SIRET</Text>
          <TextInput
            style={styles.input}
            value={siret}
            onChangeText={setSiret}
            placeholder="SIRET"
            placeholderTextColor="#B8A896"
          />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Téléphone"
            placeholderTextColor="#B8A896"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Adresse"
            placeholderTextColor="#B8A896"
            multiline
            numberOfLines={3}
          />

          <AnimatedPressable
            style={[styles.saveButton, animatedStyle]}
            onPress={() => onSave({ ...client, nom, prenom, email, siret, phone, address })}
            onPressIn={() => {
              scale.value = withSpring(0.97);
            }}
            onPressOut={() => {
              scale.value = withSpring(1);
            }}
          >
            <Text style={styles.saveButtonText}>Mettre à jour</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.card}>
          {clientDevis.length === 0 ? (
            <Text style={styles.emptyText}>
              Aucun devis trouvé pour ce client.
            </Text>
          ) : (
            <View style={styles.recapList}>
              {clientDevis.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.recapRow,
                    pressed && styles.recapRowPressed,
                  ]}
                  onPress={() => router.push(`/devis/${item.id}`)}
                >
                  <View>
                    <Text style={styles.recapLabel}>{item.date}</Text>
                    <Text style={styles.recapSubLabel}>{item.statut}</Text>
                  </View>
                  <Text style={styles.recapAmount}>
                    {formatMontant(parseMontant(item.montant))} €
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.recapTotalRow}>
            <Text style={styles.recapTotalLabel}>Total client</Text>
            <Text style={styles.recapTotalAmount}>
              {formatMontant(totalMontant)} €
            </Text>
          </View>
        </View>
      )}
    </View>
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
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5C4A2F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B7A5F',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E8DDD0',
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#9B846A',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F2EC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#B8A896',
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C4A2F',
  },
  dropdownChevron: {
    fontSize: 16,
    color: '#8B7A5F',
  },
  dropdownList: {
    marginTop: 12,
    backgroundColor: '#FDFBF7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DB',
  },
  dropdownItemActive: {
    backgroundColor: '#F7F2EC',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C4A2F',
  },
  dropdownItemSubText: {
    fontSize: 12,
    color: '#8B7A5F',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#8B7A5F',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F7F2EC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#5C4A2F',
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#7A1F2B',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#7A1F2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#EFE6DA',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#7A1F2B',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B7A5F',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  recapList: {
    gap: 12,
    marginBottom: 16,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DB',
  },
  recapRowPressed: {
    opacity: 0.7,
  },
  recapLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C4A2F',
  },
  recapSubLabel: {
    fontSize: 12,
    color: '#8B7A5F',
    marginTop: 2,
  },
  recapAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7A1F2B',
  },
  recapTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DDD0',
  },
  recapTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C4A2F',
  },
  recapTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A1F2B',
  },
});
