import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters"); // bcrypt input limit

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email("Enter a valid email").max(254),
  password: passwordSchema,
  captchaToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const giveawaySchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(100),
  description: z.string().trim().min(1, "Description is required").max(2000),
  prize: z.string().trim().min(1, "Prize is required").max(200),
  endsAt: z.coerce.date(),
  winnersCount: z.coerce.number().int().min(1).max(50),
});

export const banSchema = z.object({
  banned: z.boolean(),
  reason: z.string().trim().max(300).optional(),
});
