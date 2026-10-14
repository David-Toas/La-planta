import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { MobileDock } from "@/components/mobile-dock";
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

export const viewport: Viewport = {
  themeColor: "#040505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "LA PLANTA PRIME - Luxury Car Hire & Executive Chauffeur Services",
  description:
    "First-class executive sedans, luxury SUVs, and armored vehicles with vetted professional drivers across Lagos, Abuja and nationwide Nigeria.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "La Planta Prime",
  },
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
        <AuthProvider>
          <div className="pb-16 lg:pb-0 min-h-screen flex flex-col">
            {children}
          </div>
          <MobileDock />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
