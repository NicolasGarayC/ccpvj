// Script para revisar estructura de tabla user
import Database from 'better-sqlite3';

const db = new Database('D:/ccpvj/Data/ccpvj.db');

console.log('=== ESTRUCTURA DE TABLA USER ===');
const tableInfo = db.prepare("PRAGMA table_info(user)").all();
console.log('Columnas:');
tableInfo.forEach(col => {
  console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
});

console.log('\n=== DATOS DE EJEMPLO ===');
const users = db.prepare("SELECT * FROM user LIMIT 3").all();
console.log('Primeros usuarios:');
users.forEach(user => {
  console.log(JSON.stringify(user, null, 2));
});

db.close();