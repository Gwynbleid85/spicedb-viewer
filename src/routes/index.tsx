import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

const authSteps = [
	{
		label: "1",
		title: "Create an account",
		description:
			"Email and password credentials are persisted through Better Auth and Drizzle.",
	},
	{
		label: "2",
		title: "Receive a session",
		description:
			"TanStack Start cookies keep the authenticated session available during SSR.",
	},
	{
		label: "3",
		title: "Enter protected routes",
		description:
			"The pathless layout checks the session in beforeLoad before rendering private UI.",
	},
];

function Home() {
	return (
		<main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-hidden px-6 py-8 sm:px-8">
			<div className="pointer-events-none absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--lagoon)]/18 blur-3xl" />
			<div className="pointer-events-none absolute right-8 top-44 hidden h-44 w-44 rounded-[36%_64%_52%_48%] border border-[var(--line)] bg-white/25 backdrop-blur sm:block" />

			<header className="relative z-10 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-[var(--line)] bg-[var(--header-bg)] px-5 py-4 shadow-xl shadow-emerald-950/5 backdrop-blur">
				<Link className="group flex items-center gap-3 no-underline" to="/">
					<span className="grid size-11 place-items-center rounded-2xl bg-[var(--sea-ink)] font-serif text-xl font-bold text-white shadow-lg shadow-emerald-950/10 transition group-hover:-rotate-6">
						T
					</span>
					<span>
						<span className="block text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--kicker)]">
							TanStack Start
						</span>
						<span className="block font-serif text-xl font-bold text-[var(--sea-ink)]">
							Better Auth Kit
						</span>
					</span>
				</Link>

				<nav className="flex flex-wrap items-center gap-2">
					<Link
						className="rounded-2xl px-4 py-2 text-sm font-bold text-[var(--sea-ink)] no-underline transition hover:bg-white/70"
						to="/sign-in"
					>
						Sign in
					</Link>
					<Link
						className="rounded-2xl bg-[var(--sea-ink)] px-4 py-2 text-sm font-bold text-white no-underline shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-[var(--palm)]"
						to="/sign-up"
					>
						Sign up
					</Link>
				</nav>
			</header>

			<section className="relative z-10 grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
				<div>
					<div className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--kicker)] shadow-lg shadow-emerald-950/5 backdrop-blur">
						<span className="size-2 rounded-full bg-[var(--lagoon)] shadow-[0_0_18px_var(--lagoon)]" />
						Server-first auth
					</div>

					<h1 className="mt-7 max-w-4xl font-serif text-6xl font-bold leading-[0.95] tracking-tight text-[var(--sea-ink)] sm:text-7xl lg:text-8xl">
						A protected app shell, already wired.
					</h1>
					<p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--sea-ink-soft)] sm:text-xl">
						This template now ships with Better Auth, SQLite-backed Drizzle
						tables, email/password pages, and a TanStack Router protected layout
						that redirects anonymous visitors before private routes render.
					</p>

					<div className="mt-9 flex flex-col gap-3 sm:flex-row">
						<Link
							className="inline-flex items-center justify-center rounded-2xl bg-[var(--sea-ink)] px-6 py-4 text-base font-extrabold text-white no-underline shadow-2xl shadow-emerald-950/15 transition hover:-translate-y-1 hover:bg-[var(--palm)]"
							to="/sign-up"
						>
							Create account
						</Link>
						<Link
							className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-white/72 px-6 py-4 text-base font-extrabold text-[var(--sea-ink)] no-underline shadow-xl shadow-emerald-950/5 backdrop-blur transition hover:-translate-y-1 hover:bg-white"
							to="/dashboard"
						>
							Test protected route
						</Link>
					</div>
				</div>

				<div className="relative">
					<div className="absolute -inset-6 rounded-[3rem] bg-[radial-gradient(circle_at_20%_20%,rgba(79,184,178,0.24),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(47,106,74,0.18),transparent_36%)] blur-2xl" />
					<div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur sm:p-8">
						<div className="flex items-center justify-between border-b border-[var(--line)] pb-5">
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--kicker)]">
									Auth status
								</p>
								<h2 className="mt-1 font-serif text-3xl font-bold text-[var(--sea-ink)]">
									Protected layout
								</h2>
							</div>
							<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800">
								Live
							</span>
						</div>

						<div className="mt-6 space-y-4">
							{authSteps.map((step) => (
								<div
									className="group rounded-3xl border border-[var(--line)] bg-white/70 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-emerald-950/5"
									key={step.title}
								>
									<div className="flex gap-4">
										<span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--sand)] font-serif text-lg font-bold text-[var(--sea-ink)] transition group-hover:bg-[var(--lagoon)] group-hover:text-white">
											{step.label}
										</span>
										<div>
											<h3 className="font-serif text-2xl font-bold text-[var(--sea-ink)]">
												{step.title}
											</h3>
											<p className="mt-2 leading-7 text-[var(--sea-ink-soft)]">
												{step.description}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>

						<div className="mt-6 rounded-3xl bg-[var(--sea-ink)] p-5 text-white">
							<p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100/80">
								Current guard
							</p>
							<p className="mt-3 font-mono text-sm leading-7 text-emerald-50/90">
								/dashboard → beforeLoad → getSession() → redirect or render
							</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
