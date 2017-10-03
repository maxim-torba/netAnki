var express = require('express');
var path = require('path');
var log = require('./libs/log')(module);
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');

var compression = require('compression');


var routes = require('./routes/index');
var users = require('./routes/users');
var words = require('./routes/words');

var config = require('./libs/config');

var app = express();

app.use(compression()); //compress

app.use(favicon(path.join(__dirname, './public/img/favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Set .html as the default template extension
app.set('view engine', 'html');

// Initialize the ejs template engine
app.engine('html', require('ejs').renderFile);

// Tell express where it can find the templates
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public', {maxAge: 86400000}));

app.use(session({
    secret: 'rhwP9gjBkv',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        url: config.get('mongoose:uri')/*process.env.OPENSHIFT_MONGODB_DB_URL*/
    })
}));

app.use('/', routes);
app.use('/users', users);
app.use('/words', words);


app.all('*', function (req, res) {
    res.redirect('/');
});

/*if ('development' == app.get('env')) {
 app.use(errorHandler());
 }
 */

var server_port = process.env.PORT || 8080;
var server_ip_address = process.env.IP || '127.0.0.1';

app.listen(server_port, server_ip_address, function () {
    console.log("Listening on " + server_ip_address + ", server_port " + server_port)
});


