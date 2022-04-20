const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  res.send("Hello!");
});
app.listen(PORT, () => {
  console.log(`TinyURL listening on port ${PORT}!`);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//way to check all the values of the database as a json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//page to add new urls
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});
//response after adding a new page
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//page showing all current urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});
//url deletion from /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//edit page for a single url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});
//update link that the shortened url leads to
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

//redirect from the shortened url to the associated website
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//brings user to login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("user_login", templateVars);
});
//logs user in and stores a cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const validEmail = isEmailInDatabase(email, users);
  if (!validEmail) {
    res.sendStatus(403);
    return;
  };
  const password = req.body.password;
  if (users[validEmail].password !== password) {
    res.sendStatus(403);
    return;
  }
  // res.cookie("username", req.body.username);
  res.redirect("/urls");
});
//logs user out and removes the cookie
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

//brings user to registration page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("user_registration", templateVars);
});
//creates a new user when someone registers
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //error handling for empty registration field
  if (!email || !password) {
    res.sendStatus(400);
    return;
  }
  if (isEmailInDatabase(email, users)) {
    res.sendStatus(400);
    return;
  }
  const id = generateRandomString();
  users[id] = { id, email, password };
  res.cookie("user_id", id);
  res.redirect("/urls");
});
