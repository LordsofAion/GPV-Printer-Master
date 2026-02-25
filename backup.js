
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * GPV Print Manager - Automated Backup System
 * This script creates a timestamped backup of the SQLite database.
 */

const DB_PATH = path.join(__dirname, 'dev.db');
const BACKUP_DIR = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `gpv_backup_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    try {
        console.log(`[BACKUP] Iniciando backup para: ${backupName}...`);
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`[BACKUP] Sucesso! Arquivo salvo em: ${backupPath}`);

        // Mantém apenas os últimos 30 backups
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('gpv_backup_'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 30) {
            files.slice(30).forEach(f => {
                fs.unlinkSync(path.join(BACKUP_DIR, f.name));
                console.log(`[BACKUP] Removendo backup antigo: ${f.name}`);
            });
        }
    } catch (error) {
        console.error(`[BACKUP] ERRO ao criar backup:`, error.message);
    }
}

// Executa o backup
createBackup();
