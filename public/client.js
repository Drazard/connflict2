//Creating a socket conection to the server.
var socket = io.connect()

//setting any variables

//setting up the client listener logic
socket.onAny(async (event, data) => { //On any event retreive everything

    console.log(event,data)
    //Going to try a switch, never used it apparently they are good?
    switch(event){

        case "disconnect":
            reloadPage()
        break;

        case "update":
          //figure out what we are updating
          switch(data.update){
            case "login":
              if (data.response == true){
                showDiv("maincontainer")
                hideDiv("registerpage")
                hideDiv("loginpage")
                console.log("login success")
                scrollToBottomContent("filedir-content")
                document.querySelector("#chat-messages").scrollIntoView(false)
              }else{
                if (data.failmessage){
                   loginfail(data.failmessage) 
                }
                hideDiv("maincontainer")
                hideDiv("registerpage")
                showDiv("loginpage")
                console.log("login fail")
              }
            break;
            case "register":
              if (data.response == true){
                document.querySelector("#registerresponsebox").innerHTML = "Registration success!, check email"; 
              } else{
                if(data.failmessage){
                  document.querySelector("#registerresponsebox").innerHTML = data.failmessage;
                }else{
                  document.querySelector("#registerresponsebox").innerHTML = "ERROR: 37 - REG FAILED";
                }
                
              }
            break;

          
            case  "status":
              if (data.ip){
                document.getElementById("IP"). innerHTML = data.ip
              }
              if (data.cpu){
                document.getElementById("CPU"). innerHTML = data.cpu
              }
              if (data.hdd){
                document.getElementById("HDD"). innerHTML = data.hdd
              }
              if (data.net){
                document.getElementById("NET"). innerHTML = data.net
              }
              
            break;  
            case "botnet":
              document.getElementById("botnet-content").innerHTML = data.botnet
              if (data.botnetcount){
                document.getElementById("botnetcount").innerHTML = `(${data.botnetcount})`
              }
            break;
          }
        break;

        case "UI":
              console.log("updating UI:",data)
              updateUI(data)
        break;
        
        case "chat":
            //chat logic
            // console.log(data)
            await createMessage("chat-messages", data);
            await scrollToBottom("chat-messages")
            break;

        case "terminal":
            //cmd logic
            await createMessage("terminal-messages", data);
            scrollToBottom("terminal-content")
        break;
        
        case "error":
          unexpectedError()
        break;

        case "test":
          console.log(data)
          console.log("DATA^^^^^^^^^^^^^^^")
        break;

        default:
          unexpectedError()
        break;
    }
});

socket.on("disconnect", () => {
  reloadPage()
});

function updateUI(data){
  //data = {id:"ELEMENTID",update:"UPDATEDATA"}
  document.getElementById(data.id). innerHTML = data.innerHTML
}

async function createMessage  (location, msg) {
    //Creating the message
    let messageBody = document.createElement('li');     //create a new element to house our message
    messageBody.innerHTML = msg;                        //set the innerHTML of our new element with contents of 'msg'  
    messageBody.id = "message"
    let windowBody = document.getElementById(location);   //get the element 'location' (where we want to put our msg content)
    windowBody.appendChild(messageBody);                  //append 'messageBody' (our 'msg' wrapped in the element we created) as a child of 'chatBody' (the location)   

    //scroll the window
    windowBody.scrollIntoView(false)

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

function loadEventListeners(){
  try {
    console.log("LOADING EVENT LISTENERS")
    //chatmessages
    const newchat = document.getElementById("chat-input");
    newchat.addEventListener("keyup", async function(event) {
      if (event.key === "Enter") {
        if (newchat.value) {
          await socket.emit('chat', newchat.value);
          newchat.value = "";
          scrollToBottom("chat-messages")
          document.getElementById("chat-input").focus();
          } 
      }
    });
    //temrinal
    const terminal = document.getElementById("terminal-input");
    terminal.addEventListener("keyup", async function(event) {
      if (event.key === "Enter") {
        if (terminal.value) {
          await socket.emit('command', terminal.value);
          terminal.value = ""; 
          scrollToBottom("terminal-messages")
          document.getElementById("terminal-input").focus();
        }       
      }
    });
    //register
    const requestaccess = document.getElementById("requestaccess");
    requestaccess.addEventListener("click", async function(event) {
      //swap to register div.
      hideDiv("maincontainer")
      showDiv("registerpage")
      hideDiv("loginpage")
      document.getElementById("registerresponsebox").innerHTML = "";
    });
    //login
    const requestlogin = document.getElementById("requestlogin");
    requestlogin.addEventListener("click", async function(event) {
      //swap to login div.
      hideDiv("maincontainer")
      showDiv("loginpage")
      hideDiv("registerpage")
      document.getElementById("loginresponsebox").innerHTML = "";
    });

    //loginattempt
    const attemptlogin = document.getElementById("login");
    attemptlogin.addEventListener("click", async function(event) {
      //try to login
      let login_email = document.querySelector("#loginemail").value
      let login_password = document.querySelector("#loginpassword").value
      let loginCreds = {username:login_email, password:login_password}

      console.log(`Attempting to login with credentials: ${JSON.stringify(loginCreds)}`)
      socket.emit('loginAttempt', loginCreds)
    });

    //registerattempt
    const attemptregister = document.getElementById("register");
    attemptregister.addEventListener("click", async function(event) {
      //try to register
      let register_email = document.querySelector("#registeremail").value
      let register_username = document.querySelector("#registerusername").value
      let registerCreds = {email:register_email, username:register_username}
    
      console.log(`'${register_username}' Attempting to register with email: '${register_email}'`)
      console.log(registerCreds)
      socket.emit('registerAttempt', registerCreds)
    });


  } catch (error) {
    console.log("ERROR LOADING EVENT LISTENERS")
  }
}

function unexpectedError(){
  createMessage("chat-messages", `<h1>ERROR, RELOADING</h1>`);
  createMessage("terminal-messages", `<h1>ERROR, RELOADING</h1>`);
  setTimeout(() => {
    reloadPage()
  }, 2000);
}

function reloadPage(){
  console.log("DISCONNECTED! - RELOADING PAGE.")
  location.reload();
  // window.frames[0].location.reload();
  // var iframe = document.getElementById('youriframe');
  // iframe.src = iframe.src;
  console.log("RELOADED.")
}

function loginfail(failmsg){
  let emelent = document.getElementById("loginresponsebox")
  emelent.innerHTML = failmsg
}

const scrollToBottom = async (id) => {
  let windowBody = document.getElementById(id);
  windowBody.scrollIntoView(false)
  // element.lastElementChild.scrollIntoView({ behavior: 'smooth' });
}

const scrollToBottomContent = (id) => {
  const element = document.getElementById(id);
  element.lastElementChild.scrollIntoView();
  // element.lastElementChild.scrollIntoView({ behavior: 'smooth' });
}

function hideDiv(id){
  let hideDiv = document.getElementById(id)
    hideDiv.style.display = 'none';
    console.log(`hiding div ${id}`)
}

function showDiv(id){
  let hideDiv = document.getElementById(id)
  hideDiv.style.display = 'block';
  console.log(`revealing div ${id}`)
}

scrollToBottom("terminal-messages")
scrollToBottom("chat-messages")
scrollToBottomContent("filedir-content")
loadEventListeners()

function autologin(){
  let loginCreds = {username:"drazard", password:"1234"}
  console.log(`Attempting to login with credentials: ${JSON.stringify(loginCreds)}`)
  socket.emit('loginAttempt', loginCreds)
}

// autologin()