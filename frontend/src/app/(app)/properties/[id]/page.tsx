"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProperty, archiveProperty, Property } from "@/services/propertyApi";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProperty() {
      try {
        const data = await getProperty(propertyId);

        if (!isMounted) return;

        setProperty(data);
      } catch (err) {
        if (!isMounted) return;

        setError(
          err instanceof Error ? err.message : "Failed to load property",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (propertyId) {
      loadProperty();
    }

    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  async function handleArchive() {
    if (!confirm("Archive this property? It can be restored within 30 days.")) {
      return;
    }

    try {
      setArchiving(true);
      setError(null);

      await archiveProperty(propertyId);

      router.push("/properties");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to archive property. Please try again.",
      );
    } finally {
      setArchiving(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading property..." />;
  }

  if (!property) {
    return <ErrorState message={error || "Property not found"} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {property.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Property details and unit management
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorState message={error} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-normal text-gray-400 uppercase tracking-wide mb-1">
              Address
            </div>
            <div className="text-gray-700">{property.address}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-normal text-gray-400 uppercase tracking-wide mb-1">
              Location
            </div>
            <div className="text-gray-700">
              {property.city}, {property.state} {property.zip}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-normal text-gray-400 uppercase tracking-wide mb-1">
              Planned Units
            </div>
            <div className="text-3xl font-light text-gray-700">
              {property.unitCount}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-normal text-gray-400 uppercase tracking-wide mb-1">
              Generated Units
            </div>
            <div className="text-3xl font-light text-gray-700">
              {property.units?.length || 0}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/properties/${propertyId}/units`}
            className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            View Units
          </Link>

          <Link
            href={`/leases/new?propertyId=${propertyId}`}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Lease
          </Link>

          <Link
            href={`/properties/${propertyId}/edit`}
            className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Edit Property
          </Link>

          <button
            type="button"
            onClick={handleArchive}
            disabled={archiving}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {archiving ? "Archiving..." : "Archive Property"}
          </button>
        </div>
      </div>
    </div>
  );
}
