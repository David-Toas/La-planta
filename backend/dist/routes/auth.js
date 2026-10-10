"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const config_1 = require("../config");
exports.authRouter = (0, express_1.Router)();
/**
 * Returns current authenticated profile (Google or Email user)
 */
exports.authRouter.get("/me", authMiddleware_1.requireAuth, async (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});
/**
 * Google OAuth Configuration metadata for Supabase and frontend
 */
exports.authRouter.get("/google-config", (req, res) => {
    res.json({
        service: "La Planta Prime Google OAuth Integration",
        supabaseUrl: config_1.config.supabaseUrl,
        redirectUriCallback: `${config_1.config.supabaseUrl}/auth/v1/callback`,
        clientFrontendCallback: "http://localhost:3000/auth/callback",
        instructions: [
            "1. Open Google Cloud Console (console.cloud.google.com) -> APIs & Services -> Credentials",
            "2. Create an OAuth 2.0 Client ID for Web Application",
            `3. Set Authorized Redirect URI to: ${config_1.config.supabaseUrl}/auth/v1/callback`,
            "4. Copy Client ID and Client Secret into Supabase Dashboard -> Authentication -> Providers -> Google",
        ],
    });
});
