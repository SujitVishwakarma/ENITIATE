const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema.js");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate.js")

// for user registration
router.post("/signup", async (req, res) => {

    const { fname, email, password, cpassword } = req.body;

    if(!fname || !email || !password || !cpassword) {
        res.status(422).json({ error: "fill all the details" })
    }

    try {

        const preuser = await userdb.findOne({ email: email }, { timeout: 20000 });

        if (preuser) {
            res.status(422).json({ error: "This Email is Already Exist" })
        } else if (password !== cpassword) {
            res.status(422).json({ error: "Password and Confirm Password Not Match" })
        } else {
            const finalUser = new userdb({
                fname: fname,
                email: email,
                password: password,
                cpassword: cpassword
            });

            // here password hasing

            const storeData = await finalUser.save();

            // console.log(storeData);
            res.status(201).json({ status: 201, storeData })
        }

    } catch (error) {
        res.status(422).json(error);
        console.log(error);
    }

});



//for login

router.post("/login", async(req, res)=>{
    // console.log(req.body);
    const {email, password} = req.body;

    if(!email || !password) {
        res.status(422).json({ error: "fill all the details" })
    }

    try {
        const userValid = await userdb.findOne({email:email});

        if(userValid){
            const isMatch = await bcrypt.compare(password,userValid.password);
            if(!isMatch){
                res.status(422).json({error:"Invalid details"});
            }else{
                //token generate
                const token = await userValid.generateAuthtoken();
                // console.log(token);

                res.cookie("usercookie", token,{
                    expires:new Date(Date.now()+9000000),
                    httpOnly:true
                });
                const result ={
                    userValid,
                    token
                }
                res.status(201).json({status:201, result})
            }
        }
    } catch (error) {
        res.status(401).json(error);
        console.log("Catch error in login function at router.js");
        
    }
    

});


//user valid

router.get("/validuser",authenticate, async(req, res)=>{
    
    try {
        const ValidUserOne = await userdb.findOne({_id:req.userId});
        res.status(201).json({status:201,ValidUserOne});
    } catch (error) {
        res.status(401).json({status:401,error});
    }
});

//user Logout

router.get("/logout",authenticate,async(req, res)=>{
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem)=>{
            return curelem.token !== req.token
        });
        res.clearCookie("usercookie",{path:"/"});
        req.rootUser.save();
        res.status(201).json({status:201})
    } catch (error) {
        res.status(401).json({status:401,error})
    }
});

// for posts

router.get('/posts', async (req, res) => {
    try {
      const token = req.headers.authorization;
      const decoded = jwt.verify(token, keysecret);
      if (!decoded) {
        return res.status(401).send('Unauthorized');
      }
  
      const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
      const posts = response.data;
  
  
      res.send(posts);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  


module.exports = router;