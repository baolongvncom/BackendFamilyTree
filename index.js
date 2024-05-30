const port = 4000;
const http = require('http');
const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');

let isAdminExist = false;

const server = http.createServer(app);
// Pass a http.Server instance to the listen method
const io = require('socket.io')(server, {
    cors: {
        origin : '*',
    }
});
const cors = require('cors');
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const uuid = require("uuid");
const Product = require('./models/Product');
const User = require('./models/User');
const Message = require('./models/Message');
const Order = require('./models/Order');
require("dotenv/config");
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API } = process.env;
app.use(express.json());
app.use(cors());

// UID Generation
function generateID() {
    return uuid.v4();
}

// Database connection with MongoDB
MongoDB_URI = "mongodb+srv://baolongvncom:baolong123456@cluster0.0vgsjr7.mongodb.net/WatchShop";
mongoose.connect(MongoDB_URI);


// API Creation
app.get('/', (req, res) => {
    res.send("Hello from the server");
});

// Image Storage Engine
const storage = multer.diskStorage({
    destination: "./upload/images/",
    filename:(req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
})

// Creating Upload Endpoint for images
app.use("/images", express.static("upload/images"));

const fetchAdmin = async (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) {
        res.send({
            isAdmin: false,
            errors: "Please authenticate using a valid token",
        });
    }
    else
        try {
            const data = jwt.verify(token, "admin");
            req.user = data.user;
            next();
        } catch (error) {
            res.send({
                isAdmin: false,
                errors: "Please authenticate using a valid token",
            });
        }
}

app.post("/upload", fetchAdmin, upload.single("product"), (req, res) => {
    res.json({
        success: 1,
        image_url: `https://deploynt208backend.onrender.com/images/${req.file.filename}`
    });
});

// Add Product API

app.post('/addproduct', fetchAdmin, async (req, res) => {
    const product = new Product(
        {
            id: generateID(),
            name: req.body.name,
            price: req.body.price,
            image: req.body.image,
            brand: req.body.brand,
            model: req.body.model,
            year: req.body.year,
            sex: req.body.sex,
            size: req.body.size,
            available: req.body.available,
        }
    )
    console.log(product);
    await product.save();
    console.log('Saved');
    res.json(
        {
            success: true,
            name: req.body.name,
        }
    );
    
}
);

// Remove Product API
app.post('/removeproduct', async (req, res) => {
    const product = await Product.findOneAndDelete({ id: req.body.id });
    if (product) {
        res.json(
            {
                success: true,
                name: product.name,
                id: product.id,
            }
        );
        console.log(product);
        console.log("Product Removed");
    } else {
        res.json(
            {
                success: false,
                name: "Product not found",
            }
        );
        console.log("Product not found");
    }
}
);



// Creating API for User Authentication
// Creating Endpoint for registering a user
app.post('/signup', async (req, res) => {
    let check = await User.findOne({ email: req.body.email });

    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    if (check) {
        return res
        .status(400)
        .json(
            {
                success: false,
                message: "Email already exists",
            }
        );
    }
    let cart = {};
    let order = [];
    cart["0"] = 0;
    order.push("0");
    const user = new User(
        {
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            cartData: cart,
            orderData: order,
        }
    );

    await user.save();

    const data = {
        user:{
            id: user.id,
        }
    }

    const token = jwt.sign(data, "secret_ecom");
    let message = await Message.findOne({ user_id: user.id });
    
            if (!message) {
                message = new Message({ user_id: user.id, messages: [] });
                await message.save();
            }
    res.json(
        {
            success: true,
            token: token,
        }
    );
}
);

