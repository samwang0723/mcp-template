# MCP Server Template

A production-ready TypeScript template for creating Model Context Protocol (MCP) servers with HTTP transport. This template provides a solid foundation for building scalable, secure, and maintainable MCP servers.

## 🚀 Features

- **TypeScript**: Full type safety with modern TypeScript patterns
- **HTTP Transport**: RESTful API with Express.js server
- **Session Management**: Stateful connections with proper session handling
- **Configuration Management**: Environment-based configuration with validation
- **Error Handling**: Comprehensive error handling and logging
- **Health Checks**: Built-in health monitoring endpoints
- **Docker Support**: Production-ready containerization
- **Development Tools**: ESLint, Prettier, and testing setup
- **Production Ready**: Optimized for scalability and security

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Docker (optional, for containerization)

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
# Clone the template
git clone <your-repo-url>
cd mcp-template

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env  # Create this file with your settings
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
LOG_LEVEL=info

# Add your custom environment variables here
```

### 3. Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint and format code
npm run lint
npm run lint:fix
```

## 🏗️ Project Structure

```
mcp-template/
├── src/
│   ├── config/           # Configuration management
│   │   └── index.ts      # Main config file
│   ├── utils/            # Utility functions
│   └── index.ts          # Main server application
├── Dockerfile            # Docker configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔧 Architecture

### Core Components

1. **McpServerApp**: Main application class that orchestrates the MCP server
2. **Configuration**: Environment-based configuration with type safety
3. **Session Management**: HTTP-based stateful sessions with cleanup
4. **Transport Layer**: StreamableHTTPServerTransport for MCP communication
5. **Error Handling**: Comprehensive error handling with proper HTTP responses

### HTTP Endpoints

- `GET /health` - Health check endpoint
- `POST /mcp` - Main MCP communication endpoint
- `GET /mcp` - Server-to-client notifications via SSE
- `DELETE /mcp` - Session termination

## 🛠️ Customization Guide

### Adding New Tools

To add a new MCP tool, modify the `createServer()` method in `src/index.ts`:

```typescript
// Register your custom tool
server.tool(
  'your-tool-name',
  'Description of your tool',
  {
    // Define input schema using Zod
    parameter1: z.string().describe('Parameter description'),
    parameter2: z.number().optional().describe('Optional parameter'),
  },
  async ({ parameter1, parameter2 }) => {
    try {
      // Your tool implementation here
      const result = await yourCustomLogic(parameter1, parameter2);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          } as TextContent,
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error in your-tool-name: ${errorMessage}`);
    }
  }
);
```

### Configuration Management

Add new configuration options in `src/config/index.ts`:

```typescript
interface Config {
  logging: LoggingConfig;
  server: ServerConfig;
  // Add your custom config sections
  database: {
    url: string;
    timeout: number;
  };
  external: {
    apiKey: string;
    baseUrl: string;
  };
}

const config: Config = {
  // ... existing config
  database: {
    url: process.env.DATABASE_URL || 'sqlite://memory',
    timeout: parseInt(process.env.DB_TIMEOUT || '5000', 10),
  },
  external: {
    apiKey: process.env.EXTERNAL_API_KEY || '',
    baseUrl: process.env.EXTERNAL_BASE_URL || 'https://api.example.com',
  },
};
```

### Adding Middleware

Add Express middleware in the `run()` method:

```typescript
async run() {
  const app = express();
  app.use(express.json());

  // Add your custom middleware
  app.use(cors()); // CORS support
  app.use(helmet()); // Security headers
  app.use(morgan('combined')); // Request logging

  // ... rest of the setup
}
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build Docker image
docker build -t mcp-server .

# Run container
docker run -p 3000:3000 --env-file .env mcp-server
```

### Docker Compose (Recommended)

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mcp-server:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:

```bash
docker-compose up -d
```

## 🔒 Security Best Practices

This template implements several security measures:

- **Input Validation**: Zod schema validation for all tool parameters
- **Error Handling**: Safe error responses without information leakage
- **Session Management**: Proper session cleanup and validation
- **HTTP Security**: Ready for security headers and CORS configuration
- **Environment Variables**: Secure configuration management

### Recommended Additional Security

```typescript
// Add security middleware
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/mcp', limiter);
```

## 📊 Monitoring and Logging

The template includes basic logging setup. For production, consider adding:

- **Structured Logging**: Winston with JSON format
- **Metrics Collection**: Prometheus metrics
- **Health Checks**: Comprehensive health endpoints
- **APM Integration**: Application Performance Monitoring

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Create test files in `src/**/*.test.ts`:

```typescript
import { describe, test, expect } from '@jest/globals';
// Your test imports

describe('YourComponent', () => {
  test('should handle valid input', async () => {
    // Test implementation
  });
});
```

## 🚀 Production Deployment

### Environment Variables

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

# Add your production-specific variables
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
API_KEYS=...
```

### Performance Optimization

- Enable gzip compression
- Implement proper caching headers
- Use connection pooling for databases
- Monitor memory usage and implement limits
- Set up log rotation

### Scaling Considerations

- Load balancing across multiple instances
- Database connection pooling
- Session store externalization (Redis)
- Horizontal pod autoscaling in Kubernetes

## 📚 References

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:

- Check the [MCP Documentation](https://modelcontextprotocol.io/)
- Review existing issues
- Create a new issue with detailed information

---

**Happy coding! 🎉**
