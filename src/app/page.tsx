'use client'

import type React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	createProgressMonitor,
	downloadFile,
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
	Download,
	FileDown,
	LinkIcon,
	Loader2,
	X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Format {
	code: string
	filesize: string
	extension: string
	resolution: string
}

export default function VideoDownloader() {
	const [url, setUrl] = useState('')
	const [formats, setFormats] = useState<Format[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
		{}
	)
	const [downloadProgress, setDownloadProgress] = useState<{
		[key: string]: number
	}>({})
	const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({})
	const inputRef = useRef<HTMLInputElement>(null)

	// Mouse follower effect
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
		setError('')

		try {
			const formats = await getVideoFormats(url)
			setFormats(formats)
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
			setDownloading(prev => ({ ...prev, [formatId]: true }))
			setDownloadProgress(prev => ({ ...prev, [formatId]: 0 }))

			// Iniciar o download
			await startVideoDownload(url, formatId)

			// Monitorar o progresso
			const eventSource = createProgressMonitor(url)

			eventSource.onmessage = event => {
				const data = JSON.parse(event.data)
				setDownloadProgress(prev => ({ ...prev, [formatId]: data.progress }))

				// Quando o progresso chegar a 100%, inicia o download real
				if (data.progress === 100) {
					eventSource.close()
					downloadFile(url, formatId)

					setTimeout(() => {
						setDownloading(prev => ({ ...prev, [formatId]: false }))
					}, 2000)
				}
			}

			eventSource.onerror = error => {
				console.error('EventSource failed:', error)
				eventSource.close()
				setDownloading(prev => ({ ...prev, [formatId]: false }))
				setDownloadProgress(prev => ({ ...prev, [formatId]: 0 }))
			}
		} catch (err) {
			console.error('Download error:', err)
			setDownloading(prev => ({ ...prev, [formatId]: false }))
			setDownloadProgress(prev => ({ ...prev, [formatId]: 0 }))
		}
	}

	const clearInput = () => {
		setUrl('')
		setFormats([])
		setError('')
		if (inputRef.current) {
			inputRef.current.focus()
		}
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
									<div className="mb-6 flex items-center justify-between">
										<h2 className="text-sm font-medium text-zinc-300">
											Available formats
										</h2>
										<span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
											{formats.length} options
										</span>
									</div>

									<div className="grid gap-3">
										{formats.map((format, index) => (
											<motion.div
												key={format.code}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.1 + index * 0.05 }}
											>
												<div className="group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-800/20 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800/40">
													<div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-800/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

													<div className="relative flex items-center justify-between p-4">
														<div className="flex items-center gap-4">
															<div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 shadow-inner shadow-black/30 group-hover:text-zinc-200 transition-colors duration-200">
																<FileDown className="h-4 w-4" />
															</div>
															<div>
																<p className="font-medium text-zinc-200 group-hover:text-white transition-colors duration-200">
																	{format.extension}
																</p>
																<p className="text-xs text-zinc-500">
																	{format.resolution}
																</p>
															</div>
														</div>

														<div className="flex items-center gap-2">
															<span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
																{format.filesize}
															</span>

															<div className="flex items-center gap-1">
																{/* <Button
																	size="sm"
																	variant="ghost"
																	className="h-8 rounded-lg border border-zinc-800 bg-zinc-800/50 px-2 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
																	onClick={() => handleCopyUrl(format.code)}
																>
																	{copiedStates[format.code] ? (
																		<Check className="h-3 w-3" />
																	) : (
																		'Copy'
																	)}
																</Button> */}

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
																			<>
																				{downloadProgress[format.code] < 100 ? (
																					<>
																						<Loader2 className="mr-1 h-3 w-3 animate-spin" />
																						{downloadProgress[format.code]}%
																					</>
																				) : (
																					<>
																						<Check className="mr-1 h-3 w-3" />
																						Done
																					</>
																				)}
																			</>
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
												</div>
											</motion.div>
										))}
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
