import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sezora - Student & Employer Platform",
  description: "A platform for students and employers to connect through job opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}