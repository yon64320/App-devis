import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync('devis_artisans.db');

  // Créer la table clients
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL,
      siret TEXT
    );
  `);

  // Créer la table devis
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS devis (
      id TEXT PRIMARY KEY,
      client TEXT NOT NULL,
      date TEXT NOT NULL,
      montant TEXT NOT NULL,
      statut TEXT NOT NULL,
      description TEXT NOT NULL,
      prestations TEXT NOT NULL,
      tva REAL NOT NULL
    );
  `);

  return db;
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    return await initDatabase();
  }
  return db;
};
