const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
const res = require("express/lib/response");
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//remove dummy login
const users = {
  admin: {
    id: "admin",
    email: "admin@admin.com",
    password: "admin"
  }
};

//convert a random number to hex and then take a 6 digit slice of it
const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8);
};
//check if an email is already in the users object
const isEmailInDatabase = (email, users) => {
  for (const user in users) {
    if (email === users[user].email) {
      return user;
    }
  }
  return false;
};

app.get("/", (req, res) => {
  return res.send("Hello!");
});
app.listen(PORT, () => {
  console.log(`TinyURL listening on port ${PORT}!`);
});
app.get("/hello", (req, res) => {
  return res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//way to check all the values of the database as a json
app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});

//page to add new urls
app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.cookies.user_id] };
  return res.render("urls_new", templateVars);
});
//page showing all current urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  return res.render("urls_index", templateVars);
});
//response after adding a new page
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.sendStatus(403);
  }
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  return res.redirect(`/urls/${shortURL}`);
});

//url deletion from /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  return res.redirect("/urls");
});

//edit page for a single url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.user_id] };
  return res.render("urls_show", templateVars);
});
//update link that the shortened url leads to
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  return res.redirect(`/urls/${req.params.id}`);
});

//redirect from the shortened url to the associated website
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  return res.redirect(longURL);
});

//brings user to login page
app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.cookies.user_id] };
  return res.render("user_login", templateVars);
});
//logs user in and stores a cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const validEmail = isEmailInDatabase(email, users);
  if (!validEmail) {
    return res.sendStatus(403);
  };
  const password = req.body.password;
  if (users[validEmail].password !== password) {
    return res.sendStatus(403);
  }
  res.cookie("user_id", validEmail);
  return res.redirect("/urls");
});
//logs user out and removes the cookie
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  return res.redirect("/urls");
});

//brings user to registration page
app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.cookies.user_id] };
  return res.render("user_registration", templateVars);
});
//creates a new user when someone registers
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //error handling for empty registration field
  if (!email || !password) {
    return res.sendStatus(400);
  }
  if (isEmailInDatabase(email, users)) {
    return res.sendStatus(400);
  }
  const id = generateRandomString();
  users[id] = { id, email, password };
  res.cookie("user_id", id);
  return res.redirect("/urls");
});
