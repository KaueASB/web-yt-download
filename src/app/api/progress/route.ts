import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get('url')

	if (!url) {
		return NextResponse.json(
			{ error: 'URL parameter is required' },
			{ status: 400 }
		)
	}

	// Aqui estabelecemos uma resposta de Server-Sent Events (SSE)
	const responseStream = new TransformStream()
	const writer = responseStream.writable.getWriter()
	const encoder = new TextEncoder()

	// Função para enviar dados por SSE
	const sendProgress = async (progress: number) => {
		const data = JSON.stringify({ progress })
		await writer.write(encoder.encode(`data: ${data}\n\n`))
	}

	// Iniciamos um processo assíncrono para verificar o progresso
	const checkProgress = async () => {
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL

			// Simula polling para o progresso
			let progress = 0
			while (progress < 100) {
				// Em produção, você faria uma requisição real para o backend
				// const response = await fetch(`${apiUrl}/progress?url=${encodeURIComponent(url)}`)
				// const data = await response.json()
				// progress = data.progress

				// Para teste, vamos simular o progresso aumentando gradualmente
				progress += Math.floor(Math.random() * 10) + 1
				progress = Math.min(progress, 100)

				await sendProgress(progress)

				// Aguarda um pouco antes de verificar novamente
				await new Promise(resolve => setTimeout(resolve, 500))
			}

			// Fecha o writer quando o download estiver completo
			await writer.close()
		} catch (error) {
			console.error('Error checking progress:', error)
			// Em caso de erro, também enviamos uma mensagem final e fechamos
			await sendProgress(-1) // Usamos -1 para indicar erro
			await writer.close()
		}
	}

	// Inicia o processo de verificação sem aguardar (para não bloquear a resposta)
	checkProgress().catch(console.error)

	return new Response(responseStream.readable, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	})
}
