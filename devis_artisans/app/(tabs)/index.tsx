import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useDevis } from '@/contexts/DevisContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const { devis } = useDevis();

  const handleCreateDevis = () => {
    router.push('/new-devis');
  };

  const handleDevisPress = (devisId: string) => {
    router.push(`/devis/${devisId}`);
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
          <Text style={styles.title}>Devis Artisan</Text>
          <Text style={styles.subtitle}>
            Créez et gérez vos devis facilement
          </Text>
        </View>

        {/* Bouton créer devis */}
        <AnimatedButton
          onPress={handleCreateDevis}
          label="Créer un devis"
          icon="➕"
        />

        {/* Liste des devis */}
        <View style={styles.devisSection}>
          <Text style={styles.sectionTitle}>Mes devis récents</Text>
          <FlatList
            data={devis}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <DevisCard devis={item} onPress={() => handleDevisPress(item.id)} />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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
      <Animated.View style={[styles.gradientBlob2, animatedStyle2]} />
      <Animated.View style={[styles.gradientBlob3, animatedStyle3]} />
    </View>
  );
}

function DevisCard({
  devis,
  onPress,
}: {
  devis: { id: string; client: string; date: string; montant: string; statut: 'En attente' | 'Accepté' | 'Refusé' };
  onPress: () => void;
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

  const getStatusColor = (statut: 'En attente' | 'Accepté' | 'Refusé') => {
    switch (statut) {
      case 'Accepté':
        return '#4CAF50';
      case 'Refusé':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

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
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(devis.statut) },
          ]}>
          <Text style={styles.statusText}>{devis.statut}</Text>
        </View>
      </View>
      <View style={styles.devisCardFooter}>
        <Text style={styles.devisMontant}>{devis.montant}</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 16,
  },
  separator: {
    height: 12,
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
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
