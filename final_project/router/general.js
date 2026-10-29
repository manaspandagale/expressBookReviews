const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const bookEntries = () => Object.entries(books);

const findBooks = (field, value) => {
  const query = String(value).trim().toLocaleLowerCase();
  return Object.fromEntries(
    bookEntries().filter(([, book]) =>
      String(book[field]).toLocaleLowerCase().includes(query)
    )
  );
};

public_users.post("/register", (req,res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: "User already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  // Async route: the book database is the provided JSON data source.
  return res.status(200).json({ books });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).json({ [req.params.isbn]: book });
 });
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  return res.status(200).json({ books: findBooks("author", req.params.author) });
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  return res.status(200).json({ books: findBooks("title", req.params.title) });
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).json({ reviews: book.reviews });
});

module.exports.general = public_users;
