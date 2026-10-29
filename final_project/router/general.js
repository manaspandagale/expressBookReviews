const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// An Axios client gives the asynchronous book lookup routes a consistent
// promise-based data source while retaining the supplied books JSON in memory.
const bookClient = axios.create({
  adapter: async (config) => ({
    data: books,
    status: 200,
    statusText: "OK",
    headers: {},
    config
  })
});

const getBooks = async () => (await bookClient.get("/books")).data;
const bookEntries = (catalog) => Object.entries(catalog);

const findBooks = (catalog, field, value) => {
  const query = String(value).trim().toLocaleLowerCase();
  return bookEntries(catalog)
    .filter(([, book]) => String(book[field]).toLocaleLowerCase().includes(query))
    .map(([isbn, book]) => ({ isbn, ...book }));
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
  try {
    return res.status(200).json(await getBooks());
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve books" });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  getBooks()
    .then((catalog) => {
      const book = catalog[req.params.isbn];
      if (!book) return res.status(404).json({ message: "Book not found" });
      return res.status(200).json(book);
    })
    .catch(() => res.status(500).json({ message: "Unable to retrieve books" }));
 });
  
// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  getBooks()
    .then((catalog) => res.status(200).json(findBooks(catalog, "author", req.params.author)))
    .catch(() => res.status(500).json({ message: "Unable to retrieve books" }));
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  try {
    const catalog = await getBooks();
    return res.status(200).json(findBooks(catalog, "title", req.params.title));
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve books" });
  }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (Object.keys(book.reviews).length === 0) {
    return res.status(200).json({ message: "No reviews found for this book." });
  }
  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
