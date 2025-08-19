import { Inter } from 'next/font/google'
import '../index.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <script
                    defer
                    src="https://assets.lemonsqueezy.com/lemon.js"
                ></script>
            </head>
            <body className={inter.className}>{children}</body>
        </html>
    )
}
