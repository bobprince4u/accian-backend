import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import compression from "compression";

//import routes
import contactRoutes from "./routes/contactRoutes";
import adminRoutes from "./routes/adminRoutes";
import projectRoutes from "./routes/projectRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import testimonialRoutes from "./routes/testimonialRoutes";

//import middleware
import errorHandler from "./middleware/errorHandler";
import * as rateLimiter from "./middleware/rateLimiter";

const app: Application = express();

//security middleware
app.use(helmet());

//CORS configuration
{
  /* const corsOptions: CorsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          "https://accian.co.uk",
          "https://www.accian.co.uk",
          "https://accian.co.uk/admin",
        ]
      : [
          "http://localhost:5173",
          "http://localhost:5174", // <-- ADD THIS LINE
          "http://localhost:2025",
          "http://localhost:2024",
          "http://localhost:2023",
        ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions)); */
}

//CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : process.env.NODE_ENV === "production"
  ? ["https://accian.co.uk", "https://www.accian.co.uk"]
  : [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:2025",
      "http://localhost:2024",
      "http://localhost:2023",
    ];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

//Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//compression middleware
app.use(compression());

//Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

//Rate Limiting middleware
app.use(rateLimiter.general);

//Welcome route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Accian Nigeria Limited Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      projects: "/api/projects",
      contact: "/api/contact",
      admin: "/api/admin",
      services: "/api/services",
      testimonials: "/api/testimonials",
    },
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/contact", contactRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/testimonials", testimonialRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.path,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
