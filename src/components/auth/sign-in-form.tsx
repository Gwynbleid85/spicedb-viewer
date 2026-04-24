import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getSafeRedirect } from "#/components/auth/auth-redirect";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";

const signInSchema = z.object({
	email: z.email("Enter a valid email address.").trim(),
	password: z.string().min(8, "Password must be at least 8 characters."),
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
		<form
			className="flex flex-col gap-5"
			noValidate
			onSubmit={handleSubmit(onSubmit)}
		>
			<FieldGroup>
				<Field data-invalid={errors.email ? "true" : undefined}>
					<FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
					<FieldContent>
						<Input
							autoComplete="email"
							id="sign-in-email"
							type="email"
							aria-invalid={errors.email ? "true" : "false"}
							{...register("email")}
						/>
						<FieldError errors={[errors.email]} />
					</FieldContent>
				</Field>

				<Field data-invalid={errors.password ? "true" : undefined}>
					<FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
					<FieldContent>
						<Input
							autoComplete="current-password"
							id="sign-in-password"
							type="password"
							aria-invalid={errors.password ? "true" : "false"}
							{...register("password")}
						/>
						<FieldError errors={[errors.password]} />
					</FieldContent>
				</Field>
			</FieldGroup>

			{authError ? (
				<Alert variant="destructive">
					<AlertDescription>{authError}</AlertDescription>
				</Alert>
			) : null}

			<Button
				className="w-full"
				disabled={isSubmitting}
				size="lg"
				type="submit"
			>
				{isSubmitting ? "Working..." : "Sign in"}
			</Button>
		</form>
	);
}

export { signInSchema };
