const Boom = require('boom');
const uuid = require('node-uuid');
const Joi = require('joi');
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config/config'); // get our config file
var User   = require('./models/user'); // get our mongoose model

var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    Hapi = require('hapi');

//var url = 'mongodb://healy108:T!mothy5391@cluster0-shard-00-00-zi4s3.mongodb.net:27017,cluster0-shard-00-01-zi4s3.mongodb.net:27017,cluster0-shard-00-02-zi4s3.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin'

var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// API ROUTES -------------------
// we'll get to these in a second

var apiRoutes = express.Router();

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token with only our given payload
    // we don't want to pass in the entire user since that has the password
    const payload = {
      admin: user.admin 
    };
        var token = jwt.sign(payload, app.get('superSecret'), {
          expiresIn: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
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

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });

  }
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the API' });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

apiRoutes.post('/users', function(req, res) {

  // create a sample user
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

  // save the sample user
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
    // save the sample user
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

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('api at http://localhost:' + port);


