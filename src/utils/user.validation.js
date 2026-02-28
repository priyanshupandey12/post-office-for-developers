const { z } = require("zod");

const urlField = z
  .string()
  .transform(val => val.trim())
  .refine(
    (val) => val === '' || /^https?:\/\/.+/.test(val),
    { message: "Invalid URL" }
  )
  .optional();

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),

  bio: z.string().trim().max(500).optional(),

  skills: z
    .array(
      z.string().trim().min(1).max(50)
    )
    .max(20)
    .optional(),

  githubUrl: urlField,
  linkedinUrl: urlField,
  websiteUrl: urlField
});

module.exports = { updateProfileSchema };
