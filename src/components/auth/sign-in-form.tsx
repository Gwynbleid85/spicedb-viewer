import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getSafeRedirect } from "#/components/auth/auth-redirect";
import { authClient } from "#/lib/auth-client";

const signInSchema = z.object({
	email: z.email("Enter a valid email address.").trim(),
	password: z.string(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

type SignInFormProps = {
	redirectTo?: string;
};

export function SignInForm({ redirectTo }: SignInFormProps) {
	const router = useRouter();
	const [authError, setAuthError] = useState<string | null>(null);
	const safeRedirect = getSafeRedirect(redirectTo);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInFormValues>({
		defaultValues: {
			email: "",
			password: "",
		},
		resolver: zodResolver(signInSchema),
	});

	async function onSubmit({ email, password }: SignInFormValues) {
		setAuthError(null);

		const result = await authClient.signIn.email({
			email,
			password,
			callbackURL: safeRedirect,
		});

		if (result.error) {
			setAuthError(result.error.message ?? "Authentication failed.");
			return;
		}

		await router.invalidate();
		location.assign(safeRedirect);
	}

	return (
		<form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
			<label className="block" htmlFor="sign-in-email">
				<span className="text-sm font-semibold text-[var(--sea-ink)]">
					Email
				</span>
				<input
					autoComplete="email"
					className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-4 focus:ring-teal-200/40"
					id="sign-in-email"
					type="email"
					{...register("email")}
					aria-invalid={errors.email ? "true" : "false"}
				/>
				{errors.email ? (
					<p className="mt-2 text-sm font-medium text-red-700">
						{errors.email.message}
					</p>
				) : null}
			</label>

			<label className="block" htmlFor="sign-in-password">
				<span className="text-sm font-semibold text-[var(--sea-ink)]">
					Password
				</span>
				<input
					autoComplete="current-password"
					className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-4 focus:ring-teal-200/40"
					id="sign-in-password"
					type="password"
					{...register("password")}
					aria-invalid={errors.password ? "true" : "false"}
				/>
				{errors.password ? (
					<p className="mt-2 text-sm font-medium text-red-700">
						{errors.password.message}
					</p>
				) : null}
			</label>

			{authError ? (
				<p
					className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
					role="alert"
				>
					{authError}
				</p>
			) : null}

			<button
				className="w-full rounded-2xl bg-[var(--sea-ink)] px-5 py-3 font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-[var(--palm)] disabled:cursor-not-allowed disabled:opacity-60"
				disabled={isSubmitting}
				type="submit"
			>
				{isSubmitting ? "Working..." : "Sign in"}
			</button>
		</form>
	);
}

export { signInSchema };
