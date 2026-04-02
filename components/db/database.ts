import * as SQLite from "expo-sqlite";
import { Habitos } from "./types";

export const db = SQLite.openDatabaseSync("app.db");
export const initDB = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habitos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      horaInicio TEXT NOT NULL,
      horaFim TEXT NOT NULL,
      descricao TEXT,
      notificationIdInicio TEXT,
      notificationIdFim TEXT
    );
  `);
};
export const addUser = async (nome: string, inicio: string, fim: string, desc: string, notifI: string, notifF: string) => {
  await db.runAsync(
    "INSERT INTO habitos (nome, horaInicio, horaFim, descricao, notificationIdInicio, notificationIdFim) VALUES (?, ?, ?, ?, ?, ?)",
    nome, inicio, fim, desc, notifI, notifF
  );
};
export const getUsers = async (): Promise<Habitos[]> => {
  return await db.getAllAsync<Habitos>("SELECT * FROM habitos ORDER BY horaInicio ASC");
};
export const deleteUser = async (id: number) => {
  await db.runAsync("DELETE FROM habitos WHERE id = ?", id);
};
export const updateUser = async (id: number, nome: string, inicio: string, fim: string, desc: string, notifI: string, notifF: string) => {
  await db.runAsync(
    "UPDATE habitos SET nome=?, horaInicio=?, horaFim=?, descricao=?, notificationIdInicio=?, notificationIdFim=? WHERE id=?",
    nome, inicio, fim, desc, notifI, notifF, id
  );
};
