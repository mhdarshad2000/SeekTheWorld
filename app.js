const createError = require('http-errors');
const express = require('express');
const path = require('path');
const  cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars');
const session = require('express-session')
const nocache = require("nocache");
const dotenv = require('dotenv')

dotenv.config()

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// app.engine('hbs', hbs.engine({
//   extname: 'hbs',
//   defaultLayout: 'layout',
//   layoutsDir: __dirname + '/views/layout/',
//   partialsDir: __dirname + '/views/partials'
// }))
app.engine('hbs', hbs.engine({helpers:{inc: function(value, option){
  return parseInt(value)+1;
}},extname: 'hbs',defaultLayout: 'layout', layoutsDir:__dirname + '/views/layout', partialDir:__dirname + '/views/partials'}));



app.use(nocache());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: 'seek the world',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge:600000 }
}))
app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.render('user/errorPage')
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // // render the error page
  // res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
