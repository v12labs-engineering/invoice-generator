import { z } from "zod";

export const CategoryInput = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CategoryInput = z.infer<typeof CategoryInput>;
