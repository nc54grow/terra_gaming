import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import PageTransition from "@/components/transition/page-transition";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TerraGaming Command Center",
  description:
    "Manage the TerraGaming ecosystem — authentication, role-based routing, and organization management.",
  openGraph: {
    title: "TerraGaming Command Center",
    description:
      "Manage the TerraGaming ecosystem — authentication, role-based routing, and organization management.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <PageTransition>{children}</PageTransition>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