// Admin signup
app.get('/adminsignup', async (req, res) => {
    let check = await User.findOne({ email: 'admin' });
    if (check) {
        res.json({success: false, message: "Admin already exists"});
        return;
    }
    let cart = {};
    let order = [];

    const password = 'admin';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    cart["0"] = 0;
    order.push("0");
    const user = new User(
        {
            username: 'admin',
            email: 'admin',
            password: hashedPassword,
            cartData: cart,
            orderData: order,
        }
    );

    await user.save();

    const data = {
        user:{
            id: user.id,
        }
    }

    const token = jwt.sign(data, "admin");
    isAdminExist = true;
    let message = await Message.findOne({ user_id: user.id });
    
            if (!message) {
                message = new Message({ user_id: user.id, messages: [] });
                await message.save();
            }
    res.json(
        {
            success: true,
            token: token,
        }
    );
}
);


// Creating endpoint for user/admin login
app.post('/login', async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (user) 
    {
        // Dùng bcrypt để so sánh password
        const passCompare = await bcrypt.compare(req.body.password, user.password);
        if (passCompare) 
        {
            const data = {
                user:{
                    id: user.id,
                }
            }
            const token = req.body.email === 'admin'?jwt.sign(data, "admin"):jwt.sign(data, "secret_ecom");
            let message = await Message.findOne({ user_id: user.id });
    
            if (!message) {
                message = new Message({ user_id: user.id, messages: [] });
                await message.save();
            }
            req.body.email === 'admin' ?res.json(
                {
                    success: true,
                    token: token,
                    admin: true,
                }
            ):
            res.json(
                {
                    success: true,
                    token: token,
                    admin: false,
                }
            )
            ;
        }
        else
        {
            res.json(
                {
                    success: false,
                    message: "Invalid Password",
                }
            );
        }
    }
    else
    {
        res.json(
            {
                success: false,
                message: "User not found",
            }
        );
    }
        
});

// Get All Products API
app.get('/allproducts', async (req, res) => {
    const products = await Product.find({});
    res.json(products);
    console.log("All Products Fetched");
}
);

// Delete Image API
app.delete("/deleteimage", fetchAdmin, async (req, res) => {
    const image = req.body.image;
    console.log(image);
    const image_path = path.join("upload", image);
    fs.unlink(image_path, (err) => {
        if (err) {
            console.error(err);
            res.json({success: false});
            return;
        }
        res.json({success: true});
    });
});

// Update Product API
app.post("/updateproduct", fetchAdmin, upload.single("product"), async (req, res) => {
    const product
    = await Product.findOneAndUpdate(
        { id
            : req.body.id },
        {
            name: req.body.name,
            price: req.body.price,
            image: req.body.image,
            brand: req.body.brand,
            model: req.body.model,
            year: req.body.year,
            size: req.body.size,
            sex: req.body.sex,
        }
    );
    if (product) {
        res.json(
            {
                success: true,
                message: req.body.name,
            }
        );
        console.log("Product Updated");
    } else {
        res.json(
            {
                success: false,
                message: "Product not found",
            }
        );
        console.log("Product not found");
    }
}
);


// Creating endpoint for getting all users data
app.get('/allusers', fetchAdmin, async (req, res) => {
    // Fetch all users from database except admin
    let users
    users = await User.find({email:{$ne:'admin'}});
    res.json(users);
    console.log(users);
    console.log("All Users Fetched");
}
);

// Creating endpoint for newcollection data

app.get('/newcollections', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection);
}
);

// Creating endpoint for popular women watches
app.get('/popularinwomen', async (req, res) => {
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0, 4);
    console.log("Popular Women Watches Fetched");
    res.send(popular_in_women);
}
);

// Creating middleware for user authentication
const fetchUser = async (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) {
        res.status(401).send({
            errors: "Please authenticate using a valid token",
        });
    }
    else
        try {
            const data = jwt.verify(token, "secret_ecom");
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({
                errors: "Please authenticate using a valid token",
            });
        }
}


app.get('/isadmin', fetchAdmin, async (req, res) => {
    res.json({isAdmin: true});
});


