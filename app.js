
require('dotenv').config()


const express=require("express");
const bodyparser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportlocal=require("passport-local-mongoose");
const bcrypt=require("bcrypt");
const app=express();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate')
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({extended:true}));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userdb",{useNewUrlParser:true,useUnifiedTopology: true});

mongoose.set("useCreateIndex",true);
const userschema=new mongoose.Schema({
	email:String,
	password:String,
	googleId:String,
	secret:String
});


userschema.plugin(passportlocal);
userschema.plugin(findOrCreate);

const user=new mongoose.model("user",userschema);
passport.use(user.createStrategy());

passport.serializeUser(function(user,done){
	done(null,user.id);
});
passport.deserializeUser(function(id,done){
	user.findById(id,function(err,user){


	done(err,user);
});
});

passport.use(new GoogleStrategy({
    clientID:process.env.client_id,
    clientSecret:process.env.client_secret,
    callbackURL: "http://localhost:30000/auth/google/secrets",
   //userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
  	console.log(profile),
    user.findOrCreate({ googleId:profile.id }, function (err,user) {
      return cb(err,user);
    });
  }
));



app.get("/",function(request,response){
	response.render("home");
});
app.get("/auth/google",
	passport.authenticate("google",{scope:["profile"]})
);
app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/a");
  });

app.get("/login",function(request,response){
	response.render("login");
});


app.get("/register",function(request,response){
	response.render("register");
});
app.get("/a",function(request,response){
	user.find({"secret":{$ne:null}},function(err,foundUser){
		if(err){
			consolg.log(err);
		}else{
			if(foundUser){
				response.render("a",{usersWithSecrets:foundUser});
			}
		}
	})
});
app.get("/logout",function(request,response){
	request.logout();
	response.redirect("/")
})

app.get("/submit",function(request,response){
	if(request.isAuthenticated()){
		response.render("submit");
	}else{
		response.redirect("/login");
	}
	});

app.post("/submit",function(request,response){
	const submitedSecrete=request.body.secret;
    console.log(request.user.id);
    user.findById(request.user.id,function(err,foundUser){
    	if(err){
    		console.log(err);

    	}else{
    		if(foundUser){
    			foundUser.secret=submitedSecrete;
    			foundUser.save(function(){
    				response.redirect("/a")
    			});
    		}

    	}
    });
})

app.post("/register",function(request,response){
	user.register({username:request.body.username},request.body.password,function(err,user){
		if(err){
			console.log(err);
			response.render("/register");
		
		}else{
			passport.authenticate("local")(request,response,function(){
				response.render("/a")
			});
		}
	///bcrypt.hash(request.body.password,saltRounds, function(err,hash){
      //  const newuser=new user({
		//email:request.body.username,
		//password:hash

	//});
//	newuser.save(function(err){
//		if(err){//
		//	console.log(err);
	//	}else{
//			response.render("secrete");
//			console.log("register sucessfull!")/
		//}


	

//	});
//	});*/
	
});
});

app.post("/login",function(request,response){
	const user=new user({
    username:request.body.username,
    password:request.body.password
	});

	request.login(user,function(err){
		if(err){
			console.log(err);

		}else{
			passport.authenticate("local")(request,response,function(){
				response.render("a")

		});
	}
});
});

/*user.findOne({email:username},function(err,foundUser){
	if(err){

		console.log(err);
	}
	else{
		if (foundUser) {
			bcrypt.compare(password,foundUser.password,function(err,res){
            if(res===true){
                	
                	response.render("secrete");}
			});
	}
		}	
		
	
	});*/
	



	
app.listen(30000,function(){
	console.log("server is running on port number 3000");
});



