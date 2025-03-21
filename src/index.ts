import { Server } from './server';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const port = process.env.PORT || 3000; // Use PORT from .env or default to 3000
const serverInstance = new Server();

serverInstance.server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
