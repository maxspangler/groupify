const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
const passport = require('passport');

// Load Models
require("./models/User");
require("./models/Group");

// Load Routes
const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const revenueRoutes = require('./routes/revenue');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');

// Passport Config
require('./config/passport')(passport);

// Load Config
const keys = require('./config/keys');


mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, {
  }) 
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.log(err));

  
const app = express();

// Configure Express Session
app.use(session({
  cookie: { maxAge: 8*60*60*1000 },
  saveUninitialized: true,
  resave: true,
  secret: 'secret'
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Initialize Connect - Flash
app.use(flash());

// Configure Body - Parser
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


// Configure Method - Override
app.use(methodOverride('_method'));

// Configure Handlebars Middleware
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Serve Static Resources
app.use(express.static(path.join(__dirname, '/public')));

// Set Header Middleware
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Global Variables
app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  if(res.locals.user) {
     let user = res.locals.user;
    if(user.role === 'Sales Agent') {
      res.locals.sales = true;
    }
    else if(user.role === 'Revenue Manager') {
      res.locals.revenue = true;
    }
    res.locals.role = JSON.stringify(req.user.role)
  }
  next();
});


app.use('/', indexRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/revenue', revenueRoutes);
app.use('/sales', salesRoutes);
app.use('/reports', reportRoutes);



const port = process.env.PORT || 3000;

app.listen(port, ()=> {
  console.log(`Server started on port ${port}`);
});
