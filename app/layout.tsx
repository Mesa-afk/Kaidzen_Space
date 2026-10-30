import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./opus-design-tokens.css";
import "./opus-base.css";
import "./opus-layout.css";
import "./opus-roadmap-cards.css";
import "./opus-detail.css";
import "./diamond-design.css";
import "./diamond-components.css";
import "./diamond-focus.css";
import "./diamond-animations.css";
import "./diamond-ui-extras.css";
import "./roadmap-ui.css";
import "./responsive-layout.css";
import "@xyflow/react/dist/style.css";
import { ThemeInitializer } from "@/components/theme-initializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaizen Space — маленькие шаги к большим целям",
  description: "Бережное пространство для освоения новых навыков шаг за шагом.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
