const mongoose = require('mongoose');

let utilisateur = new mongoose.Schema({
    username: String,
    password: String
});

module.exports = utilisateur;