"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProperty, Property } from "@/services/propertyApi";
import { api } from "@/services/api"; // 👈 Add this import

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperty() {
      try {
        const data = await getProperty(id as string);
        setProperty(data);
      } catch (err) {
        console.error("Failed to load property:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading property details...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Property not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {property.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Property details and unit management
        </p>
      </div>

      {/* Info Cards */}
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href={`/properties/${id}/units`}
          className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          View Units
        </Link>

        <Link
          href={`/leases/new?propertyId=${id}`}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Create Lease
        </Link>

        {/* 👇 Add Archive Button */}
        <button
          onClick={async () => {
            if (
              !confirm(
                "Archive this property? It can be restored within 30 days.",
              )
            )
              return;

            try {
              await api.patch(`/api/properties/${id}/archive`, {});
              router.refresh();
              router.push("/properties");
            } catch (err) {
              console.error("Failed to archive property:", err);
              alert("Failed to archive property. Please try again.");
            }
          }}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Archive Property
        </button>
      </div>
    </div>
  );
}
