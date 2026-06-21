"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProperty, Property } from "@/services/propertyApi";
import { getUnits, archiveUnit, restoreUnit, Unit } from "@/services/unitApi";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

export default function UnitsPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUnits = useCallback(async () => {
    setLoading(true);
    try {
      const status = showArchived ? "archived" : "active";
      const [propertyData, unitsData] = await Promise.all([
        getProperty(propertyId),
        getUnits(propertyId, status),
      ]);
      setProperty(propertyData);
      setUnits(unitsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load units");
    } finally {
      setLoading(false);
    }
  }, [propertyId, showArchived]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  async function handleArchive(unitId: string) {
    if (!confirm("Archive this unit?")) return;
    setActionLoading(unitId);
    try {
      await archiveUnit(unitId);
      await loadUnits();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to archive unit");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestore(unitId: string) {
    setActionLoading(unitId);
    try {
      await restoreUnit(unitId);
      await loadUnits();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore unit");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <LoadingState message="Loading units..." />;
  }

  if (error || !property) {
    return <ErrorState message={error || "Property not found"} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-4">
          <PageHeader
            title={`${property.name} — Units`}
            description={
              units.length > 0
                ? `${units.length} ${showArchived ? "archived" : ""} units`
                : `No ${showArchived ? "archived" : ""} units`
            }
          />
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/properties/${property.id}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              &larr; Back to Property
            </Link>
            {!showArchived && (
              <Link
                href={`/properties/${property.id}/units/new`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add Unit
              </Link>
            )}
          </div>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              showArchived
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {showArchived ? "Show Active Units" : "View Archived Units"}
          </button>
        </div>

        {units.length === 0 ? (
          <EmptyState
            message={
              showArchived
                ? "No archived units."
                : "No units found. Add your first unit to this property."
            }
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Unit
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Bedrooms
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Bathrooms
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Market Rent
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr
                      key={unit.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        showArchived ? "opacity-75" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        Unit {unit.unitNumber}
                        {showArchived && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {unit.bedrooms}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {unit.bathrooms}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        ${Number(unit.rentAmount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!showArchived ? (
                            <>
                              <Link
                                href={`/properties/${property.id}/units/${unit.id}/edit`}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleArchive(unit.id)}
                                disabled={actionLoading === unit.id}
                                className="text-amber-600 hover:text-amber-800 font-medium disabled:opacity-50"
                              >
                                {actionLoading === unit.id ? "..." : "Archive"}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestore(unit.id)}
                              disabled={actionLoading === unit.id}
                              className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                            >
                              {actionLoading === unit.id ? "..." : "Restore"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
