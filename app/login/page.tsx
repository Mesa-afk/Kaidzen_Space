import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Вход — Kaizen Space",
  description: "Войдите в свой аккаунт Kaizen Space.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
