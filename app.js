require('dotenv').config();
const express= require('express');
const mysql = require('mysql2');
const bodyParser=require('body-parser');
const encoder=bodyParser.urlencoded();
const router=express.Router();
const path=require('path');
const multer=require('multer');
const session=require('express-session');
const AES = require('mysql-aes');
const alert = require('alert');
const PythonShell = require('python-shell')

const app=express();

const upload=multer({storage:multer.memoryStorage()});
app.use("/styales.css",express.static("styales.css"));
app.use("/01.jpg",express.static("01.jpg"));
app.use("/Welcome.css",express.static("Welcome.css"));
app.use("/Cart.css",express.static("Cart.css"));
app.use("/payments.png",express.static("payments.png"));
app.use("/bside.jpg",express.static("bside.jpg"));
app.use("/bc.jpg",express.static("bc.jpg"));
app.use("/book.webp",express.static("book.webp"));
app.use("/style.css",express.static("style.css"));
app.use("/delivery.png",express.static("delivery.png"));
app.use("/logo.png",express.static("logo.png"));
app.use("/transition.js",express.static("transition.js"));

app.use(session({
    secret:"secret-key",
    resave:false,
    saveUninitialized:false
}));

const connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"Yogesh@127103",
    database:"world"
});

connection.connect(function(error){
    if (error) throw error;
    else console.log("connection to database is successfull...")
});

app.get("/login",(req,res)=>{
    req.session.user=null
    res.sendFile(__dirname+'/Login.html');
});

app.post("/login",encoder,(req,res)=>{
    var userid=req.body.userid;
    var password=req.body.password;
    connection.query("select * from userdetails where userid=? and password=?",[userid,AES.encrypt(password,process.env.SECRET)],(error,results,fields)=>{
        if (results.length>0){
            req.session.user=userid;
            res.redirect('/welcome');
        }
        else{
            return res.status(400).json({msg: "enter valid details"});
        }
        res.end();
})});

app.get("/welcome",(req,res,next)=>{
    var query="select * from bookdetails";
    connection.query(query,(err,data)=>{
        if(err){
            throw err;
        }
        else{
            res.render(__dirname+'/Welcome.ejs',{title:'Node.js MySQL CRUD Application',action:'list',sampleData:data});
        }
    });
});

app.post("/welcome",encoder,(req,res)=>{
    if("add-to-cart"===req.body.formType){
        if(!req.session.user){
            res.redirect('/login');
        }
        else{
        var bname=req.body.bname;
        var Qty=req.body.Qty;
        connection.query("insert into cart (userid,bname,Qty) values(?,?,?)",[req.session.user,bname,Qty],(error,data)=>{
            if(error){
                throw error;
            }
            res.redirect('/welcome');
    })
    }}
    else if("search"===req.body.formType){
        var bname=req.body.bname;
        connection.query("select * from bookdetails where bname=?",[bname],(err,data)=>{
            res.render(__dirname+'/Welcome.ejs',{title:'Node.js MySQL CRUD Application',action:'list',sampleData:data});
        });
    }
});

app.get("/register",(req,res)=>{
    res.sendFile(__dirname+"/Register.html");
});

app.post("/register",encoder,(req,res)=>{
    var userid=req.body.userid;
    var firstname=req.body.firstname;
    var lastname=req.body.lastname;
    var emailid=req.body.emailid;
    var phonenumber=req.body.phonenumber;
    var password=req.body.password;
    connection.query("insert into userdetails (userid,fname,lname,emailid,phonenumber,password) values (?,?,?,?,?,?)",[userid,firstname,lastname,emailid,phonenumber,AES.encrypt(password,process.env.SECRET)],(error) => {
            if (error) {
                throw error;
            }
            else {
                res.redirect("/login");
            }
            res.end();
        })
});


app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/Home.html");
});

app.get("/admin",(req,res)=>{
    res.sendFile(__dirname+"/Admin.html");
});

