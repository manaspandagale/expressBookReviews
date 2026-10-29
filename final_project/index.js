const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
  const header = req.headers.authorization || "";
  const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  const accessToken = bearerToken || req.session.authorization?.accessToken;
  if (!accessToken) return res.status(401).json({ message: "Authentication required" });

  try {
    req.user = jwt.verify(accessToken, "access");
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
});
 
const PORT = process.env.PORT || 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
