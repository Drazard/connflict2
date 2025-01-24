// connflict2.js
require('dotenv').config()
console.log(process.env.SCRIPTSTART_MESSAGE)
const { promisify } = require("util");
const geoip = require('geoip-lite');
const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const cookie = require('cookie')
console.log("Server Started...")
var express = require('express');
var app = express();
const cookieParser  = require("cookie-parser");
const { Socket } = require('dgram');
const { emit } = require('process');
const nodemailer = require("nodemailer");
app.use(cookieParser ())
var server = require('http').createServer(app);
var io = require('socket.io')(server);
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public/'));
// app.use(express.static(__dirname + '/public/images'));

//Connect the database
function Database() {
  this.connection = mysql.createConnection({
    host     : process.env.DATABASE_HOST,
    user     : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASS,
    database : process.env.DATABASE,
    multipleStatements: true
  });
  
  this.query = (sql, args) => {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err)
          return reject(err);
        resolve(rows);
      });
    });
  };

  this.close = () => {
    return async () => {
      try {
        this.connection.end(err => {
          if (err) throw err;
          return;
        });
      } catch(e) {
        return e;
      }
    }
  };
};

//define database
var db = new Database();
 try {
   db.query('SELECT 1');
 } catch (error) {
    console.log(error)
 }



//keep the connection to the database open
setInterval(() => {
  try {
      db.query('SELECT 1');
  } catch (error) {
      // process.exit()
      console.log(error)
  }

}, 5*60*1000);

app.get('/admin', async function(req, res,next) {
  //send client to admin page.
  await res.sendFile(__dirname + '/public/admin.html');

});

app.get('/test', async function(req, res,next) {

  timestamp = new Date().toLocaleTimeString([], {year:'numeric', month:'numeric', day:'numeric', hour: '2-digit', minute:'2-digit'});
  //console.log(process.env.WELCOME_MESSAGE)
  console.log(`New connection: ${timestamp}`)
  //set a USERID
  var user_id = crypto.randomBytes(20).toString('hex');
  var sessionid = crypto.randomBytes(40).toString('hex');

  var sessionCookieOptions = {
      expires: new Date(
          Date.now() + 1 * 1000 * 60 * 60 * 24 * 365 //1 year.
      ),
      httpOnly: true
  }

  await res.cookie('sessionid', sessionid, sessionCookieOptions );

  //Gather geodata
  try {
      var ipAdd = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (ipAdd.substr(0, 7) == "::ffff:") {
          ipAdd = ipAdd.substr(7)
      }
      var geo = geoip.lookup(ipAdd)
      //let geoString = `Country:${geo.country} State:${geo.region} City:${geo.city}`
      var geoData = {ip:ipAdd, country:geo.country, region:geo.region, city:geo.city}
  } catch (error) {
      console.log(`NO geoData for ${user_id}`)
      var geoData = {ip:ipAdd, country:"UNK", region:"UNK", city:"UNK"}
      //res.sendFile(__dirname + '/error.html');
  }

  //send geodata to cookie.
  await res.cookie('geodata', geoData, cookieOptions );



  //check for stickytoken.
  if (req.cookies.stickytoken == undefined){
      //create token.
      var stickytoken = crypto.randomBytes(20).toString('hex');
      // console.log("Creating stickly token!")
      var stickyOptions = {
          expires: new Date(
              Date.now() + 1 * 1000 * 60 * 60 *24 *365 * 10//10 years.
          ),
          httpOnly: true
      }
      //send stickytoken
      await res.cookie('stickytoken', stickytoken, stickyOptions );
  }else{
      stickytoken = req.cookies.stickytoken
  }

  //check for logintoken.
  if (req.cookies.logintoken == undefined){
      //create token.
      var logintoken = crypto.randomBytes(20).toString('hex');
      // console.log("Creating stickly token!")
      var loginOptions = {
          expires: new Date(
              Date.now() + 1 * 1000 * 60 * 5 //5minutes
          ),
          httpOnly: true
      }
      //send stickytoken
      await res.cookie('logintoken', logintoken, loginOptions );
  }else{
      logintoken = req.cookies.logintoken
  }

  

  try {
      //console.log(`Fetching cookies:`);
      // Verify the token
      const decoded = await promisify(jwt.verify)(
          req.cookies.connflict,
          process.env.JWT_SECRET
          );
      //console.log(`cookies: ${JSON.stringify(decoded)}`)
      // console.log(`decoded cookie: ${JSON.stringify(decoded)}`);

  } catch (error) {
      // console.log(error)
      console.log(`No data for userid: ${user_id}`)
      //token creation
      
      //console.log(`userid: ${user_id}`)
      var token = jwt.sign({ id: user_id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN
      });

      var cookieOptions = {
          expires: new Date(
              Date.now() + 1 * 1000 * 60 * 60 //1 hour.
          ),
          httpOnly: true
      }
      
      
      
      await res.cookie('connflict', token, cookieOptions );
      await res.cookie('userid', user_id, cookieOptions );
      

      // console.log(`Cookies Created.`)
  }

          console.log(`\n
          Time: [${timestamp}] 
          ClientID: ${JSON.stringify(user_id)} 
          GEO: ${JSON.stringify(geoData)}
          StickyToken: ${stickytoken}
          LoginToken: ${logintoken}
          Event: connection \n    
          Data: none \n\n`)

  //check users login status.

  //send client to game page

  //send client to login page
  await res.sendFile(__dirname + '/public/connflict.html');
  
  
  // setTimeout(async() => {
  //     await res.sendFile(__dirname + '/signup.html');
  // }, 3000);
  //await res.redirect('/index');

});

