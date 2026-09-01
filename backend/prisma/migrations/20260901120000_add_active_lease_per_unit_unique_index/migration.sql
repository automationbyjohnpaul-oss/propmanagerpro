CREATE UNIQUE INDEX "leases_one_active_per_unit_idx"
ON "leases" ("unitId")
WHERE "status" = 'ACTIVE';
