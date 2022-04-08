var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');

app.use(express.json());
app.use(cookieParser());

var monk = require('monk');
var db = monk('127.0.0.1:27017/assignment1');

app.use(express.static('public'), function(req,res,next){	
    req.db = db;
    next();
})

app.get('/', (req, res) =>{
  res.sendFile( __dirname + "/public/" + "newsfeed.html" );
});

app.get('/retrievenewslist', (req, res) => {   
  console.log(req.query.search); 
  console.log(req.query.page);
  var db = req.db;
  var col = db.get('newsList');
  var result = col.find({headline: {$regex: req.query.search}}, {sort:{time: -1}}).then((docs) => {
    //console.log(docs);
    var total_length = col.count({headline: {$regex: req.query.search}}).then((docs1) => {
      console.log(docs1);
      var start = (req.query.page - 1) * 5;
      //console.log(start);
      if(start + 4 >= docs1){
        var end = docs1;
      }else{
        var end = start + 5;
      }

      var jresult = new Object();
      jresult['news'] = [];
      var count = 0;
      for(i = start;i < end;i++){
        var content = docs[i]['content'].split(" ");
        var content_value = "";
        for(x=0;x < content.length;x++){
          if(x == 0){
            content_value += content[x];
          }else{
            content_value += " ";
            content_value += content[x];
          }
          if(x == 9){
            break;
          }
        }
        
        docs[i]['content'] = content_value;
        
        jresult['news'][count] = docs[i];
        count += 1;
      }
      jresult['total_number'] = docs1;

      if (req.cookies.userID){
        jresult['login_status'] = 1;
      }else{
        jresult['login_status'] = 0;
      }



      console.log(jresult);
      console.log(JSON.stringify(jresult));
      res.json(jresult);
  });
});
});

app.get('/displayNewsEntry', (req, res) => {   
  var db = req.db;
  var col = db.get('newsList');
  var result = col.find({_id: monk.id(req.query.newsID)}, {sort:{time: -1}}).then((news) => {
    console.log(news);
    var db = req.db;
    var col1 = db.get('userList');
    var commentsList = [];
    if(news[0]['comments']){

    
    for(i=0;i < news[0]['comments'].length;i++){
      commentsList[i] = news[0]['comments'][i]['userID'];
    }
    console.log(commentsList);
    var result1 = col1.find({_id: {"$in" :commentsList}}).then((users) => {
      console.log(users);
      if (req.cookies.userID){
        var login = 1;
      }else{
        var login = 0;
      }
      res.send(renderHTML(news, users, login));

    });
  }else{
    if (req.cookies.userID){
      var login = 1;
    }else{
      var login = 0;
    }
    res.send(renderHTML(news, [], login));
  }

});
  
});

app.get('/login', (req, res) => {   
  var newsID = req.query.newsID;
  var css = "<link rel=" + "stylesheet" + " href=" + "stylesheets/style.css" + "></link>";
  var script = "<script src=" + "javascripts/script.js" + "></script>";
  var response = "<div id=" + "main" + ">";
  var header = "<h2 id=" + "header" + ">You can log in here</h2>";
  var user_name = "<label>User Name:</label><input type=" + "text" + " id=" + "user_name" + "><br>";
  var password = "<label>Password:   </label><input type=" + "password" + " id=" + "password" + "><br>";
  var submit = "<button onclick=" + "login()" + ">Submit</button>";
  var end_main = "</div>";
  if (newsID == 0){
    var back = "<a href=" + "/newsfeed.html"+ ">Go back</a>";
  }else{
    var back = "<a href=" + "/displayNewsEntry?newsID=" + newsID + ">Go back</a>";
  }
  response = css + script + response + header + user_name + password + submit + end_main + back;
  res.send(response);
  
});

app.get('/handleLogin', (req, res) => {   
  var user_name = req.query.user_name;
  var password = req.query.password;
  var db = req.db;
  var col = db.get('userList');
  var total_length = col.find({"name": user_name, "password": password}).then((docs1) => {
    if(docs1.length > 0){
      console.log(docs1[0]['_id']);
      res.cookie('userID', docs1[0]['_id'])
      res.send("login success");
    }else{
      res.send("Username or Password incorrect");
    }   
});
});