function gatherGeodata(req){
  //Gather geodata
  try {
      var ipAdd = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (ipAdd.substr(0, 7) == "::ffff:") {
          ipAdd = ipAdd.substr(7)
      }
      var geo = geoip.lookup(ipAdd)
      //let geoString = `Country:${geo.country} State:${geo.region} City:${geo.city}`
      var geoData = {ip:ipAdd, country:geo.country, region:geo.region, city:geo.city}
  } catch (error) {
      var geoData = {ip:ipAdd, country:"UNK", region:"UNK", city:"UNK"}
      //res.sendFile(__dirname + '/error.html');
  }
  
  return geoData
}

function createCokie(time){
    var cookieOptions = {
      expires: new Date(
          Date.now() + 1000 * time //seconds
      ),
      httpOnly: true
  }
  return cookieOptions
}

app.get('/', async function(req, res,next) {
  
  //setup timestamp
  timestamp = new Date().toLocaleTimeString([], {year:'numeric', month:'numeric', day:'numeric', hour: '2-digit', minute:'2-digit'});

  //get geolocation data from ip address
  var geoData = gatherGeodata(req);

  //create session token
  var sessiontoken = crypto.randomBytes(100).toString('hex');
  console.log("new session token created for",geoData.ip,sessiontoken)

  //send session token to cookie
  await res.cookie('sessiontoken', sessiontoken, createCokie(60*60) );

  //send geodata to cookie.
  await res.cookie('geodata', JSON.stringify(geoData), createCokie(60*60) );  

  //check for stickytoken.
  if (req.cookies.stickytoken == undefined){
    console.log("sticky token not found for",geoData.ip)
    //create token.
    var stickytoken = crypto.randomBytes(100).toString('hex');
    console.log("sticky token created for",geoData.ip,stickytoken)
    await res.cookie('stickytoken', stickytoken, createCokie(60*60*24*365*10) );

  }else{
      var stickytoken = req.cookies.stickytoken
  }
  //send connection data to database
  db.query('INSERT log_connection SET ?', {
    realip:geoData.ip,
    geodata:JSON.stringify(geoData),
    stickytoken:stickytoken,
  }, (error, results) => {
    if(error){
        logError({error:error,errorinfo:"error trying to set connection log on app.get'/'"})
        return
    }         
  });

  console.log(`\n
      New connection logged:
      Time: [${timestamp}] 
      GEO: ${JSON.stringify(geoData)}\n
      Sticky: ${stickytoken}\n
      `)

  await res.sendFile(__dirname + '/public/connflict.html');

});

async function findIP(string){
  let regex = /(\d+\.+){3}\d+/gm;
  // let match = 'unknown'
  let match = string.match(regex)[0]
  //console.log(`IP MATCH: ${match}`)
  if (match === undefined){
      return "unknown?"
  }
  return match
}

