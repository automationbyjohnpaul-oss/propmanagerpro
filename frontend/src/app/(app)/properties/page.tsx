"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProperties, Property } from "@/services/propertyApi";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getProperties();
        if (!isMounted) return;
        setProperties(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load properties",
        );
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Soft loading: only show full loading state if still loading
  if (loading && !properties.length) {
    return <LoadingState message="Loading properties..." />;
  }

  if (error && !properties.length) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <PageHeader
            title="Properties"
            description={
              properties.length > 0
                ? `${properties.length} properties in portfolio`
                : "Manage your property portfolio"
            }
          />
          <Link
            href="/properties/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            Add Property
          </Link>
        </div>

        {properties.length === 0 ? (
          <EmptyState message="No properties found. Add your first property to get started." />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Address
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      City
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      State
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Units
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr
                      key={property.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <Link
                          href={`/properties/${property.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {property.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {property.address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {property.city}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {property.state}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {property.unitCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <Link
                          href={`/properties/${property.id}/edit`}
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
  );
}
