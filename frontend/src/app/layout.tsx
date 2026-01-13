/**
 * Root Layout - Pass-through for Next.js App Router
 *
 * IMPORTANT: This layout does NOT include <html> or <body> tags.
 * The [locale]/layout.tsx handles the complete HTML structure with:
 * - Proper font loading (Inter for English, Noto Kufi Arabic for Arabic)
 * - RTL/LTR direction based on locale
 * - i18n provider setup
 *
 * Having HTML tags here would cause:
 * - Nested <html> elements (invalid HTML)
 * - Hydration mismatches between server and client
 * - Font loading conflicts and FOUC (Flash of Unstyled Content)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