async function clientSetup(client){

}

io.on('connection', async function(client) {
    //get cookies
    var cookies = cookie.parse(client.request.headers.cookie || '')
    //setup client's chat room form sessionid
    client.stickytoken = cookies.stickytoken
    client.sessionid = cookies.sessiontoken
    client.geodata = JSON.parse(cookies.geodata)
    // console.log("GEODATA:::::::::",client.geodata)
    // console.log("IP:::::::::",client.geodata.ip)
    // console.log(JSON.parse(cookies.geodata))
    client.realip = await findIP(client.geodata.ip) //get users ivp4 address '255.255.255.255'
    console.log("CLIENT IP ADDRESS:",client.realip)
    client.join(client.sessionid)

    if(client.realip = null){
      console.log("ERROR WITH CLIENT, NO IPADDRESS.")
      data = {update:"login",response:false, failmessage:` [${timestamp}] ERROR WITH IP ADDRESS! - Disconnected`}
                io.to(client.sessionid).emit("update", data)
      client.disconnect()
    }

    client.onAny( async function(event, data) {

      // setup timestamp for the event
      timestamp = new Date().toLocaleTimeString([], {year:'numeric', month:'numeric', day:'numeric', hour: '2-digit', minute:'2-digit', second:'2-digit'});

      //log whats happened.
      console.log(`\n
      Time: [${timestamp}] 
      ClientID: ${JSON.stringify(client.sessionid)}
      Slient StickyToken: ${JSON.stringify(client.stickytoken)} 
      GEO: ${cookies.geodata}
      Event: ${event} \n    
      Data: ${JSON.stringify(data)} \n\n`)      

      switch (event) {

            case "loginAttempt":
              // console.log(client.geodata.ip,"client.geodata.ip")
              // console.log(client.realip,"client.realip")
              // console.log(data)
              // console.log(data.username)
              //log the attempt
              // console.log("CLIENT REALIP LOGIN ATTEMPT----------------------------------------------------------------",client.realip,client.geodata.ip)
              db.query('INSERT log_login SET ?', {
                realip:client.geodata.ip,
                username:data.username,
                password:data.password,
                geodata:cookies.geodata,
                stickytoken:client.stickytoken,
              }, (error, results) => {
                if(error){
                    logError({error:error,errorinfo:"error trying to set login log on on loginattempt"})
                    return
                }         
              });

              // console.log(`Time: [${timestamp}] LOGIN ATTEMPT: ${data.username}, ${data.password} \n FROM: ${cookies.geodata} ${client.stickytoken}`)
              //check username and password is correct.

              var userCheck = JSON.stringify(await db.query(`
                SELECT id, name, password
                FROM users
                WHERE name = '${data.username}'
              `))
              var userDetails = JSON.parse(userCheck)[0]

              if (userDetails != undefined && userDetails.password == data.password){
                //user login success
                client.username = userDetails.name
                client.userid = userDetails.id
                //populate chat history
                await getChatHistory(client)

                client.join("mainchat")
                data = {update:"login",response:true}
                io.to(client.sessionid).emit("update", data)

                //updateUI
                updateUI(client)

                //constantly update UI
                let updateInterval = (1000 * 10) // 10 seconds
                setInterval(() => {
                  updateUI(client)
                }, updateInterval);

              }else{
                //user login fail
                // logError({error:"invalid login",data:data})

                db.query('INSERT log_login_fail SET ?', {
                  username:data.username,
                  password:data.password,
                }, (error, results) => {
                  // console.log("New conneciton logged to database:",geoData.ip)
                    if(error){
                          console.log("ERROR", `ERROR creating error log in database \n ${error}`)
                          return
                    }             
                });

                data = {update:"login",response:false, failmessage:` [${timestamp}] Incorrect Credentials!`}
                io.to(client.sessionid).emit("update", data)
              }
              // console.log("checking user pass is correct for",data.username, data.password,"result",userDetails.password)
                
            break;

            case "registerAttempt":
              //log the attempt
              db.query('INSERT log_register SET ?', {
                realip:client.geodata.ip,
                username:data.username,
                email:data.email,
                geodata:cookies.geodata,
                stickytoken:client.stickytoken,
              }, (error, results) => {
                if(error){
                    logError({error:error,errorinfo:"error trying to set registration log on on registerattempt"})
                    return
                }         
              });

              //check email and username are valid
              console.log("register attempt username:",validateUsername(data.username),"email:",validateEmail(data.email))

              if (validateEmail(data.email) == false || validateUsername(data.username) == false){
                data = {update:"register",response:false, failmessage:` [${timestamp}] EMAIL/USERNAME INVALID <br> EMAIL: ${validateEmail(data.email)} USERNAME: ${validateUsername(data.username)}`}
                io.to(client.sessionid).emit("update", data)
                break;
              }else{
                console.log("register attempt username:",validateUsername(data.username),"email:",validateEmail(data.email))
              }

              var userCheck = JSON.stringify(await db.query(`
                SELECT name, email
                FROM users 
              `))
                

                console.log(userCheck)
                //check username isnt in use
                if (userCheck.includes(data.email) || userCheck.includes(data.username)){
                  data = {update:"register",response:false, failmessage:` [${timestamp}] EMAIL/USERNAME IN USE!`}
                  io.to(client.sessionid).emit("update", data)
                  break;
                }
                //generate password
                let randomPassword = crypto.randomBytes(5).toString('hex');

                

                //update database with new user
                await db.query('INSERT users SET ?', {
                  name:data.username,
                  email:data.email,
                  password:randomPassword,
                  sessiontoken:client.sessionid,
                  stickytoken:client.stickytoken,
                  realip:client.geodata.ip,
                }, (error, results) => {
                  if(error){
                      logError({error:error,errorinfo:"error trying to register user on updating database"})
                      return
                  }         
                });

                //setup new user with in-game VPS
                await setupNewUser(data.username)
                
                //email password to user
                try {
                  registerEmail(data.email, data.username, randomPassword)
                } catch (error) {
                  data = {update:"register",response:false, failmessage:` [${timestamp}] AN ERROR OCCURED SENDING REGISTRATION EMAIL`}
                  io.to(client.sessionid).emit("update", data)
                  break;
                }
                
                //respond.
                console.log(userCheck[0])
                data = {update:"register",response:false, failmessage:` [${timestamp}] ACCOUNT CREATED! ACCESS-CODE SENT TO EMAIL`}
                io.to(client.sessionid).emit("update", data)
                
            break;
            
            case "chat":
                let chatstamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                let  chatmessage = await sanitize(data)
                chatmessage = chatmessage.slice(0,500)
                //if the user is not logged in, do nothing.
                if (!client.username){
                  //Client isnt logged in! - send them to the login form
                  client.disconnect()
                  break;
                }else{
                  logChat(client.username, chatmessage)
                  if (chatmessage == "!reload"){
                    client.disconnect()
                  } else {
                    
                    let chatresponse = `${client.username}: ${chatmessage}`
                    io.to("mainchat").emit("chat", chatresponse)
                  }
                    
                }
            break;
            
            case "command":
              let  command = await sanitize(data)
              if (!client.sessionid){
                //Client isnt logged in! - send them to the login form
                client.disconnect()
                break;
              }else{
                //send commend to command handler.
                let terminalresponse = `command '${command}' not found`
                io.to("mainchat").emit("terminal", terminalresponse)
                //parse command

               
              }
            break;

            case "disconnect":
              // clearInterval(evalTimer)
              console.log(client.stickytoken, "disconnected")
            break;
            
            default:
                //log what happened to database
                console.log(`\n----------------------------------------------------
      Time: [${timestamp}] 
      ClientID: ${JSON.stringify(client.sessionid)} 
      GEO: ${cookies.geodata}
      Event: ${event} \n    
      Data: ${JSON.stringify(data)} \n\n----------------------------------------------------`)

              client.disconnect()
            break;
      }

    });

    client.on("disconnect", (reason) => {
      // ...
    });

});

