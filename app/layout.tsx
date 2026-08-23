import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://adpilot-ai-strategy.chengyilun213.chatgpt.site'),
  title: 'AdPilot · 广告投放智能策略助手',
  description: '连接真实案例库，从 Campaign Brief 生成可追溯、可编辑、可导出的媒介策略',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'AdPilot · 广告投放智能策略助手',
    description: '让策略有出处，让判断有依据。',
    type: 'website',
    locale: 'zh_CN',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AdPilot 广告投放智能策略助手' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdPilot · 广告投放智能策略助手',
    description: '让策略有出处，让判断有依据。',
    images: ['/og.png'],
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
