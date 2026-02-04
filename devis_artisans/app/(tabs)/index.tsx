import { router } from 'expo-router';
import { useEffect } from 'react';
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

// Fonctions utilitaires pour formater les montants
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

export default function HomeScreen() {
  const { devis, deleteDevis } = useDevis();
  const { clients } = useClients();

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
            onPress: () => router.push('/new-devis'),
          },
        ]
      );
      return;
    }
    router.push('/new-devis');
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
            <Text style={styles.sectionTitle}>Mes devis récents</Text>
          </View>
          <FlatList
            data={devis}
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
                Aucun devis à afficher pour le moment.
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
            <Ionicons name="trash-outline" size={14} color="#B38B6D" />
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
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#D4A574',
    opacity: 0.25,
    top: -70,
    left: -70,
  },
  gradientBlob1Shine: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    opacity: 0.2,
    top: -25,
    left: -10,
  },
  gradientBlob2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#C9A961',
    opacity: 0.22,
    top: 180,
    right: -120,
  },
  gradientBlob2Shine: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
    top: 210,
    right: -20,
  },
  gradientBlob3: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#E8C5A0',
    opacity: 0.2,
    bottom: -80,
    left: 40,
  },
  gradientBlob3Shine: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
    bottom: -20,
    left: 70,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    marginTop: 48,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5C4A2F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#8B7A5F',
    fontWeight: '400',
  },
  createButton: {
    backgroundColor: '#7A1F2B',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#7A1F2B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4A2F',
    flex: 1,
  },
  separator: {
    height: 10,
  },
  emptyText: {
    color: '#8B7A5F',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  devisCard: {
    backgroundColor: '#FFF5F6',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: '#D8C8B6',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 4,
  },
  devisDate: {
    fontSize: 12,
    color: '#8B7A5F',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    color: '#5C4A2F',
    fontSize: 10,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E7DA',
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  devisCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E8DDD0',
    paddingTop: 8,
  },
  devisMontant: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4A574',
  },
});
