"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Camera, RefreshCw, Upload } from "lucide-react"

type Phase = "idle" | "zooming" | "counting" | "done"

const DEFAULT_DRESS = "/caramel-dress.jpg?v=3"

export function ThreadCounter() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [count, setCount] = useState<number>(0)
  const [targetCount, setTargetCount] = useState<number>(20646)
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_DRESS)
  const [isZoomedIn, setIsZoomedIn] = useState<boolean>(false)
  const [cameraActive, setCameraActive] = useState<boolean>(false)
  const [cameraNotice, setCameraNotice] = useState<string>(
    "Camera unavailable. Please allow access or upload an image instead."
  )

  // Fabric dimensions
  const [widthCm] = useState<number>(30)
  const [lengthCm] = useState<number>(40)
  const [threadsPerCm] = useState<number>(50)

  // Calculated predicted count: (30 + 40) * 50 = 3,500
  const predictedCount = Math.max(0, (widthCm + lengthCm) * threadsPerCm)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Smooth count animation
  const animateCountUp = useCallback((target: number, duration: number = 2000) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const startTime = performance.now()
    const startVal = 0

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(startVal + (target - startVal) * ease)
      setCount(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(updateCount)
      } else {
        setCount(target)
        setPhase("done")
      }
    }

    rafRef.current = requestAnimationFrame(updateCount)
  }, [])

  // Reset to default starting dress and 0 threads
  const handleReset = () => {
    if (cameraActive) stopCamera()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPhase("idle")
    setCount(0)
    setImageSrc(DEFAULT_DRESS)
    setIsZoomedIn(false)
    setTargetCount(20646)
  }

  // Button 1: Count again
  const handleCountAgain = () => {
    if (cameraActive) stopCamera()
    setPhase("zooming")
    setIsZoomedIn(false)
    setCount(0)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setIsZoomedIn(true)
      setPhase("counting")
      animateCountUp(targetCount, 2000)
    }, 900)
  }

  // Button 2: Upload image
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    if (cameraActive) stopCamera()

    setImageSrc(objectUrl)
    setPhase("zooming")
    setIsZoomedIn(false)
    setCount(0)

    const variation = Math.floor(Math.random() * 500) - 250
    const newCount = Math.max(16000, 20646 + variation)
    setTargetCount(newCount)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsZoomedIn(true)
      setPhase("counting")
      animateCountUp(newCount, 2000)
    }, 900)
  }

  // Button 3: Use camera
  const handleUseCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      setCameraActive(true)
      setCameraNotice("Live camera active. Center fabric in frame.")

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
    } catch {
      setCameraActive(false)
      setCameraNotice("Camera unavailable. Please allow access or upload an image instead.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    setCameraNotice("Camera unavailable. Please allow access or upload an image instead.")
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 640
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/jpeg")
    stopCamera()
    setImageSrc(dataUrl)
    handleCountAgain()
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center">
      {/* 1. Large Rounded Fabric Image Area in the Center */}
      <div className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden bg-white border border-[#231834]/6 shadow-[0_12px_36px_-16px_rgba(35,24,52,0.06)]">
        {cameraActive ? (
          <div className="relative w-full h-full bg-[#181122]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder reticle */}
            <div className="absolute inset-8 rounded-2xl border border-dashed border-white/40 pointer-events-none flex items-center justify-center">
              <span className="bg-[#231834]/70 text-white text-xs px-3 py-1 rounded-full font-medium">
                Align fabric in frame
              </span>
            </div>
            {/* Controls */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2.5 px-4">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 rounded-full bg-white text-[#231834] text-xs font-semibold shadow-sm hover:bg-[#FAF8F5] transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-[#231834]" />
                Snap & Count
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-full bg-[#231834]/80 text-white text-xs font-medium hover:bg-[#231834] transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-[#FAF8F5]/50">
            {/* Garment View */}
            <div
              className={`absolute inset-0 p-6 flex items-center justify-center transition-all duration-700 ease-out ${
                isZoomedIn ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
              }`}
            >
              <Image
                src={imageSrc}
                alt="Woven garment"
                fill
                priority
                unoptimized
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-contain p-4"
              />
            </div>

            {/* Microscopic Threads Weave View */}
            <div
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                isZoomedIn ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <Image
                src="/threads.png"
                alt="Microscopic close-up of woven threads"
                fill
                priority
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover"
              />
            </div>

            {/* Minimal Segmented View Switcher Pill */}
            <div className="absolute top-3.5 right-3.5 z-10">
              <div className="inline-flex p-0.5 rounded-full bg-white/95 border border-[#231834]/6 shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsZoomedIn(false)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    !isZoomedIn
                      ? "bg-[#231834] text-white"
                      : "text-[#746882] hover:text-[#231834]"
                  }`}
                >
                  Garment
                </button>
                <button
                  type="button"
                  onClick={() => setIsZoomedIn(true)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isZoomedIn
                      ? "bg-[#231834] text-white"
                      : "text-[#746882] hover:text-[#231834]"
                  }`}
                >
                  Weave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Below it show: THREADS COUNTED & 20,646 */}
      <div className="mt-9 text-center flex flex-col items-center">
        <span className="text-[11px] font-medium tracking-[0.22em] text-[#746882] uppercase">
          THREADS COUNTED
        </span>
        <div className="mt-1 font-heading text-5xl font-bold tracking-tight text-[#231834] tabular-nums">
          {count.toLocaleString()}
        </div>
      </div>

      {/* 3. Statistics Card (Minimal, Clean, Elegant) */}
      <div className="w-full mt-7 p-5 rounded-2xl bg-white border border-[#231834]/6 shadow-[0_8px_24px_-12px_rgba(35,24,52,0.04)]">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          {/* WIDTH (CM) */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5]">
            <span className="text-[9px] font-semibold tracking-[0.14em] text-[#746882] uppercase">
              WIDTH (CM)
            </span>
            <span className="mt-1 font-heading text-lg font-bold text-[#231834] tabular-nums">
              {widthCm}
            </span>
          </div>

          {/* LENGTH (CM) */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5]">
            <span className="text-[9px] font-semibold tracking-[0.14em] text-[#746882] uppercase">
              LENGTH (CM)
            </span>
            <span className="mt-1 font-heading text-lg font-bold text-[#231834] tabular-nums">
              {lengthCm}
            </span>
          </div>

          {/* THREADS / CM */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5]">
            <span className="text-[9px] font-semibold tracking-[0.14em] text-[#746882] uppercase">
              THREADS / CM
            </span>
            <span className="mt-1 font-heading text-lg font-bold text-[#231834] tabular-nums">
              {threadsPerCm}
            </span>
          </div>

          {/* PREDICTED */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF8F5]">
            <span className="text-[9px] font-semibold tracking-[0.14em] text-[#746882] uppercase">
              PREDICTED
            </span>
            <span className="mt-1 font-heading text-lg font-bold text-[#231834] tabular-nums">
              {predictedCount.toLocaleString()}
            </span>
          </div>

          {/* DETECTED (Muted Lavender Accent) */}
          <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#F2EFF8] border border-[#DED6EA]">
            <span className="text-[9px] font-semibold tracking-[0.14em] text-[#55466A] uppercase">
              DETECTED
            </span>
            <span className="mt-1 font-heading text-lg font-bold text-[#231834] tabular-nums">
              {count.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Three Rounded Buttons */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 w-full">
        {/* Button 1: Count again */}
        <button
          type="button"
          onClick={handleCountAgain}
          disabled={phase === "zooming" || phase === "counting"}
          className="flex-1 min-w-[130px] sm:flex-initial px-5 py-3 rounded-full bg-[#231834] text-white font-heading text-xs font-semibold shadow-xs hover:bg-[#34244D] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#FAF8F5] ${
              phase === "counting" || phase === "zooming" ? "animate-spin" : ""
            }`}
          />
          <span>Count again</span>
        </button>

        {/* Button 2: Upload image (Dusty Pink Accent) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 min-w-[130px] sm:flex-initial px-5 py-3 rounded-full bg-[#F9EEF2] border border-[#EED7DF] text-[#231834] font-heading text-xs font-semibold hover:bg-[#F4E3EB] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-[#55466A]" />
          <span>Upload image</span>
        </button>

        {/* Button 3: Use camera (Lavender Accent) */}
        <button
          type="button"
          onClick={handleUseCamera}
          className="flex-1 min-w-[130px] sm:flex-initial px-5 py-3 rounded-full bg-[#F2EFF8] border border-[#DED6EA] text-[#231834] font-heading text-xs font-semibold hover:bg-[#EAE4F3] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-[#55466A]" />
          <span>Use camera</span>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Upload garment image"
        />
      </div>

      {/* Optional Reset trigger when counted or custom image */}
      {(count > 0 || imageSrc !== DEFAULT_DRESS || isZoomedIn) && (
        <button
          type="button"
          onClick={handleReset}
          className="mt-3 text-xs text-[#746882] underline hover:text-[#231834] transition-colors cursor-pointer"
        >
          Reset to default dress & 0 threads
        </button>
      )}

      {/* 5. Below the buttons show: Camera unavailable message */}
      <div className="mt-4 text-center px-4">
        <p className="text-xs text-[#746882] font-normal">
          {cameraNotice}
        </p>
      </div>
    </div>
  )
}
