import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="bg-px-bg text-px-text antialiased">
        {children}
      </body>
    </html>
  );
}
