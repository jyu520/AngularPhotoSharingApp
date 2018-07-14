"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');
var assert = require('assert');

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();
var fs = require("fs");
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// XXX - Your submission should work without this line
var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());
// app.use(middleWare);

app.get('/', function (request, response) {
    if (request.session.login_name === undefined){
        response.status(401).send("Please Login");
        return;
    }
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    if (request.session.login_name === undefined){
        response.status(401).send("Please Login");
        return;
    }

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});
// /*
// * URL /admin/login - Login to account
// */
app.post('/admin/login', function(request, response){
    // check if in data base
    // set session
    const login_name = request.body.login_name;
    const password = request.body.password;
    
    User.find({login_name: login_name}, function(error, data){
        if (error){
            response.status(500).send(JSON.stringify(error));
        } else { 

            if (data[0] === undefined){
                response.status(400).send('This user does not exist, try again.');
            } else if (password !== data[0].password){
                response.status(400).send('Incorrect password, try again.');
            } else {
                var userData = JSON.parse(JSON.stringify(data[0]));
                request.session.user_id = userData._id;
                request.session.login_name = userData.login_name;

                response.status(200).send(userData);
            }   
        }
    });
});

app.post('/admin/logout', function(request, response){
    if (request.session.user_id === undefined){
        response.status(400).send("Not Logged in.");
        return;
    }

    delete request.session.login_name;
    delete request.session.user_id;
    request.session.destroy(function(error){
        if (error){
            response.status(500).send(JSON.stringify(error));
        } else {
            response.status(200).send();
        }
    });
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if (request.session.login_name === undefined){
        response.status(401).send("Not Logged in.");
        return;
    }

    User.find(function(err, users){
        if(err){
            console.log("Error fetching /user/list:", err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        var userList = JSON.parse(JSON.stringify(users));
        for (var i in userList){
            delete userList[i].occupation;
            delete userList[i].location;
            delete userList[i].description;
            delete userList[i].__v;
            delete userList[i].login_name;
            delete userList[i].password;
        }
        response.status(200).send(JSON.stringify(userList));
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {

    if (request.session.login_name === undefined){
        response.status(401).send("Please Login");
        return;
    }

    var id = request.params.id;

    User.findOne({ _id: id }, function(err, user){
        if(err){
            response.status(400).send("ID invalid: " + id);
            return;
        } else {
            var userObject = JSON.parse(JSON.stringify(user));
            delete userObject.__v;
            delete userObject.login_name;
            delete userObject.password;
            response.status(200).send(JSON.stringify(userObject));
        }
    });
    return;
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {

    if (request.session.login_name === undefined){
        response.status(401).send("Please Login");
        return;
    }

    var id = request.params.id;

    Photo.find({ user_id: id }, function(err, photoAlbum){
        if(err){
            response.status(400).send("ID invalid.");
            return;
        }

        var photos = JSON.parse(JSON.stringify(photoAlbum));
        // Modify comments of all photos asynchronously
        async.each(photos, function(photo, photo_callback){ // Iterator Callback Function
            if (photo === undefined){
                console.log("Err: Photo Undefined.");
                photo_callback('Photo Undefined.');
            } else {
                // remove uncessary properties
                delete photo.__v;
                // Modify each comment asynchronously
                async.each(photo.comments, function(comment, comment_callback){
                    User.findOne({ _id:  comment.user_id}, '_id first_name last_name', function(err, user){
                        if (comment === undefined){
                            comment_callback(err);
                        } else {
                            
                            delete comment.user_id;
                            var userProfile = {};
                            userProfile._id = user._id;
                            userProfile.first_name = user.first_name;
                            userProfile.last_name = user.last_name;
                            comment.user = JSON.parse(JSON.stringify(userProfile));
                            comment_callback();
                        }
                    });
    
                }, function(err){
                    if (err){
                        photo_callback(err);
                    } else{
                        photo_callback();
                    }
                });
            }

        }, function(err){ //Main Callback Function
            if (err){
                response.status(500).send(err);
            } else{
                response.status(200).send(JSON.stringify(photos));
            }
        });

    });
});

app.post('/commentsOfPhoto/:photo_id', function (request, response) {
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    if (request.body.comment.trim() === '') {
        response.status(400).send("Please Enter Valid Comment");
    }
    
    Photo.find({_id: request.params.photo_id}, function (error, data) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {
            var newComment = {
                comment: request.body.comment,
                user_id: request.session.user_id
            };
            data[0].comments = data[0].comments.concat([newComment]);

            data[0].save();

            response.status(200).end();
        }
    });
});


app.post('/photos/new', function(request, response){

    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send("No File");
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes
    
         // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;
    
        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
          if (err){
              response.status(500).send(JSON.stringify(err));
          } else {
              Photo.find({}, function(){
                var commentsArray = [];
                Photo.create({
                    file_name: filename,
                    user_id: request.session.user_id,
                    comments: commentsArray
                });
                response.status(200).send("Successfully uploaded photo");
              });
          }
        });
    });

});

app.post('/delete/:photo_id', function (request, response) {
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    Photo.remove({_id: request.params.photo_id}, function (error, data) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {
            response.status(200).end();
        }
    });
    
});


