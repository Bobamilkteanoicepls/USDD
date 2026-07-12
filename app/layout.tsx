import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trash Your Ex — U.S. Department of Dating",
  description: "America’s first emotionally responsible waste management service. Sort your past. Clear your future.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
