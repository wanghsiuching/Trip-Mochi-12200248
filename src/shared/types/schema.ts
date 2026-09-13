/**
 * Schema Version System for Trip Mochi
 * V1: Legacy schema (without schemaVersion, or schemaVersion: 1)
 * V2: Feature/Domain-Oriented Schema with unified ImageAssetReference and normalized fields
 */

export type SchemaVersion = 1 | 2;

export const CURRENT_SCHEMA_VERSION: SchemaVersion = 2;

export interface VersionedEntity {
  schemaVersion?: SchemaVersion;
}
