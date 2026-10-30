import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/authContext";
import { EventConfigProvider } from "../lib/eventConfigContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iglesia Nueva Apostólica (INA) — Comunidad, Membresía, Asistencia y Eventos",
  description:
    "Plataforma integral de la Iglesia Nueva Apostólica (INA): Información institucional, Sedes, Grupos, Ministerios, Membresía, Asistencia por Reuniones y Gestión de Eventos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AuthProvider>
          <EventConfigProvider>{children}</EventConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
