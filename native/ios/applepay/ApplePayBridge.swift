/**
 * ApplePayBridge.swift
 * Feature: 049-apple-pay
 *
 * Expo Module wrapping `PKPaymentAuthorizationController`. JS
 * surface mirrors `src/native/applepay.ts`.
 *
 * Methods:
 *   - canMakePayments — `PKPaymentAuthorizationController.canMakePayments()`.
 *   - canMakePaymentsUsingNetworks(networks) — gated form.
 *   - presentPaymentRequest(opts) — composes a `PKPaymentRequest`,
 *     drives the controller, and resolves with a
 *     `PaymentResult` once authorization completes.
 *
 * NOTE: This is an educational scaffold. The token returned in
 * the success path is a mock shape (`paymentDataBase64`); real
 * charges require a live Merchant ID and a payment processor
 * (Stripe, Square, Adyen, …).
 */

import ExpoModulesCore
#if canImport(PassKit)
import PassKit
#endif

public class ApplePayBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("ApplePayBridge")

    Function("canMakePayments") { () -> Bool in
      #if canImport(PassKit)
      return PKPaymentAuthorizationController.canMakePayments()
      #else
      return false
      #endif
    }

    Function("canMakePaymentsUsingNetworks") { (networks: [String]) -> Bool in
      #if canImport(PassKit)
      let mapped: [PKPaymentNetwork] = networks.compactMap(Self.mapNetwork)
      return PKPaymentAuthorizationController.canMakePayments(usingNetworks: mapped)
      #else
      return false
      #endif
    }

    AsyncFunction("presentPaymentRequest") { (opts: [String: Any]) -> [String: Any] in
      #if canImport(PassKit)
      // Build a PKPaymentRequest from `opts`. The actual sheet
      // presentation + delegate plumbing is intentionally elided
      // here — see specs/049-apple-pay/research.md §R-E. The
      // educational return shape mirrors `PKPayment.token`
      // enough to demonstrate the data flow without performing
      // a real charge.
      let merchantId = (opts["merchantIdentifier"] as? String) ?? ""
      let networks = (opts["supportedNetworks"] as? [String]) ?? []
      let mapped: [PKPaymentNetwork] = networks.compactMap(Self.mapNetwork)

      let request = PKPaymentRequest()
      request.merchantIdentifier = merchantId
      request.countryCode = (opts["countryCode"] as? String) ?? "US"
      request.currencyCode = (opts["currencyCode"] as? String) ?? "USD"
      request.supportedNetworks = mapped
      request.merchantCapabilities = .threeDSecure

      // Mock success result — real integration would forward
      // `payment.token.paymentData` to the processor SDK.
      return [
        "status": "success",
        "token": [
          "transactionIdentifier": UUID().uuidString,
          "paymentNetwork": networks.first ?? "Visa",
          "paymentDataBase64": "MOCK-PAYMENT-DATA",
        ],
        "errorMessage": NSNull(),
      ]
      #else
      throw NSError(domain: "ApplePayBridge", code: -1)
      #endif
    }
  }

  #if canImport(PassKit)
  private static func mapNetwork(_ raw: String) -> PKPaymentNetwork? {
    switch raw {
    case "Visa": return .visa
    case "MasterCard": return .masterCard
    case "AmEx": return .amex
    case "Discover": return .discover
    case "ChinaUnionPay": return .chinaUnionPay
    default: return nil
    }
  }
  #endif
}
