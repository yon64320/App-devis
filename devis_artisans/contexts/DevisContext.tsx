import * as FileSystem from 'expo-file-system';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  deleteDevis: (id: string) => void;
  updateDevisStatut: (id: string, statut: Devis['statut']) => void;
}

const DevisContext = createContext<DevisContextType | undefined>(undefined);

const DEVIS_STORAGE_FILE = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}devis.json`
  : null;

export function DevisProvider({ children }: { children: ReactNode }) {
  const [devis, setDevis] = useState<Devis[]>([]);

  useEffect(() => {
    const loadDevis = async () => {
      if (!DEVIS_STORAGE_FILE) return;
      const fileInfo = await FileSystem.getInfoAsync(DEVIS_STORAGE_FILE);
      if (!fileInfo.exists) return;
      const storedDevis = await FileSystem.readAsStringAsync(DEVIS_STORAGE_FILE);
      if (storedDevis) {
        setDevis(JSON.parse(storedDevis));
      }
    };

    void loadDevis();
  }, []);

  const persistDevis = async (nextDevis: Devis[]) => {
    setDevis(nextDevis);
    if (DEVIS_STORAGE_FILE) {
      await FileSystem.writeAsStringAsync(
        DEVIS_STORAGE_FILE,
        JSON.stringify(nextDevis)
      );
    }
  };

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

    const nextDevis = [formattedDevis, ...devis];
    void persistDevis(nextDevis);
  };

  const getDevisById = (id: string) => {
    return devis.find((d) => d.id === id);
  };

  const deleteDevis = (id: string) => {
    const nextDevis = devis.filter((item) => item.id !== id);
    void persistDevis(nextDevis);
  };

  const updateDevisStatut = (id: string, statut: Devis['statut']) => {
    const nextDevis = devis.map((item) =>
      item.id === id ? { ...item, statut } : item
    );
    void persistDevis(nextDevis);
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
