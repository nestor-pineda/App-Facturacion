-- Drop global unique on invoice numero (replaced by per-user uniqueness)
DROP INDEX IF EXISTS "invoices_numero_key";

-- One legal number per user; multiple borrador rows may share (user_id, NULL)
CREATE UNIQUE INDEX "invoices_user_id_numero_key" ON "invoices"("user_id", "numero");
