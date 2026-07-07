"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(email: string, password: string) {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      return { error: "Email veya şifre hatalı" };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email veya şifre hatalı" };
    }
    return { error: "Bir hata oluştu" };
  }
}
