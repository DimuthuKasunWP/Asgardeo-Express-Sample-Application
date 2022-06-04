const cookieParser = require("cookie-parser");
const express = require("express");
const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  max: 100,
  windowMs: 1 * 60 * 1000
});

const PORT = 3000;


const app = express();

app.use(cookieParser());
app.use(rateLimiter);

app.set("view engine", "ejs");

app.use("/", express.static("static"));

app.get("/", async (req, res) => {
  res.render("landingPage");
});

app.listen(PORT, () => {
  console.log(`Server Started at PORT ${PORT}`);
});
