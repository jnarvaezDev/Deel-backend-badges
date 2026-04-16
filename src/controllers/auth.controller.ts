import { Request, Response } from "express";
import { getAccessToken, getUserProfile } from "../services/linkedin.service";

export const linkedinLogin = (req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;

  const scope = "openid profile email";

  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  res.redirect(url);
};

export const linkedinCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;

    const accessToken = await getAccessToken(code);
    const profile = await getUserProfile(accessToken);

    // Aquí luego guardas en DB
    console.log("USER:", profile);

    // Redirigir al frontend
    const frontendUrl = process.env.FRONTEND_URL;

    res.redirect(`${frontendUrl}/app?name=${profile.name}&email=${profile.email}`);

  } catch (error) {
    console.error(error);
    res.status(500).send("Auth error");
  }
};