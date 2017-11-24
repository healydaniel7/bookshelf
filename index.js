const Boom = require('boom');
const uuid = require('node-uuid');
const Joi = require('joi');
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); 
var config = require('./config/config'); 
var User   = require('./models/user'); 
var Book   = require('./models/book'); 

var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    Hapi = require('hapi');

//var url = 'mongodb://healy108:T!mothy5391@cluster0-shard-00-00-zi4s3.mongodb.net:27017,cluster0-shard-00-01-zi4s3.mongodb.net:27017,cluster0-shard-00-02-zi4s3.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin'

var port = process.env.PORT || 8080; 
mongoose.connect(config.database); 
app.set('superSecret', config.secret); 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', function(req, res) {
    res.send('API is at http://localhost:' + port + '/api');
});

var apiRoutes = express.Router();

app.get('/api/books', function(req, res) {
  Book.find({}, function(err, books) {
    res.json(books);
  });
});
app.post('/api/books', function(req, res) {

  var book = new Book({ 
    title: req.body.title, 
    genre: req.body.genre,
    author: req.body.author
  });

  book.save(function(err) {
    if (err) throw err;

    console.log('Book saved successfully');
    res.json({ success: true });
  });
});

app.get('/api/books/:id', function(req, res) {
  Book.findById(req.params.id, function(err, book) {
    res.json(book);
  });
});

app.put('/api/books/:id', function(req, res) {
  Book.findById(req.params.id, function(err, book) {
    if(req.body.title && book.title != req.body.title){
        book.title = req.body.title;
    }
    if(req.body.author && book.author != req.body.author){
        book.author = req.body.author;
    }
    if(req.body.genre && book.genre != req.body.genre){
        book.genre = req.body.genre;
    }
    // save the sample user
    book.save(function(err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({ success: true });
    });
  });
});

app.delete('/api/books/:id', function(req, res) {
    Book.remove({
    _id: req.params.id
    }, function (err, book) {
    if (err)
      return console.error(err);

    console.log('Book successfully removed from polls collection!');
    res.status(200).send();


    });
});

app.get('/api/books/genre/:genre', function(req, res) {
  Book.find({genre: req.params.genre}, function(err, book) {
    res.json(book);
  });
});

app.get('/api/books/author/:author', function(req, res) {
  Book.find({author: req.params.author}, function(err, book) {
    res.json(book);
  });
});

apiRoutes.post('/authenticate', function(req, res) {

  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

    const payload = {
      admin: user.admin 
    };
        var token = jwt.sign(payload, app.get('superSecret'), {
          expiresIn: 1440 
        });

        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   

    }

  });
}); 

apiRoutes.use(function(req, res, next) {

  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {

    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });

  }
});

apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the API' });
});

apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

apiRoutes.post('/users', function(req, res) {

  var user = new User({ 
    name: req.body.name, 
    password: req.body.password
  });
  if(req.body.admin &&req.body.admin == "true"){
    user.admin = true;
  }
  else{
    user.admin = false;
  }

  user.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
}); 

apiRoutes.get('/user/:id', function(req, res) {
  User.findById(req.params.id, function(err, user) {
    res.json(user);
  });
});

apiRoutes.put('/user/:id', function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if(req.body.name && user.name != req.body.name){
        user.name = req.body.name;
    }
    if(req.body.password && user.password != req.body.password){
        user.password = req.body.password;
    }
    if(req.body.admin && req.body.admin == "true"){
        user.admin = true;
    }
    else{
        user.admin = false;
    }
    user.save(function(err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({ success: true });
    });
  });
});

apiRoutes.delete('/user/:id', function(req, res) {
    User.remove({
    _id: req.params.id
    }, function (err, user) {
    if (err)
      return console.error(err);

    console.log('User successfully removed from polls collection!');
    res.status(200).send();


    });
});

app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('api at http://localhost:' + port);


