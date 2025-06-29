require("dotenv").config();
require("express-async-errors");
const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./models");

// Get the routes
const boxRoutes = require("./routes/boxRoutes");
const productRoutes = require("./routes/productRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const truckRoutes = require("./routes/truckRoutes");
const wasteRoutes = require("./routes/wasteRoutes");
const chargeRoutes = require("./routes/chargeRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const tripRoutes = require("./routes/tripRoutes");
const paymentRoutes = require("./routes/paymentEmployeeRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const defaultRoutes = require("./routes/defaultValuesRoutes");
const authRoutes = require("./routes/authRoutes");


const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// Set Packages
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.get("/", (req, res) => {
  res.send(`WELCOME TO THE APPLICATION..`);
});
app.use("/api/v1/box", boxRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/supplier", supplierRoutes);
app.use("/api/v1/truck", truckRoutes);
app.use("/api/v1/waste", wasteRoutes);
app.use("/api/v1/charges", chargeRoutes);
app.use("/api/v1/purchase", purchaseRoutes);
app.use("/api/v1/trip", tripRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/revenue", revenueRoutes);
app.use("/api/v1/default", defaultRoutes);
app.use("/api/v1/auth", authRoutes);

// SET THE MIDDLEWARES
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

const PORT = process.env.PORT || 5000;


const start = () => {
  try {
    db.sequelize.sync({ force: false }).then(() => {
      app.listen(PORT, () =>
        console.log(`The Application is running in PORT : ${PORT}`)
      );
    });
  } catch (error) {
    console.log(error);
  }
};
start();
