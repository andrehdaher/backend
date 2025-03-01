const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const User = require("./models/userShcema");
const addUser = require("./models/add-userSchema");
const Product = require("./models/productSchema "); 
const Passport  = require("./models/passportSchema"); 
const Sale = require("./models/Saleschema"); 
const Payment = require("./models/paymentSchema"); // استيراد موديل المدفوعات

require("dotenv").config();

var methodOverride = require("method-override");

const app = express();
app.use(cors());
app.options('*', cors()); // يسمح لجميع الطلبات OPTIONS
app.use(express.json());
app.use(methodOverride("_method"));
app.use("/uploads", express.static("uploads")); // جعل الملفات قابلة للوصول

mongoose
.connect(process.env.MONGO_URI)
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.log("❌ MongoDB connection error:", err));

const verifyRole = (role) => {
  return (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "No token provided, please login" });
    }

    try {
      const decoded = jwt.verify(token.split(" ")[1], "secretKey"); 
      if (decoded.role !== role) {
        return res.status(403).json({ message: "Access denied, incorrect role" });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token, please login again" });
    }
  };
};


  
  // ✅ تسجيل مستخدم جديد (Signup)
app.post("/api/signup", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ message: "Enter all fields" });
  }
  
  const isUser = await User.findOne({ email });
  if (isUser) {
    return res.status(400).json({ message: "User already exists" });
  }
  
  // لا حاجة لتشفير كلمة المرور، فقط خزنها كما هي
  await User.create({ email, password, role });

  res.status(200).json({ message: "Signup successful" });
});
  // ✅ تسجيل الدخول (Login)
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
  
      // مقارنة كلمة المرور المدخلة بكلمة المرور المخزنة كما هي
      if (password !== user.password) {
        return res.status(400).json({ message: "Invalid password" });
      }
  
      const token = jwt.sign({ id: user._id, role: user.role }, "secretKey", {
        expiresIn: "10m",
      });
  
      
      res.status(200).json({ message: "Login successful", token, role: user.role });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error logging in" });
    }
  });
  


// ✅ جلب بيانات مستخدم بواسطة البريد الإلكتروني
app.get("/api/user/:email", async (req, res) => {
  const { email } = req.params;

  
  
  try {
    const user = await User.findOne({user: email });
    
    if (!user) {
      console.log("❌ User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }
    
    
    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Error fetching user data:", err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});




// ✅ جلب جميع المستخدمين (للمشرف فقط)

app.get("/api/", async (req, res) => {
  try {
    const users = await addUser.find();
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching users" });
  }
});
// ✅ إضافة مستخدم جديد
app.post("/api/add-user", async (req, res) => {
  try {
    const { fullName, ip, tower, date, speed, user, password, required, paid, email } = req.body;

    const newUser = new addUser({ fullName, ip, tower, date, speed, user, password, required, paid, email });
    await newUser.save();

    res.status(200).json({ message: "User added successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error adding user", error });
  }
});
  
// ✅ حذف مستخدم
app.delete("/api/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await addUser.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
});


app.put("/api/update/:id", async (req, res) => {
  const { id } = req.params;
  const { paid, manualUpdate, ...updateFields } = req.body;

  try {
    const user = await addUser.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // إذا كان هناك قيمة لـ paid
    if (paid !== undefined) {
      // عند التحديث اليدوي، نقوم بتعيين القيمة الجديدة مباشرة
      if (manualUpdate) {
        updateFields.paid = Number(paid);
      } else {
        // عند إضافة دفعة، نقوم بجمع القيمة الجديدة مع القيمة السابقة
        updateFields.paid = Number(user.paid || 0) + Number(paid);
      }

      // ✅ إضافة دفعة جديدة إلى جدول المدفوعات
      const newPayment = new Payment({
        userId: user._id,
        amount: Number(paid),
        userName: user.fullName, // اسم المستخدم
      });

      // حفظ الدفعة الجديدة
      await newPayment.save();
    }

    // تحديث تاريخ آخر تحديث إذا كان التحديث يدويًا
    if (manualUpdate) {
      updateFields.lastUpdatedMonth = new Date();
    }

    // تحديث بيانات المستخدم وإرجاع النتيجة الجديدة
    const updatedUser = await addUser.findByIdAndUpdate(id, updateFields, { new: true });

    res.status(200).json({ updatedUser, payment: { userName: user.fullName, amount: paid, date: new Date().toISOString() } });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error });
  }
});

app.get("/api/payments", async (req, res) => {
  try {
    const users = await Payment.find().select("fullName payments");
    console.log("📢 البيانات المسترجعة من قاعدة البيانات:", users);
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ خطأ أثناء جلب البيانات:", error);
    res.status(500).json({ message: "خطأ أثناء جلب البيانات", error });
  }
});



app.get("/api/payments", async (req, res) => {
  try {
    const users = await Payment.find().select("userName amount");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Error fetching payments", error });
  }
});


app.get('/api/inventory', async (req, res) => {
  try {
    const products = await Product.find({}, 'name type wholesalePrice retailPrice quantity'); // تحديد الحقول المسترجعة
    res.json(products);
  } catch (error) {
    console.error("خطأ في جلب المنتجات:", error);
    res.status(500).send("حدث خطأ أثناء جلب المنتجات");
  }
});


// 2. إضافة منتج جديد
app.post('/api/inventory', async (req, res) => {
  const { name, type, wholesalePrice, retailPrice, quantity } = req.body;

  if (!name || !type || !wholesalePrice || !retailPrice || quantity === undefined) {
    return res.status(400).send("الرجاء إدخال كافة البيانات");
  }

  try {
    const newProduct = new Product({ name, type, wholesalePrice, retailPrice, quantity });
    await newProduct.save();
    res.status(201).send('تم إضافة المنتج بنجاح');
  } catch (error) {
    console.error("خطأ في إضافة المنتج:", error);
    res.status(500).send("حدث خطأ أثناء إضافة المنتج");
  }
});



// 3. تعديل سعر منتج
app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { wholesalePrice, retailPrice } = req.body;

  if (!wholesalePrice || isNaN(wholesalePrice) || !retailPrice || isNaN(retailPrice)) {
    return res.status(400).send("الرجاء إدخال أسعار صحيحة");
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send("المنتج غير موجود");
    }
    
    product.wholesalePrice = wholesalePrice;
    product.retailPrice = retailPrice;
    await product.save();

    res.status(200).json({ message: "تم تعديل الأسعار بنجاح", product });
  } catch (error) {
    console.error("خطأ في تعديل المنتج:", error);
    res.status(500).send("حدث خطأ أثناء تعديل المنتج");
  }
});



