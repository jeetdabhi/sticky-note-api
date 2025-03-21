import { Environment } from "./environment";

export const ProdEnviroment = {
    db_uri: "mongodb+srv://jeetdabhi6:YqtT3WLERzCRw6N0@stickynotes.umpe3.mongodb.net/?retryWrites=true&w=majority&appName=StickyNotes",
    // GOOGLE_CLIENT_ID: "your_google_client_id",
    JWT_SECRET: process.env.JWT_SECRET || "fallback_secret",  // ✅ Add this line
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h", // 🔥 Ensure JWT_EXPIRES_IN exists
    MAILTRAP_USER: '5583e3ec649006',
    MAILTRAP_PASS: 'b2c544c835f870',
    EMAIL_FROM: 'hegafo1375@payposs.com',
};
