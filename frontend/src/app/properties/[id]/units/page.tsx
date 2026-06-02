"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProperty, Property } from "@/services/propertyApi";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import AuthGuard from "@/components/AuthGuard";

export default function UnitsPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperty() {
      try {
        const data = await getProperty(propertyId);
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load units");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  if (loading) {
    return (
      <AuthGuard>
        <LoadingState message="Loading units..." />
      </AuthGuard>
    );
  }

  if (error || !property) {
    return (
      <AuthGuard>
        <ErrorState message={error || "Property not found"} />
      </AuthGuard>
    );
  }

  const units = property.units || [];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-4">
            <PageHeader
              title={`${property.name} — Units`}
              description={
                units.length > 0
                  ? `${units.length} units`
                  : "No units added yet"
              }
            />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/properties/${property.id}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Property
            </Link>
            <Link
              href={`/properties/${property.id}/units/new`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Add Unit
            </Link>
          </div>

          {units.length === 0 ? (
            <EmptyState message="No units found. Add your first unit to this property." />
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
                        Beds / Baths
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Sq Ft
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Rent
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
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          Unit {unit.unitNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {unit.bedrooms} Bed / {unit.bathrooms} Bath
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {unit.squareFeet
                            ? `${unit.squareFeet.toLocaleString()} sq ft`
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          ${Number(unit.rentAmount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <Link
                            href={`/properties/${property.id}/units/${unit.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </Link>
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
    </AuthGuard>
  );
}
