import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  const description =
    "Explore Filipino dishes through a classmate-developed cookbook API.";

  return {
    title: "Sarap Atlas | Filipino Cookbook Explorer",
    description,
    openGraph: {
      title: "Sarap Atlas",
      description,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1733,
          height: 909,
          alt: "Sarap Atlas - Filipino Cookbook Explorer",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Sarap Atlas",
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
