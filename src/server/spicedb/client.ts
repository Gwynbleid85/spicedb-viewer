import { existsSync, readFileSync } from "node:fs";

import { v1 } from "@authzed/authzed-node";

type SpiceDbConfig = {
	endpoint: string;
	token: string;
	security: "secure" | "insecure-localhost";
	caCertPath?: string;
	relationshipExportLimit: number;
};

let cachedClient: v1.ZedClientInterface | null = null;
let cachedConfigKey: string | null = null;

function requireEnv(name: string) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required to connect to SpiceDB.`);
	}

	return value;
}

function parseLimit(value: string | undefined) {
	if (!value) {
		return 1000;
	}

	const limit = Number(value);

	if (!Number.isInteger(limit) || limit < 1) {
		throw new Error(
			"SPICEDB_RELATIONSHIP_EXPORT_LIMIT must be a positive integer.",
		);
	}

	return limit;
}

export function getSpiceDbConfig(): SpiceDbConfig {
	const security = process.env.SPICEDB_SECURITY ?? "secure";

	if (security !== "secure" && security !== "insecure-localhost") {
		throw new Error("SPICEDB_SECURITY must be secure or insecure-localhost.");
	}

	return {
		endpoint: requireEnv("SPICEDB_ENDPOINT"),
		token: requireEnv("SPICEDB_TOKEN"),
		security,
		caCertPath: process.env.SPICEDB_CA_CERT_PATH,
		relationshipExportLimit: parseLimit(
			process.env.SPICEDB_RELATIONSHIP_EXPORT_LIMIT,
		),
	};
}

export function getSpiceDbClient() {
	const config = getSpiceDbConfig();
	const configKey = JSON.stringify({
		endpoint: config.endpoint,
		token: config.token,
		security: config.security,
		caCertPath: config.caCertPath,
	});

	if (cachedClient && cachedConfigKey === configKey) {
		return cachedClient;
	}

	if (cachedClient) {
		cachedClient.close();
	}

	if (config.caCertPath) {
		if (!existsSync(config.caCertPath)) {
			throw new Error(
				"SPICEDB_CA_CERT_PATH does not point to a readable file.",
			);
		}

		cachedClient = v1.NewClientWithCustomCert(
			config.token,
			config.endpoint,
			readFileSync(config.caCertPath),
		);
	} else {
		cachedClient = v1.NewClient(
			config.token,
			config.endpoint,
			config.security === "insecure-localhost"
				? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
				: v1.ClientSecurity.SECURE,
		);
	}

	cachedConfigKey = configKey;

	return cachedClient;
}

export function normalizeSpiceDbError(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return "Unable to read data from SpiceDB.";
}
