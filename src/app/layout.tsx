import type { Metadata } from "next";
import { Outfit, Syncopate } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const syncopate = Syncopate({
  variable: "--font-syncopate",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "00makaa | Portfolio",
  description: "Video Editor, Web Developer & 3D Artist. Ecosistemi digitali su misura tra codice, video e spazio 3D.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="scroll-smooth">
      <body
        className={`${outfit.variable} ${syncopate.variable} antialiased bg-[#0B071E] text-white font-sans overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
