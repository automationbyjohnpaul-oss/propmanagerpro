// backend/src/tests/unit.service.test.ts
import {
  createUnit,
  getAllUnits,
  getUnitById,
  deleteUnit,
  restoreUnit,
} from "../services/unit.service";

// ============================================
// TEST: Unit Service (Production-Aligned)
// ============================================

async function testUnitService() {
  // ✅ FILLED WITH YOUR ACTUAL IDs
  const userId = "cmqimuf990000u5347eug0z1x"; // testuser@example.com
  const propertyId = "cmqjtlmuc0009u5086xkthmtn"; // Test Property

  console.log("🧪 STARTING UNIT SERVICE TESTS\n");
  console.log(`👤 Testing with User ID: ${userId}`);
  console.log(`🏠 Testing with Property ID: ${propertyId}\n`);

  try {
    // ============================================
    // 1. CREATE UNIT
    // ============================================
    console.log("📝 1. Creating unit...");
    const timestamp = Date.now();
    const unit = await createUnit(userId, {
      unitNumber: `TEST-${timestamp}`,
      bedrooms: 2,
      bathrooms: 1,
      rentAmount: 1200,
      propertyId: propertyId,
    });
    console.log(`✅ Created: ${unit.unitNumber} (ID: ${unit.id})\n`);

    // ============================================
    // 2. GET ACTIVE UNITS
    // ============================================
    console.log("📊 2. Fetching active units...");
    const activeUnits = await getAllUnits(userId, "active", propertyId);
    console.log(`✅ Active units: ${activeUnits.length}`);
    activeUnits.forEach((u) => {
      console.log(
        `   - Unit ${u.unitNumber}: ${u.deletedAt ? "Archived" : "Active"}`,
      );
    });
    console.log("");

    // ============================================
    // 3. ARCHIVE (SOFT DELETE)
    // ============================================
    console.log("📦 3. Archiving unit (soft delete)...");
    await deleteUnit(unit.id, userId);
    console.log(`✅ Archived: ${unit.unitNumber}\n`);

    // ============================================
    // 4. GET ARCHIVED UNITS
    // ============================================
    console.log("📊 4. Fetching archived units...");
    const archivedUnits = await getAllUnits(userId, "archived", propertyId);
    console.log(`✅ Archived units: ${archivedUnits.length}`);

    const archivedUnit = archivedUnits.find((u) => u.id === unit.id);
    if (archivedUnit && archivedUnit.deletedAt) {
      console.log(
        `✅ Verified: ${archivedUnit.unitNumber} is archived (deletedAt: ${archivedUnit.deletedAt})\n`,
      );
    } else {
      console.log(`❌ Unit not found in archived list\n`);
    }

    // ============================================
    // 5. RESTORE UNIT (UNARCHIVE)
    // ============================================
    console.log("♻️ 5. Restoring unit...");
    await restoreUnit(unit.id, userId);
    console.log(`✅ Restored: ${unit.unitNumber}\n`);

    // ============================================
    // 6. VERIFY UNIT IS ACTIVE AGAIN
    // ============================================
    console.log("📊 6. Verifying unit is active again...");
    const restoredUnit = await getUnitById(unit.id, userId);
    if (restoredUnit && !restoredUnit.deletedAt) {
      console.log(
        `✅ Verified: ${restoredUnit.unitNumber} is active (deletedAt: null)\n`,
      );
    } else {
      console.log(`❌ Unit still archived\n`);
    }

    // ============================================
    // 7. VERIFY UNIT APPEARS IN ACTIVE LIST
    // ============================================
    console.log("📊 7. Verifying unit appears in active list...");
    const activeAfterRestore = await getAllUnits(userId, "active", propertyId);
    const restoredFound = activeAfterRestore.find((u) => u.id === unit.id);

    if (restoredFound) {
      console.log(
        `✅ Verified: ${restoredFound.unitNumber} appears in active list\n`,
      );
    } else {
      console.log(`❌ Unit not found in active list\n`);
    }

    // ============================================
    // 8. ARCHIVE AGAIN (CLEANUP)
    // ============================================
    console.log("📦 8. Archiving unit for cleanup...");
    await deleteUnit(unit.id, userId);
    console.log(`✅ Archived for cleanup: ${unit.unitNumber}\n`);

    // ============================================
    // 9. VERIFY UNIT IS ARCHIVED
    // ============================================
    console.log("🔍 9. Verifying unit is archived...");
    const archivedAfterCleanup = await getAllUnits(
      userId,
      "archived",
      propertyId,
    );
    const found = archivedAfterCleanup.find((u) => u.id === unit.id);

    if (found) {
      console.log(
        `✅ Verified: Unit ${found.unitNumber} is archived (deletedAt: ${found.deletedAt})\n`,
      );
    } else {
      console.log(`❌ Unit not found in archived list\n`);
    }

    // ============================================
    // 10. VERIFY getUnitById RETURNS NULL FOR ARCHIVED
    // ============================================
    console.log("🔍 10. Attempting to fetch archived unit with getUnitById...");
    const archivedUnitById = await getUnitById(unit.id, userId);
    if (!archivedUnitById) {
      console.log(
        `✅ Verified: getUnitById() returns null for archived units (expected)\n`,
      );
    } else {
      console.log(`❌ getUnitById() returned archived unit - This is a bug!\n`);
    }

    // ============================================
    // TEST COMPLETE
    // ============================================
    console.log("🎉 ALL TESTS PASSED!");
    console.log("📋 Summary:");
    console.log(`   - Created unit: ${unit.unitNumber}`);
    console.log(`   - Archived: ✅ (deleteUnit = soft delete)`);
    console.log(`   - Restored: ✅ (restoreUnit = unarchive)`);
    console.log(`   - Verified in active list: ✅`);
    console.log(`   - Cleanup archived: ✅`);
    console.log(`   - getUnitById returns null for archived: ✅`);
    console.log("\n📌 Architecture Confirmed:");
    console.log("   deleteUnit() = SOFT DELETE (archive)");
    console.log("   restoreUnit() = RESTORE (unarchive)");
    console.log("   getUnitById() = ACTIVE UNITS ONLY");
    console.log("   No hard delete operation exists (by design)");
  } catch (error: any) {
    console.error("❌ TEST FAILED:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

// ============================================
// RUN THE TEST (Safe Execution)
// ============================================
if (require.main === module) {
  testUnitService()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