app.post("/admin",upload.single('img'),(req,res)=>{
    if ("Add Product"===req.body.formType){
        var img=req.file.buffer.toString('base64');
        var bookname=req.body.bookname;
        var author=req.body.author;
        var category=req.body.category;
        var abt=req.body.abt;
        var price=req.body.price;
        connection.query("insert into bookdetails (imgHERE,bname,author,category,abt,price) values (?,?,?,?,?,?)",[img,bookname,author,category,abt,price],(error,results,fields) => {
                if (error) {
                    throw error;
                }
                else {
                    res.redirect("/admin");
                }
                res.end();
            });
        }
    else if ("Delete Product"===req.body.formType){
        var bookname=req.body.bookname;
        connection.query("delete from bookdetails where bname=?",[bookname],(error,results,fields) => {
                if (error) {
                    throw error;
                }
                else {
                    res.redirect("/admin");
                }
                res.end();
            });

        }
});

app.get("/cart",(req,res,next)=>{
    if(!req.session.user){
        res.redirect('/login');
    }
    else{
    var query="select c.Qty,c.bname,b.price,b.category,b.author,b.imgHERE from cart c inner join bookdetails b on b.bname=c.bname and userid=?";
    connection.query(query,[req.session.user],(err,data)=>{
        if(err){
            throw err;
        }
        else{
            res.render(__dirname+'/Cart.ejs',{title:'Node.js MySQL CRUD Application',action:'list',sampleData:data});
        }
    });}
});

app.post("/cart",encoder,(req,res)=>{
    if(req.body.formType=="remove-from-cart"){
    var bname=req.body.bname;
    connection.query("DELETE FROM cart WHERE userid=? and bname=?",[req.session.user,bname],(error,results,fields) => {
        if (error) {
            throw error;
        }
        else {
            alert('Selected Product removed from cart');
            res.redirect("/cart");
        }
        res.end();
    });}
    else if(req.body.formType=="Buy"){
        connection.query("insert into orders select * from cart where userid=?",[req.session.user],(error) => {
            if(error){
                throw error;
            }
            else{
                connection.query("delete from cart where userid=?",[req.session.user],(err) => {
                    if(err){
                        throw err;
                    }
                    else{
                        alert('Cash On Delivery Order Successfull will be delivered safely...!');
                        res.redirect('/cart');
                    }
                })
            }
        })
    }
});


app.get("/orders",(req,res,next)=>{
    if(!req.session.user){
        res.redirect('/login');
    }
    else{
    var query="select o.Qty,o.bname,b.price,b.category,b.author,b.imgHERE from orders o inner join bookdetails b on b.bname=o.bname and userid=?";
    connection.query(query,[req.session.user],(err,data)=>{
        if(err){
            throw err;
        }
        else{
            res.render(__dirname+'/orders.ejs',{title:'Node.js MySQL CRUD Application',action:'list',sampleData:data});
        }
    });}
});

app.post("/orders",encoder,(req,res)=>{
    if(req.body.formType=="remove-from-orders"){
    var bname=req.body.bname;
    connection.query("DELETE FROM orders WHERE userid=? and bname=?",[req.session.user,bname],(error,results,fields) => {
        if (error) {
            throw error;
        }
        else {
            alert('Order Cancelled for selected Product');
            res.redirect("/orders");
        }
        res.end();
    });}
    else if(req.body.formType=="cancel-all"){
        connection.query("delete from orders where userid=?",[req.session.user],(error) => {
            if(error){
                throw error;
            }
            else{
                connection.query("delete from orders where userid=?",[req.session.user],(err) => {
                    if(err){
                        throw err;
                    }
                    else{
                        alert('All Orders are cancelled Successfully...!');
                        res.redirect('/orders');
                    }
                })
            }
        })
    }
});


module.exports=router;

app.listen(4000,()=>{console.log("Server is Up and Running at port 4000...");});