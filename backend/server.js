const express = require("express");
const cors = require("cors");
const config = require("./config");
const queryRoutes = require("./routes/queryRoutes");
const companyRoutes = require("./routes/companyRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", queryRoutes);
app.use("/api", companyRoutes);
app.use("/api", contactRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("Smart Query Parser API is running");
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
