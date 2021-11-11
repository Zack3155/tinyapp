const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

// Use EJS as its templating engine
app.set("view engine", "ejs");
// Make POST data readable
app.use(bodyParser.urlencoded({ extended: true }));
// Cookie-parser
app.use(cookieParser());

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
    const id = req.cookies["user_id"];
    const urls = urlsForUser(id);
    console.log(urlDatabase, users);

    const templateVars = {
      user: users[id],
      urls: urls
    };
    //console.log(templateVars.user.email);
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
    setShortUrl(shortURL, longURL, req.cookies["user_id"]);

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
    const id = req.cookies["user_id"];
    const templateVars = {
      user: users[id],
    };

    res.render("urls_new", templateVars);
  }
  else
    res.redirect('/login');
});
////////////////////////////////////////////////////////////////////////////

// User Login Page
app.get("/login", (req, res) => {
  const id = req.cookies["user_id"];
  const templateVars = {
    user: users[id]
  };

  if (!loggedin)
    res.render('login', templateVars);
  else
    res.redirect('/urls');
});
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);

  if (!findUserByEmail(email) || password !== user.password) {
    return res.status(403).send("Wrong Email or Passworrd, Please Enter again.");
    //return setTimeout(() => {res.redirect('/urls')}, 3000);
  }

  loggedin = true;
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});
////////////////////////////////////////////////////////////////////////////

// User Logout Page
app.post("/logout", (req, res) => {
  loggedin = false;
  res.clearCookie("user_id");
  res.redirect('/urls');
});
////////////////////////////////////////////////////////////////////////////

// User Register Page
app.get("/register", (req, res) => {
  const id = req.cookies["user_id"];

  const templateVars = {
    user: users[id]
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
  else if (findUserByEmail(email)) {
    return res.status(400).send("email already registered!");
  }

  const tmp = {
    id: generateRandomString(12),
    email: email,
    password: password
  };

  loggedin = true;
  users[tmp.id] = tmp;
  res.cookie('user_id', tmp.id);
  res.redirect('/urls');
});
////////////////////////////////////////////////////////////////////////////

// Update Long url 
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const id = req.cookies["user_id"];

  if (loggedin && urlDatabase[shortURL].userID === id) {
    setLongUrl(shortURL, longURL);
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
  const id = req.cookies["user_id"];

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

  const longURL = getLongUrl(shortURL);
  res.redirect(longURL);
});

app.get('/urls/:shortURL', function (req, res) {
  const shortURL = req.params.shortURL;
  const id = req.cookies["user_id"];

  try {
    if (urlDatabase[shortURL].userID === id) {
      const longURL = getLongUrl(shortURL);
      const templateVars = {
        user: users[id],
        'shortURL': shortURL, 'longURL': longURL
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

// Helper functions
function getLongUrl(shortURL) {
  return urlDatabase[shortURL].longURL;
};

function setShortUrl(shortURL, longURL, userID) {
  urlDatabase[shortURL] = { longURL: longURL, userID: userID };
};

function setLongUrl(shortURL, longURL) {
  urlDatabase[shortURL].longURL = longURL;
};

function generateRandomString(length) {
  return Math.random().toString(36).substr(2, length);
}

const findUserByEmail = (email) => {
  for (const id in users) {
    const user = users[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

function urlsForUser(id) {
  let tmp = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id)
      tmp[url] = urlDatabase[url];
  }
  return tmp;
}

