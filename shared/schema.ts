import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(3),
  email: z.string().email(),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]),
  createdAt: z.string(),
  role: z.enum(["user", "admin"]).default("user")
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });

export const templateSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  subject: z.string(),
  bodyPart1: z.string(),
  bodyFooter: z.string(),
  fontFamily: z.string(),
  ccAddress: z.string().optional(),
  bccAddress: z.string().optional(),
  attachmentNames: z.array(z.string()).default([]),
  createdAt: z.string()
});

export const insertTemplateSchema = templateSchema.omit({ id: true, createdAt: true });

export const scheduledEmailSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subject: z.string(),
  bodyPart1: z.string(),
  bodyFooter: z.string(),
  fontFamily: z.string(),
  ccAddress: z.string().optional(),
  bccAddress: z.string().optional(),
  bccCcCount: z.number().default(0),
  bccCcType: z.enum(["BCC", "CC"]).default("BCC"),
  attachmentNames: z.array(z.string()).default([]),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  status: z.enum(["pending", "sent", "failed"]).default("pending"),
  createdAt: z.string()
});

export const insertScheduledEmailSchema = scheduledEmailSchema.omit({ id: true, createdAt: true });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Template = z.infer<typeof templateSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type ScheduledEmail = z.infer<typeof scheduledEmailSchema>;
export type InsertScheduledEmail = z.infer<typeof insertScheduledEmailSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
