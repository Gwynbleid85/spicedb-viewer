import { existsSync, readFileSync } from "node:fs";

import { v1 } from "@authzed/authzed-node";

type SpiceDbProtocol = "grpc" | "rest";

type SpiceDbConfig = {
	endpoint: string;
	token: string;
	protocol: SpiceDbProtocol;
	security: "secure" | "insecure-localhost";
	caCertPath?: string;
	relationshipExportLimit: number;
};

type RestRequestBody = Record<string, unknown>;

type SpiceDbLogContext = Record<string, unknown>;

type SerializedError = {
	cause?: unknown;
	code?: unknown;
	details?: unknown;
	message?: string;
	metadata?: unknown;
	name?: string;
	stack?: string;
};

type SpiceDbRestClient = {
	deleteRelationships: (body: RestRequestBody) => Promise<unknown>;
	dependentRelations: (body: RestRequestBody) => Promise<unknown>;
	readRelationships: (body: RestRequestBody) => Promise<unknown[]>;
	reflectSchema: (body: RestRequestBody) => Promise<unknown>;
};

let cachedGrpcClient: v1.ZedClientInterface | null = null;
let cachedGrpcConfigKey: string | null = null;
let cachedRestClient: SpiceDbRestClient | null = null;
let cachedRestConfigKey: string | null = null;

function getErrorProperty(error: object, key: string) {
	return key in error ? (error as Record<string, unknown>)[key] : undefined;
}

function serializeError(error: unknown): SerializedError {
	if (error instanceof Error) {
		return {
			cause: error.cause,
			code: getErrorProperty(error, "code"),
			details: getErrorProperty(error, "details"),
			message: error.message,
			metadata: getErrorProperty(error, "metadata"),
			name: error.name,
			stack: error.stack,
		};
	}

	return {
		message: String(error),
	};
}

function getSpiceDbLogContext(): SpiceDbLogContext {
	return {
		caCertConfigured: Boolean(process.env.SPICEDB_CA_CERT_PATH),
		endpoint: process.env.SPICEDB_ENDPOINT,
		protocol: process.env.SPICEDB_PROTOCOL ?? "grpc",
		relationshipExportLimit:
			process.env.SPICEDB_RELATIONSHIP_EXPORT_LIMIT ?? "1000",
		security: process.env.SPICEDB_SECURITY ?? "secure",
	};
}

function writeSpiceDbServerLog(
	level: "error" | "info",
	message: string,
	context: SpiceDbLogContext,
) {
	const payload = {
		...context,
		level,
		message,
		timestamp: new Date().toISOString(),
	};

	console[level](`[spicedb] ${message}`, context);
	process.stderr.write(`[spicedb] ${JSON.stringify(payload)}\n`);
}

export function logSpiceDbInfo(
	message: string,
	context: SpiceDbLogContext = {},
) {
	writeSpiceDbServerLog("info", message, {
		...getSpiceDbLogContext(),
		...context,
	});
}

export function logSpiceDbError(
	operation: string,
	error: unknown,
	context: SpiceDbLogContext = {},
) {
	writeSpiceDbServerLog("error", "operation failed", {
		...getSpiceDbLogContext(),
		...context,
		error: serializeError(error),
		operation,
	});
}

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

function parseProtocol(value: string | undefined): SpiceDbProtocol {
	if (!value) {
		return "grpc";
	}

	if (value !== "grpc" && value !== "rest") {
		throw new Error("SPICEDB_PROTOCOL must be grpc or rest.");
	}

	return value;
}

export function getSpiceDbConfig(): SpiceDbConfig {
	const security = process.env.SPICEDB_SECURITY ?? "secure";

	if (security !== "secure" && security !== "insecure-localhost") {
		throw new Error("SPICEDB_SECURITY must be secure or insecure-localhost.");
	}

	return {
		endpoint: requireEnv("SPICEDB_ENDPOINT"),
		token: requireEnv("SPICEDB_TOKEN"),
		protocol: parseProtocol(process.env.SPICEDB_PROTOCOL),
		security,
		caCertPath: process.env.SPICEDB_CA_CERT_PATH,
		relationshipExportLimit: parseLimit(
			process.env.SPICEDB_RELATIONSHIP_EXPORT_LIMIT,
		),
	};
}

