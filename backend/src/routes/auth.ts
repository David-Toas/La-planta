import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import { config } from "../config";

export const authRouter = Router();

/**
 * Returns current authenticated profile (Google or Email user)
 */
authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * Google OAuth Configuration metadata for Supabase and frontend
 */
authRouter.get("/google-config", (req: Request, res: Response) => {
  res.json({
    service: "La Planta Prime Google OAuth Integration",
    supabaseUrl: config.supabaseUrl,
    redirectUriCallback: `${config.supabaseUrl}/auth/v1/callback`,
    clientFrontendCallback: `${config.clientUrl}/auth/callback`,
    instructions: [
      "1. Open Google Cloud Console (console.cloud.google.com) -> APIs & Services -> Credentials",
      "2. Create an OAuth 2.0 Client ID for Web Application",
      `3. Set Authorized Redirect URI to: ${config.supabaseUrl}/auth/v1/callback`,
      "4. Copy Client ID and Client Secret into Supabase Dashboard -> Authentication -> Providers -> Google",
    ],
  });
});
