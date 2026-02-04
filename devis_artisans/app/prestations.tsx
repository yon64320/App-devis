import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { usePrestations } from '@/contexts/PrestationsContext';

export default function PrestationsScreen() {
  const { prestations, deletePrestation } = usePrestations();

  const emptyState = useMemo(() => prestations.length === 0, [prestations.length]);

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer la prestation ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePrestation(id);
          } catch (error) {
            console.error(error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </Pressable>
        <View style={styles.header}>
          <Text style={styles.title}>Mes prestations</Text>
          <Text style={styles.subtitle}>
            Retrouvez ici vos prestations enregistrées.
          </Text>
        </View>

        {emptyState ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucune prestation enregistrée</Text>
            <Text style={styles.emptyDescription}>
              Ajoutez des prestations depuis un devis pour les revoir ici.
            </Text>
          </View>
        ) : (
          prestations.map((prestation) => (
            <View key={prestation.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{prestation.libelle}</Text>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDelete(prestation.id)}>
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </Pressable>
              </View>
              <Text style={styles.cardSubtitle}>
                Prix unitaire : {prestation.prixUnitaire.toFixed(2)} €
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#D4A574',
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5C4A2F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8C7A6B',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5C4A2F',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#8C7A6B',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4A2F',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8C7A6B',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#B33A31',
    fontWeight: '600',
  },
});
