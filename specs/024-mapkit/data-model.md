# Data Model: MapKit Lab Module

All entities are TypeScript value types — no persistence, no
networking. Lifetime is the screen mount only.

## Landmark (preset)

```ts
interface Landmark {
  id: string;             // kebab-case, unique within LANDMARKS
  name: string;           // human-readable label rendered in panel
  lat: number;            // [-90, 90]
  lng: number;            // [-180, 180]
  description: string;    // 1-sentence subtitle
}
```

Source of truth: `src/modules/mapkit-lab/landmarks.ts` exports
`LANDMARKS: readonly Landmark[]` containing exactly four entries
(Apple Park, Eiffel Tower, Tokyo Tower, Sydney Opera House — see
`plan.md` §Data for coordinates).

Validation rules (enforced by `landmarks.test.ts`):

- `LANDMARKS.length === 4`.
- `id` matches `/^[a-z][a-z0-9-]*$/`.
- `id` values are unique.
- `lat`, `lng` within geographic bounds.
- `description` non-empty.

## Annotation (visible)

```ts
type Annotation =
  | { kind: 'preset'; landmarkId: string }
  | { kind: 'user-added'; id: string; lat: number; lng: number };
```

Preset annotations are derived from membership in
`useMapState.visibleAnnotationIds` (a `ReadonlySet<string>` of
landmark ids). The `screen.tsx` layer joins
`visibleAnnotationIds` with `LANDMARKS` to render `<Marker>`s.

User-added annotations live in
`useMapState.customAnnotations: ReadonlyArray<Annotation & { kind:
'user-added' }>`. Ids are generated as
`` `user-${Date.now()}-${counter}` `` where `counter` is a
hook-local monotonic ref.

State transitions:

- `toggleAnnotation(landmarkId)` — add or remove `landmarkId` from
  `visibleAnnotationIds`. Unknown ids are ignored (no throw).
- `addAnnotationAtCenter()` — append a new `user-added` entry at
  `region.center` to `customAnnotations`. Repeated taps stack at
  the same coord (acceptable per spec edge case).

## Region

```ts
interface LatLng { lat: number; lng: number; }

interface Region extends LatLng {
  latDelta: number;
  lngDelta: number;
}
```

Mirrors `react-native-maps`' `Region` shape (which itself mirrors
`MKCoordinateRegion`). Stored on `useMapState.region`. Updated by
`MapView` via `onRegionChangeComplete` → `setRegion` and by
`recenter`.

`DEFAULT_FALLBACK_REGION` constant lives in `landmarks.ts`:
`{ lat: 39.5, lng: -98.35, latDelta: 35, lngDelta: 50 }`
(continental US).

## MapType

```ts
type MapType = 'standard' | 'satellite' | 'hybrid' | 'mutedStandard';
```

Stored on `useMapState.mapType`. Initial value: `'standard'`.
Mutated by `setMapType(type)` from the `MapToolbar` segmented
control. Forwarded directly to `<MapView mapType={mapType} />`.

## PermissionStatus

```ts
type PermissionStatus =
  | 'undetermined' | 'denied' | 'granted' | 'restricted';
```

Stored on `useMapState.permissionStatus`. Seeded on mount from
`Location.getForegroundPermissionsAsync()`. Mutated by
`setPermissionStatus` (called after request) and by direct
re-reads.

State transitions enforced by the hook:
- transition out of `'granted'` forces
  `userLocationEnabled := false`.

## Polyline

```ts
type PolylinePoints = ReadonlyArray<LatLng>;
```

Stored on `useMapState.polylinePoints`. Initial value: `[]`.
Replaced (not appended) by `drawSampleLoop()` to an 8-point closed
loop around `region.center`. Cleared by `clearPolyline()` to `[]`.

## SearchResult (bridge contract)

```ts
interface SearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}
```

Returned by `MapKitSearchBridge.searchLocations(query, region)`.
Empty array allowed (spec edge case "Search returns zero results").
Owned transiently by `SearchPanel` local state; never persisted.

## LookAroundResult (bridge contract)

```ts
interface LookAroundResult {
  shown: boolean;
}
```

Returned by `LookAroundBridge.presentLookAround(lat, lng)`.
`shown: false` covers both "no scene for coordinate" and "iOS < 16"
(handled by the bridge); JS callers only see this single shape.

## Hook-owned state shape

```ts
interface UseMapState {
  // state
  mapType: MapType;
  visibleAnnotationIds: ReadonlySet<string>;
  customAnnotations: ReadonlyArray<
    Extract<Annotation, { kind: 'user-added' }>
  >;
  polylinePoints: ReadonlyArray<LatLng>;
  region: Region;
  permissionStatus: PermissionStatus;
  userLocationEnabled: boolean;

  // actions
  toggleAnnotation(landmarkId: string): void;
  addAnnotationAtCenter(): void;
  drawSampleLoop(): void;
  clearPolyline(): void;
  setMapType(type: MapType): void;
  setRegion(region: Region): void;
  setPermissionStatus(status: PermissionStatus): void;
  toggleUserLocation(): void;
  recenter(): Promise<void>;
}
```

## Relationships

```
LANDMARKS (const, 4 items)
   │
   │ landmarkId ∈ LANDMARKS.map(l => l.id)
   ▼
visibleAnnotationIds (Set<string>) ──┐
                                     ├─► <Marker> ×N rendered on <MapView>
customAnnotations (Array)        ────┘

polylinePoints (Array<LatLng>) ─────► <Polyline coordinates={...} />

region ─────────► <MapView region={...} onRegionChangeComplete={setRegion} />
                                      │
                                      └─► used by SearchPanel as the
                                          search-scope region and by
                                          LookAroundPanel as the
                                          presentation coordinate

permissionStatus ─────► PermissionsCard (display + request button)
                  └──► MapToolbar (gates user-location toggle)
                  └──► useMapState.recenter (chooses real GPS vs
                       DEFAULT_FALLBACK_REGION)
```
