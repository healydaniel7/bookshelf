const Boom = require('boom');
const uuid = require('node-uuid');
const Joi = require('joi');

var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    Hapi = require('hapi');

var url = 'mongodb://localhost:27017/bookshelf'

var server = new Hapi.Server();
server.connection({
    port:8080
})

server.route( [
    // Get book list
    {
        method: 'GET',
        path: '/api/books',
        config: {json: {space: 2}},
        handler: function(request, reply) {
            var findObject = {};
            for (var key in request.query) {
                findObject[key] = request.query[key]
            }
            collection.find(findObject).toArray(function(error, books) {
                assert.equal(null,error);
                reply(books);
            })
        }
    },
    // Add new book
    {
        method: 'POST',
        path: '/api/books',
        handler: function(request, reply) {
        	const book = request.payload;	
        	book._id = uuid.v1();


        	collection.save(book, (err, result) => {
        		if(err) {
        			return reply(Boom.wrap(err, "Internal Error"));
        		}

        		reply(book);
        	});
        },
        config: {
        validate: {
            payload: {
                title: Joi.string().min(2).max(50).required(),
                author: Joi.string().min(2).max(50).required(),
                genre: Joi.array(),
            }
        }
    }
    },
    // Get a single book
    {
        method: 'GET',
        path: '/api/books/{id}',
        config: {json: {space: 2}},
        handler: function(request, reply) {
            collection.findOne({"_id":request.params.id}, function(error, book) {
               assert.equal(null,error);
               reply(book);
            })
        }
    },
    // Update a single book
    {
        method: 'PUT',
        path: '/api/books/{id}',
        handler: function(request, reply) {
            // request.payload variables
            reply ("Updating " + request.params.id);
        }
    },
    // Delete a single book
    {
        method: 'DELETE',
        path: '/api/books/{id}',
        handler: function(request, reply) {
            reply ("Deleting " + request.params.id).code(204);
        }
    },
    // Add a book
    {
        method: 'POST',
        path: '/api/books/add',
        handler: function(request, reply) {

        }
    },
    // Home page
    {
        method: 'GET',
        path: '/',
        handler: function(request, reply) {
            reply( "This is where the main view will be presented")
        }
    }
])

MongoClient.connect(url, function(err, db) {
    assert.equal(null,err);
    console.log("Connected to server");
    collection = db.collection('books');
    server.start(function(err) {
        console.log('Listening on http://localhost/seng')
    })
})