// 4. حذف منتج
app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).send("المنتج غير موجود");
    }

    res.status(200).send("تم حذف المنتج بنجاح");
  } catch (error) {
    console.error("خطأ في حذف المنتج:", error);
    res.status(500).send("حدث خطأ أثناء حذف المنتج");
  }
});



// تعديل بيع المنتج ليشمل تسجيل المبيعات
app.post('/api/inventory/:id/sell', async (req, res) => {
  console.log(req.body)
  const { id } = req.params;
  const { retailPrice, buyerName, paymentMethod } = req.body;

  if (!retailPrice || isNaN(retailPrice) || !buyerName || !paymentMethod) {
    return res.status(400).send('الرجاء إدخال جميع البيانات بشكل صحيح');
  }

  try {
    const product = await Product.findById(id);
    console.log(product);
    if (!product) {
      return res.status(404).send('المنتج غير موجود');
    }

    if (!product.quantity || product.quantity <= 0) {
      return res.status(400).send('المنتج غير متوفر في المخزون');
    }

    product.quantity -= 1; // تقليل الكمية
    await product.save();
    console.log("بعد تحديث المخزون:", product);

    // تسجيل عملية البيع
    const sale1 = new Sale({
      productId: product._id,
      retailPrice: Number(retailPrice), // التأكد من أنه رقم
      buyerName,
      paymentMethod,
      saleDate: new Date(), // تسجيل تاريخ البيع
    });
    console.log("عملية البيع:", sale1);

    await sale1.save();
    res.status(200).send('تم بيع المنتج بنجاح');
  } catch (error) {
    console.error('خطأ في بيع المنتج:', error);
    res.status(500).send('حدث خطأ أثناء بيع المنتج');
  }
});

// 6. عرض جميع المبيعات
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('productId', 'name type') // جلب اسم ونوع المنتج فقط
      .sort({ saleDate: -1 }); // ترتيب المبيعات من الأحدث إلى الأقدم

    res.json(sales);
  } catch (error) {
    console.error("خطأ في جلب المبيعات:", error);
    res.status(500).send("حدث خطأ أثناء جلب المبيعات");
  }
});



// تحديث طريقة الدفع
app.put('/api/sales/:id', async (req, res) => {
  try {
      const { paymentMethod } = req.body;
      if (!['كاش', 'دين'].includes(paymentMethod)) {
          return res.status(400).json({ message: "طريقة دفع غير صالحة" });
      }

      const sale = await Sale.findByIdAndUpdate(req.params.id, { paymentMethod }, { new: true });

      if (!sale) {
          return res.status(404).json({ message: "لم يتم العثور على البيع" });
      }

      res.json(sale);
  } catch (error) {
      console.error("خطأ في تحديث حالة الدفع:", error);
      res.status(500).json({ message: "خطأ في السيرفر" });
  }
});




