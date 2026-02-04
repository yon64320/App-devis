import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getDatabase, initDatabase } from '../database/database';

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  siret?: string;
  phone?: string;
  address?: string;
}

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        await initDatabase();
        const db = await getDatabase();
        const result = await db.getAllAsync<Client>('SELECT * FROM clients ORDER BY id DESC');
        setClients(result);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      }
    };

    void loadClients();
  }, []);

  const addClient = async (client: Omit<Client, 'id'>) => {
    try {
      const newClient: Client = {
        ...client,
        id: Date.now().toString(),
      };

      const db = await getDatabase();
      await db.runAsync(
        'INSERT INTO clients (id, nom, prenom, email, siret, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          newClient.id,
          newClient.nom,
          newClient.prenom,
          newClient.email,
          newClient.siret || null,
          newClient.phone || null,
          newClient.address || null,
        ]
      );

      setClients((prev) => [newClient, ...prev]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error);
      throw error;
    }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE clients SET nom = ?, prenom = ?, email = ?, siret = ?, phone = ?, address = ? WHERE id = ?',
        [
          updatedClient.nom,
          updatedClient.prenom,
          updatedClient.email,
          updatedClient.siret || null,
          updatedClient.phone || null,
          updatedClient.address || null,
          updatedClient.id,
        ]
      );

      setClients((prev) =>
        prev.map((client) => (client.id === updatedClient.id ? updatedClient : client))
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      throw error;
    }
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
}