app.get('/handleLogout', (req, res) => {   
  res.clearCookie('userID');
  res.send("logout sucess");
});
  
  
app.post('/handlePostComment', (req, res) => {
  console.log("comment");
  var comment = req.body.comment;
  var id = req.body.id;
  var time = req.body.time;
  var latest_comment = req.body.latest_comment;
  var userID = req.cookies.userID;
  console.log(time);
  console.log(id);
  console.log(comment);
  console.log(new Date(latest_comment));
  console.log(userID);


  var col = db.get('newsList');

  
  col.update({_id: id}, {$addToSet:{ "comments":{'userID': monk.id(userID), 'time': new Date(time), 'comment': comment}}}).then((result, err) => {
    if(err){
      console.log(err);
    }else{
      //console.log(result);
    }
    
    var result = col.find({_id: monk.id(id)}, {sort:{time: -1}}).then((news) => {
      console.log(news[0]);
      var news = news[0];
      var db = req.db;
      var col1 = db.get('userList');
      var commentsList = [];
      var count = 0;
      for(i=0;i < news['comments'].length;i++){
        if(new Date(news['comments'][i]['time'].toISOString()).getTime() > new Date(latest_comment).getTime()){
          commentsList[count] = news['comments'][i]['userID'];
          count += 1;
        } 
      }
      console.log(commentsList);
      var result1 = col1.find({_id: {"$in" :commentsList}}).then((users) => {
      //console.log(news);
      console.log(users);      
      var jresult = new Object();
      jresult['latest_comment'] = [];
      var count1 = 0;
      for(i=0;i<news['comments'].length;i++){
        if(new Date(news['comments'][i]['time'].toISOString()).getTime() > new Date(latest_comment).getTime()){
        var user;
        for(x=0;x<users.length;x++){      
          //console.log(monk.id(news['comments'][i]['userID']));
          //console.log(monk.id(users[x]['_id']));
        if(news['comments'][i]['userID'].equals(users[x]['_id'])){
          user = users[x];
          break;
        }
      }
        jresult['latest_comment'][count1] = new Object();
        jresult['latest_comment'][count1]['time'] = news['comments'][i]['time'];
        jresult['latest_comment'][count1]['icon'] = user['icon'];
        jresult['latest_comment'][count1]['name'] = user['name'];
        jresult['latest_comment'][count1]['comment'] = news['comments'][i]['comment'];
        count += 1;
      }    
    }
      jresult['latest_comment'].sort(custom_sort);
      //console.log(jresult);
      console.log(JSON.stringify(jresult));
      res.json(jresult);
      });
  });
});

});



function renderHTML(news, users, login){
  var script = "<script src=" + "javascripts/script.js" + "></script>";
  var css = "<link rel=" + "stylesheet" + " href=" + "stylesheets/style.css" + "></link>";
  var news = news[0];
  //console.log(news);
  //console.log(users);
  var top = `
  <div id="top">
  ` 
  
  var response = `
  <a href="/newsfeed.html">&laquo; Previous</a>
  ` 
  var news_head = `<div id=${news._id}>
  <h1>${news.headline}</h1><p>${news.time.toLocaleString()}</p></div>
  `
  var end_top = `</div>`

  var content = `
  <div id="content"><p>${news.content}</p></div>
  `

  var comment = `<div id="comments">`
  if(news['comments']){

  news['comments'].sort(custom_sort);
  //console.log("sorted");
  //console.log(news['comments']);
  for (var i = news['comments'].length - 1; i > - 1; i--){
      var comments = news['comments'][i];
      //var doc = users[i];
      for(x=0;x<users.length;x++){
        //console.log(comments['userID']);
        //console.log(users[x]['_id']);
        if((comments['userID']).equals(users[x]['_id'])){
          var doc = users[x];
          //console.log(doc);
          break;
        }
      }    
      var comments = news['comments'][i];
      var d = "<div id=" + comments['time'].toISOString() + " class=" + "comment" + ">";
      var td = `
          
          <img src=${doc.icon}>
          <p>${doc.name}</p>
          <div class="time_and_comments"><p class='time'>${new Date(comments.time).toLocaleString()}</p><br><p>${news.comments[i].comment}</p></div>
          </div>
      `
      comment += d;
      comment += td;
  }
}
  comment += `</div>`

  if(login == 1){
    var login = `
  <div id="post"><input type="text" id="comment" placeholder="Add a comment"><button onclick="postComment()">post comment</button></div>
  `
  }else{
    var login = `
  <div id="post"><input type="text" disabled><button onclick="location.href='/login?newsID=${news._id}'" type="button">login to comment</button></div>
  `
  }
  
  return css + script + top + response + news_head + end_top + content + comment + login;
}

function custom_sort(a, b) {
  return new Date(a.time).getTime() - new Date(b.time).getTime();
}


// launch the server with port 8081
var server = app.listen(8081, () => {
	var host = server.address().address
	var port = server.address().port
	console.log("lab5 app listening at http://%s:%s", host, port)
});
