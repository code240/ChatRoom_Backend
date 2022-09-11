const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const UserCode = require("./Functions/UniqueCodeGenerator");
const app = express();
const port = 8000;
const MY_API_KEY = "O13EINLKWOI876WPCJ5SPE";

const db = mysql.createPool({
    host:"bb2doe9xh3zz03e0efvz-mysql.services.clever-cloud.com",
    user:"uq0hq0rfattx9huy",
    password:"rFBOCbaWmLUqL3Am7NHz",
    database:"bb2doe9xh3zz03e0efvz",
    charset: 'utf8mb4'
})

// const db = mysql.createPool({
//     host:"localhost",
//     user:"root",
//     password:"",
//     database:"chatroom",
//     charset: 'utf8mb4'
// })

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));



// Register User

app.post("/API/SaveUser" ,(req,res) => {
    const API_KEY = req.body.API_KEY;
    if(MY_API_KEY !== API_KEY){
        res.send({error:true,errorType:"API_KEY"});
        return false;
    }
    const username = req.body.username;
    const useremail = req.body.useremail;
    const usermobile = req.body.usermobile;
    const userps = req.body.userpassword;
    const useravtar = req.body.useravtar;

    const getCodes = "SELECT userid FROM chatusers";
    db.query(getCodes,(getCode_err,getCode_result) => {
        if(getCode_err === null){
            let codes = getCode_result.map((item)=>item.userid)
            let newCode = UserCode(codes);
            // Register User With newCode 
            const sqlInsert = "INSERT INTO chatusers (user_name,user_email,user_avtar,user_mobile,user_psw,userid) VALUES (?,?,?,?,?,?)";
            db.query(sqlInsert, [username,useremail,useravtar,usermobile,userps,newCode],(err,result) => {
                // console.log("error :"+ err + "Result:" +result);
                if(err !== null){
                    res.send({
                        error:true,
                        errorType:"query_error",
                        errorCode:err.code,
                        errorMessage:err.message,
                        errorNumber : err.errno
                    });           
                }else{                    
                    res.send({error:false,success:true,result:result});
                }
            });

        }else{
            res.send({error:true,errorType:"code_fetch"});
        }
    })
    
    
}); 


// Login User

app.post("/API/Authentication/Login", (req,res) => {
    if(MY_API_KEY !== req.body.API_KEY){
        res.send({error:true,errorType:"API_KEY"});
        return false;
    }
    const sqlGetQuery = "SELECT * FROM chatusers WHERE user_email = ?";
    db.query(sqlGetQuery,[req.body.useremail],(err,result) => {
        if(err === null){ 
            if(result.length === 1){
                if(req.body.userpassword === result[0].user_psw){
                    res.send({
                        error : false,
                        loginStatus : true,
                        AuthenticateUser : result[0].userid,
                        Message : "User Successfully Login"
                    }); 
                }else{ 
                    res.send({
                        error : false,
                        loginStatus : false,
                        Reason : "Password" ,
                        ForUser : result[0].user_email,
                        Message : "Password incorrect!"
                    });
                }
            }else{
                res.send({ 
                    error : false,
                    loginStatus : false,
                    Reason : "Useremail" ,
                    ForUser : req.body.useremail,
                    Message : "User not found!"
                });
            }
        }else{
            res.send({error:true,errorType:"query_unknown_error"});
            return false;
        }
    })
}); 
  


// Confirm User 


app.post("/API/ConfirmUser",(req,res) => {
    if(MY_API_KEY !== req.body.API_KEY){ 
        res.send({error:true,errorType:"API_KEY"});
        return false;
    }
    $sqlQuery = "SELECT * FROM chatusers WHERE userid = ?";
    db.query($sqlQuery,[req.body.useremail],(err,result) => {
        if(err === null){
            if(result.length === 1){
                res.send({error:false,userLogin:true,userCode:result[0].userid})
            }else{
                res.send({error:true,errorType:"USER_NOT_FOUND"});
            }
        }else{
            res.send({error:true,errorType:"query_error"});
        }
    })
})




