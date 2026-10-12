interface Format {
	code: string
	extension: string
	resolution: string
	filesize: string
}

interface VideoFormatsResponse {
	formats: Format[]
}

interface DownloadResponse {
	message: string
	jobId: string
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

	const data: VideoFormatsResponse = await response.json()
	return data.formats
}

/**
 * Inicia o processo de download de um vídeo
 */
export async function startVideoDownload(
	url: string,
	formatCode: string
): Promise<string> {
	const trimmedUrl = url.trim()
	const apiUrl = process.env.NEXT_PUBLIC_API_URL

	const response = await fetch(
		`${apiUrl}/download-with-code?url=${encodeURIComponent(trimmedUrl)}&code=${formatCode}`
	)

	if (!response.ok) {
		throw new Error('Failed to start download')
	}

	const data: DownloadResponse = await response.json()

	return data.jobId
}

/**
 * Obtém o progresso do download
 */
export async function getDownloadProgress(jobId: string): Promise<number> {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL

	const response = await fetch(
		`${apiUrl}/progress?jobId=${encodeURIComponent(jobId)}`
	)

	if (!response.ok) {
		throw new Error('Failed to get download progress')
	}

	const data = await response.json()

	return data.progress
}

/**
 * Inicia o download do arquivo final
 */
export function downloadFile(jobId: string): void {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL

	const iframe = document.createElement('iframe')
	iframe.style.display = 'none'
	iframe.src = `${apiUrl}/file?jobId=${encodeURIComponent(jobId)}`
	document.body.appendChild(iframe)

	setTimeout(() => {
		document.body.removeChild(iframe)
	}, 2000)
}
