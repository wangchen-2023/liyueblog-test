import type { APIRoute } from "astro";

export const prerender = false;

function json(status: number, payload: Record<string, unknown>) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
	});
}

async function readDevCodeFromRequest(request: Request): Promise<string> {
	const urlCode = new URL(request.url).searchParams.get("devCode");
	if (urlCode) return urlCode;

	const raw = await request.text();
	if (!raw) return "";

	try {
		const parsed = JSON.parse(raw) as { devCode?: unknown };
		return typeof parsed.devCode === "string" ? parsed.devCode : "";
	} catch {
		const params = new URLSearchParams(raw);
		return params.get("devCode") || "";
	}
}

export const POST: APIRoute = async ({ request }) => {
	const expectedCode = import.meta.env.DEV_EDITOR_CODE || "1234";
	try {
		const devCode = await readDevCodeFromRequest(request);
		if (!devCode) {
			return json(400, { ok: false, message: "Missing code" });
		}
		if (devCode !== expectedCode) {
			return json(403, { ok: false, message: "Invalid code" });
		}
		return json(200, { ok: true });
	} catch {
		return json(400, { ok: false, message: "Invalid request format" });
	}
};

export const GET: APIRoute = async ({ request }) => {
	const expectedCode = import.meta.env.DEV_EDITOR_CODE || "1234";
	const devCode = new URL(request.url).searchParams.get("devCode") || "";
	if (!devCode) {
		return json(400, { ok: false, message: "Missing code" });
	}
	if (devCode !== expectedCode) {
		return json(403, { ok: false, message: "Invalid code" });
	}
	return json(200, { ok: true });
};
