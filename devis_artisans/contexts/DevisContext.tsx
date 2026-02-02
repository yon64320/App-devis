import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Prestation {
  libelle: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Devis {
  id: string;
  client: string;
  date: string;
  montant: string;
  statut: 'En attente' | 'Accepté' | 'Refusé';
  description: string;
  prestations: Prestation[];
  tva: number;
}

interface DevisContextType {
  devis: Devis[];
  addDevis: (devis: Omit<Devis, 'id' | 'date' | 'montant' | 'statut'>) => void;
  getDevisById: (id: string) => Devis | undefined;
}

const DevisContext = createContext<DevisContextType | undefined>(undefined);

// Données initiales mockées
const initialDevis: Devis[] = [
  {
    id: '1',
    client: 'Jean Dupont',
    date: '15 Jan 2024',
    montant: '1 250 €',
    statut: 'En attente',
    description: 'Rénovation complète de la salle de bain',
    prestations: [
      { libelle: 'Carrelage mural', quantite: 25, prixUnitaire: 35 },
      { libelle: 'Carrelage sol', quantite: 8, prixUnitaire: 28 },
      { libelle: 'Plomberie', quantite: 1, prixUnitaire: 450 },
    ],
    tva: 20,
  },
  {
    id: '2',
    client: 'Marie Martin',
    date: '10 Jan 2024',
    montant: '3 450 €',
    statut: 'Accepté',
    description: 'Installation cuisine équipée',
    prestations: [
      { libelle: 'Éléments haut', quantite: 3, prixUnitaire: 450 },
      { libelle: 'Éléments bas', quantite: 4, prixUnitaire: 520 },
      { libelle: 'Pose et finitions', quantite: 1, prixUnitaire: 800 },
    ],
    tva: 20,
  },
  {
    id: '3',
    client: 'Pierre Durand',
    date: '05 Jan 2024',
    montant: '890 €',
    statut: 'Refusé',
    description: 'Réparation toiture',
    prestations: [
      { libelle: 'Remplacement tuiles', quantite: 50, prixUnitaire: 12 },
      { libelle: 'Main-d\'œuvre', quantite: 1, prixUnitaire: 290 },
    ],
    tva: 20,
  },
];

export function DevisProvider({ children }: { children: ReactNode }) {
  const [devis, setDevis] = useState<Devis[]>(initialDevis);

  const addDevis = (newDevis: Omit<Devis, 'id' | 'date' | 'montant' | 'statut'>) => {
    const totalHT = newDevis.prestations.reduce(
      (total, p) => total + p.quantite * p.prixUnitaire,
      0
    );
    const montantTVA = (totalHT * newDevis.tva) / 100;
    const totalTTC = totalHT + montantTVA;

    const formattedDevis: Devis = {
      ...newDevis,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      montant: `${totalTTC.toFixed(2).replace('.', ' ')} €`,
      statut: 'En attente',
    };

    setDevis((prev) => [formattedDevis, ...prev]);
  };

  const getDevisById = (id: string) => {
    return devis.find((d) => d.id === id);
  };

  return (
    <DevisContext.Provider value={{ devis, addDevis, getDevisById }}>
      {children}
    </DevisContext.Provider>
  );
}

export function useDevis() {
  const context = useContext(DevisContext);
  if (context === undefined) {
    throw new Error('useDevis must be used within a DevisProvider');
  }
  return context;
}
