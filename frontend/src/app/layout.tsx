import type { Metadata } from "next";
import "@/styles.css";
export const metadata: Metadata = { title: "AssetFlow | Enterprise Asset Management", description: "Asset, employee handover, depreciation, QR scanning, and audit management." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>; }
