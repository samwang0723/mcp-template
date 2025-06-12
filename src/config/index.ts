import dotenv from 'dotenv';

dotenv.config();

interface LoggingConfig {
  level: string;
}

interface ServerConfig {
  port: number;
}

interface Config {
  logging: LoggingConfig;
  server: ServerConfig;
}

const config: Config = {
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  },
};

export default config;
