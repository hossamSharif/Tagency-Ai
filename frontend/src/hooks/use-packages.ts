'use client';

/**
 * Package Hooks
 *
 * React hooks for package data fetching and real-time subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useTenant } from './use-tenant';
import {
  getTenantCollectionRef,
  subscribeToCollection,
  subscribeToDocument,
  query,
  where,
  orderBy,
  limit as limitQuery,
  type QueryConstraint,
  type Unsubscribe,
} from '@/lib/firebase/firestore';
import { type Package, type PackageWithServices, type PackageStatus, type PackageType } from '@/types/models/package';
import { type Service } from '@/types/models/service';

export interface UsePackagesOptions {
  status?: PackageStatus;
  type?: PackageType;
  limit?: number;
  orderByField?: 'createdAt' | 'startDate' | 'name';
  orderDirection?: 'asc' | 'desc';
}

export interface UsePackagesReturn {
  packages: Package[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch and subscribe to packages list
 */
export function usePackages(options: UsePackagesOptions = {}): UsePackagesReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { status, type, limit = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user || !tenant?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Build query constraints
    const constraints: QueryConstraint[] = [];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (type) {
      constraints.push(where('type', '==', type));
    }

    constraints.push(orderBy(orderByField, orderDirection));
    constraints.push(limitQuery(limit));

    // Subscribe to packages collection
    const unsubscribe = subscribeToCollection<Package>(
      tenant.id,
      'packages',
      constraints,
      (data) => {
        setPackages(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, tenant?.id, status, type, limit, orderByField, orderDirection, refreshKey]);

  return { packages, loading, error, refresh };
}

export interface UsePackageReturn {
  package: PackageWithServices | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch and subscribe to a single package with its services
 */
export function usePackage(packageId: string | null): UsePackageReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [pkg, setPkg] = useState<PackageWithServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user || !tenant?.id || !packageId) {
      setLoading(false);
      setPkg(null);
      return;
    }

    setLoading(true);
    setError(null);

    let packageUnsubscribe: Unsubscribe | null = null;
    let servicesUnsubscribe: Unsubscribe | null = null;

    let currentPackage: Package | null = null;
    let currentServices: Service[] = [];

    const updateCombined = () => {
      if (currentPackage) {
        setPkg({
          ...currentPackage,
          services: currentServices.sort((a, b) => a.displayOrder - b.displayOrder),
        });
      }
    };

    // Subscribe to package document
    packageUnsubscribe = subscribeToDocument<Package>(
      tenant.id,
      'packages',
      packageId,
      (data) => {
        currentPackage = data;
        updateCombined();
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    // Subscribe to services subcollection
    servicesUnsubscribe = subscribeToCollection<Service>(
      tenant.id,
      `packages/${packageId}/services`,
      [orderBy('displayOrder', 'asc')],
      (data) => {
        currentServices = data;
        updateCombined();
      },
      (err) => {
        console.error('Services subscription error:', err);
      }
    );

    return () => {
      if (packageUnsubscribe) packageUnsubscribe();
      if (servicesUnsubscribe) servicesUnsubscribe();
    };
  }, [user, tenant?.id, packageId, refreshKey]);

  return { package: pkg, loading, error, refresh };
}

export interface UsePackageStatsReturn {
  totalPackages: number;
  activePackages: number;
  draftPackages: number;
  loading: boolean;
}

/**
 * Hook to get package statistics
 */
export function usePackageStats(): UsePackageStatsReturn {
  const { packages, loading } = usePackages({ limit: 1000 }); // Get all for stats

  const stats = packages.reduce(
    (acc, pkg) => {
      acc.total++;
      if (pkg.status === 'active') acc.active++;
      if (pkg.status === 'draft') acc.draft++;
      return acc;
    },
    { total: 0, active: 0, draft: 0 }
  );

  return {
    totalPackages: stats.total,
    activePackages: stats.active,
    draftPackages: stats.draft,
    loading,
  };
}
