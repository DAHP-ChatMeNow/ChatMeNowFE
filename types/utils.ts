const normalizeEnvUrl = (value?: string) => value?.replace(/\/+$/, "");

const apiUrlEnv = normalizeEnvUrl(process.env.NEXT_PUBLIC_API_URL);
const webUrlEnv = normalizeEnvUrl(
	process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL,
);

export const BASE_API_URL = apiUrlEnv;

export const BASE_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export const buildPublicAppUrl = (path: string): string => {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const runtimeOrigin =
		typeof window !== "undefined" ? window.location.origin : undefined;
	const base = webUrlEnv || normalizeEnvUrl(runtimeOrigin);

	if (!base) {
		return normalizedPath;
	}

	return new URL(normalizedPath, `${base}/`).toString();
};
