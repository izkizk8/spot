import ExpoModulesCore
import MapKit

public class MapKitSearchBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("SpotMapKitSearch")

    AsyncFunction("search") { (query: String, region: SearchRegionInput) -> [SearchResult] in
      try await self.search(query: query, region: region)
    }
  }

  private func search(query: String, region: SearchRegionInput) async throws -> [SearchResult] {
    let request = MKLocalSearch.Request()
    request.naturalLanguageQuery = query
    request.region = MKCoordinateRegion(
      center: CLLocationCoordinate2D(latitude: region.lat, longitude: region.lng),
      span: MKCoordinateSpan(latitudeDelta: region.latDelta, longitudeDelta: region.lngDelta)
    )

    let search = MKLocalSearch(request: request)
    let response = try await search.start()

    return response.mapItems.map { item in
      let placemark = item.placemark
      let addressParts = [
        placemark.thoroughfare,
        placemark.locality,
        placemark.administrativeArea,
        placemark.country
      ].compactMap { $0 }
      
      return SearchResult(
        name: item.name ?? "",
        address: addressParts.joined(separator: ", "),
        lat: placemark.coordinate.latitude,
        lng: placemark.coordinate.longitude
      )
    }
  }
}

struct SearchRegionInput: Record {
  @Field var lat: Double
  @Field var lng: Double
  @Field var latDelta: Double
  @Field var lngDelta: Double
}

struct SearchResult: Record {
  @Field var name: String
  @Field var address: String
  @Field var lat: Double
  @Field var lng: Double
}
