"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
//import routes
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const testimonialRoutes_1 = __importDefault(
  require("./routes/testimonialRoutes")
);
//import middleware
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const rateLimiter = __importStar(require("./middleware/rateLimiter"));
const app = (0, express_1.default)();
//security middleware
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());

//CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : process.env.NODE_ENV === "production"
  ? [
      "https://accian.co.uk",
      "https://www.accian.co.uk",
      "https://admin.accian.co.uk",
    ]
  : [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:2025",
      "http://localhost:2024",
      "http://localhost:2023",
    ];
const corsOptions = {
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
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-security-token",
    "x-timestamp",
  ],
};
app.use("/", (0, cors_1.default)(corsOptions));
//Body parser middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
//compression middleware
app.use((0, compression_1.default)());
//Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use((0, morgan_1.default)("dev"));
} else {
  app.use((0, morgan_1.default)("combined"));
}
//Rate Limiting middleware
app.use(rateLimiter.general);
//Welcome route
app.get("/", (req, res) => {
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
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});
// API Routes
app.use("/api/contact", contactRoutes_1.default);
app.use("/api/projects", projectRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/services", serviceRoutes_1.default);
app.use("/api/testimonials", testimonialRoutes_1.default);
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.path,
  });
});
// Error handling middleware (must be last)
app.use(errorHandler_1.default);
exports.default = app;
