import { z } from "zod";

const BLOCKED_PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "aol.com",
  "msn.com",
  "gmx.com",
  "mail.com",
  "yandex.com",
  "zoho.com",
]);

const isBlockedPublicEmail = (email: string) => {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return BLOCKED_PUBLIC_EMAIL_DOMAINS.has(domain);
};

const professionalEmailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .refine((email) => !isBlockedPublicEmail(email), {
    message: "Please use your professional email (personal domains are not allowed)",
  });

const maxKeys = <T extends Record<string, unknown>>(value: T, max: number) =>
  Object.keys(value).length <= max;

const answersRecordSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => maxKeys(value, 200), "Too many answer entries");

const intentSchema = z
  .record(z.string(), z.boolean())
  .refine((value) => maxKeys(value, 50), "Too many intent entries");

export const submitResultsSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: professionalEmailSchema,
    currentJobTitle: z.string().trim().min(1).max(120).optional(),
    jobTitle: z.string().trim().min(1).max(120).optional(),
    currentCountry: z.string().trim().min(1).max(120),
    badge: z.enum(["talent", "champion", "leader", "none"]),
    score: z.number().finite().min(0).max(1000).optional(),
    maxScore: z.number().finite().min(1).max(1000).optional(),
    reason: z.string().trim().max(2000).optional(),
    answers: answersRecordSchema.optional(),
    openText: z.string().trim().max(4000).optional(),
    honestyConfirmed: z.boolean().optional(),
    intent: intentSchema,
    rawScore: z.number().finite().min(0).max(1000).optional(),
    adjustedScore: z.number().finite().min(0).max(1000).optional(),
    aiValidation: z
      .record(z.string(), z.unknown())
      .refine((value) => maxKeys(value, 50), "Too many aiValidation entries")
      .optional(),
  })
  .strict();

export const createLeadSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: professionalEmailSchema,
    currentJobTitle: z.string().trim().min(1).max(120).optional(),
    jobTitle: z.string().trim().min(1).max(120).optional(),
    job: z.string().trim().min(1).max(120).optional(),
    currentCountry: z.string().trim().min(1).max(120),
  })
  .strict();

const validateAnswerItemSchema = z
  .object({
    label: z.string().trim().min(1).max(300),
    points: z.number().finite().min(-100).max(100),
    flag: z.string().trim().max(120).optional(),
  })
  .strict();

export const validateResponsesSchema = z
  .object({
    path: z.enum(["A", "B", "C"]),
    entryAnswer: z.string().trim().min(1).max(500),
    answers: z
      .record(z.string(), validateAnswerItemSchema)
      .refine((value) => maxKeys(value, 100), "Too many answers"),
    openText: z.string().trim().min(1).max(4000),
  })
  .strict();