app.post('/delete/:photo_id/:comment_id', function (request, response) {
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    Photo.update({_id: request.params.photo_id}, { $pull: { "comments" : { _id: request.params.comment_id } } }, 
    
    function (error, data) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {
            response.status(200).end();
        }
    });
    
});

app.post('/delete', function (request, response) {
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    var user_id = request.session.user_id;
    // First remove all comments with this user id
    Photo.find(
        {comments: { $elemMatch: { user_id: user_id } } }, function (error, photos){
            if (error) {
                response.status(500).send(JSON.stringify(error));
            } else {
                
                async.each(photos, function(photo, photo_callback){ // Iterator Callback Function
                    
                    if (photo === undefined){
                        console.log("Err: Photo Undefined.");
                        photo_callback('Photo Undefined.');
                    } else {
                    
                        Photo.update({_id: photo._id}, { $pull: { "comments" : { user_id: user_id} } }, 

                        function (error, data) {
                            if (error) {
                                response.status(500).send(JSON.stringify(error));
                            } else {
                                response.status(200).end();
                            }
                        });
            

                    }
        
                }, function(err){ //Main Callback Function
                    if (err){
                        response.status(500).send(err);
                    } else{
                        // Remove all photos with this user ID 

                        Photo.remove({user_id: user_id}, function (error, data) {
                            if (error) {
                                response.status(500).send(JSON.stringify(error));
                            } else {
                                
                                // Remove this user 
                                User.remove({_id: user_id}, function(error, data){
                                    if (error){
                                        response.status(500).send(JSON.stringify(error));
                                    } else { 
                                        response.status(200).end();
                                    }
                                });
                            }
                        });

                    }
                }); 
            }
        }
    );

});

app.get('/sessionInfo', function (request, response) {
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    response.status(200).send(request.session);
    
});

// sort for most recent photo
app.get('/recentPhotoOf/:id', function(request, response){
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }
    
    Photo.find({user_id: request.params.id}, function (error, photos) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {
            var photo = photos.sort(function(a,b){
                return new Date(b.date_time) - new Date(a.date_time);
            })[0];
            response.status(200).send(photo);
        }
    });
});

// sort for photo with most comments
app.get('/commentedPhotoOf/:id', function(request, response){
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    Photo.find({user_id: request.params.id}, function (error, photos) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {
            var photo = photos.sort(function(a,b){
                return b.comments.length - a.comments.length;
            })[0];
            response.status(200).send(photo);
        }
    });
});

app.get('/getFavorites', function (request, response) {
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    Photo.find({user_id: request.session.user_id, favorited: true}, function(error, favorites){
        if (error){
            response.status(500).send(JSON.stringify(error));
        } else {
            response.status(200).send(favorites);
        }
    });
    
});
// sets true the favorite status on photo and adds favorited photo id into user favorites array
app.post('/addFavorite/:photo_id', function (request, response) {
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    Photo.find({_id: request.params.photo_id}, function (error, data) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {
            data[0].favorited = true;

            data[0].save();
            User.find({_id: request.session.user_id}, function(error, user){
                if (error){
                    response.status(500).send(JSON.stringify(error));
                } else {
                    user[0].favorites = user[0].favorites.concat(request.params.photo_id);
                    user[0].save();

                    response.status(200).end();
                }
            });

        }
    });
    
});
// sets false the favorite status on photo and removes favorited photo id from user favorites array
app.post('/deleteFavorite/:photo_id', function(request, response){
    if (request.session.login_name === undefined) {
        response.status(401).send("Please login");
        return;
    }

    Photo.find({_id: request.params.photo_id}, function (error, data) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {

            data[0].favorited = false;
            data[0].save();

            User.find({_id: request.session.user_id}, function(error, user){
                if (error){
                    response.status(500).send(JSON.stringify(error));
                } else {
                    
                    user[0].favorites = user[0].favorites.remove(request.params.photo_id);
                    user[0].save();

                    response.status(200).end();
                }
            });

        }
    });
    
});


app.post('/user', function (request, response) {

    User.find({login_name: request.body.login_name}, function (error, info) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {
            if (info.length === 0) {
                console.log("creating new account");
                User.create({
                    first_name: request.body.first_name,
                    last_name: request.body.last_name,
                    location: request.body.location,
                    description: request.body.description,
                    occupation: request.body.occupation,
                    login_name: request.body.login_name,
                    password: request.body.password
                });

                response.status(200).send();

            } else {
                response.status(400).send("Username taken, please choose another one.");
            }
        }
    });
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


