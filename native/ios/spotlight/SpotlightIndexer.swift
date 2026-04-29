//
//  SpotlightIndexer.swift
//  spot — feature 031
//
//  iOS 9+ CSSearchableIndex wrapper. Authored on Windows; verified on-device
//  per `specs/031-spotlight-indexing/quickstart.md` (Constitution V exemption
//  mirroring 007/013/014/027/028/029/030).
//
//  Responsibilities (FR-080..083):
//    - Index `SearchableItem` arrays into system Spotlight via
//      `CSSearchableIndex.default()`.
//    - Build `CSSearchableItemAttributeSet` with appropriate UTType:
//      `kUTTypeData` on iOS 9–13 (MobileCoreServices), `UTType.data` on iOS 14+
//      (UniformTypeIdentifiers), branching via `#available(iOS 14.0, *)`.
//    - Set `domainIdentifier = "com.izkizk8.spot.modules"` on every item.
//    - Expose `index`, `delete`, `deleteAll`, `search` to the JS bridge.
//    - `search` runs a `CSSearchQuery` capped at the specified limit.
//
//  Exposed to JS via `requireOptionalNativeModule('Spotlight')` —
//  see `src/native/spotlight.ts`.
//

import Foundation
import CoreSpotlight

#if canImport(MobileCoreServices)
import MobileCoreServices
#endif

#if canImport(UniformTypeIdentifiers)
import UniformTypeIdentifiers
#endif

/// SearchableItem shape matching the JS bridge contract.
public struct SearchableItem: Codable {
    public let id: String
    public let title: String
    public let contentDescription: String
    public let keywords: [String]
    public let domainIdentifier: String
    public let thumbnailURL: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case contentDescription
        case keywords
        case domainIdentifier
        case thumbnailURL
    }
}

@available(iOS 9.0, *)
public enum SpotlightIndexer {
    
    public static let domainIdentifier = "com.izkizk8.spot.modules"
    
    // MARK: - Index items (FR-080)
    
    /// Index an array of SearchableItem into system Spotlight.
    public static func index(
        items: [SearchableItem],
        completion: @escaping (Error?) -> Void
    ) {
        let searchableItems = items.map { item -> CSSearchableItem in
            let attributeSet = makeAttributeSet(from: item)
            let searchableItem = CSSearchableItem(
                uniqueIdentifier: item.id,
                domainIdentifier: domainIdentifier,
                attributeSet: attributeSet
            )
            return searchableItem
        }
        
        CSSearchableIndex.default().indexSearchableItems(searchableItems) { error in
            completion(error)
        }
    }
    
    // MARK: - Delete items (FR-081)
    
    /// Delete items by their unique identifiers.
    public static func delete(
        identifiers: [String],
        completion: @escaping (Error?) -> Void
    ) {
        CSSearchableIndex.default().deleteSearchableItems(
            withIdentifiers: identifiers,
            completionHandler: completion
        )
    }
    
    /// Delete all items in the domain.
    public static func deleteAll(completion: @escaping (Error?) -> Void) {
        CSSearchableIndex.default().deleteSearchableItems(
            withDomainIdentifiers: [domainIdentifier],
            completionHandler: completion
        )
    }
    
    // MARK: - Search (FR-083)
    
    /// Search indexed items. Returns results capped at limit.
    public static func search(
        query: String,
        limit: Int,
        completion: @escaping (Result<[SearchableItem], Error>) -> Void
    ) {
        // Build query string that searches title, description, and keywords
        let queryString = "title == \"*\(query)*\"cd || contentDescription == \"*\(query)*\"cd || keywords == \"*\(query)*\"cd"
        
        let csQuery = CSSearchQuery(
            queryString: queryString,
            attributes: ["title", "contentDescription", "keywords", "domainIdentifier"]
        )
        
        var results: [SearchableItem] = []
        var queryError: Error?
        
        csQuery.foundItemsHandler = { items in
            for item in items {
                guard results.count < limit else { break }
                
                let searchableItem = SearchableItem(
                    id: item.uniqueIdentifier ?? "",
                    title: item.attributeSet?.title ?? "",
                    contentDescription: item.attributeSet?.contentDescription ?? "",
                    keywords: item.attributeSet?.keywords ?? [],
                    domainIdentifier: item.attributeSet?.domainIdentifier ?? domainIdentifier,
                    thumbnailURL: nil
                )
                results.append(searchableItem)
            }
        }
        
        csQuery.completionHandler = { error in
            if let error = error {
                queryError = error
            }
            DispatchQueue.main.async {
                if let error = queryError {
                    completion(.failure(error))
                } else {
                    completion(.success(results))
                }
            }
        }
        
        csQuery.start()
    }
    
    // MARK: - Attribute Set Builder (DECISION 15 / FR-081)
    
    private static func makeAttributeSet(from item: SearchableItem) -> CSSearchableItemAttributeSet {
        let attributeSet: CSSearchableItemAttributeSet
        
        // Use UTType.data on iOS 14+, kUTTypeData on iOS 9–13
        if #available(iOS 14.0, *) {
            #if canImport(UniformTypeIdentifiers)
            attributeSet = CSSearchableItemAttributeSet(contentType: UTType.data)
            #else
            attributeSet = CSSearchableItemAttributeSet(itemContentType: kUTTypeData as String)
            #endif
        } else {
            attributeSet = CSSearchableItemAttributeSet(itemContentType: kUTTypeData as String)
        }
        
        attributeSet.title = item.title
        attributeSet.contentDescription = item.contentDescription
        attributeSet.keywords = item.keywords
        attributeSet.domainIdentifier = domainIdentifier
        
        // Optional thumbnail
        if let thumbnailURLString = item.thumbnailURL,
           let thumbnailURL = URL(string: thumbnailURLString) {
            attributeSet.thumbnailURL = thumbnailURL
        }
        
        return attributeSet
    }
}
