import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "USDD — United States Department of Dating",
  description: "Protecting America’s emotional infrastructure since 2026. A fictional government dating portal.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
