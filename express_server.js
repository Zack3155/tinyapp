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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  // const username = req.cookies.username;
  // if(!username) {
  //   return res.status(401).send('you are not logged in')
  // }
  //console.log(req.cookies);

  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  // shortURL-longURL key-value pair are saved to the urlDatabase
  urlDatabase[shortURL] = longURL;

  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`); // Redirect to '/urls/:shortURL'
});


// needs to be defined before the GET /urls/:id route
// as Express will think that new is a route parameter
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

// User Login Page
// app.get('/login', (req, res) => {
//   // if we here, we take for granted that the user is not logged in.
//   const templateVars = { username: null };
//   res.render('urls_index', templateVars);
// });
app.post("/login", (req, res) => {
  const username = req.body.username;
  console.log(username);
  res.cookie("username", username);
  res.redirect('/urls');
});

// User Logout Page
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect('/urls');
});

// Update Long url 
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// Delete url 
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL]; // delete the resource

  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get('/urls/:shortURL', function (req, res) {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = {
    username: req.cookies["username"],
    'shortURL': shortURL, 'longURL': longURL
  };
  res.render("urls_show", templateVars);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}