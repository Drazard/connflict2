//Creating a socket conection to the server.
var socket = io.connect()

var financeInfo;
//Retreiving the chat history
// setTimeout(() => {
//     socket.emit('chathistory', "get me chat history plz!");
//     socket.emit('cmdhistory', "get me cmd history plz!");
//     socket.emit('requestpage', "temppage")
// }, 500);

//setting variables

//setting up the client listener logic
socket.onAny(async (event, data) => { //On any event retreive everything

    //console.log(data)
    //Going to try a switch, never used it apparently they are good?
    switch(event){
        case "cls":
            //clear temrinal

              document.getElementById("localterminal-messages").innerHTML = "";

            break;
        
        case "chat":
            //chat logic
            await createMessage("chat-messages", data);
            document.getElementById("chat-messages").scrollTop = 10000;
            break;
        case "terminal":
            //cmd logic
            await createMessage("localterminal-messages", data);
            document.getElementById("localterminal-messages").scrollTop = 10000;
            break;
        case "error":
          await createMessage("chat-messages", `<h1>ERROR, RELOADING</h1>`);
          await createMessage("localterminal-messages", `<h1>ERROR, RELOADING</h1>`);
            break;
        case "nanobegin":
            //show the nano window
            console.log(`NANO STARTING ${data.nano}`)
            if(data.nano){
              nano = data.nano
              document.getElementById("localterminal-messages").style.display = "none";
              document.getElementById("nano-contents").style.display = "";
              document.getElementById("nano-textarea").innerHTML = data.response;
              document.getElementById("nano-textarea").value = data.response;
              document.getElementById("nano-textarea").focus();
            }

            break;
        
        case "terminalhistory":
            //cmd logic
            document.getElementById("localterminal-messages").innerHTML = data
            document.getElementById("terminaltaskbar").innerHTML = "";
            //await replaceMessage("localterminal-messages", data);
            //console.log(data)
            document.getElementById("localterminal-messages").scrollTop = 10000;
            break;

        case "process":
          //process logic
          const elem = document.getElementById("terminaltaskbar"); 
            elem.innerHTML = data
            //console.log("logging the data for taskbarthing",data)
          break;
        case "logprocess":
          //LOG process logic
          //console.log("logging the data for LOG taskbarthing",data)
            var logselem = document.getElementById("logterminaltaskbar"); 
            logselem.innerHTML = data
            
          break;
        case "terminalupdate":
            //cmd logic
           //("terminal update data",data)
            //console.log("data.time",data.time)
            //console.log("data.id",data.id)
            var steps = 1 / data.time
            //console.log("steps",steps)

            // var elem = document.getElementById(data.id);
            // for(var steps = 1 / data.time;steps<1;steps = steps + steps){
            //     setTimeout( async(steps) => {
            //         console.log(steps)
            //         let curwidth = elem.style.width
            //         console.log("width of elem",curwidth)
            //         elem.style.width = curwidth + steps+"%"
            //     }, 1000*steps+1000);
                
            // }

            function myMove(anim, time) {
                let id = null;
                let steps = time / 20
                const elem = document.getElementById("terminaltaskbar");   
                let pos = "";
                clearInterval(id);
                id = setInterval(frame, steps*1000);
                function frame() {
                  if (pos > 19) {
                    clearInterval(id);
                  } else {
                    pos++; 
                    elem.style.width = pos*5 + "%"; 
                    elem.innerHTML = "&nbsp;" + pos*5 + "%";
                  }
                }
              }

              return myMove(data.id, data.time)
            break;
        case "log":
            //console.log(data);
            await createMessage("logs-messages", data);
            document.getElementById("logs-messages").scrollTop = 10000;
            break;
          
    }
    //console.log(event, data) // log the event
});

socket.on("disconnect", (data) => {
  console.log("RELOADING PAGE.")
  location.reload();
  console.log("RELOADED.")
});

