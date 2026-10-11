import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PrivacyX — AI-Assisted Privacy Penetration Testing",
  description:
    "PrivacyX simulates what an attacker could infer from your digital footprint. Continuous personal-data penetration testing with AI/ML analysis, evidence-backed inferences, and privacy regression testing.",
  keywords: ["privacy", "cybersecurity", "penetration testing", "AI", "machine learning", "data privacy"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-px-bg text-px-text antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
