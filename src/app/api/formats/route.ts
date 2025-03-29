import { type NextRequest, NextResponse } from 'next/server'

type Format = {
	code: string
	extension: string
	resolution: number
	filesize: string
}

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get('url')

	if (!url || !url.startsWith('http')) {
		return NextResponse.json(
			{ error: 'URL parameter is required' },
			{ status: 400 }
		)
	}

	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL
		const response = await fetch(`${apiUrl}/formats?url=${url}`)
		const data = await response.json()

		const formats = data.formats.map((format: Format) => ({
			id: format.code,
			label: format.extension,
			quality: format.resolution,
			filesize: format.filesize,
		}))

		return NextResponse.json({ formats })
	} catch (error) {
		console.error('Error fetching formats:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch video formats' },
			{ status: 500 }
		)
	}
}
