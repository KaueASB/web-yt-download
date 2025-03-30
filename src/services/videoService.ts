/**
 * Serviço para gerenciar operações relacionadas a vídeos
 */

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
	const response = await fetch(
		`/api/formats?url=${encodeURIComponent(trimmedUrl)}`
	)

	if (!response.ok) {
		throw new Error('Failed to fetch video formats')
	}

	const data = (await response.json()) as VideoFormatsResponse
	return data.formats
}

/**
 * Inicia o processo de download de um vídeo
 */
export async function startVideoDownload(
	url: string,
	formatCode: string
): Promise<void> {
	const trimmedUrl = url.trim()
	const response = await fetch(
		`/api/download?url=${encodeURIComponent(trimmedUrl)}&code=${formatCode}`
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
	return new EventSource(`/api/progress?url=${encodeURIComponent(trimmedUrl)}`)
}

/**
 * Inicia o download do arquivo final
 */
export function downloadFile(url: string, formatCode: string): void {
	const trimmedUrl = url.trim()

	const iframe = document.createElement('iframe')
	iframe.style.display = 'none'
	iframe.src = `/api/file?url=${encodeURIComponent(trimmedUrl)}`
	document.body.appendChild(iframe)

	setTimeout(() => {
		document.body.removeChild(iframe)
	}, 2000)
}
