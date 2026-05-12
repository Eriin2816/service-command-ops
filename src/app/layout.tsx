import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "@/styles/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ServiceOps Command Center",
    template: "%s | ServiceOps",
  },
  description: "GHL-integrated work order and field operations platform",
  manifest: "/manifest.json",
  themeColor: "#06B6D4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ServiceOps",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${sora.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
