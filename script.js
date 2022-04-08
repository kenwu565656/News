function loadNewsList(pageindex){
    var xmlhttp = new XMLHttpRequest();
    if(document.getElementById("search").value != null){
        var search = document.getElementById("search").value;
    }else{
        var search = "";
    }
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            var result = JSON.parse(xmlhttp.responseText);
            console.log(result);
            if(result['login_status'] == 1){
                document.getElementById("login").innerHTML = "Login out";
                document.getElementById("login").addEventListener("click", logout);
                document.getElementById("login")['href'] = "#";
            }else{
                document.getElementById("login").innerHTML = "Login in";
                document.getElementById("login")['href'] = "/login?newsID=0";
                document.getElementById("login").removeEventListener("click", logout);
            }
            document.getElementById("news").replaceChildren();
            for (i = 0; i < result['news'].length; i++){
                var test = document.createElement("p");
                test.innerHTML = "<a href=" + "/displayNewsEntry?newsID=" + result['news'][i]['_id'] +">" + result['news'][i]['headline'] + "</a>" + "<br>" + new Date(result['news'][i]['time']).toLocaleString() + "<br>" + result['news'][i]['content'];
                document.getElementById("news").appendChild(test);
            }
            document.getElementById("pageindex").replaceChildren();
            for (i = 0; i < result['total_number'] / 5; i++){
                var page = document.createElement("a");
                page.innerHTML = (i + 1).toString();
                page.style.width = ((1 / Math.ceil(result['total_number'] / 5)) * 100).toString() + "%";
                if(i == pageindex - 1){
                    page.classList.add("current");
                }
                // page.onclick = loadNewsList(parseInt(this.innerHTML));
                page.addEventListener('click', function(){
                    loadNewsList(parseInt(this.innerHTML))
                });
                document.getElementById("pageindex").appendChild(page);
            }
        }
    }

    xmlhttp.open("GET", "retrievenewslist?search=" + search + "&page=" + pageindex, true);
    xmlhttp.send();
}

function postComment(){
    if(document.getElementById("comment").value != null && document.getElementById("comment").value != ""){
        var comment = document.getElementById("comment").value;
        var id = document.getElementsByTagName('div')[1].id;
        if(document.getElementById("comments").getElementsByClassName('comment')[0]){
            var latest_comment = document.getElementById("comments").getElementsByClassName('comment')[0].id;
        }else{
            var latest_comment = -8640000000000000;
        }
        
        console.log(latest_comment);
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            //document.getElementById("comments").replaceChildren();
            var result = JSON.parse(xmlhttp.responseText);
            console.log(result);
            var total = result['latest_comment'].length;
            for (i = 0; i < total; i++){
                console.log("in");
                var test = document.createElement("div");
                test.id = result['latest_comment'][i]['time'];
                var icon = document.createElement("img");
                icon.src = result['latest_comment'][i]['icon'];
                var name = document.createElement("p");
                name.innerHTML = result['latest_comment'][i]['name'];
                var time_and_comments = document.createElement("div");
                time_and_comments.innerHTML = "<p class=" + "time" + ">" + new Date((result['latest_comment'][i]['time'])).toLocaleString()  + "</p>" + "<br>" + "<p>" + result['latest_comment'][i]['comment'] + "</p>";
                time_and_comments.classList.add("time_and_comments");
                test.appendChild(icon);
                test.appendChild(name);
                test.appendChild(time_and_comments);
                test.classList.add("comment");
                document.getElementById("comments").prepend(test);
            }
            document.getElementById("comment").value = "";
        }
        }

        xmlhttp.open("POST", "handlePostComment", true);
        xmlhttp.setRequestHeader("Content-type", "application/json");
        var json = {"comment": comment, "time": new Date(), "id": id, "latest_comment": latest_comment};
        xmlhttp.send(JSON.stringify(json));	
    }else{
        alert("No comment has been entered");
    }
}

function login(){
    var user_name = document.getElementById("user_name").value;
    var password = document.getElementById("password").value;
    if(user_name == "" || password == "" || user_name == null || password == null){
        alert("Please enter username and password");    
    }else{
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            var text = xmlhttp.responseText;
            if (text == "login success"){
                document.getElementById("main").innerHTML = "<h1>You have successfully logged in</h1>";
            }else{
                document.getElementById("header").innerHTML = text;
            }
        }
    }

    xmlhttp.open("GET", "handleLogin?user_name=" + user_name + "&password=" + password, true);
    xmlhttp.send();

    }

}

function logout(){
    var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            
            document.getElementById("login").innerHTML = "Login in";
            document.getElementById("login")['href'] = "/login?newsID=0";
            document.getElementById("login").removeEventListener("click", logout);
            
        }
    }

    xmlhttp.open("GET", "handleLogout", true);
    xmlhttp.send();

}