// إضافة منتج جديد
app.post('/api/inventory', async (req, res) => {
  const { name, type, wholesalePrice, retailPrice, quantity } = req.body;

  if (!name || !type || !wholesalePrice || !retailPrice || !quantity) {
    return res.status(400).send('الرجاء إدخال جميع البيانات');
  }

  try {
    const newProduct = new Product({
      name,
      type,
      wholesalePrice,
      retailPrice,
      quantity,
    });

    await newProduct.save();
    res.status(201).send('تم إضافة المنتج بنجاح');
  } catch (error) {
    console.error('خطأ في إضافة المنتج:', error);
    res.status(500).send('حدث خطأ أثناء إضافة المنتج');
  }
});



//=======================================================================================









// إعدادات Multer لتحميل الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // مجلد حفظ الملفات
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // اسم الملف الفريد
  },
});

const upload = multer({ storage });

// دالة إضافة جواز سفر مع دعم رفع أكثر من صورة
app.post("/api/passports", upload.array("idImages", 10), async (req, res) => {
  try {
    const { fullName, passportType, amountPaid, isReserved } = req.body;

    if (!fullName || !passportType || !amountPaid) {
      return res.status(400).json({ message: "❌ يرجى ملء جميع الحقول المطلوبة!" });
    }

    const idImages = req.files.map((file) => file.path);

    const newPassport = new Passport({
      fullName,
      idImages,
      passportType,
      amountPaid,
      isReserved: isReserved === "true",
    });

    const savedPassport = await newPassport.save();

    res.status(201).json({
      message: "✅ تم إضافة الجواز بنجاح!",
      passport: savedPassport,
    });
  } catch (error) {
    console.error("❌ حدث خطأ أثناء إضافة الجواز:", error);
    res.status(500).json({ message: `❌ حدث خطأ أثناء حفظ البيانات: ${error.message}` });
  }
});


// دالة عرض الجوازات
app.get("/api/passports", async (req, res) => {
  try {
    const passports = await Passport.find(); // جلب جميع الجوازات من قاعدة البيانات
    res.json(passports); // إرسال الجوازات كاستجابة في هيئة JSON
  } catch (error) {
    console.error("❌ خطأ في جلب الجوازات:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الجوازات" });
  }
});




// دالة الحذف بناءً على الـ ID
app.delete("/api/passports/:id", async (req, res) => {
  try {
    // استخدام ID من الرابط للبحث عن الجواز
    const passport = await Passport.findByIdAndDelete(req.params.id);
    
    // إذا لم يتم العثور على الجواز
    if (!passport) {
      return res.status(404).json({ message: "الجواز غير موجود!" });
    }

    // حذف الصور المرتبطة بالجواز من المجلد
    passport.idImages.forEach((imagePath) => {
      const filePath = path.join(__dirname, imagePath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("❌ خطأ في حذف الصورة:", err);
        } else {
          console.log(`✅ تم حذف الصورة: ${imagePath}`);
        }
      });
    });

    // إذا تم العثور على الجواز وحذفه
    res.json({ message: "تم حذف الجواز بنجاح!" });
  } catch (error) {
    console.error("❌ حدث خطأ أثناء حذف الجواز:", error);
    res.status(500).json({ message: "حدث خطأ في الحذف، يرجى المحاولة لاحقًا." });
  }
});
// دالة تعديل الجواز
app.put("/api/passports/:id", upload.array("idImages", 10), async (req, res) => {
  try {
    const { id } = req.params;

    // جلب الجواز الحالي من قاعدة البيانات
    const passport = await Passport.findById(id);
    if (!passport) {
      return res.status(404).json({ message: "الجواز غير موجود!" });
    }

    // حذف الصور القديمة إذا تم تحميل صور جديدة
    passport.idImages.forEach((imagePath) => {
      const filePath = path.join(__dirname, imagePath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("❌ خطأ في حذف الصورة القديمة:", err);
        } 
      });
    });

    // تحديث البيانات مع الصور الجديدة
    const idImages = req.files.map((file) => file.path);
    const updatedPassport = await Passport.findByIdAndUpdate(
      id,
      {
        ...req.body, // تحديث باقي الحقول
        idImages: idImages, // تحديث الصور
      },
      { new: true }
    );

    res.status(200).json({ message: "✅ تم تعديل الجواز بنجاح!", passport: updatedPassport });
  } catch (error) {
    console.error("❌ حدث خطأ أثناء التعديل:", error);
    res.status(500).json({ message: "حدث خطأ في التعديل، يرجى المحاولة لاحقًا." });
  }
});


const port = process.env.PORT || 3000; // استخدام متغير البيئة
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});