// Create  Room

app.post("/API/CreateRoom",(req,res) => {
    if(MY_API_KEY !== req.body.API_KEY){ 
        res.send({error:true,errorType:"API_KEY"});
        return false;
    }
    const roomName = req.body.RoomName;
    // console.log(roomName);
    const roomAvtar = req.body.RoomAvtar;
    const roomMember = req.body.RoomMember;
    let uid = req.body.uid;
    uid = uid + ",";
    const getData = "SELECT roomid from rooms";
    db.query(getData,(error,result) => {
        if(error === null){         
            let roomCodes = result.map((item)=>item.roomid);
            const newRoomCode = UserCode(roomCodes);
            const SqlInert = "INSERT INTO rooms (roomname,roomavtar,memberCount,members,roomid) VALUES (?,?,?,?,?)";
            db.query(SqlInert,[roomName,roomAvtar,roomMember,uid,newRoomCode],(e,r) => {
                if(e===null){
                    res.send({error:false, roomId:newRoomCode})
                }else{
                    res.send({error:true})
                }
            })
        }else{
            res.send({error:true})
        }
    })

})

//  Join room

app.post("/API/JoinRoom",(req,res) => {
    if(MY_API_KEY !== req.body.API_KEY){ 
        res.send({error:true,errorType:"API_KEY"});
        return false;
    } 
    const sqlget = "SELECT * FROM rooms WHERE roomid = ?";
    db.query(sqlget,[req.body.roomId],(e,r)=>{
        if(e === null){
            if(r.length === 0){
                res.send({error:false,success:false,Reason:"NoRoom"})
            }if(r.length > 1){
                res.send({error:true})
            }
            if(r.length === 1){
                let enrolledUsers = r[0].members;
                let maxMembers = parseInt(r[0].memberCount);
                enrolledUsers = enrolledUsers.split(",");
                enrolledUsers.pop();
                if(enrolledUsers.length < maxMembers){
                    let uid = req.body.uid;
                    let exist = 0;
                    for(let i = 0; i < enrolledUsers.length; i++){
                        if(enrolledUsers[i] === uid){
                            exist = 1;
                        }
                    }
                    if(exist === 1){
                        res.send({error:false,success:false,Reason:"YouAlreadyExist"})
                    }else{
                        let enrolledUsers_string = r[0].members;
                        enrolledUsers_string =  enrolledUsers_string + uid+",";
                        const updateQuery = "UPDATE rooms SET members = ? WHERE roomid = ?";
                        db.query(updateQuery,[enrolledUsers_string,req.body.roomId],(ee,rr) => {
                            if(ee === null){
                                res.send({error:false,success:true})
                            }else{
                                res.send({error:true})
                            }
                        })

                    }
                }else if(enrolledUsers.length === maxMembers){
                    res.send({error:false,success:false,Reason:"NoSpaceInRoom"});
                }else{
                    res.send({error:true});
                }
            }
        }else{
            res.send({error:true})
        }
    });
    
}) 



// Send Room info

