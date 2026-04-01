import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="bg-[#0a0608] text-white antialiased">
        <ClerkProvider ui={ui}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}