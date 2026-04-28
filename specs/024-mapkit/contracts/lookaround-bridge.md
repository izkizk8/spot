# Contract: `LookAroundBridge`

## Swift module name (Expo Modules API)

`SpotLookAround` — registered in
`native/ios/mapkit/expo-module.config.json` and resolved on the JS
side via
`requireOptionalNativeModule<SpotLookAroundModule>('SpotLookAround')`.

## Swift surface

```swift
public class LookAroundBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("SpotLookAround")

    AsyncFunction("presentLookAround") {
      (lat: Double, lng: Double) -> LookAroundResult in
      try await self.presentLookAround(lat: lat, lng: lng)
    }
  }
}

struct LookAroundResult: Record {
  @Field var shown: Bool
}
```

Implementation behavior:

1. `if #available(iOS 16.0, *)` — proceed; otherwise return
   `LookAroundResult(shown: false)`.
2. Build `MKLookAroundSceneRequest(coordinate:
   CLLocationCoordinate2D(latitude: lat, longitude: lng))`.
3. `let scene = try await request.scene` — `nil` ⇒ resolve
   `LookAroundResult(shown: false)`.
4. Otherwise on the main actor:
   - Find the topmost presented view controller of the key
     window (`UIApplication.shared.connectedScenes` →
     first foreground active `UIWindowScene` → `keyWindow?
     .rootViewController?.topMostPresented`).
   - Instantiate `MKLookAroundViewController(scene: scene)`.
   - `present(_:animated:true) { continuation.resume(returning:
     LookAroundResult(shown: true)) }`.
5. Throws propagate to JS as `Error`.

`topMostPresented` is a small recursive helper on
`UIViewController`:
```swift
extension UIViewController {
  var topMostPresented: UIViewController {
    presentedViewController?.topMostPresented ?? self
  }
}
```

## JS surface

```ts
// src/native/lookaround.types.ts
export interface LookAroundResult {
  shown: boolean;
}

export interface LookAroundBridge {
  presentLookAround(lat: number, lng: number):
    Promise<LookAroundResult>;
}

// re-exports from mapkit-search.types — kept colocated for
// import ergonomics:
export { MapKitNotSupportedError } from './mapkit-search.types';
```

### `lookaround.ios.ts`

```ts
import { requireOptionalNativeModule } from 'expo-modules-core';
import {
  type LookAroundBridge,
  type LookAroundResult,
} from './lookaround.types';
import { MapKitNotSupportedError } from './mapkit-search.types';

interface SpotLookAroundModule {
  presentLookAround(lat: number, lng: number):
    Promise<LookAroundResult>;
}

const native = requireOptionalNativeModule<SpotLookAroundModule>(
  'SpotLookAround',
);

const bridge: LookAroundBridge = {
  async presentLookAround(lat, lng) {
    if (!native) {
      throw new MapKitNotSupportedError('presentLookAround');
    }
    return native.presentLookAround(lat, lng);
  },
};

export default bridge;
```

### `lookaround.android.ts` and `lookaround.web.ts`

```ts
import { type LookAroundBridge } from './lookaround.types';
import { MapKitNotSupportedError } from './mapkit-search.types';

const bridge: LookAroundBridge = {
  presentLookAround: async () => {
    throw new MapKitNotSupportedError('presentLookAround');
  },
};

export default bridge;
```

## Test contract

| Test                                   | Asserts                                                              |
|----------------------------------------|----------------------------------------------------------------------|
| `lookaround.ios.test.ts`               | Forwards `(lat, lng)` to mock; returns `{ shown: true|false }`; throws when mock returns null. |
| `lookaround.android.test.ts`           | Always throws `MapKitNotSupportedError`.                             |
| `lookaround.web.test.ts`               | Always throws `MapKitNotSupportedError`.                             |
| `components/LookAroundPanel.test.tsx`  | Renders banner when `iosVersionAtLeast16=false`; surfaces `shown:false` as no-imagery copy; surfaces throws inline. |
