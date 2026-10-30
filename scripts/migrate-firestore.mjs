import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const targetUid = process.env.TARGET_UID || "OGlKVAiYT4XYEXlS5zQOetTHLaF2";
const deleteSources = process.argv.includes("--delete-sources");
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (credentialsPath) {
  initializeApp({ credential: cert(credentialsPath) });
} else {
  initializeApp({ credential: applicationDefault() });
}

const db = getFirestore();
const users = db.collection("users");
const targetRef = users.doc(targetUid);
const snapshot = await users.get();
const sourceDocs = snapshot.docs.filter((document) => document.id !== targetUid);

if (sourceDocs.length === 0) {
  console.log(`Nenhum documento antigo encontrado. O destino é /users/${targetUid}.`);
  process.exit(0);
}

const sourceData = sourceDocs.map((document) => ({ id: document.id, ...document.data() }));
const timestamp = (data) => data._updatedAt?.toMillis?.() || 0;
const newest = [...sourceData].sort((a, b) => timestamp(b) - timestamp(a))[0];
const uniqueBy = (items, key) => {
  const result = new Map();
  for (const item of items) {
    const itemKey = item[key] || JSON.stringify(item);
    result.set(itemKey, item);
  }
  return [...result.values()];
};

const merged = {
  items: uniqueBy(sourceData.flatMap((data) => Array.isArray(data.items) ? data.items : []), "id"),
  history: uniqueBy(sourceData.flatMap((data) => Array.isArray(data.history) ? data.history : []), "date"),
  pantry: uniqueBy(sourceData.flatMap((data) => Array.isArray(data.pantry) ? data.pantry : []), "name"),
  budget: newest.budget || 0,
  date: newest.date || new Date().toLocaleDateString("en-CA"),
  market: newest.market || "",
  note: newest.note || null,
  _migration: {
    migratedAt: FieldValue.serverTimestamp(),
    sourceCount: sourceDocs.length,
    sourceIds: sourceDocs.map((document) => document.id)
  }
};

await targetRef.set(merged, { merge: true });
console.log(`Dados consolidados em /users/${targetUid} a partir de ${sourceDocs.length} documento(s).`);

if (deleteSources) {
  for (const document of sourceDocs) {
    await document.ref.delete();
    console.log(`Documento removido: /users/${document.id}`);
  }
} else {
  console.log("Fontes preservadas. Use --delete-sources somente após validar o destino.");
}
