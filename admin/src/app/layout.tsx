import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { AdminAuthProvider } from "@/context/admin-auth-context";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LA PLANTA PRIME • Admin Command Center & Dispatch Cockpit",
  description:
    "Executive fleet operations, live telematics corridor tracking, VIP client tier management, and digital handover inspection console.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakarta.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="font-sans bg-surface text-on-surface antialiased min-h-screen">
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </body>
    </html>
  );
}