async function setupNewUser(username){
  //generate new vps details

  //get userid based off name
  var databseid = await db.query(`
    SELECT id
    FROM users
    WHERE name = '${username}'
    `)
  if(!databseid[0]){
    console.log("error with getting userid for",username)
  }else{
      var userid = databseid[0].id 
  }

  //generate new localip address
  var localip = generateIP()

  //generate new filelist
  try {
    generateDefaultFiles(username,userid)
  } catch (error) {
    console.log("ERROR with generating new files for USERID",userid)
  }

  // console.log("USERID",userid,"-------------------------------------------------------------------\n---------------------------------------------------")
  

  //add details to the database
  db.query('INSERT user_vps SET ?', {
    id:userid,
    localip:localip,
    remoteip:"localhost",
    terminaldata:"",
    cpu:500,
    hdd:1,
    network:4,
    antivirus:1,
    ddos:1,
    slavelist:JSON.stringify({}),
    notepad:"",

  }, (error, results) => {
    if(error){
        logError({error:error,errorinfo:"error trying to register user on updating database"})
        return
    }         
  });
}

async function getUserIP(client){
  var ip = await db.query(`
  SELECT localip
  FROM user_vps
  WHERE id = '${client.userid}'
  `)
  // console.log("getUserIP",ip.localip,ip[0].localip)
  return ip[0].localip
}

