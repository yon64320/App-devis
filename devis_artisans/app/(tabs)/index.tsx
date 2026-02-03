import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDevis } from '@/contexts/DevisContext';
import { useClients } from '@/contexts/ClientsContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const { devis, deleteDevis } = useDevis();
  const { clients } = useClients();
  const [viewMode, setViewMode] = useState<'recent' | 'client'>('recent');
  const [selectedClient, setSelectedClient] = useState('');
  const [clientListOpen, setClientListOpen] = useState(false);
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

  const handleCreateDevis = () => {
    if (clients.length === 0) {
      Alert.alert(
        'Aucun client enregistré',
        'Vous pouvez créer un client maintenant ou continuer sans fiche client.',
        [
          {
            text: 'Ajouter un client',
            onPress: handleAddClient,
          },
          {
            text: 'Continuer',
            onPress: () => router.push('/(tabs)/new-devis'),
          },
        ]
      );
      return;
    }
    router.push('/(tabs)/new-devis');
  };

  const handleAddClient = () => {
    router.push('/new-client');
  };

  const handleDevisPress = (devisId: string) => {
    router.push(`/devis/${devisId}`);
  };

  const handleDeleteDevis = (devisId: string) => {
    Alert.alert(
      'Supprimer le devis ?',
      'Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDevis(devisId);
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
            }
          },
        },
      ]
    );
  };

  const filteredDevis = useMemo(() => {
    if (viewMode === 'recent') {
      return devis;
    }
    if (!selectedClient) {
      return [];
    }
    return devis.filter((item) => item.client === selectedClient);
  }, [devis, selectedClient, viewMode]);

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Devis Artisan</Text>
            <Text style={styles.subtitle}>
              Créez et gérez vos devis facilement
            </Text>
          </View>
        </View>

        {/* Bouton créer devis */}
        <AnimatedButton
          onPress={handleCreateDevis}
          label="Créer un devis"
          icon="➕"
        />
        <AnimatedButton
          onPress={handleAddClient}
          label="Ajouter un client"
          icon="👤"
        />

        {/* Liste des devis */}
        <View style={styles.devisSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {viewMode === 'recent' ? 'Mes devis récents' : 'Mes devis par client'}
            </Text>
            <View style={styles.segmentedControl}>
              <Pressable
                style={[
                  styles.segmentButton,
                  viewMode === 'recent' && styles.segmentButtonActive,
                ]}
                onPress={() => {
                  setViewMode('recent');
                  setSelectedClient('');
                  setClientListOpen(false);
                }}>
                <Text
                  style={[
                    styles.segmentText,
                    viewMode === 'recent' && styles.segmentTextActive,
                  ]}>
                  Récents
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.segmentButton,
                  viewMode === 'client' && styles.segmentButtonActive,
                ]}
                onPress={() => {
                  setViewMode('client');
                  setClientListOpen(false);
                }}>
                <Text
                  style={[
                    styles.segmentText,
                    viewMode === 'client' && styles.segmentTextActive,
                  ]}>
                  Par client
                </Text>
              </Pressable>
            </View>
          </View>

          {viewMode === 'client' && (
            <View style={styles.clientFilter}>
              <Pressable
                style={styles.dropdownButton}
                onPress={() => setClientListOpen((prev) => !prev)}>
                <Text
                  style={
                    selectedClient ? styles.dropdownValue : styles.dropdownPlaceholder
                  }>
                  {selectedClient || 'Choisir un client'}
                </Text>
                <Ionicons
                  name={clientListOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#8B7A5F"
                />
              </Pressable>
              {clientListOpen && (
                <View style={styles.dropdownList}>
                  {clients.length === 0 ? (
                    <Text style={styles.dropdownEmpty}>Aucun client enregistré</Text>
                  ) : (
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled">
                      {clients.map((item) => {
                        const label = `${item.prenom} ${item.nom}`;
                        const isActive = label === selectedClient;
                        return (
                          <Pressable
                            key={item.id}
                            style={[
                              styles.dropdownItem,
                              isActive && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              setSelectedClient(label);
                              setClientListOpen(false);
                            }}>
                            <Text
                              style={[
                                styles.dropdownItemText,
                                isActive && styles.dropdownItemTextActive,
                              ]}>
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          )}
          <FlatList
            data={filteredDevis}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <DevisCard
                devis={item}
                onPress={() => handleDevisPress(item.id)}
                onDelete={() => handleDeleteDevis(item.id)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {viewMode === 'client' && !selectedClient
                  ? 'Sélectionnez un client pour voir ses devis.'
                  : 'Aucun devis à afficher pour le moment.'}
              </Text>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

function AnimatedButton({
  onPress,
  label,
  icon,
}: {
  onPress: () => void;
  label: string;
  icon: string;
}) {
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
      style={[styles.createButton, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Text style={styles.buttonIcon}>{icon}</Text>
      <Text style={styles.buttonText}>{label}</Text>
    </AnimatedPressable>
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
      <Animated.View style={[styles.gradientBlob1Shine, animatedStyle1]} />
      <Animated.View style={[styles.gradientBlob2, animatedStyle2]} />
      <Animated.View style={[styles.gradientBlob2Shine, animatedStyle2]} />
      <Animated.View style={[styles.gradientBlob3, animatedStyle3]} />
      <Animated.View style={[styles.gradientBlob3Shine, animatedStyle3]} />
    </View>
  );
}

function DevisCard({
  devis,
  onPress,
  onDelete,
}: {
  devis: { id: string; client: string; date: string; montant: string; statut: 'En attente' | 'Accepté' | 'Refusé' };
  onPress: () => void;
  onDelete: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getStatusStyle = (statut: 'En attente' | 'Accepté' | 'Refusé') => {
    switch (statut) {
      case 'Accepté':
        return {
          backgroundColor: 'rgba(76, 175, 80, 0.12)',
          borderColor: 'rgba(76, 175, 80, 0.35)',
          textColor: '#3E7C40',
        };
      case 'Refusé':
        return {
          backgroundColor: 'rgba(244, 67, 54, 0.12)',
          borderColor: 'rgba(244, 67, 54, 0.35)',
          textColor: '#B33A31',
        };
      default:
        return {
          backgroundColor: 'rgba(255, 152, 0, 0.12)',
          borderColor: 'rgba(255, 152, 0, 0.35)',
          textColor: '#A86800',
        };
    }
  };
  const statusStyle = getStatusStyle(devis.statut);

  return (
    <AnimatedPressable
      style={[styles.devisCard, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <View style={styles.devisCardHeader}>
        <View style={styles.devisCardLeft}>
          <Text style={styles.devisClient}>{devis.client}</Text>
          <Text style={styles.devisDate}>{devis.date}</Text>
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusStyle.backgroundColor,
                borderColor: statusStyle.borderColor,
              },
            ]}>
            <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
              {devis.statut}
            </Text>
          </View>
          <Pressable style={styles.deleteButton} onPress={onDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={16} color="#B38B6D" />
          </Pressable>
        </View>
      </View>
      <View style={styles.devisCardFooter}>
        <Text style={styles.devisMontant}>
          {formatMontant(parseMontant(devis.montant))} €
        </Text>
      </View>
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
  gradientBlob1Shine: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    opacity: 0.2,
    top: -40,
    left: -20,
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
  gradientBlob2Shine: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
    top: 240,
    right: -40,
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
  gradientBlob3Shine: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
    bottom: -40,
    left: 90,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 60,
  },
  headerTitles: {
    flex: 1,
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
    fontWeight: '400',
  },
  createButton: {
    backgroundColor: '#D4A574',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  devisSection: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5C4A2F',
    flex: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F0E7DB',
    borderRadius: 16,
    padding: 4,
  },
  segmentButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  segmentText: {
    fontSize: 12,
    color: '#8B7A5F',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#5C4A2F',
  },
  clientFilter: {
    marginBottom: 16,
  },
  dropdownButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8DDD0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPlaceholder: {
    color: '#B8A896',
    fontSize: 15,
  },
  dropdownValue: {
    color: '#5C4A2F',
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8DDD0',
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DB',
  },
  dropdownItemActive: {
    backgroundColor: '#F7F2EC',
  },
  dropdownItemText: {
    color: '#5C4A2F',
    fontSize: 15,
  },
  dropdownItemTextActive: {
    fontWeight: '700',
  },
  dropdownEmpty: {
    padding: 16,
    color: '#8B7A5F',
    fontSize: 14,
  },
  separator: {
    height: 12,
  },
  emptyText: {
    color: '#8B7A5F',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  devisCard: {
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
  devisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  devisCardLeft: {
    flex: 1,
  },
  devisClient: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 4,
  },
  devisDate: {
    fontSize: 14,
    color: '#8B7A5F',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    color: '#5C4A2F',
    fontSize: 12,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E7DA',
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  devisCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E8DDD0',
    paddingTop: 12,
  },
  devisMontant: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D4A574',
  },
});
