interface Format {
	code: string
	extension: string
	resolution: string
	filesize: string
}

interface VideoFormatsResponse {
	formats: Format[]
}

/**
 * Busca os formatos disponíveis para o vídeo
 */
export async function getVideoFormats(url: string): Promise<Format[]> {
	const trimmedUrl = url.trim()
	const apiUrl = process.env.NEXT_PUBLIC_API_URL

	const response = await fetch(
		`${apiUrl}/formats?url=${encodeURIComponent(trimmedUrl)}`
	)

	if (!response.ok) {
		throw new Error('Failed to fetch video formats')
	}

	const data = await response.json()
	return data.formats satisfies VideoFormatsResponse
}

/**
 * Inicia o processo de download de um vídeo
 */
export async function startVideoDownload(
	url: string,
	formatCode: string
): Promise<void> {
	const trimmedUrl = url.trim()
	const apiUrl = process.env.NEXT_PUBLIC_API_URL

	const response = await fetch(
		`${apiUrl}/download-with-code?url=${encodeURIComponent(trimmedUrl)}&code=${formatCode}`
	)

	if (!response.ok) {
		throw new Error('Failed to start download')
	}
}

/**
 * Cria um EventSource para monitorar o progresso do download
 */
export function createProgressMonitor(url: string): EventSource {
	const trimmedUrl = url.trim()
	const apiUrl = process.env.NEXT_PUBLIC_API_URL
	return new EventSource(
		`${apiUrl}/progress?url=${encodeURIComponent(trimmedUrl)}`
	)
}

/**
 * Inicia o download do arquivo final
 */
export function downloadFile(url: string): void {
	const trimmedUrl = url.trim()
	const apiUrl = process.env.NEXT_PUBLIC_API_URL

	const iframe = document.createElement('iframe')
	iframe.style.display = 'none'
	iframe.src = `${apiUrl}/file?url=${encodeURIComponent(trimmedUrl)}`
	document.body.appendChild(iframe)

	setTimeout(() => {
		document.body.removeChild(iframe)
	}, 2000)
}
