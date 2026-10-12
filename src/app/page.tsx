'use client'

import type React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	type Format,
	downloadFile,
	getDownloadProgress,
	getVideoFormats,
	startVideoDownload,
} from '@/services/videoService'
import {
	AnimatePresence,
	motion,
	useMotionValue,
	useSpring,
	useTransform,
} from 'framer-motion'
import {
	ArrowRight,
	Check,
	ChevronDown,
	Download,
	Info,
	LinkIcon,
	Loader2,
	type LucideIcon,
	Music,
	Sparkles,
	Video,
	X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const isAudioOnly = (format: Format) => format.resolution === 'audio only'

// Altura do vídeo a partir de "1920x1080" (0 se não for possível ler)
const getHeight = (format: Format) =>
	Number(format.resolution.split('x')[1]) || 0

// Nome de exibição dos codecs que a API devolve
const CODEC_LABELS: { [codec: string]: string } = {
	h264: 'H.264',
	h265: 'H.265',
	vp8: 'VP8',
	vp9: 'VP9',
	av1: 'AV1',
	aac: 'AAC',
	opus: 'Opus',
	mp3: 'MP3',
	vorbis: 'Vorbis',
	ac3: 'AC-3',
	eac3: 'E-AC-3',
}

const codecLabel = (codec?: string) =>
	codec ? (CODEC_LABELS[codec] ?? codec.toUpperCase()) : null

// Tamanho em bytes a partir de "179.73MiB" (Infinity se não for possível ler)
const UNITS: { [unit: string]: number } = {
	B: 1,
	KiB: 1024,
	MiB: 1024 ** 2,
	GiB: 1024 ** 3,
}

const getSize = (format: Format) => {
	const match = format.filesize.match(/^~?([\d.]+)\s*([KMG]?i?B)$/)
	if (!match) return Number.POSITIVE_INFINITY
	return Number(match[1]) * (UNITS[match[2]] ?? 1)
}

// Uma linha por qualidade: o formato principal e as variações (outros
// formatos/codecs da mesma resolução)
interface FormatRow {
	main: Format
	alternatives: Format[]
}

const groupByQuality = (formats: Format[]): FormatRow[] => {
	const groups = new Map<string, Format[]>()

	for (const format of formats) {
		const key = `${getHeight(format)}-${format.fps ?? 0}`
		groups.set(key, [...(groups.get(key) ?? []), format])
	}

	return [...groups.values()]
		.map(group => {
			// A opção principal é a mais compatível (H.264); entre iguais, o menor
			// arquivo. AV1/VP9 ficam nas variações: menores, mas não tocam em
			// aparelhos mais antigos
			const [main, ...alternatives] = [...group].sort(
				(a, b) =>
					Number(b.vcodec === 'h264') - Number(a.vcodec === 'h264') ||
					getSize(a) - getSize(b)
			)
			return { main, alternatives }
		})
		.sort(
			(a, b) =>
				getHeight(b.main) - getHeight(a.main) ||
				(b.main.fps ?? 0) - (a.main.fps ?? 0)
		)
}

export default function VideoDownloader() {
	const [url, setUrl] = useState('')
	const [formats, setFormats] = useState<Format[]>([])
	const [video, setVideo] = useState<{
		title: string | null
		thumbnail: string | null
	} | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [downloadProgress, setDownloadProgress] = useState<{
		[key: string]: number
	}>({})
	const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({})
	const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({})
	const inputRef = useRef<HTMLInputElement>(null)

	const mouseX = useMotionValue(0)
	const mouseY = useMotionValue(0)
	const springConfig = { damping: 50, stiffness: 500 }
	const springX = useSpring(mouseX, springConfig)
	const springY = useSpring(mouseY, springConfig)

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			mouseX.set(e.clientX)
			mouseY.set(e.clientY)
		}

		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [mouseX, mouseY])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!url) return

		setLoading(true)
		setFormats([])
		setVideo(null)
		setExpanded({})
		setError('')

		try {
			const { title, thumbnail, formats } = await getVideoFormats(url)
			setFormats(formats)
			setVideo({ title, thumbnail })
		} catch (err) {
			setError(
				'Failed to get video formats. Please check the URL and try again.'
			)
			console.error(err)
		} finally {
			setLoading(false)
		}
	}

	const handleDownload = async (formatId: string) => {
		if (downloading[formatId]) return

		try {
			setError('')
			setDownloading(prev => ({ ...prev, [formatId]: true }))
			setDownloadProgress(prev => ({ ...prev, [formatId]: 0 }))

			const jobId = await startVideoDownload(url, formatId)

			const interval = setInterval(async () => {
				try {
					const progress = await getDownloadProgress(jobId)

					setDownloadProgress(prev => ({
						...prev,
						[formatId]: progress,
					}))

					if (progress >= 100) {
						clearInterval(interval)

						downloadFile(jobId)

						setTimeout(() => {
							setDownloading(prev => ({
								...prev,
								[formatId]: false,
							}))
						}, 2000)
					}
				} catch (error) {
					console.error('Progress check failed:', error)
					clearInterval(interval)
					setError(error instanceof Error ? error.message : 'Download failed')

					setDownloading(prev => ({
						...prev,
						[formatId]: false,
					}))

					setDownloadProgress(prev => ({
						...prev,
						[formatId]: 0,
					}))
				}
			}, 2000)
		} catch (err) {
			console.error('Download error:', err)
			setError(err instanceof Error ? err.message : 'Failed to start download')

			setDownloading(prev => ({
				...prev,
				[formatId]: false,
			}))

			setDownloadProgress(prev => ({
				...prev,
				[formatId]: 0,
			}))
		}
	}

	const clearInput = () => {
		setUrl('')
		setFormats([])
		setVideo(null)
		setError('')
		if (inputRef.current) {
			inputRef.current.focus()
		}
	}

	// Separa os formatos em blocos: vídeo (uma linha por qualidade, maior
	// primeiro) e só áudio
	const formatGroups: {
		title: string
		icon: LucideIcon
		rows: FormatRow[]
		note?: string
	}[] = [
		{
			title: 'Video',
			icon: Video,
			// Só avisa quando há codecs mais novos nas variações
			note: formats.some(format => format.vcodec && format.vcodec !== 'h264')
				? 'H.264 plays everywhere. AV1 and VP9 files are smaller, but may not play on older phones, TVs and editors.'
				: undefined,
			rows: groupByQuality(formats.filter(format => !isAudioOnly(format))),
		},
		{
			title: 'Audio only',
			icon: Music,
			rows: formats
				.filter(isAudioOnly)
				.map(format => ({ main: format, alternatives: [] })),
		},
	]

	// Opções recomendadas: a principal da maior qualidade de vídeo e o áudio de
	// maior bitrate (sem bitrate, o maior arquivo)
	const recommended = new Set(
		[
			formatGroups[0].rows[0]?.main,
			formatGroups[1].rows
				.map(row => row.main)
				.sort(
					(a, b) => (b.abr ?? 0) - (a.abr ?? 0) || getSize(b) - getSize(a)
				)[0],
		]
			.filter(Boolean)
			.map(format => format?.code)
	)

	const renderFormat = (
		format: Format,
		Icon: LucideIcon,
		toggle?: React.ReactNode
	) => {
		const audio = isAudioOnly(format)
		const height = getHeight(format)
		const isRecommended = recommended.has(format.code)

		return (
			<div
				className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800/40 ${isRecommended ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-800/80 bg-zinc-800/20'}`}
			>
				<div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-800/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

				<div className="relative flex items-center justify-between gap-3 p-3 pl-4">
					<div className="flex min-w-0 items-center gap-4">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 shadow-inner shadow-black/30 group-hover:text-zinc-200 transition-colors duration-200">
							<Icon className="h-4 w-4" />
						</div>
						<div className="min-w-0">
							<p className="flex items-center gap-2 font-medium text-zinc-200 group-hover:text-white transition-colors duration-200">
								{audio
									? format.abr
										? `${format.abr} kbps`
										: format.extension.toUpperCase()
									: height
										? `${height}p`
										: format.extension.toUpperCase()}
								{!audio && format.fps && format.fps > 30 && (
									<span className="rounded bg-zinc-800 px-1.5 py-px text-[10px] font-normal text-zinc-400">
										{format.fps}fps
									</span>
								)}
								{isRecommended && (
									<span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-px text-[10px] font-normal text-emerald-400">
										<Sparkles className="h-2.5 w-2.5" />
										Recommended
									</span>
								)}
							</p>
							<p className="truncate text-xs text-zinc-500">
								{[
									format.extension.toUpperCase(),
									codecLabel(audio ? format.acodec : format.vcodec),
									!audio && format.resolution,
								]
									.filter(Boolean)
									.join(' · ')}
							</p>
						</div>
					</div>

					<div className="flex shrink-0 items-center gap-2">
						{toggle}
						<span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
							{format.filesize}
						</span>

						<Button
							size="sm"
							className="h-8 rounded-lg bg-zinc-100 px-3 text-xs text-zinc-900 hover:bg-zinc-200 cursor-pointer relative overflow-hidden disabled:opacity-70"
							onClick={() => handleDownload(format.code)}
							disabled={downloading[format.code]}
						>
							{/* Barra de progresso - Usando style inline para sobrescrever a opacidade */}
							{downloading[format.code] && (
								<div
									className="absolute left-0 top-0 bottom-0 bg-green-400 transition-all duration-300 ease-out"
									style={{
										width: `${downloadProgress[format.code] || 0}%`,
										zIndex: 0,
										opacity: 1,
									}}
								/>
							)}

							<span className="relative z-10 flex items-center justify-center">
								{downloading[format.code] ? (
									downloadProgress[format.code] < 100 ? (
										<>
											<Loader2 className="mr-1 h-3 w-3 animate-spin" />
											{downloadProgress[format.code]}%
										</>
									) : (
										<>
											<Check className="mr-1 h-3 w-3" />
											Done
										</>
									)
								) : (
									<>
										<Download className="mr-1 h-3 w-3" />
										Download
									</>
								)}
							</span>
						</Button>
					</div>
				</div>
			</div>
		)
	}

	// const handleCopyUrl = (formatId: string) => {
	// 	const trimmedUrl = url.trim()
	// 	const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/download?url=${encodeURIComponent(trimmedUrl)}&format=${formatId}`
	// 	navigator.clipboard.writeText(downloadUrl)
	// 	setCopiedStates(prev => ({ ...prev, [formatId]: true }))
	// 	setTimeout(() => {
	// 		setCopiedStates(prev => ({ ...prev, [formatId]: false }))
	// 	}, 2000)
	// }

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white overflow-hidden">
			{/* Gradient background */}
			<div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)]" />
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(50,50,50,0.15),transparent_65%)]" />

			{/* Animated gradient blob */}
			<motion.div
				className="absolute -z-10 h-56 w-56 rounded-full bg-gradient-to-br from-zinc-800/20 to-zinc-900/20 blur-3xl"
				style={{
					x: useTransform(springX, val => val - 200),
					y: useTransform(springY, val => val - 200),
				}}
			/>

			<div className="relative w-full max-w-3xl px-4 py-12">
				<div className="mb-12 text-center">
					<motion.h1
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="text-5xl font-bold tracking-tight text-white"
					>
						Video{' '}
						<span className="bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
							Downloader
						</span>
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="mt-3 text-zinc-400"
					>
						Download videos in your preferred format with a modern interface
					</motion.p>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl"
				>
					<div className="p-6 md:p-8">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="relative">
								<div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-zinc-700/20 via-zinc-600/20 to-zinc-700/20 opacity-50 blur-sm group-hover:opacity-75 transition duration-500" />

								<div className="group relative flex items-center overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 focus-within:border-zinc-700/80 hover:border-zinc-700/80">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
										<LinkIcon className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-400" />
									</div>
									<Input
										ref={inputRef}
										type="text"
										placeholder="Paste video URL here..."
										value={url}
										onChange={e => setUrl(e.target.value)}
										className="h-14 flex-1 border-0 bg-transparent pl-12 pr-12 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
									/>
									{url && (
										<button
											type="button"
											onClick={clearInput}
											className="absolute right-4 rounded-full p-1 text-zinc-500 hover:bg-zinc-700/50 hover:text-zinc-300"
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</div>
							</div>

							<div className="flex items-center gap-4">
								<Button
									type="submit"
									className="relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 text-zinc-900 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
									disabled={loading || !url}
								>
									<span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />
									<span className="relative z-10 flex items-center justify-center gap-2 text-base font-medium">
										{loading ? (
											<>
												<Loader2 className="h-5 w-5 animate-spin" />
												<span>Processing...</span>
											</>
										) : (
											<>
												<span>Get Download Options</span>
												<ArrowRight className="h-5 w-5" />
											</>
										)}
									</span>
								</Button>
							</div>
						</form>

						<AnimatePresence>
							{error && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									className="mt-6 rounded-xl border border-red-900/30 bg-red-950/10 p-4 text-red-200 backdrop-blur-sm"
								>
									<p className="text-sm">{error}</p>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<AnimatePresence>
						{formats.length > 0 && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.3 }}
							>
								<div className="border-t border-zinc-800/50 bg-zinc-900/50 p-6 md:p-8">
									{(video?.title || video?.thumbnail) && (
										<div className="mb-8 flex items-center gap-4">
											{video.thumbnail && (
												<img
													src={video.thumbnail}
													alt=""
													className="aspect-video w-32 shrink-0 rounded-lg border border-zinc-800/80 bg-zinc-800 object-cover"
												/>
											)}
											{video.title && (
												<p className="line-clamp-2 font-medium text-zinc-100">
													{video.title}
												</p>
											)}
										</div>
									)}

									<div className="mb-6 flex items-center justify-between">
										<h2 className="text-sm font-medium text-zinc-300">
											Available formats
										</h2>
										<span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
											{formats.length} options
										</span>
									</div>

									<div className="space-y-8">
										{formatGroups.map(
											group =>
												group.rows.length > 0 && (
													<section key={group.title}>
														<div className="mb-3 flex items-center gap-2">
															<group.icon className="h-4 w-4 text-zinc-500" />
															<h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
																{group.title}
															</h3>
															<span className="text-xs text-zinc-600">
																{group.rows.length}
															</span>
															<div className="ml-2 h-px flex-1 bg-zinc-800/80" />
														</div>

														{group.note && (
															<p className="mb-3 flex items-start gap-1.5 text-xs text-zinc-500">
																<Info className="mt-px h-3.5 w-3.5 shrink-0" />
																{group.note}
															</p>
														)}

														<div className="grid gap-2">
															{group.rows.map(
																({ main, alternatives }, index) => {
																	const isExpanded = expanded[main.code]

																	const toggle = alternatives.length > 0 && (
																		<button
																			type="button"
																			onClick={() =>
																				setExpanded(prev => ({
																					...prev,
																					[main.code]: !prev[main.code],
																				}))
																			}
																			aria-expanded={isExpanded}
																			className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer transition-colors"
																		>
																			+{alternatives.length}
																			<ChevronDown
																				className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
																			/>
																		</button>
																	)

																	return (
																		<motion.div
																			key={main.code}
																			initial={{ opacity: 0, y: 10 }}
																			animate={{ opacity: 1, y: 0 }}
																			transition={{ delay: 0.1 + index * 0.03 }}
																		>
																			{renderFormat(main, group.icon, toggle)}

																			<AnimatePresence initial={false}>
																				{isExpanded && (
																					<motion.div
																						initial={{ opacity: 0, height: 0 }}
																						animate={{
																							opacity: 1,
																							height: 'auto',
																						}}
																						exit={{ opacity: 0, height: 0 }}
																						transition={{ duration: 0.2 }}
																						className="overflow-hidden"
																					>
																						<div className="ml-5 mt-2 grid gap-2 border-l border-zinc-800 pl-3">
																							{alternatives.map(format => (
																								<div key={format.code}>
																									{renderFormat(
																										format,
																										group.icon
																									)}
																								</div>
																							))}
																						</div>
																					</motion.div>
																				)}
																			</AnimatePresence>
																		</motion.div>
																	)
																}
															)}
														</div>
													</section>
												)
										)}
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="mt-6 text-center text-xs text-zinc-600"
				>
					Enter a video URL to see available download formats
				</motion.div>
			</div>
		</div>
	)
}
