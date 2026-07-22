import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-pulse-red absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="animate-float absolute right-0 top-40 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl flex-col justify-center px-4 py-16">
        <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-brand">rbxlAnimate</p>
        <h1 className="max-w-4xl font-[family-name:var(--font-display)] text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl">
          <span className="brand-glow text-brand">AI animations</span>
          <br />
          built for Roblox.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Prompt a move, preview it live, export clean KeyframeSequence data — no watermarks. Pro unlocks video→anim,
          better quality, and more usage.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/studio" className="btn-primary">
            Start animating
          </Link>
          <Link href="/pricing" className="btn-ghost">
            See Pro — $15.99/mo
          </Link>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Web studio",
              body: "Generate and scrub animations on an R15-style rig right in the browser.",
            },
            {
              title: "Studio plugin",
              body: "Apply clips in Roblox Studio and build full backgrounds — environment, scene kit, stage set.",
            },
            {
              title: "Pro power",
              body: "Video to animation, higher fidelity, 150 gens/month, plus buy-more packs anytime.",
            },
          ].map((item) => (
            <div key={item.title} className="panel p-5">
              <h2 className="font-[family-name:var(--font-display)] text-lg text-white">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
