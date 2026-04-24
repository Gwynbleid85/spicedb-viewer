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
		<form
			className="flex flex-col gap-5"
			noValidate
			onSubmit={handleSubmit(onSubmit)}
		>
			<FieldGroup>
				<Field data-invalid={errors.name ? "true" : undefined}>
					<FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
					<FieldContent>
						<Input
							autoComplete="name"
							id="sign-up-name"
							aria-invalid={errors.name ? "true" : "false"}
							{...register("name")}
						/>
						<FieldError errors={[errors.name]} />
					</FieldContent>
				</Field>

				<Field data-invalid={errors.email ? "true" : undefined}>
					<FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
					<FieldContent>
						<Input
							autoComplete="email"
							id="sign-up-email"
							type="email"
							aria-invalid={errors.email ? "true" : "false"}
							{...register("email")}
						/>
						<FieldError errors={[errors.email]} />
					</FieldContent>
				</Field>

				<Field data-invalid={errors.password ? "true" : undefined}>
					<FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
					<FieldContent>
						<Input
							autoComplete="new-password"
							id="sign-up-password"
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
				{isSubmitting ? "Working..." : "Create account"}
			</Button>
		</form>
	);
}

export { signUpSchema };