// Creating endpoint for adding products in cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
    let userData = await User.findOne({ _id: req.user.id });
    if (req.body.itemId in userData.cartData) {
        userData.cartData[req.body.itemId] += 1;
    }
    else {
        userData.cartData[req.body.itemId] = 1;
    }
    await User.findOneAndUpdate({ _id: req.user.id }, { cartData:userData.cartData });
    res.send("Product Added to Cart");
});


// creating endpoint for removing products from cartdata
app.post('/removefromcart', fetchUser, async (req, res) => {
    let userData = await User.findOne({ _id: req.user.id });
    if (req.body.itemId in userData.cartData) {
        userData.cartData[req.body.itemId] -= 1;
        if (userData.cartData[req.body.itemId] === 0) {
            delete userData.cartData[req.body.itemId];
        }
        await User.findOneAndUpdate({ _id: req.user.id }, { cartData:userData.cartData });
        res.send("Product Removed from Cart");
    }
    else {
        res.send("Product not found in cart");
    }
    
});

// creating endpoint for removing an entire product from cartdata
app.post('/removeallfromcart', fetchUser, async (req, res) => {
    let userData = await User.findOne({ _id: req.user.id });
    if (req.body.itemId in userData.cartData) {
        delete userData.cartData[req.body.itemId];
        await User
        .findOneAndUpdate(
            { _id: req.user.id }, 
            { cartData: userData.cartData},
        );
        res.send("Product Removed from Cart");
    }
    else {
        res.send("Product not found in cart");
    }

});


// Creating endpoint for getting cartdata
app.post('/getcart', fetchUser, async (req, res) => {
    console.log("Get Cart Data");
    let userData = await User.findOne({ _id: req.user.id });
    res.json(userData.cartData);
});

// Creating endpoint for user profile
app.post('/getinfo', fetchUser,async(req,res)=>{
    let user = await User.findOne({_id:req.user.id});
    res.json(user);
  })

// Creating endpoint for getiing chat messages
app.get('/getmessages', fetchUser, async (req, res) => {
    let message = await Message.find({
        user_id:req.user.id,
      });
    message = message[0];
    if (!message) {
        return res.json({messages: []});
    }
    res.json(message.messages);
});

// Creating endpoint for getting all messages
app.get('/admingetmessages', fetchAdmin, async (req, res) => {
    const message = await Message.find({});
    console.log('All Messages Fetched');
    res.json(message);
});

const fs = require('fs');

