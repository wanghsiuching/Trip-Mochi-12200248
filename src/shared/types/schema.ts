/**
 * Schema Version System for Trip Mochi
 * V1: Legacy schema (without schemaVersion, or schemaVersion: 1)
 * V2: Feature/Domain-Oriented Schema with unified ImageAssetReference and normalized fields
 */

export type SchemaVersion = 1 | 2;

export const CURRENT_SCHEMA_VERSION: SchemaVersion = 2;

/**
 * Soft delete tracking fields
 */
export interface SoftDeletable {
  deletedAt?: number | null;
  deletedBy?: string | null;
  deletedByMemberId?: string | null;
}

/**
 * Concurrency and conflict tracking fields
 */
export interface ConcurrencyEntity {
  version?: number;
  updatedAt?: number;
  updatedBy?: string | null;
  updatedByMemberId?: string | null;
}

/**
 * Base versioned entity that all domain objects extend
 */
export interface VersionedEntity extends SoftDeletable, ConcurrencyEntity {
  schemaVersion?: SchemaVersion;
}

