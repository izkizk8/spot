//
//  UserActivityHelper.swift
//  spot — feature 031
//
//  iOS 8+ NSUserActivity wrapper for current-state Spotlight indexing.
//  Authored on Windows; verified on-device per
//  `specs/031-spotlight-indexing/quickstart.md` (Constitution V exemption
//  mirroring 007/013/014/027/028/029/030).
//
//  Responsibilities (FR-084..085):
//    - Create `NSUserActivity(activityType: "spot.showcase.activity")` with
//      title, keywords, userInfo from the descriptor.
//    - Set `isEligibleForSearch = true` and `isEligibleForPrediction = true`.
//    - Call `becomeCurrent()` to make the activity visible in Spotlight.
//    - Retain the activity via `private var current: NSUserActivity?`.
//    - Expose `invalidate()` which calls `resignCurrent()` then `invalidate()`
//      and releases the retained activity.
//    - Re-marking while one is already current invalidates the prior activity
//      first (defensive against EC-009).
//
//  Exposed to JS via `requireOptionalNativeModule('Spotlight')` —
//  see `src/native/spotlight.ts`.
//

import Foundation

/// Descriptor for the user activity, matching the JS bridge contract.
public struct UserActivityDescriptor: Codable {
    public let title: String
    public let keywords: [String]
    public let userInfo: [String: String]?
    
    public init(title: String, keywords: [String], userInfo: [String: String]? = nil) {
        self.title = title
        self.keywords = keywords
        self.userInfo = userInfo
    }
}

@available(iOS 8.0, *)
public final class UserActivityHelper {
    
    public static let shared = UserActivityHelper()
    
    public static let activityType = "spot.showcase.activity"
    
    /// The currently active NSUserActivity, if any.
    private var current: NSUserActivity?
    
    private init() {}
    
    // MARK: - Mark current activity (FR-084)
    
    /// Mark the given descriptor as the current user activity.
    /// If an activity is already current, it is invalidated first (EC-009).
    public func markCurrent(descriptor: UserActivityDescriptor) {
        // Invalidate prior activity if exists (defensive against EC-009)
        if current != nil {
            clearCurrent()
        }
        
        let activity = NSUserActivity(activityType: Self.activityType)
        activity.title = descriptor.title
        activity.keywords = Set(descriptor.keywords)
        
        // Set userInfo if provided
        if let userInfo = descriptor.userInfo {
            activity.userInfo = userInfo as [AnyHashable: Any]
        }
        
        // Make eligible for search and prediction
        activity.isEligibleForSearch = true
        if #available(iOS 12.0, *) {
            activity.isEligibleForPrediction = true
        }
        
        // Become current
        activity.becomeCurrent()
        
        // Retain the activity
        current = activity
    }
    
    // MARK: - Clear current activity (FR-085 / FR-064)
    
    /// Invalidate the current activity, if any.
    /// Calls `resignCurrent()` then `invalidate()` and releases the reference.
    public func clearCurrent() {
        guard let activity = current else { return }
        
        activity.resignCurrent()
        activity.invalidate()
        
        current = nil
    }
    
    // MARK: - Check if active
    
    /// Returns true if an activity is currently marked.
    public var isActive: Bool {
        return current != nil
    }
}