async function updateUserIP(client){
  //get files
  let ip = await getUserIP(client)

  //update userfiles with their local files
  io.to(client.sessionid).emit("UI", {id:"IP",innerHTML:ip})
}

async function updateUserFiles(client){
  //get files
  let files = await findFiles(client.userid)

  //update userfiles with their local files
  io.to(client.sessionid).emit("UI", {id:"filedir-content",innerHTML:files})
}

async function findFiles(userid){
  // console.log("SEARCHING FOR FILES OWNED BY",userid)
  var files = await db.query(`
    SELECT *
    FROM gamefiles
    WHERE location = '${userid}'
    `)
  if(!files[0]){
    console.log("error with getting userid for",userid)
    console.log("files:",files)
    return "disc empty"
  }else{
    // console.log(files)
    var filelList = "";
    // console.log(filelList)
    files.forEach(file => {
      if (file.name){
        filelList += `<span><i class='${file.icon}'></i> ${file.name}.${file.extension}</span><br>`
      }
      
    });
    // console.log(filelList)
    return filelList
  }
}

async function updateSlaveList(client){
  let slaves = await findSlaves(client)
  // console.log("SLAVES:",slaves)
  //update slavelist with their current slaves
  io.to(client.sessionid).emit("UI", {id:"botnet-content",innerHTML:slaves})
}

async function findSlaves(client){
  
  // console.log("SEARCHING FOR FILES OWNED BY",userid)
  var slaves = await db.query(`
    SELECT *
    FROM gamefiles
    WHERE filetype = 'trojan'
    AND creatorid = '${client.userid}'
    `)
  if(!slaves[0]){
    console.log("NO TROJANS FOUND")
    return "no active trojans found"
  }else{

    var slaveList = "";

    for (let i = 0; i < slaves.length; i++) {
      var slave = slaves[i]
      var slaveInfo = await db.query(`
          SELECT id, localip
          FROM user_vps
          WHERE id = ${slave.location}
          `)
      slaveInfo = slaveInfo[0]
      // console.log(`Owner: ${client.userid} Location: ${slaveInfo.id}`)
      if (slaveInfo.id != client.userid){
        slaveList += `<span><i class='fa-regular fa-user'></i> ${slaveInfo.localip}</span><br>`
      }
  }
    //we have a list of slaves we own
    // console.log("these are the slaves",slaves)
    // var slaveList = "";
    
    // slaves.forEach(async (slave) => {
    //   //only do stuff with trojans that arent on ourself.
    //   console.log(`trojan owner: ${slave.creatorid} trojan location: ${slave.location}`)
    //   var slaveInfo = await db.query(`
    //       SELECT localip
    //       FROM user_vps
    //       WHERE id = ${slave.location}
    //       `)
    //   slaveInfo = slaveInfo[0]
    //   console.log("FOREACH SLAVEINFO",slaveInfo)
    //   slaveList += `<span><i class='fa-regular fa-user'></i> ${slaveInfo.localip}</span><br>`
    //   console.log(slaveList)
    // });
    
  }
  // console.log("slaveInfo: '",slaveList,"'")
  return slaveList
}

