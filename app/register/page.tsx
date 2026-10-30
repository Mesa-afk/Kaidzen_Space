import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Регистрация — Kaizen Space",
  description: "Создайте аккаунт Kaizen Space.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
