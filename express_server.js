const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const res = require("express/lib/response");
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");
const bcrypt = require('bcryptjs');

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'user_id',
  secret: 'longstringtomakesurecookiesessionworks1234'
}));
const salt = bcrypt.genSaltSync(10);

const PORT = 8080;
const urlDatabase = {
};
const users = {
};

//Root domain sends users to login if not logged in or their personal page if they are
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login")
  }
  return res.redirect("/urls");
});

//way to check all the values of the database as a json
app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});

//page to add new urls
app.get("/urls/new", (req, res) => {
  //redirect to login if not signed in
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.session.user_id] };
  return res.render("urls_new", templateVars);
});

//page showing all current urls
app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  const urls = urlsForUser(user, urlDatabase);
  const templateVars = { urls: urls, user: users[user] };
  //error if user isn't signed in
  if (!user) {
    templateVars.status = "You must be logged in to view this page.";
    return res.status(403).render("error", templateVars);
  }
  return res.render("urls_index", templateVars);
});

//response after adding a new page
app.post("/urls", (req, res) => {
  //error if user isn't signed in
  if (!req.session.user_id) {
    templateVars.user = users[req.session.user_id];
    templateVars.status = "You do not have access to this page";
    return res.status(403).render("error", templateVars);
  }
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { shortURL };
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.session.user_id;
  return res.redirect(`/urls/${shortURL}`);
});

//url deletion from /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  const templateVars = {}
  const shortURL = req.params.shortURL;
  const user = req.session.user_id;
  const urls = urlsForUser(user, urlDatabase);
  //redirect if user doesn't have permission to delete url
  if (!urls[shortURL]) {
    templateVars.user = users[req.session.user_id];
    templateVars.status = "You do not have access to this page";
    return res.status(403).render("error", templateVars);
  }
  delete urlDatabase[shortURL];
  return res.redirect("/urls");
});

//edit page for a single url
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const user = req.session.user_id;
  const urls = urlsForUser(user, urlDatabase);
  //redirect if user didn't create this short url
  if (!urls[shortURL]) {
    const templateVars = { user: users[req.session.user_id] };
    templateVars.status = "You do not have access to this page";
    return res.status(403).render("error", templateVars);
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };
  return res.render("urls_show", templateVars);
});

//update link that the shortened url leads to
app.post("/urls/:id", (req, res) => {
  const templateVars = {};
  const id = req.params.id;
  const user = req.session.user_id;
  const urls = urlsForUser(user, urlDatabase);
  //deny url update for anyone other than the creator of the link
  if (!urls[id]) {
    templateVars.user = users[req.session.user_id];
    templateVars.status = "You do not have access to this page";
    return res.status(403).render("error", templateVars);
  }
  urlDatabase[id].longURL = req.body.longURL;
  return res.redirect(`/urls/${req.params.id}`);
});

//redirect from the shortened url to the associated website
app.get("/u/:shortURL", (req, res) => {
  const templateVars = {}
  //show error if a shortened url doesn't exist
  if (!urlDatabase[req.params.shortURL]) {
    templateVars.user = users[req.session.user_id];
    templateVars.status = "This url does not exist";
    return res.status(404).render("error", templateVars);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect(longURL);
});

//brings user to login page
app.get("/login", (req, res) => {
  //redirect if already logged in
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.session.user_id] };
  return res.render("user_login", templateVars);
});

//logs user in and stores a cookie
app.post("/login", (req, res) => {
  const templateVars = {};
  const email = req.body.email;
  const validEmail = getUserByEmail(email, users);
  //redirect if invalid email is used
  if (!validEmail) {
    templateVars.user = users[req.session.user_id];
    templateVars.status = "Your email is incorrect";
    return res.status(403).render("error", templateVars);
  }
  const hashedPassword = users[validEmail].password;
  const password = req.body.password;
  //redirect if incorrect password is input
  if (!bcrypt.compareSync(password, hashedPassword)) {
    templateVars.user = users[req.session.user_id];
    templateVars.status = "Your password is incorrect";
    return res.status(403).render("error", templateVars);
  }
  req.session.user_id = validEmail;
  return res.redirect("/urls");
});

//logs user out and removes the cookies
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.clearCookie('user_id.sig');
  return res.redirect("/urls");
});

//brings user to registration page
app.get("/register", (req, res) => {
  //redirect if already logged in
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.session.user_id] };
  return res.render("user_registration", templateVars);
});

//creates a new user when someone registers
app.post("/register", (req, res) => {
  const templateVars = {};
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, salt);
  //deny registration for empty email or password fields
  if (!email || !password) {
    templateVars.user = users[req.session.user_id];
    templateVars.status = "The email or password is invalid";
    return res.status(400).render("error", templateVars);
  }
  //deny registration for already used emails
  if (getUserByEmail(email, users)) {
    templateVars.user = users[req.session.user_id];
    templateVars.status = "There is already an account registered to this email";
    return res.status(400).render("error", templateVars);
  }
  const id = generateRandomString();
  users[id] = { id, email, password: hashedPassword };
  req.session.user_id = id;
  return res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyURL listening on port ${PORT}!`);
});