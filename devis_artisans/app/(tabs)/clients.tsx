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
  const { clients, updateClient } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const handleSave = async (client: Client) => {
    await updateClient(client);
    Alert.alert('Succès', 'Client mis à jour.');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
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
              clients.map((client) => (
                <Pressable
                  key={client.id}
                  style={[
                    styles.clientRow,
                    selectedClientId === client.id && styles.clientRowActive,
                  ]}
                  onPress={() => setSelectedClientId(client.id)}>
                  <View>
                    <Text style={styles.clientName}>
                      {client.prenom} {client.nom}
                    </Text>
                    <Text style={styles.clientEmail}>{client.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#8B7A5F" />
                </Pressable>
              ))
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
  const [nom, setNom] = useState(client.nom);
  const [prenom, setPrenom] = useState(client.prenom);
  const [email, setEmail] = useState(client.email);
  const [siret, setSiret] = useState(client.siret ?? '');
  const [activeTab, setActiveTab] = useState<'fiche' | 'recap'>('fiche');
  const { devis } = useDevis();
  const scale = useSharedValue(1);

  useEffect(() => {
    setNom(client.nom);
    setPrenom(client.prenom);
    setEmail(client.email);
    setSiret(client.siret ?? '');
    setActiveTab('fiche');
  }, [client]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const clientLabel = `${client.prenom} ${client.nom}`.trim();
  const clientDevis = devis.filter((item) => item.client === clientLabel);
  const totalMontant = clientDevis.reduce((total, item) => {
    const numericValue = Number(
      item.montant
        .replace('€', '')
        .replace(/\s/g, '')
        .replace(',', '.')
    );
    return total + (Number.isNaN(numericValue) ? 0 : numericValue);
  }, 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Fiche client</Text>
      <View style={styles.segmentedControl}>
        <Pressable
          style={[
            styles.segmentButton,
            activeTab === 'fiche' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('fiche')}>
          <Text
            style={[
              styles.segmentText,
              activeTab === 'fiche' && styles.segmentTextActive,
            ]}>
            Fiche client
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.segmentButton,
            activeTab === 'recap' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('recap')}>
          <Text
            style={[
              styles.segmentText,
              activeTab === 'recap' && styles.segmentTextActive,
            ]}>
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

          <AnimatedPressable
            style={[styles.saveButton, animatedStyle]}
            onPress={() => onSave({ ...client, nom, prenom, email, siret })}
            onPressIn={() => {
              scale.value = withSpring(0.97);
            }}
            onPressOut={() => {
              scale.value = withSpring(1);
            }}>
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
                <View key={item.id} style={styles.recapRow}>
                  <View>
                    <Text style={styles.recapLabel}>{item.date}</Text>
                    <Text style={styles.recapSubLabel}>{item.statut}</Text>
                  </View>
                  <Text style={styles.recapAmount}>{item.montant}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.recapTotalRow}>
            <Text style={styles.recapTotalLabel}>Total client</Text>
            <Text style={styles.recapTotalAmount}>
              {totalMontant.toFixed(2).replace('.', ' ')} €
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
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DB',
  },
  clientRowActive: {
    backgroundColor: '#F7F2EC',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4A2F',
  },
  clientEmail: {
    fontSize: 13,
    color: '#8B7A5F',
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
