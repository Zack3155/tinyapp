const { generateRandomString, getUserByEmail } = require('./helpers');

const bcrypt = require('bcryptjs');
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const app = express();
const PORT = 8080; // default port 8080

// Use EJS as its templating engine
app.set("view engine", "ejs");
// Make POST data readable
app.use(bodyParser.urlencoded({ extended: true }));
// Cookie Session
app.use(cookieSession({
  name: 'session',
  keys: ['Hello', 'World'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

////////////////////////////////////////////////////////////////////////////
// related data
let loggedin = false;
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },

  // Built In Helper functions
  getLongUrl: function (shortURL) {
    return this[shortURL].longURL;
  },
  setShortUrl: function (shortURL, longURL, userID) {
    this[shortURL] = { longURL: longURL, userID: userID };
  },
  setLongUrl: function (shortURL, longURL) {
    this[shortURL].longURL = longURL;
  },
  urlsForUser: function (id) {
    let tmp = {};
    for (const url in this) {
      if (this[url].userID === id)
        tmp[url] = this[url];
    }
    return tmp;
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

////////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  if (!loggedin)
    res.redirect('/login');
  else
    res.redirect('/urls');
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
////////////////////////////////////////////////////////////////////////////

// Main requests
app.get("/urls", (req, res) => {
  if (loggedin) {
    //const id = req.cookies["user_id"];
    const id = req.session.user_id;
    const urls = urlDatabase.urlsForUser(id);
    console.log(urlDatabase, users, urls);

    const templateVars = {
      user: users[id],
      urls: urls,
      loggedin: loggedin
    };
    res.render("urls_index", templateVars);
  }
  else {
    //res.redirect('/login');
    return res.status(401).send("Please Login to Access");
  }
});

// Generates a short URL, saves it, and associates it with the user
app.post("/urls", (req, res) => {
  if (loggedin) {
    const shortURL = generateRandomString(6);
    const longURL = req.body.longURL;
    // shortURL-longURL key-value pair are saved to the urlDatabase
    urlDatabase.setShortUrl(shortURL, longURL, req.session.user_id);

    console.log(req.body);  // Log the POST request body to the console
    res.redirect(`/urls/${shortURL}`); // Redirect to '/urls/:shortURL'
  }
  else {
    //res.redirect('/login');
    return res.status(401).send("Please Login to Access");
  }
});
////////////////////////////////////////////////////////////////////////////

// needs to be defined before the GET /urls/:id route
// as Express will think that new is a route parameter
app.get("/urls/new", (req, res) => {
  if (loggedin) {
    //const id = req.cookies["user_id"];
    const id = req.session.user_id;
    const templateVars = {
      user: users[id],
      loggedin: loggedin
    };

    res.render("urls_new", templateVars);
  }
  else
    res.redirect('/login');
});
////////////////////////////////////////////////////////////////////////////

// User Login Page
app.get("/login", (req, res) => {
  //const id = req.cookies["user_id"];
  const id = req.session.user_id;
  const templateVars = {
    user: users[id],
    loggedin: loggedin
  };

  if (!loggedin)
    res.render('login', templateVars);
  else
    res.redirect('/urls');
});
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Wrong Email or Passworrd, Please Enter again.");
    //return setTimeout(() => {res.redirect('/urls')}, 3000);
  }

  loggedin = true;
  //res.cookie('user_id', user.id);
  req.session.user_id = user.id;
  res.redirect('/urls');
});
////////////////////////////////////////////////////////////////////////////

// User Logout Page
app.post("/logout", (req, res) => {
  loggedin = false;
  req.session = null;
  res.redirect('/urls');
});
////////////////////////////////////////////////////////////////////////////

// User Register Page
app.get("/register", (req, res) => {
  //const id = req.cookies["user_id"];
  const id = req.session.user_id;

  const templateVars = {
    user: users[id],
    loggedin: loggedin
  };
  if (!loggedin)
    res.render('register', templateVars);
  else
    res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("email or password cannot be blank");
  }
  else if (getUserByEmail(email, users)) {
    return res.status(400).send("email already registered!");
  }

  const tmp = {
    id: generateRandomString(12),
    email: email,
    password: bcrypt.hashSync(password, 10)
  };

  loggedin = true;
  users[tmp.id] = tmp;
  //res.cookie('user_id', tmp.id);
  req.session.user_id = tmp.id;
  res.redirect('/urls');
});
////////////////////////////////////////////////////////////////////////////

// Update Long url 
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  //const id = req.cookies["user_id"];
  const id = req.session.user_id;

  if (loggedin && urlDatabase[shortURL].userID === id) {
    urlDatabase.setLongUrl(shortURL, longURL);
    res.redirect('/urls');
  }
  else {
    //res.redirect('/login');
    return res.status(401).send("Please Login Corresponding Account to Access");
  }
});
////////////////////////////////////////////////////////////////////////////

// Delete url 
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  //const id = req.cookies["user_id"];
  const id = req.session.user_id;

  if (loggedin && urlDatabase[shortURL].userID === id) {
    delete urlDatabase[shortURL]; // delete the resource
    res.redirect('/urls');
  }
  else {
    //res.redirect('/login');
    return res.status(401).send("Please Login Corresponding Account to Access");
  }
});
////////////////////////////////////////////////////////////////////////////

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL])
    return res.status(401).send("Shorten URL Does Not Exist.");

  const longURL = urlDatabase.getLongUrl(shortURL);
  res.redirect(longURL);
});

app.get('/urls/:shortURL', function (req, res) {
  const shortURL = req.params.shortURL;
  //const id = req.cookies["user_id"];
  const id = req.session.user_id;

  try {
    if (urlDatabase[shortURL].userID === id) {
      const longURL = urlDatabase.getLongUrl(shortURL);
      const templateVars = {
        user: users[id],
        'shortURL': shortURL, 'longURL': longURL,
        loggedin: loggedin
      };
      res.render("urls_show", templateVars);
    }
    else {
      //res.redirect('/login');
      return res.status(401).send("Please Login Corresponding Account to Access");
    }
  }
  catch (err) {
    return res.status(401).send("Shorten URL Does Not Exist.");
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
////////////////////////////////////////////////////////////////////////////

