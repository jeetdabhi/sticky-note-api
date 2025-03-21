import { DevEnviroment } from "./environment.dev";
import { ProdEnviroment } from "./environment.prod";

export interface Environment {
    db_uri: string;
    // GOOGLE_CLIENT_ID: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;  // ✅ Ensure this property exists
    MAILTRAP_USER: string;
    MAILTRAP_PASS: string;
    EMAIL_FROM: string;
}

export function getEnvironmentVariables(): Environment {
    return process.env.NODE_ENV === "production" ? ProdEnviroment : DevEnviroment;
}