function generateDefaultFiles(username, userid){
  db.query('INSERT gamefiles SET ?', { name:"log",filetype:"log",extension:"db",description:`default log file for ${username}`,icon:'fas fa-database',creatorid:userid,location:userid,contents:`${username} Created an account!`,read:1,write:1,delete:0,execute:0,download:0,unique:0});
  db.query('INSERT gamefiles SET ?', { name:"btc",filetype:"cryptowallet",extension:"wallet",description:`default btc wallet for ${username}`,icon:'fa-solid fa-key',creatorid:userid,location:userid,contents:`${generateRandomFileContents()}`,read:1,write:0,delete:0,execute:0,download:0,unique:0});
  db.query('INSERT gamefiles SET ?', { name:"readme",filetype:"textfile",extension:"txt",description:`default readme for ${username}`,icon:'fa-regular fa-file-lines',creatorid:userid,location:userid,contents:readmeFile(),read:1,write:1,delete:1,execute:0,download:1,unique:0});
  db.query('INSERT gamefiles SET ?', { name:`${username}'s nudes`,filetype:"nudes",extension:"zip",description:`sexy pictures of ${username}`,icon:'fa-solid fa-gift',creatorid:userid,location:userid,contents:`${username}'s sexy pictures!`,read:1,write:0,delete:0,execute:0,download:1,unique:1});
  db.query('INSERT gamefiles SET ?', { name:"recovery",filetype:"discimage",extension:"iso",description:`default recovery for ${username}`,icon:'fa-solid fa-compact-disc',creatorid:userid,location:userid,contents:`${username}'s recovery disc`,read:1,write:0,delete:0,execute:0,download:0,unique:0});
  db.query('INSERT gamefiles SET ?', { name:"trojan",filetype:"trojan",extension:"tjn",description:`default trojan for ${username}`,icon:'fa-solid fa-radiation',creatorid:userid,location:userid,contents:`${username}'s blackshades`,read:1,write:0,delete:1,execute:0,download:1,unique:0});
}

function readmeFile(){
  return `
  Welcome to Connection Conflict, or Connflict for short!
  This is your new VPS! If you are stuck you can try the 'help' command in the temrinal, or ask other players in the chatbox!
  Goodluck!
  ${crypto.randomBytes(randomInt(20,40)).toString('hex')}
  `
}

function generateRandomFileContents(){
  let contents = crypto.randomBytes(randomInt(128,256)).toString('hex');
  return contents
}

function updateUI(client){

    //get user IP
    updateUserIP(client)

    //get user filedir.
    updateUserFiles(client)

    //update slavelist
    updateSlaveList(client)

    //run update tests for others
    testUpdate(client)
}

async function getChatHistory(client){
  var chatHistory = await db.query(`
  SELECT * FROM (
    SELECT * FROM log_chat ORDER BY id DESC LIMIT 50
    ) sub
    ORDER BY id ASC
  `)
    // console.log(chatHistory)
    // console.log("chat history")

    

    if(!chatHistory[0]){
      console.log("error with chathisrtoy")
    }else{
        for(var i=0;i<chatHistory.length;i++){
            let chatresponse = `${chatHistory[i].name}: ${chatHistory[i].message}`
            // prob should bulk send this instead of 1 at a time
            await io.to(client.sessionid).emit("chat", chatresponse)
        } 
    }



    // try {
    //   chathistory.array.forEach(item => {
    //     console.log("Chats",chatresponse)
    //     let chatresponse = `${item.name}: ${item.message}`
    //     io.to(client.sessionid).emit("chat", chatresponse)
    //   });
    // } catch (error) {
    //   let chatresponse = `ADMIN: NO CHAT HISTORY`
    //   io.to(client.sessionid).emit("chat", chatresponse)
    // }
    
}

