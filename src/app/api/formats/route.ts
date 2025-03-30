import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get('url')

	if (!url || !url.startsWith('http')) {
		return NextResponse.json(
			{ error: 'URL parameter is required and must start with http' },
			{ status: 400 }
		)
	}

	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL
		const response = await fetch(`${apiUrl}/formats?url=${url}`)

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`)
		}

		const data = await response.json()

		return NextResponse.json(data)
	} catch (error) {
		console.error('Error fetching formats:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch video formats' },
			{ status: 500 }
		)
	}
}
