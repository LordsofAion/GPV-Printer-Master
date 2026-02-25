-- DropIndex
DROP INDEX "Transacao_vendaId_key";

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licenseKey" TEXT,
    "licenseExpiry" DATETIME,
    "clientName" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Produto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "preco" REAL NOT NULL,
    "custo" REAL NOT NULL DEFAULT 0,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "estoque_minimo" INTEGER NOT NULL DEFAULT 10,
    "sku" TEXT,
    "categoria" TEXT,
    "empresaId" INTEGER DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Produto" ("categoria", "createdAt", "custo", "empresaId", "estoque", "id", "nome", "preco", "sku", "updatedAt") SELECT "categoria", "createdAt", "custo", "empresaId", "estoque", "id", "nome", "preco", "sku", "updatedAt" FROM "Produto";
DROP TABLE "Produto";
ALTER TABLE "new_Produto" RENAME TO "Produto";
CREATE UNIQUE INDEX "Produto_sku_key" ON "Produto"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
