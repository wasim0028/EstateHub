"use client";
// src/components/property/BookVisitButton.tsx
/**
 * BookVisitButton — CLIENT COMPONENT
 *
 * "Book a site visit" token-payment flow. Requires login — an anonymous
 * visitor is sent to /login instead of ever reaching the payment step.
 * Uses Razorpay's Standard Checkout, which surfaces UPI apps (PhonePe,
 * Google Pay, Paytm, etc.) automatically once UPI is enabled on the
 * merchant's Razorpay account — there's no direct PhonePe/GPay SDK for
 * this without going through an aggregator like Razorpay.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createBookingOrder, verifyBookingPayment } from "@/lib/api-client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BookVisitButtonProps {
  propertyId: number;
  propertyTitle: string;
  tokenAmountDisplay?: string; // e.g. "₹500" — purely for the button label
}

type FlowState = "idle" | "loading" | "success" | "error";


const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Loads Razorpay Checkout on demand and resolves once window.Razorpay exists.
 *
 * Previously this used <Script strategy="lazyOnload" onLoad={...}>. That fires
 * onLoad only the first time the tag is inserted, so navigating away and back
 * (or any remount) left `scriptReady` stuck at false forever — the button then
 * always reported "Payment is still loading". Loading it explicitly here also
 * means the SDK is fetched when the user actually intends to pay.
 */
function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (typeof window.Razorpay !== "undefined") return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SRC}"]`
    );

    if (existing) {
      // Tag is present but may still be in flight — wait for it either way.
      existing.addEventListener("load", () => resolve(typeof window.Razorpay !== "undefined"));
      existing.addEventListener("error", () => resolve(false));
      // Already finished loading before we attached listeners
      if (typeof window.Razorpay !== "undefined") resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(typeof window.Razorpay !== "undefined");
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BookVisitButton({
  propertyId,
  propertyTitle,
  tokenAmountDisplay = "₹500",
}: BookVisitButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<FlowState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!user) {
      router.push(`/login?next=/properties`);
      return;
    }
    setError(null);
    setState("loading");

    const ready = await loadRazorpay();
    if (!ready) {
      setState("error");
      setError(
        "Couldn't load the payment gateway. Check your internet connection or any ad blocker, then try again."
      );
      return;
    }

    try {
      const order = await createBookingOrder(propertyId);

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "EstateHub",
        description: `Site visit token — ${propertyTitle}`,
        order_id: order.order_id,
        prefill: order.prefill,
        theme: { color: "#2563eb" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const result = await verifyBookingPayment({
              booking_id: order.booking_id,
              ...response,
            });
            setState(result.verified ? "success" : "error");
            if (!result.verified) {
              setError(result.detail ?? "Payment could not be verified.");
            }
          } catch {
            setState("error");
            setError("Payment succeeded but verification failed. Contact support with your payment ID.");
          }
        },
        modal: {
          ondismiss: () => setState("idle"),
        },
      });

      rzp.on("payment.failed", () => {
        setState("error");
        setError("Payment failed or was cancelled.");
      });

      rzp.open();
    } catch {
      setState("error");
      setError("Couldn't start the payment. Please try again.");
    }
  };

  return (
    <>
      {state === "success" ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          ✓ Visit reserved! We've locked your site-visit token payment of {tokenAmountDisplay}.
          The agent will confirm a time slot with you shortly.
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={handleClick}
            disabled={state === "loading"}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {state === "loading" ? (
              "Opening payment…"
            ) : (
              <>📅 Book site visit — {tokenAmountDisplay} token</>
            )}
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-center">
            Pay via UPI (PhonePe, Google Pay, Paytm), card, or netbanking. Refundable.
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1.5 text-center">{error}</p>
          )}
          {!user && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center">
              You'll need to sign in first.
            </p>
          )}
        </div>
      )}
    </>
  );
}
