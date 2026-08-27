import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import {
  getDashboardMetrics,
  getRevenueByProperty,
  getOutstandingRent,
} from "../../src/services/financeAnalytics.service";

describe("Finance Analytics Service", () => {
  let testUserId: string;
  let otherUserId: string;

  let testPropertyId: string;
  let otherPropertyId: string;

  let testUnitId: string;
  let otherUnitId: string;

  let testTenantId: string;
  let otherTenantId: string;

  let testLeaseId: string;
  let otherLeaseId: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    // ============================================================
    // CREATE TEST USERS
    // ============================================================

    const testUser = await prisma.user.create({
      data: {
        email: `finance-test-${timestamp}@example.com`,
        password: "hashed",
        name: "Finance Test User",
      },
    });

    testUserId = testUser.id;

    const otherUser = await prisma.user.create({
      data: {
        email: `finance-other-${timestamp}@example.com`,
        password: "hashed",
        name: "Other Finance User",
      },
    });

    otherUserId = otherUser.id;

    // ============================================================
    // CREATE TEST PROPERTIES
    // ============================================================

    const testProperty = await prisma.property.create({
      data: {
        name: "Finance Test Property",
        address: "123 Finance Street",
        city: "Test City",
        state: "TS",
        zip: "12345",
        unitCount: 2,
        userId: testUserId,
      },
    });

    testPropertyId = testProperty.id;

    const otherProperty = await prisma.property.create({
      data: {
        name: "Other User Property",
        address: "456 Other Street",
        city: "Other City",
        state: "OS",
        zip: "67890",
        unitCount: 1,
        userId: otherUserId,
      },
    });

    otherPropertyId = otherProperty.id;

    // ============================================================
    // CREATE TEST UNITS
    // ============================================================

    const testUnit = await prisma.unit.create({
      data: {
        unitNumber: "1",
        propertyId: testPropertyId,
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 1000,
      },
    });

    testUnitId = testUnit.id;

    // Second unit is intentionally vacant.
    await prisma.unit.create({
      data: {
        unitNumber: "2",
        propertyId: testPropertyId,
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 1200,
      },
    });

    const otherUnit = await prisma.unit.create({
      data: {
        unitNumber: "1",
        propertyId: otherPropertyId,
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 1500,
      },
    });

    otherUnitId = otherUnit.id;

    // ============================================================
    // CREATE TEST TENANTS
    // ============================================================

    const testTenant = await prisma.tenant.create({
      data: {
        firstName: "Finance",
        lastName: "Tenant",
        email: `finance-tenant-${timestamp}@example.com`,
        userId: testUserId,
      },
    });

    testTenantId = testTenant.id;

    const otherTenant = await prisma.tenant.create({
      data: {
        firstName: "Other",
        lastName: "Tenant",
        email: `finance-other-tenant-${timestamp}@example.com`,
        userId: otherUserId,
      },
    });

    otherTenantId = otherTenant.id;

    // ============================================================
    // CREATE ACTIVE LEASES
    // ============================================================

    const testLease = await prisma.lease.create({
      data: {
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        monthlyRent: 1000,
        securityDeposit: 1000,
        status: "ACTIVE",
        propertyId: testPropertyId,
        unitId: testUnitId,
        tenantId: testTenantId,
      },
    });

    testLeaseId = testLease.id;

    const otherLease = await prisma.lease.create({
      data: {
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        monthlyRent: 1500,
        securityDeposit: 1500,
        status: "ACTIVE",
        propertyId: otherPropertyId,
        unitId: otherUnitId,
        tenantId: otherTenantId,
      },
    });

    otherLeaseId = otherLease.id;
  });

  afterAll(async () => {
    // ============================================================
    // CLEAN UP PAYMENTS FIRST
    // ============================================================

    if (testLeaseId) {
      await prisma.payment.deleteMany({
        where: { leaseId: testLeaseId },
      });
    }

    if (otherLeaseId) {
      await prisma.payment.deleteMany({
        where: { leaseId: otherLeaseId },
      });
    }

    // Remove payments belonging to temporary leases created
    // during the outstanding-rent tests.
    if (testPropertyId) {
      const temporaryLeases = await prisma.lease.findMany({
        where: {
          propertyId: testPropertyId,
          id: { not: testLeaseId },
        },
        select: { id: true },
      });

      if (temporaryLeases.length > 0) {
        await prisma.payment.deleteMany({
          where: {
            leaseId: {
              in: temporaryLeases.map((lease) => lease.id),
            },
          },
        });
      }
    }

    // ============================================================
    // DELETE LEASES
    // ============================================================

    if (testPropertyId) {
      await prisma.lease.deleteMany({
        where: {
          propertyId: testPropertyId,
        },
      });
    }

    if (otherPropertyId) {
      await prisma.lease.deleteMany({
        where: {
          propertyId: otherPropertyId,
        },
      });
    }

    // ============================================================
    // DELETE TENANTS
    // ============================================================

    if (testTenantId) {
      await prisma.tenant.delete({
        where: { id: testTenantId },
      });
    }

    if (otherTenantId) {
      await prisma.tenant.delete({
        where: { id: otherTenantId },
      });
    }

    // Delete any temporary tenants created by the tests.
    if (testUserId) {
      await prisma.tenant.deleteMany({
        where: {
          userId: testUserId,
        },
      });
    }

    // ============================================================
    // DELETE UNITS
    // ============================================================

    if (testPropertyId) {
      await prisma.unit.deleteMany({
        where: {
          propertyId: testPropertyId,
        },
      });
    }

    if (otherPropertyId) {
      await prisma.unit.deleteMany({
        where: {
          propertyId: otherPropertyId,
        },
      });
    }

    // ============================================================
    // DELETE PROPERTIES
    // ============================================================

    if (testPropertyId) {
      await prisma.property.delete({
        where: { id: testPropertyId },
      });
    }

    if (otherPropertyId) {
      await prisma.property.delete({
        where: { id: otherPropertyId },
      });
    }

    // ============================================================
    // DELETE USERS
    // ============================================================

    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }

    if (otherUserId) {
      await prisma.user.delete({
        where: { id: otherUserId },
      });
    }
  });

  // ==============================================================
  // DASHBOARD METRICS
  // ==============================================================

  describe("getDashboardMetrics", () => {
    it("should calculate occupancy from active leases", async () => {
      const result = await getDashboardMetrics(testUserId);

      expect(result.activeLeases).toBe(1);
      expect(result.occupiedUnits).toBe(1);
      expect(result.vacantUnits).toBe(1);
      expect(result.occupancyRate).toBe(50);
    });

    it("should return zero income when there are no completed payments this month", async () => {
      const result = await getDashboardMetrics(testUserId);

      expect(result.monthlyIncome).toBe(0);
    });

    it("should count completed payments from the current month", async () => {
      const now = new Date();

      await prisma.payment.create({
        data: {
          amount: 600,
          paymentDate: now,
          status: "completed",
          method: "bank_transfer",
          leaseId: testLeaseId,
          tenantId: testTenantId,
        },
      });

      const result = await getDashboardMetrics(testUserId);

      expect(result.monthlyIncome).toBe(600);
      expect(result.netCashflow).toBe(600);

      await prisma.payment.deleteMany({
        where: { leaseId: testLeaseId },
      });
    });

    it("should ignore non-completed payments", async () => {
      const now = new Date();

      await prisma.payment.createMany({
        data: [
          {
            amount: 100,
            paymentDate: now,
            status: "pending",
            method: "bank_transfer",
            leaseId: testLeaseId,
            tenantId: testTenantId,
          },
          {
            amount: 200,
            paymentDate: now,
            status: "failed",
            method: "bank_transfer",
            leaseId: testLeaseId,
            tenantId: testTenantId,
          },
          {
            amount: 300,
            paymentDate: now,
            status: "refunded",
            method: "bank_transfer",
            leaseId: testLeaseId,
            tenantId: testTenantId,
          },
        ],
      });

      const result = await getDashboardMetrics(testUserId);

      expect(result.monthlyIncome).toBe(0);

      await prisma.payment.deleteMany({
        where: { leaseId: testLeaseId },
      });
    });

    it("should ignore completed payments from previous months", async () => {
      await prisma.payment.create({
        data: {
          amount: 900,
          paymentDate: new Date("2025-01-15"),
          status: "completed",
          method: "bank_transfer",
          leaseId: testLeaseId,
          tenantId: testTenantId,
        },
      });

      const result = await getDashboardMetrics(testUserId);

      expect(result.monthlyIncome).toBe(0);

      await prisma.payment.deleteMany({
        where: { leaseId: testLeaseId },
      });
    });

    it("should not include another user's financial data", async () => {
      await prisma.payment.create({
        data: {
          amount: 5000,
          paymentDate: new Date(),
          status: "completed",
          method: "bank_transfer",
          leaseId: otherLeaseId,
          tenantId: otherTenantId,
        },
      });

      const result = await getDashboardMetrics(testUserId);

      expect(result.monthlyIncome).toBe(0);
      expect(result.activeLeases).toBe(1);
      expect(result.occupiedUnits).toBe(1);

      await prisma.payment.deleteMany({
        where: { leaseId: otherLeaseId },
      });
    });
  });

  // ==============================================================
  // REVENUE BY PROPERTY
  // ==============================================================

  describe("getRevenueByProperty", () => {
    it("should calculate completed payment revenue for each property", async () => {
      await prisma.payment.create({
        data: {
          amount: 400,
          paymentDate: new Date(),
          status: "completed",
          method: "bank_transfer",
          leaseId: testLeaseId,
          tenantId: testTenantId,
        },
      });

      const result = await getRevenueByProperty(testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].propertyId).toBe(testPropertyId);
      expect(result[0].propertyName).toBe("Finance Test Property");
      expect(result[0].revenue).toBe(400);

      await prisma.payment.deleteMany({
        where: { leaseId: testLeaseId },
      });
    });

    it("should ignore non-completed payments", async () => {
      await prisma.payment.createMany({
        data: [
          {
            amount: 100,
            paymentDate: new Date(),
            status: "pending",
            method: "bank_transfer",
            leaseId: testLeaseId,
            tenantId: testTenantId,
          },
          {
            amount: 200,
            paymentDate: new Date(),
            status: "failed",
            method: "bank_transfer",
            leaseId: testLeaseId,
            tenantId: testTenantId,
          },
          {
            amount: 300,
            paymentDate: new Date(),
            status: "refunded",
            method: "bank_transfer",
            leaseId: testLeaseId,
            tenantId: testTenantId,
          },
        ],
      });

      const result = await getRevenueByProperty(testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(0);

      await prisma.payment.deleteMany({
        where: { leaseId: testLeaseId },
      });
    });

    it("should not include another user's property", async () => {
      const result = await getRevenueByProperty(testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].propertyId).toBe(testPropertyId);
      expect(
        result.some((property) => property.propertyId === otherPropertyId),
      ).toBe(false);
    });
  });

  // ==============================================================
  // OUTSTANDING RENT
  // ==============================================================

  describe("getOutstandingRent", () => {
    it("should calculate outstanding rent correctly", async () => {
      const timestamp = Date.now();

      const tenant = await prisma.tenant.create({
        data: {
          firstName: "Outstanding",
          lastName: "Tenant",
          email: `outstanding-${timestamp}@example.com`,
          userId: testUserId,
        },
      });

      const unit = await prisma.unit.create({
        data: {
          unitNumber: `OUT-${timestamp}`,
          propertyId: testPropertyId,
          bedrooms: 1,
          bathrooms: 1,
          rentAmount: 1200,
        },
      });

      const lease = await prisma.lease.create({
        data: {
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          monthlyRent: 1200,
          securityDeposit: 1200,
          status: "ACTIVE",
          propertyId: testPropertyId,
          unitId: unit.id,
          tenantId: tenant.id,
        },
      });

      await prisma.payment.create({
        data: {
          amount: 500,
          paymentDate: new Date(),
          status: "completed",
          method: "bank_transfer",
          leaseId: lease.id,
          tenantId: tenant.id,
        },
      });

      const result = await getOutstandingRent(testUserId);

      const entry = result.find((item) => item.tenantId === tenant.id);

      expect(entry).toBeDefined();
      expect(entry?.tenantName).toBe("Outstanding Tenant");
      expect(entry?.propertyName).toBe("Finance Test Property");
      expect(entry?.unitNumber).toBe(`OUT-${timestamp}`);
      expect(entry?.amountDue).toBe(700);

      await prisma.payment.deleteMany({
        where: { leaseId: lease.id },
      });

      await prisma.lease.delete({
        where: { id: lease.id },
      });

      await prisma.unit.delete({
        where: { id: unit.id },
      });

      await prisma.tenant.delete({
        where: { id: tenant.id },
      });
    });

    it("should not return fully paid leases", async () => {
      const timestamp = Date.now();

      const tenant = await prisma.tenant.create({
        data: {
          firstName: "Fully",
          lastName: "Paid",
          email: `fully-paid-${timestamp}@example.com`,
          userId: testUserId,
        },
      });

      const unit = await prisma.unit.create({
        data: {
          unitNumber: `FULL-${timestamp}`,
          propertyId: testPropertyId,
          bedrooms: 1,
          bathrooms: 1,
          rentAmount: 1000,
        },
      });

      const lease = await prisma.lease.create({
        data: {
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          monthlyRent: 1000,
          securityDeposit: 1000,
          status: "ACTIVE",
          propertyId: testPropertyId,
          unitId: unit.id,
          tenantId: tenant.id,
        },
      });

      await prisma.payment.create({
        data: {
          amount: 1000,
          paymentDate: new Date(),
          status: "completed",
          method: "bank_transfer",
          leaseId: lease.id,
          tenantId: tenant.id,
        },
      });

      const result = await getOutstandingRent(testUserId);

      expect(result.some((entry) => entry.tenantId === tenant.id)).toBe(false);

      await prisma.payment.deleteMany({
        where: { leaseId: lease.id },
      });

      await prisma.lease.delete({
        where: { id: lease.id },
      });

      await prisma.unit.delete({
        where: { id: unit.id },
      });

      await prisma.tenant.delete({
        where: { id: tenant.id },
      });
    });

    it("should not return negative balances when rent is overpaid", async () => {
      const timestamp = Date.now();

      const tenant = await prisma.tenant.create({
        data: {
          firstName: "Overpaid",
          lastName: "Tenant",
          email: `overpaid-${timestamp}@example.com`,
          userId: testUserId,
        },
      });

      const unit = await prisma.unit.create({
        data: {
          unitNumber: `OVER-${timestamp}`,
          propertyId: testPropertyId,
          bedrooms: 1,
          bathrooms: 1,
          rentAmount: 1000,
        },
      });

      const lease = await prisma.lease.create({
        data: {
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          monthlyRent: 1000,
          securityDeposit: 1000,
          status: "ACTIVE",
          propertyId: testPropertyId,
          unitId: unit.id,
          tenantId: tenant.id,
        },
      });

      await prisma.payment.create({
        data: {
          amount: 1500,
          paymentDate: new Date(),
          status: "completed",
          method: "bank_transfer",
          leaseId: lease.id,
          tenantId: tenant.id,
        },
      });

      const result = await getOutstandingRent(testUserId);

      expect(result.some((entry) => entry.tenantId === tenant.id)).toBe(false);

      await prisma.payment.deleteMany({
        where: { leaseId: lease.id },
      });

      await prisma.lease.delete({
        where: { id: lease.id },
      });

      await prisma.unit.delete({
        where: { id: unit.id },
      });

      await prisma.tenant.delete({
        where: { id: tenant.id },
      });
    });

    it("should ignore non-completed payments when calculating outstanding rent", async () => {
      const timestamp = Date.now();

      const tenant = await prisma.tenant.create({
        data: {
          firstName: "Pending",
          lastName: "Payment",
          email: `pending-payment-${timestamp}@example.com`,
          userId: testUserId,
        },
      });

      const unit = await prisma.unit.create({
        data: {
          unitNumber: `PENDING-${timestamp}`,
          propertyId: testPropertyId,
          bedrooms: 1,
          bathrooms: 1,
          rentAmount: 1000,
        },
      });

      const lease = await prisma.lease.create({
        data: {
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          monthlyRent: 1000,
          securityDeposit: 1000,
          status: "ACTIVE",
          propertyId: testPropertyId,
          unitId: unit.id,
          tenantId: tenant.id,
        },
      });

      await prisma.payment.create({
        data: {
          amount: 600,
          paymentDate: new Date(),
          status: "pending",
          method: "bank_transfer",
          leaseId: lease.id,
          tenantId: tenant.id,
        },
      });

      const result = await getOutstandingRent(testUserId);

      const entry = result.find((item) => item.tenantId === tenant.id);

      expect(entry).toBeDefined();
      expect(entry?.amountDue).toBe(1000);

      await prisma.payment.deleteMany({
        where: { leaseId: lease.id },
      });

      await prisma.lease.delete({
        where: { id: lease.id },
      });

      await prisma.unit.delete({
        where: { id: unit.id },
      });

      await prisma.tenant.delete({
        where: { id: tenant.id },
      });
    });

    it("should not include another user's lease", async () => {
      const result = await getOutstandingRent(testUserId);

      expect(result.some((entry) => entry.tenantId === otherTenantId)).toBe(
        false,
      );
    });
  });
});
