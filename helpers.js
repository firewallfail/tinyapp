//Functions
//convert a random number to hex and then take a 6 digit slice of it
const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8);
};
//check if an email is already in the users object
const getUserByEmail = (email, users) => {
  for (const user in users) {
    if (email === users[user].email) {
      return user;
    }
  }
  return false;
};
//return a new object for urls a user has access to
const urlsForUser = (id, urlDatabase) => {
  const userUrls = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};