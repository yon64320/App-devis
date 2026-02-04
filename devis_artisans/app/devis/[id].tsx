import { Devis, useDevis } from '@/contexts/DevisContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function DevisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDevisById, deleteDevis, updateDevisStatut } = useDevis();
  const devis = getDevisById(id || '');

  if (!devis) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Devis introuvable</Text>
      </View>
    );
  }

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
  const statusOrder: Devis['statut'][] = ['En attente', 'Accepté', 'Refusé'];

  const handleStatusPress = async () => {
    const currentIndex = statusOrder.indexOf(devis.statut);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    try {
      await updateDevisStatut(devis.id, statusOrder[nextIndex]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleDelete = () => {
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
              await deleteDevis(devis.id);
              router.back();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
            }
          },
        },
      ]
    );
  };

  const calculerTotalHT = () => {
    return devis.prestations.reduce(
      (total, p) => total + p.quantite * p.prixUnitaire,
      0
    );
  };

  const totalHT = calculerTotalHT();
  const montantTVA = (totalHT * devis.tva) / 100;
  const totalTTC = totalHT + montantTVA;

  const handleSendPro = async () => {
    try {
      const parsedDate = new Date(devis.date);
      const payloadDate = Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString().slice(0, 10)
        : parsedDate.toISOString().slice(0, 10);

      const payload = {
        quoteNumber: devis.quoteNumber,
        date: payloadDate,
        company: {
          name: devis.companyName,
          email: devis.companyEmail,
          phone: devis.companyPhone,
          address: devis.companyAddress,
          siret: devis.companySiret,
        },
        client: {
          name: devis.client,
          email: devis.clientEmail,
          phone: devis.clientPhone,
          address: devis.clientAddress,
        },
        siteAddress: devis.siteAddress || devis.clientAddress,
        vatRate: devis.tva,
        lines: devis.prestations.map((prestation) => ({
          title: prestation.libelle,
          qty: prestation.quantite,
          unitPriceHT: prestation.prixUnitaire,
        })),
        totals: {
          totalHT: Number(totalHT.toFixed(2)),
          totalTVA: Number(montantTVA.toFixed(2)),
          totalTTC: Number(totalTTC.toFixed(2)),
        },
        notes: devis.notes,
      };

      console.log('Envoi du devis vers n8n:', payload);

      // Utiliser l'URL de production au lieu de l'URL de test
      // Remplacez 'webhook-test' par 'webhook' pour utiliser l'URL de production
      const webhookUrl = 'https://n8n.srv1266367.hstgr.cloud/webhook-test/devis/create';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error('Erreur HTTP:', response.status, errorText);
        
        // Parser le message d'erreur JSON si possible
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
            if (errorJson.hint) {
              errorMessage += `\n\n${errorJson.hint}`;
            }
          }
        } catch {
          errorMessage = `Erreur ${response.status}: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json().catch(() => null);
      console.log('Réponse du webhook:', responseData);
      Alert.alert('Succès', 'Version pro envoyée.');
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Message d'erreur plus clair pour l'utilisateur
      let userMessage = `Impossible d'envoyer la version pro.\n\n${errorMessage}`;
      
      // Si c'est une erreur 404, donner des instructions spécifiques
      if (errorMessage.includes('404') || errorMessage.includes('not registered')) {
        userMessage = `Le webhook n8n n'est pas actif.\n\n` +
          `Solutions possibles :\n` +
          `1. Activez le workflow dans n8n (bouton "Execute workflow")\n` +
          `2. Ou utilisez l'URL de production si disponible\n\n` +
          `Détails : ${errorMessage}`;
      }
      
      Alert.alert('Erreur', userMessage);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerRight}>
            <Text style={styles.title}>Détail du devis</Text>
            <Pressable
              style={styles.editButton}
              onPress={() => router.push(`/new-devis?id=${devis.id}`)}>
              <Ionicons name="pencil" size={18} color="#5C4A2F" />
            </Pressable>
          </View>
        </View>

        {/* Carte principale */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{devis.client}</Text>
              <Text style={styles.devisDate}>{devis.date}</Text>
              {devis.quoteNumber ? (
                <Text style={styles.quoteNumber}>Devis n° {devis.quoteNumber}</Text>
              ) : null}
            </View>
            <View style={styles.statusRow}>
              <Pressable
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusStyle.backgroundColor,
                    borderColor: statusStyle.borderColor,
                  },
                ]}
                onPress={handleStatusPress}>
                <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                  {devis.statut}
                </Text>
              </Pressable>
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
                hitSlop={10}>
                <Ionicons name="trash-outline" size={16} color="#B38B6D" />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.description}>{devis.description}</Text>
        </View>

        {/* Section prestations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prestations</Text>
          <View style={styles.prestationsCard}>
            {devis.prestations.map((prestation, index) => (
              <View key={index} style={styles.prestationRow}>
                <View style={styles.prestationLeft}>
                  <Text style={styles.prestationLibelle}>
                    {prestation.libelle}
                  </Text>
                  <Text style={styles.prestationDetails}>
                    {prestation.quantite} × {prestation.prixUnitaire} €
                  </Text>
                </View>
                <Text style={styles.prestationTotal}>
                  {(prestation.quantite * prestation.prixUnitaire).toFixed(2)} €
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section totaux */}
        <View style={styles.section}>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{totalHT.toFixed(2)} €</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA ({devis.tva}%)</Text>
              <Text style={styles.totalValue}>{montantTVA.toFixed(2)} €</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelBold}>Total TTC</Text>
              <Text style={styles.totalValueBold}>
                {totalTTC.toFixed(2)} €
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.proButton} onPress={handleSendPro}>
            <Text style={styles.proButtonText}>Envoyer version pro</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 36,
    paddingBottom: 140,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#D4A574',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5C4A2F',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DDD0',
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E8DDD0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5C4A2F',
    marginBottom: 4,
  },
  devisDate: {
    fontSize: 14,
    color: '#8B7A5F',
  },
  quoteNumber: {
    fontSize: 13,
    color: '#8B7A5F',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    color: '#5C4A2F',
    fontSize: 13,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: '#E8DDD0',
    marginVertical: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7A5F',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#5C4A2F',
    lineHeight: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 16,
  },
  prestationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E8DDD0',
  },
  prestationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
  },
  prestationLeft: {
    flex: 1,
    marginRight: 16,
  },
  prestationLibelle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 4,
  },
  prestationDetails: {
    fontSize: 14,
    color: '#8B7A5F',
  },
  prestationTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4A574',
  },
  totalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E8DDD0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#8B7A5F',
  },
  totalValue: {
    fontSize: 16,
    color: '#5C4A2F',
    fontWeight: '500',
  },
  totalLabelBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5C4A2F',
  },
  totalValueBold: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4A574',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 50,
  },
  proButton: {
    backgroundColor: '#7A1F2B',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A1F2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  proButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
