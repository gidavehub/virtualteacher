import type { Metadata } from "next";
import { Inter, Outfit, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vtp.davelabs.co"),
  title: "Virtual Teacher | Rohey — Live AI Classroom",
  description:
    "Real-time stage projection and operator console for Rohey, the AI Virtual Teacher presented at the UNICEF Gambia dinner in support of the Giga school-connectivity initiative. Built by DaveLabs with Kids Edutainment Labs.",
  applicationName: "Virtual Teacher",
  authors: [{ name: "DaveLabs", url: "https://vtp.davelabs.co" }],
  creator: "DaveLabs",
  publisher: "Kids Edutainment Labs",
  keywords: [
    "Virtual Teacher",
    "Rohey",
    "AI avatar",
    "UNICEF Gambia",
    "Giga initiative",
    "school connectivity",
    "DaveLabs",
    "Kids Edutainment Labs",
  ],
  openGraph: {
    type: "website",
    url: "https://vtp.davelabs.co",
    siteName: "Virtual Teacher",
    title: "Virtual Teacher | Rohey — Live AI Classroom",
    description:
      "Rohey, the AI Virtual Teacher for the UNICEF Gambia dinner — live stage projection and operator console in support of the Giga school-connectivity initiative.",
    images: [
      {
        url: "/media/rohey-avatar.jpg",
        width: 2560,
        height: 1428,
        alt: "Rohey, the AI Virtual Teacher, in her Gambian classroom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Teacher | Rohey — Live AI Classroom",
    description:
      "Rohey, the AI Virtual Teacher for the UNICEF Gambia dinner — live stage projection and operator console in support of the Giga school-connectivity initiative.",
    images: ["/media/rohey-avatar.jpg"],
  },
  icons: {
    icon: "/davelabstabicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${caveat.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}


