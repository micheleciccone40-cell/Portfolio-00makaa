import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Michele Ciccone — Video Editor & Web Developer",
  description:
    "Studio indipendente di Michele Ciccone (00makaa). Video editing e storytelling per YouTube, sviluppo web con Next.js e GSAP, 3D in produzione.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="scroll-smooth">
      <body
        className={`${archivo.variable} ${plexMono.variable} antialiased bg-paper text-ink font-sans overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
