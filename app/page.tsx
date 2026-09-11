import { ThreadCounter } from "@/components/thread-counter"

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-6 py-20 sm:py-28 bg-[#FAF8F5]">
      {/* Header with generous whitespace and refined typography */}
      <header className="w-full max-w-xl text-center flex flex-col items-center">
        <h1 className="font-heading text-4xl sm:text-[2.75rem] font-bold tracking-tight text-[#231834] leading-tight">
          Count the Threads
        </h1>
        <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-[#746882] font-normal">
          Watch the garment zoom into its fabric, then reveal every single thread woven into the cloth.
        </p>
      </header>

      {/* Main Interactive Fabric Area & Counter */}
      <section className="mt-12 sm:mt-14 w-full flex justify-center">
        <ThreadCounter />
      </section>

      {/* Minimal Understated Footer */}
      <footer className="mt-20 sm:mt-24 text-center">
        <span className="text-xs text-[#958A9F] tracking-wider uppercase font-medium">
          Microscopic Optical Analysis
        </span>
      </footer>
    </main>
  )
}