app.post("/API/GetRooms",(req,res) => {
    if(MY_API_KEY !== req.body.API_KEY){ 
        res.send({error:true,errorType:"API_KEY"});
        return false;
    } 
    const sqlFetch = "SELECT * FROM rooms WHERE members LIKE '%"+req.body.uid+"%' ORDER BY id ASC";
    db.query(sqlFetch,(e,r) => {
        if(e === null){
            if(r.length === 0){
                res.send({error : false, success : true, RoomData : [] })
                return false;
            }
            const dataArray = r;
            let roomQuery = "SELECT * FROM roomchats WHERE roomid IN(";

            for(let i = 0; i<dataArray.length; i++){
                roomQuery += "'"+dataArray[i].roomid+"'";
                if(i !== dataArray.length - 1){
                    roomQuery += ",";
                }
            }
            roomQuery += ") ORDER BY id DESC";

            let x_RoomOrder = [];
            let RoomOrder = [];
            db.query(roomQuery,(ee,rr) => {
                if(ee === null){   
                    for(let i = 0; i < rr.length; i++){
                        x_RoomOrder.push(rr[i].roomid);
                    }
                    // console.log(x_RoomOrder.length);
                    for(let i = 0; i < x_RoomOrder.length ; i++){
                        if(!RoomOrder.includes(x_RoomOrder[i])){
                            RoomOrder.push(x_RoomOrder[i]);
                        }
                    }
                    // console.log(RoomOrder);
                    let newDataArray = [];
                    let temp_array = []
                    for(let i = 0; i<RoomOrder.length; i++){
                        for(let j = 0; j<dataArray.length; j++){
                            if(RoomOrder[i] === dataArray[j].roomid){
                                newDataArray.push(dataArray[j]);
                                temp_array.push(j);
                            }
                        }
                    }
                    dataArray.map((item,index)=>{
                        if(!temp_array.includes(index)){
                            newDataArray.push(item);
                        }
                    })
                    // newDataArray is the variable which contain room detail with sorting. 


                    res.send({error:false,success:true,RoomData:newDataArray})
                    return true;
                }else{
                    res.send({error:true})
                }
            })

        }else{
            res.send({error:true})
        }
    })
})


// Send This.Room Info

app.post("/API/ThisRoomInfo",(req,res) => {
    if(MY_API_KEY !== req.body.API_KEY){ 
        res.send({error:true,errorType:"API_KEY"});
        return false;
    } 
    const sqlQuery = "SELECT * FROM rooms WHERE roomid = ?";
    db.query(sqlQuery,[req.body.roomId],(e,r) => {
        if(e === null){
            if(r.length===0){
                res.send({error:true});
                return false;
            }
            let members = r[0].members.split(",");
            members.pop(); 

            let sqlFetch = "SELECT user_name,user_email,user_avtar,userid FROM chatusers WHERE userid IN("

            for(let i = 0; i < members.length; i++){
                sqlFetch += "'"+members[i]+"'";
                if(i !== members.length - 1){
                    sqlFetch += ",";
                }
            }
            sqlFetch += ")";

            db.query(sqlFetch,(ee,rr) => {
                if(ee === null){
                    res.send({
                        error : false,
                        success : true,
                        roomDetails : {
                            roomname : r[0].roomname,
                            roomavtar : r[0].roomavtar,
                            maxMember : r[0].memberCount,
                            nowMember : members.length
                        },
                        members : rr
                    })
                }else{
                    res.send({error:true});
                }
            })
        }else{
            res.send({error:true})
        }
    })
})












// save message

app.post("/API/SendMessage",(req,res) => {
    if(MY_API_KEY !== req.body.API_KEY){ 
        res.send({error:true,errorType:"API_KEY"});
        return false;
    } 
    let maxMsg = 99;
    // console.log("mmm");
    const sqlQuery = "SELECT * FROM roomchats WHERE roomid = (?) ORDER BY id ASC";
    db.query(sqlQuery,[req.body.roomId],(e,r) => {
        if(e === null){
            
            let data = [];
            let replyTo = 0;
            if(r.length > maxMsg){
                for(let i = r.length-1; i >=0; i--){
                    data.push(r[i]);
                }
                for(let i = data.length-1; i >= maxMsg; i--){
                    const deletQuery = "DELETE FROM roomchats WHERE id = ?";
                    db.query(deletQuery,[data[i].id]);
                    data.pop();   
                }
            }else{
                data = r;
            }
            for(let i = 0; i < data.length; i++){
                if(data[i].id === parseInt(req.body.replyTo)){
                    replyTo = parseInt(req.body.replyTo);
                }
            }

            let myTime = "10:20 PM";
            let myDate = "09-09-2022";

            const sqlSaveMessage = "INSERT INTO roomchats (senderid,main_msg,time,date,roomid,seenby,replyTo) VALUES (?,?,?,?,?,?,?)";
            db.query(sqlSaveMessage,[req.body.me,req.body.message,myTime,myDate,req.body.roomId,"",replyTo], (ee,rr) => {
                if(ee === null){
                    res.send({error : false,success:true});
                }else{
                    res.send({error : true});
                }
            })
            
        }else{
            // console.log(e);
            res.send({error : true})
        }
    })
})



