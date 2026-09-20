// Safe, explicitly classified API failures for payment creation recovery.
export class PaymentRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly phase: "key" | "claim" | "replay" | "finalize",
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "PaymentRequestError";
  }
}
