import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getSafeRedirect } from "#/components/auth/auth-redirect";
import { authClient } from "#/lib/auth-client";

const signUpSchema = z.object({
	name: z.string().trim().min(1, "Name is required."),
	email: z.email("Enter a valid email address.").trim(),
	password: z.string().min(8, "Password must be at least 8 characters."),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

type SignUpFormProps = {
	redirectTo?: string;
};

export function SignUpForm({ redirectTo }: SignUpFormProps) {
	const router = useRouter();
	const [authError, setAuthError] = useState<string | null>(null);
	const safeRedirect = getSafeRedirect(redirectTo);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignUpFormValues>({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		resolver: zodResolver(signUpSchema),
	});

	async function onSubmit({ name, email, password }: SignUpFormValues) {
		setAuthError(null);

		const result = await authClient.signUp.email({
			name,
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
			<label className="block" htmlFor="sign-up-name">
				<span className="text-sm font-semibold text-[var(--sea-ink)]">
					Name
				</span>
				<input
					autoComplete="name"
					className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-4 focus:ring-teal-200/40"
					id="sign-up-name"
					{...register("name")}
					aria-invalid={errors.name ? "true" : "false"}
				/>
				{errors.name ? (
					<p className="mt-2 text-sm font-medium text-red-700">
						{errors.name.message}
					</p>
				) : null}
			</label>

			<label className="block" htmlFor="sign-up-email">
				<span className="text-sm font-semibold text-[var(--sea-ink)]">
					Email
				</span>
				<input
					autoComplete="email"
					className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-4 focus:ring-teal-200/40"
					id="sign-up-email"
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

			<label className="block" htmlFor="sign-up-password">
				<span className="text-sm font-semibold text-[var(--sea-ink)]">
					Password
				</span>
				<input
					autoComplete="new-password"
					className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-4 focus:ring-teal-200/40"
					id="sign-up-password"
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
				{isSubmitting ? "Working..." : "Create account"}
			</button>
		</form>
	);
}

export { signUpSchema };
