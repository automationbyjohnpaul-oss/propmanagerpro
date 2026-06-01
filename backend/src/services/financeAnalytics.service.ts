import { prisma } from "../lib/prisma";

function getCurrentMonthRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startOfMonth, startOfNextMonth };
}

export async function getDashboardMetrics(userId: string) {
  const totalUnits = await prisma.unit.count({
    where: { property: { userId } },
  });

  const activeLeases = await prisma.lease.count({
    where: { isActive: true, property: { userId } },
  });

  const occupiedUnits = await prisma.lease.groupBy({
    by: ["unitId"],
    where: { isActive: true, property: { userId } },
  });

  const vacantUnits = totalUnits - occupiedUnits.length;
  const occupancyRate =
    totalUnits > 0 ? (occupiedUnits.length / totalUnits) * 100 : 0;

  const { startOfMonth, startOfNextMonth } = getCurrentMonthRange();

  const monthlyPayments = await prisma.payment.aggregate({
    where: {
      status: "completed",
      paymentDate: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
      lease: {
        property: { userId },
      },
    },
    _sum: { amount: true },
  });

  const monthlyIncome = Number(monthlyPayments._sum.amount ?? 0);

  return {
    monthlyIncome,
    monthlyExpenses: 0,
    netCashflow: monthlyIncome,
    occupiedUnits: occupiedUnits.length,
    vacantUnits,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    activeLeases,
  };
}

export async function getRevenueByProperty(userId: string) {
  const properties = await prisma.property.findMany({
    where: { userId },
    include: {
      leases: {
        include: {
          payments: {
            where: {
              status: "completed",
            },
          },
        },
      },
    },
  });

  return properties.map((property) => {
    const revenue = property.leases.reduce((sum, lease) => {
      const leaseRevenue = lease.payments.reduce(
        (paymentSum, payment) => paymentSum + Number(payment.amount),
        0,
      );
      return sum + leaseRevenue;
    }, 0);

    return {
      propertyId: property.id,
      propertyName: property.name,
      revenue,
    };
  });
}

export async function getOutstandingRent(userId: string) {
  const { startOfMonth, startOfNextMonth } = getCurrentMonthRange();

  const leases = await prisma.lease.findMany({
    where: { isActive: true, property: { userId } },
    include: {
      tenant: true,
      unit: {
        include: {
          property: true,
        },
      },
      payments: {
        where: {
          status: "completed",
          paymentDate: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
      },
    },
  });

  return leases
    .map((lease) => {
      const currentMonthPaid = lease.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      const monthlyRent = Number(lease.monthlyRent);
      const amountDue = monthlyRent - currentMonthPaid;

      return {
        tenantId: lease.tenantId,
        tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
        propertyName: lease.unit.property.name,
        unitNumber: lease.unit.unitNumber,
        amountDue: amountDue > 0 ? amountDue : 0,
      };
    })
    .filter((entry) => entry.amountDue > 0);
}