const imageSearchStorage = multer.diskStorage({
    destination: "./upload/imageSearch/",
    filename:(req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const imageSearchUpload = multer(
    {
        storage: imageSearchStorage,
    })

    // Creating Upload Endpoint for imageSearch
app.use("/imagesearchstorage", express.static("upload/imageSearch"));

app.post('/imagesearch',imageSearchUpload.single('query_img'), async (req, res) => {
    try {
        // Kiểm tra xem có file query_img không
        if (!req.file) {
            return res.status(400).send('No image was uploaded.');
        }
        // Tạo formData mới để gửi đến URL khác
        let imageSearchformData = new FormData();

        console.log(req.file);

        imageSearchformData.append('query_img', req.file.filename);

        // Gửi formData đến URL khác
        const response = await fetch('http://localhost:5001/imagesearch', {
            method: 'POST',
            body: imageSearchformData
        });

        // Đọc và trả về phản hồi từ URL khác
        res.json(await response.json());
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Midlleware for reatrain model
app.post('/retrain', async (req, res) => {
    try {
        // Tao formData moi de gui den URL khac
        let formData = new FormData();
        console.log(req.body.image_filename);
        formData.append('image_filename', req.body.image_filename);
        // Gui formData den URL khac
        const response = await fetch(
            'http://localhost:5001/retrain',
            {
                method: 'POST',
                body: formData,
            }
        );
        res.json(await response.json());
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/changeinfo', fetchUser, async(req,res)=>{
    if (req.body.email === 'admin') {
        res.json({success:false,errors:"Invalid Email"});
        return;
    }
    let userData = await User.findOne({ _id: req.user.id });
    userData.username = req.body.username;
    userData.email = req.body.email;
    await User.findOneAndUpdate({ _id: req.user.id }, {username:userData.username, email:userData.email});
    console.log("Updated User Info");
    res.json({success:true,alert:"User Info Updated"});
    //res.json({success:false,errors:"Wrong Email Id"})
  })

app.post('/changepassword', fetchUser, async(req,res)=>{
let userData = await User.findOne({ _id: req.user.id });
const oldPassword = req.body.oldpassword;
const newPassword = req.body.newpassword;
const passCompare = await bcrypt.compare(oldPassword, userData.password);
if (passCompare) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findOneAndUpdate({ _id: req.user.id }, { password: hashedPassword });
    res.json({success: true, message: "Password Changed Successfully"});
}
else {
    res.json({success: false, message: "Invalid Password"});
}
})


  // Creating endpoint for user to order products
app.post('/order', fetchUser, async (req, res) => {
    let userData = await User.findOne({ _id: req.user.id });
    let order = new Order(
        {
            id: generateID(),
            user_id: req.user.id,
            products: req.body.products,
            total: req.body.total,
            fullname: req.body.fullname,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            province: req.body.province,
            city: req.body.city,
            ward: req.body.ward,
            time: req.body.time,
            status: "Pending",
            payment: req.body.payment,
        }
    );
    await order.save();
    userData.orderData.push(order._id);
    userData.cartData = {"0": 0};
    await User
    .findOneAndUpdate(
        { _id: req.user.id }, 
        { cartData: userData.cartData},
    );
    await User
    .findOneAndUpdate(
        { _id: req.user.id }, 
        { orderData: userData.orderData},
    );
    res.json({success: true, message: "Order Placed Successfully"});
}
);

// Creating endpoint for getting order by user id
app.post('/getorder', fetchUser, async (req, res) => {
    let order = await Order.find({ user_id: req.user.id });
    res.json(order);
});

app.get('/getallorder', fetchAdmin, async (req, res) => {
    let order = await Order.find({});
    res.json(order);
});

app.post('/confirmorder', fetchAdmin, async (req, res) => {
    let order = await Order
    .findOneAndUpdate(
        { id
            : req.body.id },
        {
            status: "Confirmed",
        }
    );
    if (order) {
        res.json(
            {
                success: true,
                message: "Order Confirmed",
            }
        );
        console.log("Order Confirmed");
    } else {
        res.json(
            {
                success: false,
                message: "Order not found",
            }
        );
        console.log("Order not found");
    }
}
);

// Authentication Middleware
// io.use( async (socket, next) => {
//     const token = socket.handshake.auth.token;
//     if (!token) {
//         return next(new Error("Please authenticate using a valid token"));
//     }
//     try {
//         const data = jwt.verify(token, "secret_ecom");
//         socket.user = data.user;
//         socket.join(data.user.id);
//         console.log("User connected: ", data.user.id);
//         next();
//     } catch (error) {
//         return next(new Error("Please authenticate using a valid token"));
//     }
//     try {
//         const deocode_admin = jwt.verify(token, "admin");
//         socket.user = deocode_admin.user;
//         console.log("Admin connected: ", deocode_admin.user.id);
//         next();
//     }
//     catch (error) {
//         return next(new Error("Please authenticate using a valid token"));
//     }
// });
// Creating Websocket Server
io.on('connection', async (socket) => {
    console.log(socket.id);
    const token = socket.handshake.auth.token;
    try {
        const decoded = jwt.verify(token, 'admin');
        // Get all users from database and join their rooms by their id
        const users = await User.find({email:{$ne:'admin'}});
        users.forEach(user => {
            socket.join(user._id);
            console.log("Admin connected to user: ", user._id);
        });
    }
    catch (error) {
        console.error('Error Admin connecting to the server:', error);
    }
    
    // Hello from the server
    socket.emit('message', 'Hello from the server');

    socket.on('message', (data) => {
        console.log(data);
    });
    


    // Admin add message with user id
    socket.on('adminAddMessage', async (data, callback) => {
            try
            {
                await Message.updateOne(
                    { user_id: data.user_id }, // Điều kiện tìm kiếm
                    {
                        $push: {
                            messages: {
                                content: data.content,
                                timeStamp: Date.now(),
                                userMessage: data.userMessage
                            }
                        }
                    }
                );
                io.emit('getMessage');
                io.emit('adminGetMessage');
                callback("Message sent");
                console.log('Đã thêm tin nhắn admin thành công!');
            }
            catch (error) {
                console.error('Lỗi khi admin thêm tin nhắn:', error);
            }    
    });


    // Add Message Event
    socket.on('addMessage', async (data, callback) => {
        // Add message to database
        try {
            // Giai mã token
            const decoded = jwt.verify(data.user_id, 'secret_ecom');


            let message = await Message.findOne({ user_id: decoded.user.id });
    
            if (!message) {
                message = new Message({ user_id: decoded.user.id, messages: [] });
                await message.save();
            }
            await Message.findOneAndUpdate(
                { user_id: decoded.user.id }, // Điều kiện tìm kiếm
                {
                    $push: {
                        messages: {
                            content: data.content,
                            timeStamp: Date.now(),
                            userMessage: data.userMessage
                        }
                    }
                }
            );
            
            console.log('Đã thêm tin nhắn thành công!');
            callback("Message sent");
            io.emit('adminGetMessage');
            io.emit('getMessage');
        } catch (error) {
            console.error('Lỗi khi thêm tin nhắn:', error);
        }             
    });
});

//TODO: PAYPAL
// host static files
//app.use(express.static("client"));


/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
    try {
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error("MISSING_API_CREDENTIALS");
      }
      const auth = Buffer.from(
        PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
      ).toString("base64");
      const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
  
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("Failed to generate Access Token:", error);
    }
  };
  
  /**
   * Create an order to start the transaction.
   * see https://developer.paypal.com/docs/api/orders/v2/#orders_create
   */
  const createOrder = async (cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    console.log(
      "shopping cart information passed from the frontend createOrder() callback:",
      cart,
    );
    
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API}/v2/checkout/orders`;
    // let message = await orderDetail.findOne({ total: totalCartAmount });  
    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            // value: orderDetail.total, 
            value: "110.00"  
          },
        },
      ],
    };
  
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
        // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
        // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
  
    return handleResponse(response);
  };
  
  /**
   * Capture payment for the created order to complete the transaction.
   * see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
   */
  const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`;
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
        // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
        // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
      },
    });
  
    return handleResponse(response);
  };
  
  async function handleResponse(response) {
    try {
      const jsonResponse = await response.json();
      return {
        jsonResponse,
        httpStatusCode: response.status,
      };
    } catch (err) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }
  }
  
  app.post(`/api/orders`, async (req, res) => {
  try {
      // use the cart information passed from the front-end to calculate the order amount detals
      const { cart } = req.body;
      const { jsonResponse, httpStatusCode } = await createOrder(cart);
      res.status(httpStatusCode).json(jsonResponse);
      console.log("create order")
    } catch (error) {
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to create order." });
    }
  });
  
  app.post(`/api/orders/:orderID/capture`, async (req, res) => {
    try {
      const { orderID } = req.params;
        console.log(orderID);  
      const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
      res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to capture order." });
    }
  });
  
  // serve index.html
  app.get("/", (req, res) => {
    res.sendFile(path.resolve("./client/checkout.html"));
  });
  


// Listening to the server
server.listen(port, (err) => {
    if (err) {
        console.log("Error in connecting to the server");
    } else {
        console.log("Server is running on port: " + port);
    }
});




