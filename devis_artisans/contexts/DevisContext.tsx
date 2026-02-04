import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getDatabase, initDatabase } from '../database/database';

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
  addDevis: (devis: Omit<Devis, 'id' | 'date' | 'montant' | 'statut'>) => Promise<void>;
  getDevisById: (id: string) => Devis | undefined;
  deleteDevis: (id: string) => Promise<void>;
  updateDevisStatut: (id: string, statut: Devis['statut']) => Promise<void>;
}

const DevisContext = createContext<DevisContextType | undefined>(undefined);

export function DevisProvider({ children }: { children: ReactNode }) {
  const [devis, setDevis] = useState<Devis[]>([]);

  useEffect(() => {
    const loadDevis = async () => {
      try {
        await initDatabase();
        const db = await getDatabase();
        const result = await db.getAllAsync<{
          id: string;
          client: string;
          date: string;
          montant: string;
          statut: string;
          description: string;
          prestations: string;
          tva: number;
        }>('SELECT * FROM devis ORDER BY id DESC');

        const formattedDevis: Devis[] = result.map((row) => ({
          ...row,
          statut: row.statut as Devis['statut'],
          prestations: JSON.parse(row.prestations),
        }));

        setDevis(formattedDevis);
      } catch (error) {
        console.error('Erreur lors du chargement des devis:', error);
      }
    };

    void loadDevis();
  }, []);

  const addDevis = async (newDevis: Omit<Devis, 'id' | 'date' | 'montant' | 'statut'>) => {
    try {
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
        montant: `${new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalTTC)} €`,
        statut: 'En attente',
      };

      const db = await getDatabase();
      await db.runAsync(
        'INSERT INTO devis (id, client, date, montant, statut, description, prestations, tva) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          formattedDevis.id,
          formattedDevis.client,
          formattedDevis.date,
          formattedDevis.montant,
          formattedDevis.statut,
          formattedDevis.description,
          JSON.stringify(formattedDevis.prestations),
          formattedDevis.tva,
        ]
      );

      setDevis((prev) => [formattedDevis, ...prev]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du devis:', error);
      throw error;
    }
  };

  const getDevisById = (id: string) => {
    return devis.find((d) => d.id === id);
  };

  const deleteDevis = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM devis WHERE id = ?', [id]);
      setDevis((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du devis:', error);
      throw error;
    }
  };

  const updateDevisStatut = async (id: string, statut: Devis['statut']) => {
    try {
      const db = await getDatabase();
      await db.runAsync('UPDATE devis SET statut = ? WHERE id = ?', [statut, id]);
      setDevis((prev) => prev.map((item) => (item.id === id ? { ...item, statut } : item)));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du devis:', error);
      throw error;
    }
  };

  return (
    <DevisContext.Provider
      value={{ devis, addDevis, getDevisById, deleteDevis, updateDevisStatut }}>
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
