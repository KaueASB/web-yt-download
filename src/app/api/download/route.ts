import { type NextRequest, NextResponse } from 'next/server'

// This is a mock API endpoint - replace with your actual implementation
export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get('url')
	const code = request.nextUrl.searchParams.get('code')

	if (!url || !code) {
		return NextResponse.json(
			{ error: 'URL and code parameters are required' },
			{ status: 400 }
		)
	}

	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL

		const response = await fetch(
			`${apiUrl}/download-with-code?url=${encodeURIComponent(url)}&code=${code}`
		)

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`)
		}

		const data = await response.json()
		return NextResponse.json(data)
	} catch (error) {
		console.error('Error starting download:', error)
		return NextResponse.json(
			{ error: 'Failed to start download' },
			{ status: 500 }
		)
	}
}