async function createMessage  (location, msg) {
    //Creating the message
    let messageBody = document.createElement('li');     //create a new element to house our message
    messageBody.innerHTML = msg;                        //set the innerHTML of our new element with contents of 'msg'  
    let windowBody = document.getElementById(location);   //get the element 'location' (where we want to put our msg content)
    windowBody.appendChild(messageBody);                  //append 'messageBody' (our 'msg' wrapped in the element we created) as a child of 'chatBody' (the location)   

    //scroll the window
    windowBody.scrollIntoView(false);

    //message pruning
    let liList = windowBody.getElementsByTagName("li");   //grab all the elements within the windowBody' as an array
    let largo = liList.length                           //figure out the length (how many elements we have)
    while(largo>49){                                    //while this number is too high (over 49)
        await liList[0].remove()                        //remove the first itsm from the array (which will be the last message)
        largo = await liList.length                     //get the length of the newly edited array
    };
}

async function replaceMessage  (location, msg) {
  //Creating the message
  let messageBody = document.createElement('li');     //create a new element to house our message
  messageBody.innerHTML = msg;                        //set the innerHTML of our new element with contents of 'msg'  
  let windowBody = document.getElementById(location);   //get the element 'location' (where we want to put our msg content)
  windowBody.appendChild(messageBody);                  //append 'messageBody' (our 'msg' wrapped in the element we created) as a child of 'chatBody' (the location)   

  //scroll the window
  windowBody.scrollIntoView(false);

  //message pruning
  let liList = windowBody.getElementsByTagName("li");   //grab all the elements within the windowBody' as an array
  let largo = liList.length                           //figure out the length (how many elements we have)
  while(largo>49){                                    //while this number is too high (over 49)
      await liList[0].remove()                        //remove the first itsm from the array (which will be the last message)
      largo = await liList.length                     //get the length of the newly edited array
  };
}

const newchat = document.getElementById("chat-input");
newchat.addEventListener("keyup", async function(event) {
  if (event.key === "Enter") {
    if (newchat.value) {
      let data = {message:newchat.value}
        await socket.emit('chat', data);
        newchat.value = "";
        } 
  }
});

var nano = false
document.getElementById("nano-contents").style.display = "none";

const terminal_local = document.getElementById("localterminal-input");
terminal_local.addEventListener("keyup", async function(event) {
  if (event.key === "Enter") {
    if (terminal_local.value) {
      //check for a nano command
      if(nano === false){
        console.log("NANO IS FALSE")
        if (terminal_local.value.split(' ')[0] === "nano"){
          //set nano to true
          //send a request to start a nano
          socket.emit('nanostart', terminal_local.value);
        }else{
          data = {command: terminal_local.value}
          socket.emit('command', data);
          //add newchat.value to an array in localstorage
        }
        
      }else{
        if (document.getElementById("localterminal-input").value === "save"){
          console.log("SAVING NANO")
          //send the nano data
          socket.emit('WHYISTHISTRIGGERING', {nano:true,nanodata:document.getElementById("nano-textarea").value});
          console.log("value of textarea",document.getElementById("nano-textarea").value)
          //set terminal back to nothing
          nano = false
          document.getElementById("nano-contents").style.display = "none";
          document.getElementById("localterminal-messages").style.display = "";
          document.getElementById("nano-textarea").innerHTML = "";
        }else if (document.getElementById("localterminal-input").value === "exit"){
          console.log("EXITING WITH NO SAVE")
          //remove nano window and do nothing
          nano = false
          document.getElementById("nano-contents").style.display = "none";
          document.getElementById("localterminal-messages").style.display = "";
          document.getElementById("nano-textarea").innerHTML = "";
          document.getElementById("nano-textarea").value = "";
          socket.emit('nano', {nano:false});
        }else{
          terminal_local.value = ""; 
        }
        
      }
    terminal_local.value = "";    
    } 
  }
});

