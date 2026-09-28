import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mokafee.com"),
  title: "INFJ漫游飞船",
  description: "认知运行地图、卡点梳理、自由探索与群星会客厅。带上你的困惑，开启一段向内觉察的漫游。",
  openGraph: {
    title: "INFJ 认知操作系统｜把内耗转化为现实行动",
    description: "别急着想明白。先看看，你现在是怎么运行的。",
    url: "https://mokafee.com",
    siteName: "Mokafee · Cognitive OS",
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "INFJ 认知操作系统" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "INFJ 认知操作系统",
    description: "别急着想明白。先看看，你现在是怎么运行的。",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
