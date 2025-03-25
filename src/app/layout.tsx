import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import type React from 'react'
import './globals.css'

export const metadata: Metadata = {
	title: 'Video Downloader',
	description:
		'Download videos in your preferred format with a modern interface',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className="dark">
			<body className={GeistSans.className}>{children}</body>
		</html>
	)
}
