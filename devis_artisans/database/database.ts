import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync('devis_artisans.db');

  const ensureColumn = async (table: string, column: string, type: string) => {
    const columns = await db!.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
    if (!columns.some((item) => item.name === column)) {
      await db!.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    }
  };

  // Créer la table clients
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL,
      siret TEXT,
      phone TEXT,
      address TEXT
    );
  `);

  // Créer la table devis
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS devis (
      id TEXT PRIMARY KEY,
      client TEXT NOT NULL,
      quoteNumber TEXT,
      clientEmail TEXT,
      clientPhone TEXT,
      clientAddress TEXT,
      companyName TEXT,
      companyEmail TEXT,
      companyPhone TEXT,
      companyAddress TEXT,
      companySiret TEXT,
      siteAddress TEXT,
      notes TEXT,
      date TEXT NOT NULL,
      montant TEXT NOT NULL,
      statut TEXT NOT NULL,
      description TEXT NOT NULL,
      prestations TEXT NOT NULL,
      tva REAL NOT NULL
    );
  `);

  // Créer la table profil entreprise
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS company_profile (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      siret TEXT
    );
  `);

  await ensureColumn('clients', 'phone', 'TEXT');
  await ensureColumn('clients', 'address', 'TEXT');

  await ensureColumn('devis', 'quoteNumber', 'TEXT');
  await ensureColumn('devis', 'clientEmail', 'TEXT');
  await ensureColumn('devis', 'clientPhone', 'TEXT');
  await ensureColumn('devis', 'clientAddress', 'TEXT');
  await ensureColumn('devis', 'companyName', 'TEXT');
  await ensureColumn('devis', 'companyEmail', 'TEXT');
  await ensureColumn('devis', 'companyPhone', 'TEXT');
  await ensureColumn('devis', 'companyAddress', 'TEXT');
  await ensureColumn('devis', 'companySiret', 'TEXT');
  await ensureColumn('devis', 'siteAddress', 'TEXT');
  await ensureColumn('devis', 'notes', 'TEXT');

  await ensureColumn('company_profile', 'name', 'TEXT');
  await ensureColumn('company_profile', 'email', 'TEXT');
  await ensureColumn('company_profile', 'phone', 'TEXT');
  await ensureColumn('company_profile', 'address', 'TEXT');
  await ensureColumn('company_profile', 'siret', 'TEXT');

  return db;
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    return await initDatabase();
  }
  return db;
};
