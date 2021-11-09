const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080; // default port 8080

// Use EJS as its templating engine
app.set("view engine", "ejs");
// Make POST data readable
app.use(bodyParser.urlencoded({ extended: true }));

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
  const templateVars = { urls: urlDatabase };
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
  res.render("urls_new");
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
  const templateVars = { 'shortURL': shortURL, 'longURL': longURL };
  res.render("urls_show", templateVars);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}