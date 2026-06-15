# Changelog

## CP-001 — Stabilization (2026-06-15)

### Added

- Auto-create units on property creation (database transaction)
- Soft delete system (archive/restore with `deletedAt`)
- Restore endpoint for archived properties
- Performance baseline documentation

### Removed

- Custom cache layer (`store.ts`, `sessionCache.ts`)
- Client-side data fetching for properties list
- Debug instrumentation (`console.time`, `console.timeEnd`, investigation logs)
- "Generate Units" button (no longer needed)

### Changed

- Properties page: Client Component → Server Component
- Data flow: Server = Source of Truth, Client = UI only
- Mutation pattern: API call → `router.refresh()`

### Fixed

- Manual refresh required after property creation
- Archive restore 404 error (removed `deletedAt` filter from restore lookup)
- Cache-related stale UI bugs
