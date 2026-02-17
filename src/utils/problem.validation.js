const { z } = require("zod");
const { CATEGORIES, SEVERITY, FREQUENCY, USERS_AFFECTED } = require("../constants/problem.constant.js");

const createProblemSchema = z.object({
  title: z.string().min(20, "Title too short").max(100),

  category: z.enum(CATEGORIES),

  otherCategoryDescription: z.string().max(100).optional(),

  affectedAudience: z.array(z.enum(USERS_AFFECTED)).min(1, "Select at least one group"),

  description: z.string().min(50, "Description too short").max(500),

  painLevel: z.enum(SEVERITY),

  frequency: z.enum(FREQUENCY),

  hasExistingSolutions: z.boolean(),

  existingSolutionsDescription: z.string().max(300).optional(),

  desiredOutcome: z.string().min(20).max(300),

  deadline: z.string().or(z.date())
});

module.exports = { createProblemSchema };