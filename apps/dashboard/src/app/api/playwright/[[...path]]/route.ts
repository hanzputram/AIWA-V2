import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAYWRIGHT_BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL || "http://127.0.0.1:3001";

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path = [] } = await context.params;
    const targetPath = "/" + path.join("/");
    const search = request.nextUrl.search || "";
    const targetUrl = `${PLAYWRIGHT_BACKEND_URL}${targetPath}${search}`;

    const headers = new Headers();
    request.headers.forEach((val: string, key: string) => {
      const lower = key.toLowerCase();
      if (!["host", "connection", "content-length"].includes(lower)) {
        headers.set(key, val);
      }
    });

    const init: RequestInit = {
      method: request.method,
      headers,
    };

    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) {
        init.body = body;
      }
    }

    const res = await fetch(targetUrl, init);
    const resBody = await res.arrayBuffer();

    const responseHeaders = new Headers();
    res.headers.forEach((val: string, key: string) => {
      const lower = key.toLowerCase();
      if (!["content-encoding", "transfer-encoding"].includes(lower)) {
        responseHeaders.set(key, val);
      }
    });

    return new NextResponse(resBody, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Playwright Service offline (${PLAYWRIGHT_BACKEND_URL}): ${err.message}`,
      },
      { status: 503 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
