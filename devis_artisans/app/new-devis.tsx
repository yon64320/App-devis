import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
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
import { useCompanyProfile } from '@/contexts/CompanyProfileContext';
import { useDevis, Prestation as PrestationType } from '@/contexts/DevisContext';

interface Prestation {
  id: string;
  libelle: string;
  quantite: string;
  prixUnitaire: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NewDevisScreen() {
  const { addDevis, updateDevis, getDevisById } = useDevis();
  const { clients } = useClients();
  const { profile } = useCompanyProfile();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = Array.isArray(params.id) ? params.id[0] : params.id;
  const devisToEdit = editId ? getDevisById(editId) : undefined;
  const isEditMode = Boolean(editId && devisToEdit);
  const [quoteNumber, setQuoteNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companySiret, setCompanySiret] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [prestations, setPrestations] = useState<Prestation[]>([
    { id: '1', libelle: '', quantite: '', prixUnitaire: '' },
  ]);
  const [tva, setTva] = useState('20');

  useEffect(() => {
    if (!devisToEdit) {
      return;
    }
    setQuoteNumber(devisToEdit.quoteNumber);
    setClientName(devisToEdit.client);
    setClientEmail(devisToEdit.clientEmail);
    setClientPhone(devisToEdit.clientPhone);
    setClientAddress(devisToEdit.clientAddress);
    setCompanyName(devisToEdit.companyName);
    setCompanyEmail(devisToEdit.companyEmail);
    setCompanyPhone(devisToEdit.companyPhone);
    setCompanyAddress(devisToEdit.companyAddress);
    setCompanySiret(devisToEdit.companySiret);
    setSiteAddress(devisToEdit.siteAddress);
    setNotes(devisToEdit.notes);
    setDescription(devisToEdit.description);
    setPrestations(
      devisToEdit.prestations.map((prestation, index) => ({
        id: `${Date.now()}-${index}`,
        libelle: prestation.libelle,
        quantite: prestation.quantite.toString(),
        prixUnitaire: prestation.prixUnitaire.toString(),
      }))
    );
    setTva(devisToEdit.tva.toString());
  }, [devisToEdit]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }
    setCompanyName((prev) => prev || profile.name);
    setCompanyEmail((prev) => prev || profile.email);
    setCompanyPhone((prev) => prev || profile.phone);
    setCompanyAddress((prev) => prev || profile.address);
    setCompanySiret((prev) => prev || profile.siret);
  }, [profile, isEditMode]);

  const addPrestation = () => {
    setPrestations([
      ...prestations,
      {
        id: Date.now().toString(),
        libelle: '',
        quantite: '',
        prixUnitaire: '',
      },
    ]);
  };

  const removePrestation = (id: string) => {
    if (prestations.length > 1) {
      setPrestations(prestations.filter((p) => p.id !== id));
    }
  };

  const updatePrestation = (id: string, field: keyof Prestation, value: string) => {
    setPrestations(
      prestations.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const calculerTotalHT = () => {
    return prestations.reduce((total, p) => {
      const qty = parseFloat(p.quantite) || 0;
      const prix = parseFloat(p.prixUnitaire) || 0;
      return total + qty * prix;
    }, 0);
  };

  const totalHT = calculerTotalHT();
  const montantTVA = (totalHT * parseFloat(tva || '0')) / 100;
  const totalTTC = totalHT + montantTVA;

  const handleSave = async () => {
    // Validation basique
    if (!quoteNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le numéro de devis');
      return;
    }

    if (!clientName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du client');
      return;
    }

    if (!clientEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'email du client');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une description');
      return;
    }

    const prestationsValides = prestations.filter(
      (p) => p.libelle.trim() && p.quantite && p.prixUnitaire
    );

    if (prestationsValides.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une prestation');
      return;
    }

    // Convertir les prestations au format attendu
    const prestationsFormatees: PrestationType[] = prestationsValides.map((p) => ({
      libelle: p.libelle.trim(),
      quantite: parseFloat(p.quantite),
      prixUnitaire: parseFloat(p.prixUnitaire),
    }));

    try {
      const payload = {
        quoteNumber: quoteNumber.trim(),
        client: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        clientAddress: clientAddress.trim(),
        companyName: companyName.trim(),
        companyEmail: companyEmail.trim(),
        companyPhone: companyPhone.trim(),
        companyAddress: companyAddress.trim(),
        companySiret: companySiret.trim(),
        siteAddress: siteAddress.trim(),
        description: description.trim(),
        prestations: prestationsFormatees,
        tva: parseFloat(tva || '20'),
        notes: notes.trim(),
      };

      if (isEditMode && editId) {
        await updateDevis(editId, payload);
      } else {
        // Sauvegarder le devis
        await addDevis(payload);
      }

      Alert.alert(
        'Succès',
        isEditMode ? 'Devis mis à jour avec succès !' : 'Devis créé avec succès !',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      if (!isEditMode) {
        setQuoteNumber('');
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setClientAddress('');
        setCompanyName('');
        setCompanyEmail('');
        setCompanyPhone('');
        setCompanyAddress('');
        setCompanySiret('');
        setSiteAddress('');
        setNotes('');
        setClientPickerOpen(false);
        setDescription('');
        setPrestations([{ id: '1', libelle: '', quantite: '', prixUnitaire: '' }]);
        setTva('20');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde du devis');
      console.error(error);
    }
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
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>{isEditMode ? 'Modifier devis' : 'Nouveau devis'}</Text>
        </View>

        {/* Référence devis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Référence du devis</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Numéro de devis *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: DEV-2024-001"
              placeholderTextColor="#B8A896"
              value={quoteNumber}
              onChangeText={setQuoteNumber}
              inputAccessoryViewID={doneAccessoryId}
            />
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Nom du client *</Text>
            {clients.length > 0 ? (
              <View>
                <View style={styles.dropdownField}>
                  <TextInput
                    style={styles.dropdownInput}
                    placeholder="Sélectionner un client"
                    placeholderTextColor="#B8A896"
                    value={clientName}
                    onChangeText={(text) => {
                      setClientName(text);
                      setClientPickerOpen(true);
                    }}
                    onFocus={() => setClientPickerOpen(true)}
                    inputAccessoryViewID={doneAccessoryId}
                  />
                  <Text style={styles.dropdownChevron}>⌄</Text>
                </View>
                {clientPickerOpen && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled">
                      {clients
                        .filter((item) => {
                          const label = `${item.prenom} ${item.nom}`.trim();
                          return label.toLowerCase().includes(clientName.trim().toLowerCase());
                        })
                        .map((item) => {
                          const label = `${item.prenom} ${item.nom}`.trim();
                          return (
                            <Pressable
                              key={item.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setClientName(label);
                                setClientEmail(item.email);
                                setClientPhone(item.phone ?? '');
                                setClientAddress(item.address ?? '');
                                setClientPickerOpen(false);
                              }}>
                              <Text style={styles.dropdownItemText}>{label}</Text>
                            </Pressable>
                          );
                        })}
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor="#B8A896"
                value={clientName}
                onChangeText={setClientName}
                inputAccessoryViewID={doneAccessoryId}
              />
            )}

            <Text style={styles.label}>Email du client *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: client@mail.com"
              placeholderTextColor="#B8A896"
              value={clientEmail}
              onChangeText={setClientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>Téléphone du client</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 06 12 34 56 78"
              placeholderTextColor="#B8A896"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>Adresse du client</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: 12 rue de la Paix, 75000 Paris"
              placeholderTextColor="#B8A896"
              value={clientAddress}
              onChangeText={setClientAddress}
              multiline
              numberOfLines={3}
              inputAccessoryViewID={doneAccessoryId}
            />
          </View>
        </View>

        {/* Informations entreprise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre entreprise</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Nom de l'entreprise</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Entreprise Martin"
              placeholderTextColor="#B8A896"
              value={companyName}
              onChangeText={setCompanyName}
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>Email de l'entreprise</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: contact@entreprise.fr"
              placeholderTextColor="#B8A896"
              value={companyEmail}
              onChangeText={setCompanyEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>Téléphone de l'entreprise</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 01 23 45 67 89"
              placeholderTextColor="#B8A896"
              value={companyPhone}
              onChangeText={setCompanyPhone}
              keyboardType="phone-pad"
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>Adresse de l'entreprise</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: 10 avenue des Artisans, 69000 Lyon"
              placeholderTextColor="#B8A896"
              value={companyAddress}
              onChangeText={setCompanyAddress}
              multiline
              numberOfLines={3}
              inputAccessoryViewID={doneAccessoryId}
            />

            <Text style={styles.label}>SIRET</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 123 456 789 00012"
              placeholderTextColor="#B8A896"
              value={companySiret}
              onChangeText={setCompanySiret}
              keyboardType="number-pad"
              inputAccessoryViewID={doneAccessoryId}
            />
          </View>
        </View>

        {/* Adresse du chantier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse du chantier</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Adresse du site</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Adresse du chantier"
              placeholderTextColor="#B8A896"
              value={siteAddress}
              onChangeText={setSiteAddress}
              multiline
              numberOfLines={3}
              inputAccessoryViewID={doneAccessoryId}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Description du projet *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez le projet..."
              placeholderTextColor="#B8A896"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              inputAccessoryViewID={doneAccessoryId}
            />
          </View>
        </View>

        {/* Prestations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prestations</Text>
            <AddButton onPress={addPrestation} />
          </View>

          {prestations.map((prestation, index) => (
            <PrestationCard
              key={prestation.id}
              prestation={prestation}
              index={index}
              onUpdate={(field, value) =>
                updatePrestation(prestation.id, field, value)
              }
              onRemove={() => removePrestation(prestation.id)}
              canRemove={prestations.length > 1}
            />
          ))}
        </View>

        {/* TVA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TVA</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Taux de TVA (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="20"
              placeholderTextColor="#B8A896"
              value={tva}
              onChangeText={setTva}
              keyboardType="number-pad"
              inputAccessoryViewID={doneAccessoryId}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Notes ou conditions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ajoutez des informations complémentaires"
              placeholderTextColor="#B8A896"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              inputAccessoryViewID={doneAccessoryId}
            />
          </View>
        </View>

        {/* Totaux */}
        <View style={styles.section}>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{totalHT.toFixed(2)} €</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA ({tva || 0}%)</Text>
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

        {/* Bouton sauvegarder */}
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

function AddButton({ onPress }: { onPress: () => void }) {
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
      style={[styles.addButton, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Text style={styles.addButtonText}>+ Ajouter</Text>
    </AnimatedPressable>
  );
}

function PrestationCard({
  prestation,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  prestation: Prestation;
  index: number;
  onUpdate: (field: keyof Prestation, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <View style={styles.prestationCard}>
      <View style={styles.prestationHeader}>
        <Text style={styles.prestationNumber}>Prestation {index + 1}</Text>
        {canRemove && <RemoveButton onPress={onRemove} />}
      </View>

      <Text style={styles.label}>Libellé *</Text>
      <TextInput
        style={[styles.input, styles.prestationInputSpacing]}
        placeholder="Ex: Carrelage mural"
        placeholderTextColor="#B8A896"
        value={prestation.libelle}
        onChangeText={(value) => onUpdate('libelle', value)}
        inputAccessoryViewID={doneAccessoryId}
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Quantité *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#B8A896"
            value={prestation.quantite}
            onChangeText={(value) => onUpdate('quantite', value)}
            keyboardType="number-pad"
            inputAccessoryViewID={doneAccessoryId}
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Prix unitaire (€) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#B8A896"
            value={prestation.prixUnitaire}
            onChangeText={(value) => onUpdate('prixUnitaire', value)}
            keyboardType="decimal-pad"
            inputAccessoryViewID={doneAccessoryId}
          />
        </View>
      </View>

      {prestation.quantite && prestation.prixUnitaire && (
        <View style={styles.prestationTotal}>
          <Text style={styles.prestationTotalLabel}>Sous-total :</Text>
          <Text style={styles.prestationTotalValue}>
            {(
              parseFloat(prestation.quantite || '0') *
              parseFloat(prestation.prixUnitaire || '0')
            ).toFixed(2)}{' '}
            €
          </Text>
        </View>
      )}
    </View>
  );
}

function RemoveButton({ onPress }: { onPress: () => void }) {
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
      style={[styles.removeButton, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Text style={styles.removeButtonText}>✕</Text>
    </AnimatedPressable>
  );
}

function SaveButton({ onPress }: { onPress: () => void }) {
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
      style={[styles.saveButton, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Text style={styles.saveButtonText}>Enregistrer le devis</Text>
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
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
    marginTop: 40,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 16,
  },
  card: {
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4A2F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#5C4A2F',
    borderWidth: 2,
    borderColor: '#E8DDD0',
  },
  dropdownField: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8DDD0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownInput: {
    flex: 1,
    fontSize: 16,
    color: '#5C4A2F',
    paddingVertical: 8,
  },
  dropdownChevron: {
    color: '#8B7A5F',
    fontSize: 16,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8DDD0',
    backgroundColor: '#FFFFFF',
    maxHeight: 180,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DB',
  },
  dropdownItemText: {
    color: '#5C4A2F',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  prestationInputSpacing: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  prestationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#5C4A2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E8DDD0',
  },
  prestationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  prestationNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4A574',
  },
  prestationTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DDD0',
  },
  prestationTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7A5F',
  },
  prestationTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4A574',
  },
  addButton: {
    backgroundColor: '#D4A574',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#F44336',
    fontSize: 18,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: '#E8F0F8',
    marginVertical: 16,
  },
  saveButton: {
    backgroundColor: '#D4A574',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
