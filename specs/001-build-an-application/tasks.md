# Tasks: Photo Album Organization Application

**Input**: Design documents from `/Users/lql/Downloads/spec-demo/test/specs/001-build-an-application/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Based on plan.md: Single web application structure

## Phase 3.1: Setup

- [ ] T001 Create project structure with Vite configuration
- [ ] T002 Initialize JavaScript project with Vite, SQL.js, and Vitest dependencies
- [ ] T003 [P] Configure ESLint and Prettier for code quality
- [ ] T004 [P] Set up IndexedDB wrapper for SQL.js persistence in src/lib/storage.js
- [ ] T005 Create database schema initialization in src/models/schema.js

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] T006 [P] Contract test GET /api/albums in tests/contract/test_albums_get.js
- [ ] T007 [P] Contract test GET /api/albums/{id} in tests/contract/test_albums_get_by_id.js
- [ ] T008 [P] Contract test PUT /api/albums/{id}/order in tests/contract/test_albums_reorder.js
- [ ] T009 [P] Contract test POST /api/albums in tests/contract/test_albums_create.js
- [ ] T010 [P] Contract test DELETE /api/albums/{id} in tests/contract/test_albums_delete.js
- [ ] T011 [P] Contract test POST /api/photos/import in tests/contract/test_photos_import.js
- [ ] T012 [P] Contract test GET /api/photos/{id} in tests/contract/test_photos_get.js
- [ ] T013 [P] Contract test GET /api/photos/{id}/thumbnail in tests/contract/test_photos_thumbnail.js
- [ ] T014 [P] Contract test PUT /api/photos/{id}/order in tests/contract/test_photos_reorder.js
- [ ] T015 [P] Contract test DELETE /api/photos/{id} in tests/contract/test_photos_delete.js
- [ ] T016 [P] Contract test GET /api/photos/album/{album_id} in tests/contract/test_photos_by_album.js

### Integration Tests (from quickstart scenarios)
- [ ] T017 [P] Integration test photo import and album creation in tests/integration/test_photo_import.js
- [ ] T018 [P] Integration test drag-and-drop album reordering in tests/integration/test_album_reorder.js
- [ ] T019 [P] Integration test album navigation and photo tile display in tests/integration/test_album_navigation.js
- [ ] T020 [P] Integration test mixed date photos and "Undated" album in tests/integration/test_mixed_dates.js
- [ ] T021 [P] Integration test large photo collections performance in tests/integration/test_performance.js

## Phase 3.3: Database Models (ONLY after tests are failing)

- [ ] T022 [P] Album model with CRUD operations in src/models/album.js
- [ ] T023 [P] Photo model with CRUD operations in src/models/photo.js
- [ ] T024 [P] DateGroup model with CRUD operations in src/models/date-group.js
- [ ] T025 Database initialization and migration logic in src/models/database.js

## Phase 3.4: Core Services

### File and Image Processing
- [ ] T026 [P] EXIF data extraction service in src/services/exif-service.js
- [ ] T027 [P] Thumbnail generation service using Canvas API in src/services/thumbnail-service.js
- [ ] T028 [P] File validation and processing service in src/services/file-service.js
- [ ] T029 Photo import service with batch processing in src/services/photo-import-service.js

### Album Management
- [ ] T030 [P] Album creation and management service in src/services/album-service.js
- [ ] T031 [P] Date-based album grouping service in src/services/date-grouping-service.js
- [ ] T032 Album reordering service with drag-and-drop logic in src/services/album-reorder-service.js

### API Layer (Frontend Services)
- [ ] T033 Album API service implementing contract endpoints in src/services/api/album-api.js
- [ ] T034 Photo API service implementing contract endpoints in src/services/api/photo-api.js

## Phase 3.5: UI Components

### Core Components
- [ ] T035 [P] Main page component with album grid layout in src/components/main-page.js
- [ ] T036 [P] Album card component with cover photo and metadata in src/components/album-card.js
- [ ] T037 [P] Album view component with photo tile interface in src/components/album-view.js
- [ ] T038 [P] Photo tile component with lazy loading in src/components/photo-tile.js
- [ ] T039 [P] Photo import component with drag-and-drop zone in src/components/photo-import.js

### Interaction Components
- [ ] T040 [P] Drag-and-drop handler for album reordering in src/components/drag-drop-handler.js
- [ ] T041 [P] Photo modal/lightbox component for full-size viewing in src/components/photo-modal.js
- [ ] T042 [P] Progress indicator component for import operations in src/components/progress-indicator.js
- [ ] T043 [P] Error handling and user feedback component in src/components/error-handler.js

### Application Shell
- [ ] T044 Main application component integrating all features in src/components/app.js
- [ ] T045 Router component for navigation between views in src/components/router.js

## Phase 3.6: Styling and Layout

- [ ] T046 [P] CSS Grid layout for responsive album grid in src/styles/album-grid.css
- [ ] T047 [P] CSS Grid layout for photo tile interface in src/styles/photo-tiles.css
- [ ] T048 [P] Drag-and-drop visual feedback styling in src/styles/drag-drop.css
- [ ] T049 [P] Responsive design breakpoints and mobile layout in src/styles/responsive.css
- [ ] T050 Main application styles and theme in src/styles/main.css

## Phase 3.7: Integration and State Management

- [ ] T051 Event-driven state management system in src/lib/state-manager.js
- [ ] T052 Application initialization and database setup in src/main.js
- [ ] T053 IndexedDB persistence layer integration in src/lib/persistence.js
- [ ] T054 Performance optimization with virtual scrolling in src/lib/virtual-scroll.js

## Phase 3.8: Polish and Optimization

- [ ] T055 [P] Unit tests for EXIF extraction in tests/unit/test_exif_service.js
- [ ] T056 [P] Unit tests for thumbnail generation in tests/unit/test_thumbnail_service.js
- [ ] T057 [P] Unit tests for date grouping logic in tests/unit/test_date_grouping.js
- [ ] T058 [P] Unit tests for album reordering in tests/unit/test_album_reorder.js
- [ ] T059 Performance tests for large collections (<200ms response) in tests/performance/test_large_collections.js
- [ ] T060 [P] HTML entry point and production build optimization in index.html
- [ ] T061 Error handling and recovery mechanisms throughout application
- [ ] T062 Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] T063 Browser compatibility testing and polyfills if needed
- [ ] T064 Final integration test running complete quickstart scenarios

## Dependencies

### Setup Dependencies
- T001 → T002 → T003,T004,T005 (project setup sequence)

### Test Dependencies
- T005 → T006-T021 (tests require database schema)
- All contract tests (T006-T016) can run in parallel
- All integration tests (T017-T021) can run in parallel

### Implementation Dependencies
- T022-T024 (models) → T025 (database init)
- T025 → T026-T032 (services depend on database)
- T026-T028 → T029 (import service needs file services)
- T030-T031 → T032 (reorder service needs album management)
- T033-T034 depend on corresponding services
- T035-T043 (UI components) can mostly run in parallel
- T044-T045 → completion of components

### Integration Dependencies
- T051 depends on models and services
- T052 depends on database and state management
- T053 depends on database models
- T054 can run in parallel with other optimizations

### Polish Dependencies
- T055-T058 (unit tests) can run in parallel
- T059 depends on complete implementation
- T060-T064 depend on complete implementation

## Parallel Examples

### Contract Tests (Run Together)
```bash
# Launch T006-T016 together:
Task: "Contract test GET /api/albums in tests/contract/test_albums_get.js"
Task: "Contract test GET /api/albums/{id} in tests/contract/test_albums_get_by_id.js"
Task: "Contract test PUT /api/albums/{id}/order in tests/contract/test_albums_reorder.js"
Task: "Contract test POST /api/albums in tests/contract/test_albums_create.js"
Task: "Contract test DELETE /api/albums/{id} in tests/contract/test_albums_delete.js"
Task: "Contract test POST /api/photos/import in tests/contract/test_photos_import.js"
# ... continue with remaining contract tests
```

### Models (Run Together)
```bash
# Launch T022-T024 together:
Task: "Album model with CRUD operations in src/models/album.js"
Task: "Photo model with CRUD operations in src/models/photo.js"
Task: "DateGroup model with CRUD operations in src/models/date-group.js"
```

### UI Components (Run Together)
```bash
# Launch T035-T043 together:
Task: "Main page component with album grid layout in src/components/main-page.js"
Task: "Album card component with cover photo and metadata in src/components/album-card.js"
Task: "Album view component with photo tile interface in src/components/album-view.js"
# ... continue with remaining components
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Use Vitest for all testing
- Follow constitutional TDD principles
- Maintain <200ms performance targets
- Avoid external dependencies beyond Vite and SQL.js

## Validation Checklist

- [x] All contracts have corresponding tests (T006-T016)
- [x] All entities have model tasks (T022-T024)
- [x] All tests come before implementation (Phase 3.2 before 3.3+)
- [x] Parallel tasks truly independent (marked [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Quickstart scenarios covered in integration tests
- [x] Performance requirements addressed
- [x] Constitutional principles (TDD, quality, UX consistency) enforced