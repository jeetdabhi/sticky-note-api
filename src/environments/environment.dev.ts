import { Environment } from "./environment";

export const DevEnviroment = {
    db_uri: "mongodb+srv://jeetdabhi6:YqtT3WLERzCRw6N0@stickynotes.umpe3.mongodb.net/?retryWrites=true&w=majority&appName=StickyNotes",
    // GOOGLE_CLIENT_ID: "your_google_client_id",
    JWT_SECRET: process.env.JWT_SECRET || "fallback_secret",  // ✅ Add this line
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h", // 🔥 Ensure JWT_EXPIRES_IN exists
    MAILTRAP_USER: 'd7a68f252d7764',
    MAILTRAP_PASS: '95e51d652eddff',
    EMAIL_FROM: 'jeetdabhi6@gmail.com',
};
