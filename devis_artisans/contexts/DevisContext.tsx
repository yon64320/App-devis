import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getDatabase, initDatabase, resetDatabase } from '../database/database';

export interface Prestation {
  libelle: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Devis {
  id: string;
  quoteNumber: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companySiret: string;
  siteAddress: string;
  date: string;
  montant: string;
  statut: 'En attente' | 'Accepté' | 'Refusé';
  description: string;
  prestations: Prestation[];
  tva: number;
  notes: string;
}

interface DevisContextType {
  devis: Devis[];
  addDevis: (devis: Omit<Devis, 'id' | 'date' | 'montant' | 'statut'>) => Promise<void>;
  updateDevis: (
    id: string,
    devis: Omit<Devis, 'id' | 'date' | 'montant' | 'statut'>
  ) => Promise<void>;
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
        await resetDatabase();
        await initDatabase();
        const db = await getDatabase();
        const result = await db.getAllAsync<{
          id: string;
          client: string;
          quoteNumber?: string;
          clientEmail?: string;
          clientPhone?: string;
          clientAddress?: string;
          companyName?: string;
          companyEmail?: string;
          companyPhone?: string;
          companyAddress?: string;
          companySiret?: string;
          siteAddress?: string;
          date: string;
          montant: string;
          statut: string;
          description: string;
          prestations: string;
          tva: number;
          notes?: string;
        }>('SELECT * FROM devis ORDER BY id DESC');

        const formattedDevis: Devis[] = result.map((row) => ({
          ...row,
          statut: row.statut as Devis['statut'],
          prestations: JSON.parse(row.prestations),
          quoteNumber: row.quoteNumber ?? '',
          clientEmail: row.clientEmail ?? '',
          clientPhone: row.clientPhone ?? '',
          clientAddress: row.clientAddress ?? '',
          companyName: row.companyName ?? '',
          companyEmail: row.companyEmail ?? '',
          companyPhone: row.companyPhone ?? '',
          companyAddress: row.companyAddress ?? '',
          companySiret: row.companySiret ?? '',
          siteAddress: row.siteAddress ?? '',
          notes: row.notes ?? '',
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
        'INSERT INTO devis (id, client, quoteNumber, clientEmail, clientPhone, clientAddress, companyName, companyEmail, companyPhone, companyAddress, companySiret, siteAddress, notes, date, montant, statut, description, prestations, tva) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          formattedDevis.id,
          formattedDevis.client,
          formattedDevis.quoteNumber,
          formattedDevis.clientEmail,
          formattedDevis.clientPhone,
          formattedDevis.clientAddress,
          formattedDevis.companyName,
          formattedDevis.companyEmail,
          formattedDevis.companyPhone,
          formattedDevis.companyAddress,
          formattedDevis.companySiret,
          formattedDevis.siteAddress,
          formattedDevis.notes,
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

  const updateDevis = async (
    id: string,
    updatedDevis: Omit<Devis, 'id' | 'date' | 'montant' | 'statut'>
  ) => {
    try {
      const existing = devis.find((item) => item.id === id);
      if (!existing) {
        throw new Error('Devis introuvable');
      }

      const totalHT = updatedDevis.prestations.reduce(
        (total, p) => total + p.quantite * p.prixUnitaire,
        0
      );
      const montantTVA = (totalHT * updatedDevis.tva) / 100;
      const totalTTC = totalHT + montantTVA;

      const nextDevis: Devis = {
        ...existing,
        ...updatedDevis,
        montant: `${new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalTTC)} €`,
      };

      const db = await getDatabase();
      await db.runAsync(
        'UPDATE devis SET client = ?, quoteNumber = ?, clientEmail = ?, clientPhone = ?, clientAddress = ?, companyName = ?, companyEmail = ?, companyPhone = ?, companyAddress = ?, companySiret = ?, siteAddress = ?, notes = ?, description = ?, prestations = ?, tva = ?, montant = ? WHERE id = ?',
        [
          nextDevis.client,
          nextDevis.quoteNumber,
          nextDevis.clientEmail,
          nextDevis.clientPhone,
          nextDevis.clientAddress,
          nextDevis.companyName,
          nextDevis.companyEmail,
          nextDevis.companyPhone,
          nextDevis.companyAddress,
          nextDevis.companySiret,
          nextDevis.siteAddress,
          nextDevis.notes,
          nextDevis.description,
          JSON.stringify(nextDevis.prestations),
          nextDevis.tva,
          nextDevis.montant,
          nextDevis.id,
        ]
      );

      setDevis((prev) => prev.map((item) => (item.id === id ? nextDevis : item)));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du devis:', error);
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
      value={{ devis, addDevis, updateDevis, getDevisById, deleteDevis, updateDevisStatut }}>
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
