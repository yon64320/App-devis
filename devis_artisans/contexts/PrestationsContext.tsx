import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getDatabase, initDatabase } from '../database/database';

export interface PrestationItem {
  id: string;
  libelle: string;
  prixUnitaire: number;
  createdAt: string;
}

interface PrestationsContextType {
  prestations: PrestationItem[];
  addPrestation: (prestation: Omit<PrestationItem, 'id' | 'createdAt'>) => Promise<void>;
  deletePrestation: (id: string) => Promise<void>;
  findMatchingPrestation: (libelle: string, prixUnitaire: number) => PrestationItem | undefined;
}

const PrestationsContext = createContext<PrestationsContextType | undefined>(undefined);

export function PrestationsProvider({ children }: { children: ReactNode }) {
  const [prestations, setPrestations] = useState<PrestationItem[]>([]);

  useEffect(() => {
    const loadPrestations = async () => {
      try {
        await initDatabase();
        const db = await getDatabase();
        const result = await db.getAllAsync<PrestationItem>(
          'SELECT * FROM prestations ORDER BY createdAt DESC'
        );
        setPrestations(result);
      } catch (error) {
        console.error('Erreur lors du chargement des prestations:', error);
      }
    };

    void loadPrestations();
  }, []);

  const addPrestation = async (prestation: Omit<PrestationItem, 'id' | 'createdAt'>) => {
    try {
      const newPrestation: PrestationItem = {
        ...prestation,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const db = await getDatabase();
      await db.runAsync(
        'INSERT INTO prestations (id, libelle, prixUnitaire, createdAt) VALUES (?, ?, ?, ?)',
        [newPrestation.id, newPrestation.libelle, newPrestation.prixUnitaire, newPrestation.createdAt]
      );
      setPrestations((prev) => [newPrestation, ...prev]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la prestation:', error);
      throw error;
    }
  };

  const deletePrestation = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM prestations WHERE id = ?', [id]);
      setPrestations((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de la prestation:', error);
      throw error;
    }
  };

  const findMatchingPrestation = (libelle: string, prixUnitaire: number) => {
    return prestations.find(
      (item) =>
        item.libelle.trim().toLowerCase() === libelle.trim().toLowerCase() &&
        item.prixUnitaire === prixUnitaire
    );
  };

  return (
    <PrestationsContext.Provider
      value={{ prestations, addPrestation, deletePrestation, findMatchingPrestation }}>
      {children}
    </PrestationsContext.Provider>
  );
}

export function usePrestations() {
  const context = useContext(PrestationsContext);
  if (context === undefined) {
    throw new Error('usePrestations must be used within a PrestationsProvider');
  }
  return context;
}
