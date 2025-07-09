import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dob: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Invalid date format",
  }).refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 18;
  }, "You must be at least 18 years old"),
  gender: z.enum(['male', 'female'], {
    required_error: 'Please select your gender',
  }),
  region: z.enum(['africa', 'asia', 'europe', 'north_america', 'south_america', 'oceania'], {
    required_error: 'Please select your region',
  }),
  culturalContext: z.enum(['global', 'african']).default('global'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;