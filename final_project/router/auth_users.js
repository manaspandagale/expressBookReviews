const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  return users.some((user) => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
  return users.some((user) => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body || {};
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: "Login successful!", accessToken });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  const { review } = req.body || {};
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (!review || !String(review).trim()) {
    return res.status(400).json({ message: "A review is required" });
  }

  const username = req.user.username;
  book.reviews[username] = String(review).trim();
  return res.status(200).json({ message: "Review added/updated successfully", reviews: book.reviews });
});

// Delete the current user's review for a book.
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });

  const username = req.user.username;
  if (!Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res.status(404).json({ message: "No review found for this user" });
  }

  delete book.reviews[username];
  return res.status(200).json({ message: `Review for ISBN ${req.params.isbn} deleted` });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
