import { z } from "zod";

/** Server-side validation for public contact submissions. */
export const leadInputSchema = z
  .object({
    name: z.string().trim().min(2, "name").max(120, "name"),
    phone: z
      .string()
      .trim()
      .max(40, "phone")
      .refine((v) => v === "" || /^[+()\d\s\-.]{7,40}$/.test(v), "phone"),
    email: z
      .string()
      .trim()
      .max(200, "email")
      .refine((v) => v === "" || z.email().safeParse(v).success, "email"),
    projectType: z.string().trim().max(120).default(""),
    message: z.string().trim().max(3000, "message").default(""),
    preferredContact: z.enum(["whatsapp", "phone", "email"]).default("whatsapp"),
    locale: z.enum(["en", "ar"]).default("en"),
    sourcePath: z.string().trim().max(300).default(""),
  })
  .refine((v) => v.phone !== "" || v.email !== "", { message: "contact", path: ["phone"] });

export type LeadInput = z.infer<typeof leadInputSchema>;
