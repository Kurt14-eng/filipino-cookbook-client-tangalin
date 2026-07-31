const LOCAL_API_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

type ProxyRequest = {
  baseUrl?: unknown;
  path?: unknown;
};

function targetUrlFor(body: ProxyRequest): URL {
  if (typeof body.baseUrl !== "string" || typeof body.path !== "string") {
    throw new Error("The API base URL and endpoint path are required.");
  }

  const baseUrl = new URL(body.baseUrl);
  if (
    !["http:", "https:"].includes(baseUrl.protocol) ||
    baseUrl.username ||
    baseUrl.password
  ) {
    throw new Error("The API base URL is not valid.");
  }
  if (!LOCAL_API_HOSTS.has(baseUrl.hostname)) {
    throw new Error("Only a locally running classmate API is allowed.");
  }
  if (baseUrl.hostname === "localhost") {
    baseUrl.hostname = "127.0.0.1";
  }
  if (!body.path.startsWith("/api/") || body.path.includes("..")) {
    throw new Error("The requested API endpoint is not allowed.");
  }

  return new URL(body.path, `${baseUrl.origin}/`);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProxyRequest;
    const targetUrl = targetUrlFor(body);
    const authorization = request.headers.get("authorization") ?? "";
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
      signal: AbortSignal.timeout(10_000),
    });
    const responseBody = await upstream.text();

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name !== "TimeoutError"
        ? error.message
        : "The classmate API did not respond in time.";

    return Response.json({ status: "error", message }, { status: 502 });
  }
}
