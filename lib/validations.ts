import { z } from "zod";

const emailField = z.string().email({ message: "Enter a valid email address" });
const passwordField = z.string().min(8, { message: "Password must be at least 8 characters" });

export const signInSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: emailField,
  password: passwordField,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