// const requestpage = document.getElementById("browser-input");
// requestpage.addEventListener("keyup", function(event) {
//     if (event.key === "Enter") {	
//         socket.emit("requestpage", document.getElementById("browser-input").value)
//         //document.getElementById("browser-input").value = "";
//     }
// });

//Setting focus on login to the local terminal.
document.getElementById("localterminal-input").focus();
//homepage icon to send you to homepage

  // setTimeout(() => {
  //   async function func() {
  //     await createMessage("logs-messages", "Logging...");
  //     await socket.emit('connect', "i am connected");
  //   }
  //   func()
  // }, 5000);

// setTimeout(async() => {
//     await socket.emit('loaded', "i am connected");
//     await createMessage("logs-messages", "Logging...");
// }, 5000);


function load_login(){
  document.getElementById("maincontainer").innerHTML=`
  <!DOCTYPE html>
<html lang="en">
<head>
    <link rel="icon" type="image/ico" href="favico.ico">
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {{!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl" crossorigin="anonymous"> --}}
    <link rel="stylesheet" href="/login.css">
    <title>CONNFLICT</title>
</head>
<body>
    
  <div class="background-wrap">
  <div class="background"></div>
</div> 
{{!-- <center><img src="connflict.png" class="sitelogo"></center> --}}
{{!-- <center><img src="connflict2.png" class="sitelogo"></center> --}}

<center><img src="https://www.connflict.com:3000/connlogo.png" class="sitelogo"></center>

{{!-- LOGIN FORM --}}


<form id="accesspanel" action="/auth/login" method="post">
  <h1 id="litheader">CREDENTIALS REQUIRED</h1>
  <div class="inset">
    <p>
      <input type="text" name="email" id="email" placeholder="ALIAS@DOMAIN">
    </p>
    <p>
      <input type="password" name="password" id="password" placeholder="ACCESS-CODE">
    </p>
    <div style="text-align: center;">
    </div>
    <input class="loginLoginValue" type="hidden" name="service" value="login" />
  </div>
  <p class="p-container">
    <input type="submit" name="Login" id="go" value="Authorize">
  </p>
  <center><a href="https://www.connflict.com:3000/register">Request Access</a></center>
  <center><a href="https://www.connflict.com:3000/forgotpass">Forgot Password</a></center>
</form>

{{!-- LOGINS CLOSED --}}

  {{!-- <form id="accesspanel">
    <h1 id="litheader">LOGINS CLOSED</h1>
    <div class="inset">
        <center><img src="locked.jpg" style="width: 240px;"></center>
    </div>
    <center><a href="https://connflict.com:3000/login">Authorized Users</a></center>
  </form>  --}}


<center><p>
    https://discord.gg/KCw5zGFshN - Official Discord
</p></center>
</body>
</html>`
}

function load_game(){
  document.getElementById("maincontainer").innerHTML=`
  <div id="terminal"> 
            <div class="terminal-contents" id="terminal-contents">
                <div class="terminal-messages" id="localterminal-messages"></div>
                <div class="progressbar" id="terminaltaskbar">&nbsp;</div>
                <input class="terminal-input" id="localterminal-input" placeholder=">_" autocomplete="off"> 
            </div>
            <div class="nano-contents" id="nano-contents">
                <div class="nano-editregion" id="nano-editregion">
                    <textarea name="nano-textarea" wrap="hard" id="nano-textarea"></textarea>
                </div>
                <div class="nano-inforegion">
                    "save" to save  "exit" to exit without saving
                </div>
            </div>
        </div>
        <div id="chat"> 
            <div class="chat-contents">
                <div class="chat-messages" id="chat-messages">
                
                </div>
                <input class="chat-input" id="chat-input"> 
            </div>    
        </div>
  `
}

load_login()

// function rotate_loads(){
//   load_login()
//   setTimeout(() => {
//     load_game()
//   }, 2500);
// }

// setTimeout(() => {
//   rotate_loads()
// }, 5000);