import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userType: z.enum(["f", "op", "sp"] as const, { message: "Please select your account type" }),
});

export const signUpCompanySchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(1, "Company name is required"),
  language: z.string().default("en"),
});

export const signUpCoolingUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  language: z.string().default("en"),
  coolingUnitId: z.number().optional(),
});

export const passwordRecoverySchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const inviteSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Check-In / Check-Out ─────────────────────────────────────────────────────

export const crateSchema = z.object({
  weight: z.number().positive("Weight must be positive"),
  tag: z.string().optional(),
  grade: z.string().optional(),
  harvestDate: z.string().optional(),
  plannedDays: z.number().int().positive().optional(),
});

export const checkInSchema = z.object({
  farmerId: z.number().int().positive(),
  coolingUnitId: z.number().int().positive(),
  cropId: z.number().int().positive(),
  crates: z.array(crateSchema).min(1, "At least one crate is required"),
  pricingType: z.string().optional(),
  pricePerUnit: z.number().nonnegative().optional(),
});

export const checkOutSchema = z.object({
  produceId: z.number().int().positive(),
  crates: z.array(
    z.object({
      crateId: z.number().int().positive(),
      weight: z.number().positive().optional(),
    })
  ),
});

// ─── Cooling Unit ─────────────────────────────────────────────────────────────

export const coolingUnitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  locationId: z.number().int().positive("Location is required"),
  coolingUnitType: z.string().min(1, "Type is required"),
  capacityInMetricTons: z.number().positive("Capacity must be positive"),
  capacityInNumberCrates: z.number().int().positive("Capacity must be positive"),
  metric: z.string().min(1, "Metric is required"),
  crops: z.array(z.number()).min(1, "Select at least one crop"),
  pricingType: z.string().min(1, "Pricing type is required"),
  pricePerUnit: z.number().nonnegative("Price must be non-negative"),
  currency: z.string().optional(),
  powerOptions: z.array(z.string()).optional(),
  public: z.boolean().optional(),
});

// ─── Location ─────────────────────────────────────────────────────────────────

export const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  state: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  streetNumber: z.number().int().positive().optional(),
  zipCode: z.string().optional(),
});

// ─── Marketplace ──────────────────────────────────────────────────────────────

export const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().nonnegative().optional(),
  expiresAt: z.string().optional(),
});

export const deliveryContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  address: z.string().optional(),
});

// ─── Account ──────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7, "Valid phone number is required"),
  gender: z.string().optional(),
  language: z.string().optional(),
});

export const bankAccountSchema = z.object({
  accountType: z.enum(["1", "2"]),
  bankCode: z.string().min(1, "Bank is required"),
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  accountName: z.string().min(1, "Account name is required"),
});

// ─── Market Survey ────────────────────────────────────────────────────────────

export const marketSurveySchema = z.object({
  price: z.number().positive("Price must be positive"),
  crop: z.number().int().positive(),
  farmerId: z.number().int().positive(),
});

// Type exports
export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpCompanyFormValues = z.infer<typeof signUpCompanySchema>;
export type SignUpCoolingUserFormValues = z.infer<typeof signUpCoolingUserSchema>;
export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>;
export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;
export type CheckInFormValues = z.infer<typeof checkInSchema>;
export type CheckOutFormValues = z.infer<typeof checkOutSchema>;
export type CoolingUnitFormValues = z.infer<typeof coolingUnitSchema>;
export type LocationFormValues = z.infer<typeof locationSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;
