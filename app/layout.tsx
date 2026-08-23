import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://adpilot-ai-strategy.chengyilun213.chatgpt.site'),
  title: 'AdPilot · 广告投放智能策略助手',
  description: '从 Campaign Brief 到可执行媒介策略的 AI 工作台',
  openGraph: {
    title: 'AdPilot · 广告投放智能策略助手',
    description: '让每一份 Brief，都更接近增长答案。',
    type: 'website',
    locale: 'zh_CN',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AdPilot 广告投放智能策略助手' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdPilot · 广告投放智能策略助手',
    description: '让每一份 Brief，都更接近增长答案。',
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
