import { NextRequest, NextResponse } from "next/server";
import { saveGitHubToken } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/?error=github_auth_failed", request.url)
      );
    }

    // Decode state to get userId
    const { userId } = JSON.parse(
      Buffer.from(state, "base64").toString("utf-8")
    );

    const clientId = process.env.GITHUB_EXPORTER_CLIENT_ID;
    const clientSecret = process.env.GITHUB_EXPORTER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/?error=github_not_configured", request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("GitHub token exchange error:", tokenData);
      return NextResponse.redirect(
        new URL("/?error=github_token_failed", request.url)
      );
    }

    // Save token to database
    await saveGitHubToken({
      userId,
      accessToken: tokenData.access_token
    });

    // Redirect back to the app with success
    return NextResponse.redirect(new URL("/?github=connected", request.url));
  } catch (error) {
    console.error("GitHub callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=github_callback_failed", request.url)
    );
  }
}
