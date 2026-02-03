import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as FileSystem from 'expo-file-system';

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  siret?: string;
}

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

const CLIENTS_STORAGE_FILE = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}clients.json`
  : null;

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const loadClients = async () => {
      if (!CLIENTS_STORAGE_FILE) return;
      const fileInfo = await FileSystem.getInfoAsync(CLIENTS_STORAGE_FILE);
      if (!fileInfo.exists) return;
      const storedClients = await FileSystem.readAsStringAsync(CLIENTS_STORAGE_FILE);
      if (storedClients) {
        setClients(JSON.parse(storedClients));
      }
    };

    void loadClients();
  }, []);

  const addClient = async (client: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
    };

    const nextClients = [newClient, ...clients];
    setClients(nextClients);
    if (CLIENTS_STORAGE_FILE) {
      await FileSystem.writeAsStringAsync(
        CLIENTS_STORAGE_FILE,
        JSON.stringify(nextClients)
      );
    }
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient }}>
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