async function registerEmail(email, name, password){
  let transporter = await nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use SSL
    auth: {
        user: process.env.GMAIL_USERNAME, // username for your mail server
        pass: process.env.GMAIL_PASSWORD, // password
    },

  });


  // send mail with defined transport object

  let info = await transporter.sendMail({
    from: '"ADMIN" <DRAZARDGAME@GMAIL.COM>',
    to: email,
    subject: "Connflict Account Verification",
    text: `
    Thank you ${name} for registering! your password is '${password}'

    For security purpouses all user account passwords are generated and cannot be changed, please do not lose this email.
    
    By activating your account you agree to Connflicts terms and conditions. You also agree that you are 18 years or older. If you are not 18 years or older please do not continue.`,
  }, async (error, info) => {

      if (error) {
        console.log(error)
        console.log("ERROR SENDING EMAIL")
          //error happened.
          return transporter.close();
      }      
  });

  /*------------------SMTP Over-----------------------------*/
}

function validateEmail(email) {
  let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u;
  return regex.test(email);
}

function validateUsername(username) {
  if (username.length < 3){
    return false
  }else{
    let regex = /[a-zA-Z0-9]/g;
    return regex.test(username);
  }
  
}

function logError(log){ 
  log = JSON.stringify(log)
  db.query('INSERT log_main SET ?', {
    log:log
  }, (error, results) => {
    // console.log("New conneciton logged to database:",geoData.ip)
      if(error){
            console.log("ERROR", `ERROR creating error log in database \n ${error}`)
            return
      }             
  });
}

function logChat(name, message){
  db.query('INSERT log_chat SET ?', {
    name:name,
    message:message,
  }, (error, results) => {
      //something here
      if(error){
            console.log("ERROR", `ERROR creating chat log in database \n ${error}`)
            return
      }             
  });
}

async function sanitize(text){
  //begin parsing the CMD and args
  return text        //sanitize the text
  .replace(/&/g, '&amp;')   //Remove &
  .replace(/</g, '&lt;')    //Remove <
  .replace(/>/g, '&gt;')    //Remove >
  .replace(/"/g, '&quot;')  //Remove " 
  .replace(/'/g, '&#039;')  //Remove '
}

async function findIP(string){
    let regex = /(\d+\.+){3}\d+/gm;
    // let match = 'unknown'
    let match = string.match(regex)[0]
    //console.log(`IP MATCH: ${match}`)
    if (match === undefined){
        return 'unknown'
    }
    return match
    
}

async function content(path) {  
    return await readFile(path, 'utf8')
}

function randomIp(){
  var icon
  let chance = randomInt(1,100)
  if (chance > 50){
    icon = 'fa-regular fa-user'
  }else{
    icon = 'fa-solid fa-user'
  }
  let ip = `${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}`
  let iphtml = `<i class="${icon}"></i> <span>${ip}</span><br>`
  return iphtml
}

function generateIP(){
  return `${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}`
}

function randomav(){
  var av
  let chance = randomInt(1,100)
  if (chance > 50){
    av = 'ACTIVE'
  }else{
    av = 'DISABLED'
  }
  return {id:"AV",innerHTML:av}
}

function randomddos(){
  var ddos
  let chance = randomInt(1,100)
  if (chance > 50){
    ddos = 'ONLINE'
  }else{
    ddos = 'OFFLINE'
  }
  return {id:"DDOS",innerHTML:ddos}
}

function randomcpu(){
  return randomInt(1,100);
}

function randomhdd(){
  return randomInt(1,100);
}

function randomnet(){
  return randomInt(1,500);
}

function updateIP(){
  return {id:"IP",innerHTML:`${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}`}
}

function updateBotnet(){
  let botnetdata =  `
      ${randomIp()}
      ${randomIp()}
      ${randomIp()}
      ${randomIp()}
      ${randomIp()}
      ${randomIp()}
      `
  return {id:"botnet-content",innerHTML:botnetdata}
}

function updateCPU(){
  return {id:"CPU",innerHTML:randomcpu()}
}

function updateHDD(){
  return {id:"HDD",innerHTML:randomhdd()}
}

function updateNET(){
  return {id:"NET",innerHTML:randomnet()}
}

function testUpdate(client){
  io.to(client.sessionid).emit("UI", updateCPU())
  io.to(client.sessionid).emit("UI", updateHDD())
  io.to(client.sessionid).emit("UI", updateNET())
  io.to(client.sessionid).emit("UI", randomav())
  io.to(client.sessionid).emit("UI", randomddos())
}

function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

server.listen(3000);