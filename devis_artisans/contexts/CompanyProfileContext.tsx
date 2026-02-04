import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getDatabase, initDatabase } from '../database/database';

export interface CompanyProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  siret: string;
}

interface CompanyProfileContextType {
  profile: CompanyProfile;
  saveProfile: (profile: CompanyProfile) => Promise<void>;
}

const defaultProfile: CompanyProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  siret: '',
};

const CompanyProfileContext = createContext<CompanyProfileContextType | undefined>(undefined);

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CompanyProfile>(defaultProfile);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await initDatabase();
        const db = await getDatabase();
        const result = await db.getAllAsync<{
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          siret?: string;
        }>('SELECT name, email, phone, address, siret FROM company_profile WHERE id = 1');

        if (result.length > 0) {
          const row = result[0];
          setProfile({
            name: row.name ?? '',
            email: row.email ?? '',
            phone: row.phone ?? '',
            address: row.address ?? '',
            siret: row.siret ?? '',
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil entreprise:', error);
      }
    };

    void loadProfile();
  }, []);

  const saveProfile = async (nextProfile: CompanyProfile) => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO company_profile (id, name, email, phone, address, siret) VALUES (1, ?, ?, ?, ?, ?)',
        [
          nextProfile.name,
          nextProfile.email,
          nextProfile.phone,
          nextProfile.address,
          nextProfile.siret,
        ]
      );
      setProfile(nextProfile);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil entreprise:', error);
      throw error;
    }
  };

  return (
    <CompanyProfileContext.Provider value={{ profile, saveProfile }}>
      {children}
    </CompanyProfileContext.Provider>
  );
}

export function useCompanyProfile() {
  const context = useContext(CompanyProfileContext);
  if (context === undefined) {
    throw new Error('useCompanyProfile must be used within a CompanyProfileProvider');
  }
  return context;
}
