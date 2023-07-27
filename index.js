const express = require('express');
const app=express();
const cookieparser=require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = "mYKey";
const cors=require('cors');

const mongoose=require('mongoose');
app.use(cors(
    {credentials:true,origin:true}
    
));
app.use(cookieparser());
app.use(express.json());


const port=process.env.PORT || 4000;
const u="mongodb+srv://anujkumar666768:foodwind@cluster0.92wcwh6.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(u,{useNewUrlParser:true})
const myschema=new mongoose.Schema({
    name:String,
    email:String,
    location:String,
    phone:String,
    password:String,
    
});


const Data=new mongoose.model("food",myschema);
const orderschema=new mongoose.Schema({
    food:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "food"
    },
    content:{
        type:Array
    }
})

const Order=new mongoose.model("order",orderschema);



const signup=async(req,res)=>{
    const{name,email,location,phone,password}=req.body;
    let existinguser;
    try {
        existinguser=await Data.findOne({email:email})
    } catch (error) {
        console.log(error)
    }
    if(existinguser){
        return res.json({ message: "already exist" });
    }
    const hashpassword=bcrypt.hashSync(password)


    const data=new Data({
        name,
        email,
        location,
        phone,
        password:hashpassword
    })
    await data.save();
    return res.json({ message: "Successfully Submitted" });
}


const postorder=async(req,res)=>{
const tokenn=req.cookies.jwtoken;
const verifytoken= jwt.verify(String(tokenn),JWT_SECRET_KEY)
console.log(verifytoken.id)
const user=await Order.findOne({food:verifytoken.id})
if(!user){
    let createfirsorder=new Order({
        food:verifytoken.id,
        content:[req.body.content]
    })
    await createfirsorder.save();
    return res.json({ message: "Item Ordered Successfully" });
}else{
    let pushorder=await Order.findOneAndUpdate(
        {food:verifytoken.id},
        {$push:{content:req.body.content}}
        
    )
    await pushorder.save()
    return res.json({ message: "Item Ordered Successfully" });
}


}
const getorder=async(req,res)=>{
const tokenn=req.cookies.jwtoken;
const verifytoken= jwt.verify(String(tokenn),JWT_SECRET_KEY)
const user=await Order.findOne({food:verifytoken.id})
if(!user){
    return res.status(404).json({ message: "No order found" })
}
return res.status(200).send( user )
}





const login=async(req,res)=>{
    const {email,password}=req.body;
    let existingUser;
    try {
        existingUser=await Data.findOne({email:email})
    } catch (error) {
        console.log(error)
    }
    if(!existingUser){
        return res.json({ message: "User not registered" })
    }
    const ispasswordcorrect=bcrypt.compareSync(password,existingUser.password);
    if(!ispasswordcorrect){
        return res.json({ message: "Password not match" })
    }
    const token = jwt.sign({ id: existingUser._id }, JWT_SECRET_KEY, {
        expiresIn: "12000s",
    });
 
    res.cookie("jwtoken",token,{
        expires:new Date(Date.now() + 1000 * 12000)
    })
 
    return res.json({message:"Successfully Login",dataa:existingUser,token})
}









const verifytoken=(req,res,next)=>{
    const tokenn=  req.cookies.jwtoken//req.headers.authorization.split("    ")[1 ]
    console.log(tokenn)
    if(!tokenn){
        res.json({message:"token is not found"});
    }else{
        jwt.verify(String(tokenn),JWT_SECRET_KEY,(err,dataa)=>{
            if(err){
                return res.json({message:"invalid"})
            }
            
            
            req.id=dataa.id;
        });
        
       next();
    }
    
  
}

const getuser = async (req, res, next) => {
    const userId = req.id;
    let user;
    try {
        user = await Data.findById(userId, "-password");
    } catch (error) {
        return new Error(err)
    }
    if (!user) {
        return res.status(404).json({ message: "user not found" })
    }
    return res.status(200).send( user )
}
app.get("/secret",verifytoken,getuser)
app.post("/secret/orderdata",verifytoken,postorder)
app.get("/secret/getorder",verifytoken,getorder)
app.post("/signup",signup)
app.post("/login",login)
app.listen(port,async()=>{
    console.log("the server is runnin on port 4000")
})




































