/**
 * StoreKitBridge.swift
 * Feature: 050-storekit-2
 *
 * Expo Module wrapping StoreKit 2 (`Product`, `Transaction`,
 * `AppStore`). JS surface mirrors `src/native/storekit.ts`.
 *
 * Methods:
 *   - products(ids) — Product.products([ids]).
 *   - purchase(productId) — Product.purchase().
 *   - currentEntitlements — Transaction.currentEntitlements.
 *   - transactionHistory — Transaction.all snapshot.
 *   - subscriptionStatuses — Product.SubscriptionInfo.Status for
 *     auto-renewable products.
 *   - restore — AppStore.sync().
 *
 * NOTE: This is an educational scaffold. Without an App Store
 * Connect catalog or a Configuration.storekit file in the Xcode
 * scheme, `products(ids)` resolves to an empty array.
 */

import ExpoModulesCore
#if canImport(StoreKit)
import StoreKit
#endif

public class StoreKitBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("StoreKitBridge")

    AsyncFunction("products") { (ids: [String]) -> [[String: Any]] in
      #if canImport(StoreKit)
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        let products = (try? await Product.products(for: ids)) ?? []
        return products.map(Self.serializeProduct)
      }
      #endif
      return []
    }

    AsyncFunction("purchase") { (productId: String) -> [String: Any] in
      #if canImport(StoreKit)
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        let products = (try? await Product.products(for: [productId])) ?? []
        guard let product = products.first else {
          return [
            "outcome": "userCancelled",
            "transaction": NSNull(),
            "errorMessage": "Unknown product id: \(productId)",
          ]
        }
        do {
          let result = try await product.purchase()
          switch result {
          case let .success(verification):
            switch verification {
            case let .verified(tx):
              await tx.finish()
              return [
                "outcome": "success",
                "transaction": Self.serializeTransaction(tx, productType: product.type),
                "errorMessage": NSNull(),
              ]
            case .unverified:
              return [
                "outcome": "userCancelled",
                "transaction": NSNull(),
                "errorMessage": "Transaction failed verification",
              ]
            }
          case .userCancelled:
            return [
              "outcome": "userCancelled",
              "transaction": NSNull(),
              "errorMessage": NSNull(),
            ]
          case .pending:
            return [
              "outcome": "pending",
              "transaction": NSNull(),
              "errorMessage": NSNull(),
            ]
          @unknown default:
            return [
              "outcome": "userCancelled",
              "transaction": NSNull(),
              "errorMessage": "Unknown purchase result",
            ]
          }
        } catch {
          return [
            "outcome": "userCancelled",
            "transaction": NSNull(),
            "errorMessage": error.localizedDescription,
          ]
        }
      }
      #endif
      return [
        "outcome": "userCancelled",
        "transaction": NSNull(),
        "errorMessage": "StoreKit 2 requires iOS 15+",
      ]
    }

    AsyncFunction("currentEntitlements") { () -> [[String: Any]] in
      #if canImport(StoreKit)
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        var out: [[String: Any]] = []
        for await result in Transaction.currentEntitlements {
          if case let .verified(tx) = result {
            out.append(Self.serializeEntitlement(tx))
          }
        }
        return out
      }
      #endif
      return []
    }

    AsyncFunction("transactionHistory") { () -> [[String: Any]] in
      #if canImport(StoreKit)
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        var out: [[String: Any]] = []
        for await result in Transaction.all {
          if case let .verified(tx) = result {
            out.append(Self.serializeTransaction(tx, productType: nil))
          }
        }
        return out
      }
      #endif
      return []
    }

    AsyncFunction("subscriptionStatuses") { () -> [[String: Any]] in
      #if canImport(StoreKit)
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        // The educational scaffold returns an empty list when no
        // products are configured. A real integration walks
        // `Product.SubscriptionInfo.status` per auto-renewable
        // product.
        return []
      }
      #endif
      return []
    }

    AsyncFunction("restore") { () -> [String: Any] in
      #if canImport(StoreKit)
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        try? await AppStore.sync()
        return ["ok": true]
      }
      #endif
      return ["ok": false]
    }
  }

  #if canImport(StoreKit)
  @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
  private static func serializeProduct(_ p: Product) -> [String: Any] {
    var out: [String: Any] = [
      "id": p.id,
      "type": serializeType(p.type),
      "displayName": p.displayName,
      "description": p.description,
      "displayPrice": p.displayPrice,
      "price": NSDecimalNumber(decimal: p.price).stringValue,
      "currencyCode": p.priceFormatStyle.currencyCode,
    ]
    if let sub = p.subscription {
      out["subscriptionPeriod"] = [
        "unit": serializeUnit(sub.subscriptionPeriod.unit),
        "value": sub.subscriptionPeriod.value,
      ]
    }
    return out
  }

  @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
  private static func serializeTransaction(_ tx: Transaction, productType: Product.ProductType?) -> [String: Any] {
    return [
      "id": String(tx.id),
      "productId": tx.productID,
      "productType": serializeType(productType ?? tx.productType),
      "purchaseDate": tx.purchaseDate.timeIntervalSince1970 * 1000,
      "expirationDate": tx.expirationDate.map { $0.timeIntervalSince1970 * 1000 } ?? NSNull(),
      "isUpgraded": tx.isUpgraded,
    ]
  }

  @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
  private static func serializeEntitlement(_ tx: Transaction) -> [String: Any] {
    return [
      "productId": tx.productID,
      "productType": serializeType(tx.productType),
      "purchaseDate": tx.purchaseDate.timeIntervalSince1970 * 1000,
      "expirationDate": tx.expirationDate.map { $0.timeIntervalSince1970 * 1000 } ?? NSNull(),
    ]
  }

  @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
  private static func serializeType(_ t: Product.ProductType) -> String {
    switch t {
    case .consumable: return "consumable"
    case .nonConsumable: return "nonConsumable"
    case .autoRenewable: return "autoRenewable"
    case .nonRenewable: return "nonRenewing"
    default: return "nonConsumable"
    }
  }

  @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
  private static func serializeUnit(_ u: Product.SubscriptionPeriod.Unit) -> String {
    switch u {
    case .day: return "day"
    case .week: return "week"
    case .month: return "month"
    case .year: return "year"
    @unknown default: return "month"
    }
  }
  #endif
}
