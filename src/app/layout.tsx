import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Inter, Special_Elite } from "next/font/google";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300"],
});

// Vintage typewriter face, used only for the music page's Now Playing
// label — meant to read like text stamped on an old record sleeve.
const specialElite = Special_Elite({
  variable: "--font-typewriter",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Ameer Al-Butaihi",
  description: "Personal site — Matrix and Human.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${inter.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          First-visit intro redirect — ported from legacy/index.html's inline
          head script. beforeInteractive runs before hydration/paint, same as
          the original's synchronous <head> script, avoiding a landing-page
          flash. Scoped to "/" via a runtime pathname check since
          beforeInteractive scripts must live in the root layout.
        */}
        <Script id="intro-redirect" strategy="beforeInteractive">
          {`(function () {
            if (window.location.pathname !== "/") return;
            var seen = false;
            try { seen = !!localStorage.getItem("seen_intro"); } catch (e) {}
            if (!seen) {
              try { localStorage.setItem("seen_intro", "1"); } catch (e) {}
              location.replace("/intro");
            }
          })();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