// Receive message






app.post("/API/getMessages",(req,res) => {
    if(MY_API_KEY !== req.body.API_KEY){ 
        res.send({error:true,errorType:"API_KEY"});
        return false;
    } 
    if(req.body.roomid === ""){
        res.send({error:true,message : []})
        return false;
    }
    const sqlQuery = "SELECT * FROM roomchats WHERE roomid = ? ORDER BY id ASC";
    db.query(sqlQuery,[req.body.roomid],(e,r) => {
        if(e === null){
            if(r.length === 0){
                res.send({error:false,success:true,message : []})
                return false;
            }
            let replys = [];
            for(let i = 0; i < r.length; i++){
                if(r[i].replyTo != 0){
                    if(!replys.includes(r[i].replyTo)){
                        replys.push(r[i].replyTo);
                    }
                }
            }
            if(replys.length === 0){
                for(let i = 0; i < r.length; i++){
                    r[i].replyExist = false;
                }
                res.send({error : false, success : true, message : r});
                return true;
            }
            let DynamicQuery = "SELECT id,senderid,main_msg FROM roomchats WHERE roomid = '"+req.body.roomid+"' AND id IN("

            for(let i = 0; i < replys.length; i++){
                DynamicQuery += "'"+replys[i]+"'";
                if(i !== replys.length - 1){
                    DynamicQuery += ",";
                }
            }
            DynamicQuery += ")";
            // console.log(DynamicQuery);
            db.query(DynamicQuery,(ee,rr) => {
                if(ee === null){
                    let exist_replys = rr.map((item) => item.id)

                    for(let i = 0; i < r.length; i++){
                        if(r[i].replyTo === 0){
                            r[i].replyExist = false;
                        }else{
                            if(exist_replys.includes(r[i].replyTo)){
                                r[i].replyExist = true;
                                r[i].reply_senderid = rr[exist_replys.indexOf(r[i].replyTo)].senderid;
                                r[i].reply_Msg = rr[exist_replys.indexOf(r[i].replyTo)].main_msg;
                            }
                        }
                    }

                    res.send({error : false, success : true, message : r})

                }else{
                    res.send({error : true,message: []})
                }
            })

        }else{
            res.send({error:true})
        }
    })
    
})












// Extra Renders

app.get("/",(req,res) => {
    res.send("abey sale");
})
app.get("/Login",(req,res) => {
    res.send("aao aao");
})
app.get("/Register",(req,res) => {
    res.send("counter number 5 pe hoga registeration");
})




// Start Application

app.listen(port,() => {
    console.log("App started at port number "+ port);
})

































// Helpfull code


// app.post("/api/saveuser" ,(req,res) => {
//     const username = req.body.username;
//     const useremail = req.body.useremail;
//     const userps = req.body.userpassword;
//     const sqlInsert = "INSERT INTO userdata (user_name,emailid,password) VALUES (?,?,?)";
//     db.query(sqlInsert, [username,useremail,userps],(err,result) => {
//         console.log("error :"+ err + "Result:" +result);
//     });
//     res.send("yes");
// });

// app.get("/api/getuser",(req,res) => {
//     const sqlget = "SELECT * FROM userdata";
//     db.query(sqlget,(err,result) => {
//         if(err){
//             console.log(err);
//         }else{
//             res.send(result);
//         }
//     })
// })



