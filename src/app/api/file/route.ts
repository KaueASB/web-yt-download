import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get('url')

	if (!url) {
		return NextResponse.json(
			{ error: 'URL parameter is required' },
			{ status: 400 }
		)
	}

	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL
		const fileUrl = `${apiUrl}/file?url=${encodeURIComponent(url)}`

		const response = await fetch(fileUrl, {
			headers: {
				'User-Agent': request.headers.get('User-Agent') || 'Next.js Proxy',
			},
		})

		if (!response.ok) {
			throw new Error(`API returned status ${response.status}`)
		}

		// Ler a resposta como buffer para repassar exatamente como está
		const buffer = await response.arrayBuffer()

		// Extrair cabeçalhos importantes do response original
		const headers = new Headers()

		// Preservar cabeçalhos críticos para download
		const criticalHeaders = [
			'content-type',
			'content-disposition',
			'content-length',
		]
		for (const name of criticalHeaders) {
			const value = response.headers.get(name)
			if (value) headers.set(name, value)
		}

		// Retornar a resposta exatamente como recebida, sem modificar
		return new Response(buffer, {
			status: response.status,
			headers,
		})
	} catch (error) {
		console.error('Error downloading file:', error)
		return NextResponse.json(
			{ error: 'Failed to download file' },
			{ status: 500 }
		)
	}
}
