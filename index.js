const url = require("url");
const { AsgardeoExpressClient } = require("@asgardeo/auth-express");
const cookieParser = require("cookie-parser");
const express = require("express");
const rateLimit = require("express-rate-limit");
const config = require("./config.json");

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
app.use("/home", express.static("static"));

AsgardeoExpressClient.getInstance(config);

const onSignIn = (res) => {
  res.redirect("/home");
}

const onSignOut = (res) => {
  res.redirect("/");
}

const onError = (res, error) => {
  res.redirect(
    url.format({
      pathname: "/",
      query: {
        message: error && error.message
      }
    })
  );
}

app.use(AsgardeoExpressClient.asgardeoExpressAuth(onSignIn, onSignOut, onError));


const dataTemplate = {
  authenticateResponse: null,
  error: false,
  errorMessage: "",
  idToken: null,
  isAuthenticated: true,
  isConfigPresent: Boolean(config && config.clientID && config.clientSecret)
};

app.get("/", async (req, res) => {
  let data = { ...dataTemplate };
  data.error = req.query.message ? true : false;
  data.errorMessage =
    req.query.message ||
    "Something went wrong during the authentication process.";
  res.render("landingPage", data);
});

const authCallback = (res, error) => {
  res.redirect(
    url.format({
      pathname: "/",
      query: {
        message: error
      }
    })
  );

  return true;
};

const isAuthenticated = AsgardeoExpressClient.protectRoute(authCallback);

app.get("/home", isAuthenticated, async (req, res) => {
  const data = { ...dataTemplate };

  try {
    data.idToken = data.isAuthenticated
      ? await req.asgardeoAuth.getIDToken(req.cookies.ASGARDEO_SESSION_ID)
      : null;

    data.authenticateResponse = data.isAuthenticated
      ? await req.asgardeoAuth.getBasicUserInfo(req.cookies.ASGARDEO_SESSION_ID)
      : {};

    data.error = req.query.error === "true";

    res.render("homePage", data);
  } catch (error) {
    res.render("homePage", { ...data, error: true });
  }
});

app.listen(PORT, () => {
  console.log(`Server Started at PORT ${PORT}`);
});