export function getSpiceDbGrpcClient() {
	const config = getSpiceDbConfig();
	const configKey = JSON.stringify({
		endpoint: config.endpoint,
		token: config.token,
		security: config.security,
		caCertPath: config.caCertPath,
	});

	if (cachedGrpcClient && cachedGrpcConfigKey === configKey) {
		return cachedGrpcClient;
	}

	if (cachedGrpcClient) {
		cachedGrpcClient.close();
	}

	if (config.caCertPath) {
		if (!existsSync(config.caCertPath)) {
			throw new Error(
				"SPICEDB_CA_CERT_PATH does not point to a readable file.",
			);
		}

		cachedGrpcClient = v1.NewClientWithCustomCert(
			config.token,
			config.endpoint,
			readFileSync(config.caCertPath),
		);
	} else {
		cachedGrpcClient = v1.NewClient(
			config.token,
			config.endpoint,
			config.security === "insecure-localhost"
				? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
				: v1.ClientSecurity.SECURE,
		);
	}

	cachedGrpcConfigKey = configKey;
	logSpiceDbInfo("client created", {
		caCertConfigured: Boolean(config.caCertPath),
		endpoint: config.endpoint,
		protocol: config.protocol,
		relationshipExportLimit: config.relationshipExportLimit,
		security: config.security,
	});

	return cachedGrpcClient;
}

function createRestBaseUrl(config: SpiceDbConfig) {
	if (config.caCertPath) {
		throw new Error(
			"SPICEDB_CA_CERT_PATH is only supported with SPICEDB_PROTOCOL=grpc.",
		);
	}

	const endpoint = config.endpoint.replace(/\/+$/, "");

	if (/^https?:\/\//.test(endpoint)) {
		return endpoint;
	}

	const scheme = config.security === "insecure-localhost" ? "http" : "https";

	return `${scheme}://${endpoint}`;
}

function parseRestStream(text: string) {
	const trimmed = text.trim();

	if (!trimmed) {
		return [];
	}

	try {
		const parsed = JSON.parse(trimmed);
		return Array.isArray(parsed) ? parsed : [parsed];
	} catch {
		return trimmed.split(/\r?\n/).map((line) => JSON.parse(line));
	}
}

function unwrapRestResult(value: unknown) {
	if (value && typeof value === "object" && "result" in value) {
		return (value as { result: unknown }).result;
	}

	return value;
}

function createSpiceDbRestClient(config: SpiceDbConfig): SpiceDbRestClient {
	const baseUrl = createRestBaseUrl(config);
	logSpiceDbInfo("client created", {
		caCertConfigured: Boolean(config.caCertPath),
		endpoint: config.endpoint,
		protocol: config.protocol,
		relationshipExportLimit: config.relationshipExportLimit,
		security: config.security,
	});

	async function request(path: string, body: RestRequestBody, stream = false) {
		const start = performance.now();
		let response: Response | undefined;
		let text: string | undefined;

		try {
			response = await fetch(`${baseUrl}${path}`, {
				body: JSON.stringify(body),
				headers: {
					Authorization: `Bearer ${config.token}`,
					"Content-Type": "application/json",
				},
				method: "POST",
			});
			text = await response.text();
			logSpiceDbInfo("REST request completed", {
				durationMs: Math.round(performance.now() - start),
				path,
				status: response.status,
				statusText: response.statusText,
			});

			if (!response.ok) {
				throw new Error(
					text || `SpiceDB REST request failed with ${response.status}.`,
				);
			}

			if (stream) {
				return parseRestStream(text).map(unwrapRestResult);
			}

			return unwrapRestResult(text ? JSON.parse(text) : {});
		} catch (error) {
			logSpiceDbError("REST request", error, {
				durationMs: Math.round(performance.now() - start),
				path,
				responseBody: text,
				status: response?.status,
				statusText: response?.statusText,
			});
			throw error;
		}
	}

	return {
		deleteRelationships: (body) => request("/v1/relationships/delete", body),
		dependentRelations: (body) =>
			request("/v1/schema/permissions/dependent", body),
		readRelationships: (body) =>
			request("/v1/relationships/read", body, true) as Promise<unknown[]>,
		reflectSchema: (body) => request("/v1/schema/reflectschema", body),
	};
}

export function getSpiceDbRestClient() {
	const config = getSpiceDbConfig();
	const configKey = JSON.stringify({
		endpoint: config.endpoint,
		token: config.token,
		security: config.security,
		caCertPath: config.caCertPath,
	});

	if (cachedRestClient && cachedRestConfigKey === configKey) {
		return cachedRestClient;
	}

	cachedRestClient = createSpiceDbRestClient(config);
	cachedRestConfigKey = configKey;

	return cachedRestClient;
}

export function normalizeSpiceDbError(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return "Unable to read data from SpiceDB.";
}
