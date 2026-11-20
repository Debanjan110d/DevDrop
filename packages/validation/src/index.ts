import { z, type ZodSchema, type ZodError } from "zod";

// ============================================================
// ValidationError
// ============================================================

export class ValidationError extends Error {
  public readonly issues: ZodError["issues"];

  constructor(error: ZodError) {
    super("Validation failed");
    this.name = "ValidationError";
    this.issues = error.issues;
  }
}

// ============================================================
// validate<T> helper
// ============================================================

/**
 * Parses `data` against `schema`.
 * Returns strongly-typed data on success.
 * Throws {@link ValidationError} on failure.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}

// ============================================================
// Zod schemas
// ============================================================

export const CreateTransferRequestSchema = z.object({
  fileName: z.string().min(1, "fileName is required").max(255),
  mimeType: z.string().min(1, "mimeType is required"),
  fileSize: z.number().int().positive("fileSize must be a positive integer"),
  direction: z.enum(["pc-to-mobile", "mobile-to-pc"]),
  destinationDeviceId: z.string().uuid("destinationDeviceId must be a UUID"),
});

export type CreateTransferRequest = z.infer<typeof CreateTransferRequestSchema>;

// ----

export const PairDeviceRequestSchema = z.object({
  pairingToken: z.string().min(1, "pairingToken is required"),
  deviceName: z.string().min(1, "deviceName is required").max(64),
  platform: z.string().min(1, "platform is required"),
});

export type PairDeviceRequest = z.infer<typeof PairDeviceRequestSchema>;

// ----

export const PairingQRPayloadSchema = z.object({
  version: z.literal(1),
  url: z.string().url("url must be a valid URL"),
  pairingToken: z.string().min(1, "pairingToken is required"),
});

export type PairingQRPayload = z.infer<typeof PairingQRPayloadSchema>;

// ----

export const UpdateDeviceRequestSchema = z
  .object({
    name: z.string().min(1).max(64).optional(),
    status: z.enum(["online", "offline"]).optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.status !== undefined,
    "At least one field (name, status) must be provided"
  );

export type UpdateDeviceRequest = z.infer<typeof UpdateDeviceRequestSchema>;

// ----

export const TransferStatusSchema = z.enum([
  "pending",
  "uploading",
  "available",
  "downloading",
  "completed",
  "failed",
  "cancelled",
  "expired",
]);

export const UpdateTransferRequestSchema = z
  .object({
    status: TransferStatusSchema.optional(),
    bytesTransferred: z
      .number()
      .int()
      .nonnegative("bytesTransferred must be >= 0")
      .optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.bytesTransferred !== undefined,
    "At least one field (status, bytesTransferred) must be provided"
  );

export type UpdateTransferRequest = z.infer<typeof UpdateTransferRequestSchema>;
