var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Book', new Schema({ 
    title: String, 
    genre: String, 
    author: String
}));