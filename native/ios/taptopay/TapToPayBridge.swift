/**
 * TapToPayBridge.swift
 * Feature: 051-tap-to-pay
 *
 * Expo Module wrapping ProximityReader / `PaymentCardReaderSession`.
 * JS surface mirrors `src/native/taptopay.ts`.
 *
 * Methods:
 *   - isSupported() — PaymentCardReaderSession.isSupported.
 *   - discover() — Instantiates session, returns reader info.
 *   - acceptPayment(opts) — Builds PaymentCardTransactionRequest,
 *     calls readPaymentCard, returns mapped result.
 *
 * NOTE: This is an educational scaffold. The
 * `com.apple.developer.proximity-reader.payment.acceptance`
 * entitlement is Apple-restricted and requires enrollment in the
 * Tap to Pay program. This Swift file demonstrates the API surface
 * and is NOT compiled or linked in this PR. Actual compilation
 * requires entitlement approval from Apple.
 *
 * @available(iOS 16.4, *)
 */

import ExpoModulesCore
#if canImport(ProximityReader)
import ProximityReader
#endif

public class TapToPayBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("TapToPay")

    // MARK: - Capability

    AsyncFunction("isSupported") { () -> Bool in
      #if canImport(ProximityReader)
      if #available(iOS 16.0, *) {
        return PaymentCardReaderSession.isSupported
      }
      #endif
      return false
    }

    // MARK: - Discovery

    AsyncFunction("discover") { () -> Void in
      #if canImport(ProximityReader)
      if #available(iOS 16.4, *) {
        // Educational scaffold: instantiate session to demonstrate API.
        // In a real integration, this session would be kept alive and
        // reused for payment requests. PSP SDKs (Stripe Terminal,
        // Adyen, Square) wrap this lifecycle.
        let _ = try await PaymentCardReaderSession()
        // Discovery succeeded (session initialized)
        return
      }
      #endif
      throw NSError(
        domain: "TapToPayBridge",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "ProximityReader not available"]
      )
    }

    // MARK: - Payment

    AsyncFunction("acceptPayment") { (opts: [String: Any]) -> [String: Any] in
      #if canImport(ProximityReader)
      if #available(iOS 16.4, *) {
        // Parse options
        guard let amountCents = opts["amount"] as? Int,
              let currencyCode = opts["currency"] as? String else {
          return [
            "outcome": "error",
            "errorMessage": "Invalid payment options (amount or currency missing)",
          ]
        }

        // Convert cents to Decimal (minor units)
        let amount = Decimal(amountCents) / 100.0

        // Parse optional line items
        var lineItems: [PaymentCardTransactionRequest.LineItem] = []
        if let lineItemsArray = opts["lineItems"] as? [[String: Any]] {
          for item in lineItemsArray {
            if let label = item["label"] as? String,
               let itemAmountCents = item["amount"] as? Int {
              let itemAmount = Decimal(itemAmountCents) / 100.0
              lineItems.append(
                PaymentCardTransactionRequest.LineItem(
                  label: label,
                  amount: itemAmount
                )
              )
            }
          }
        }

        // Build transaction request
        let request = PaymentCardTransactionRequest(
          amount: amount,
          currencyCode: currencyCode,
          lineItems: lineItems.isEmpty ? nil : lineItems
        )

        // Educational scaffold: call readPaymentCard.
        // In a real integration, the PSP SDK handles this call and
        // communicates with the payment backend for authorization.
        do {
          let session = try await PaymentCardReaderSession()
          let cardData = try await session.readPaymentCard(request)

          // Map result to JS shape
          return [
            "outcome": "success",
            "transactionId": UUID().uuidString, // Mock transaction ID
            "amount": amountCents,
            "currency": currencyCode,
          ]
        } catch {
          // Handle errors (not-entitled, user-cancelled, declined, etc.)
          let errorMessage = error.localizedDescription
          if errorMessage.contains("entitled") || errorMessage.contains("notEntitled") {
            return [
              "outcome": "error",
              "errorMessage": "not-entitled: Entitlement missing or not approved by Apple",
            ]
          } else if errorMessage.contains("cancelled") {
            return [
              "outcome": "error",
              "errorMessage": "User cancelled payment",
            ]
          } else {
            return [
              "outcome": "error",
              "errorMessage": errorMessage,
            ]
          }
        }
      }
      #endif

      return [
        "outcome": "error",
        "errorMessage": "ProximityReader not available (iOS 16.4+ required)",
      ]
    }
  }
}
