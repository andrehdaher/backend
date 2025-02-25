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
require("dotenv").config();

var methodOverride = require("method-override");

const app = express();
app.use(cors({
  origin: 'https://andreh-daher.netlify.app',  // تحديد الـ origin الذي تريد السماح له
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],  // السماح بالطرق الأخرى
  allowedHeaders: ['Content-Type', 'Authorization'],  // السماح بالهيدر المناسب
}));
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




app.use(verifyRole);


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




// ✅ تحديث بيانات المستخدم
app.put("/api/update/:id", async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  
  if (updateFields.manualUpdate) {
    updateFields.lastUpdatedMonth = new Date(); // إضافة تاريخ التحديث إذا كان تحديثًا يدويًا
  }

  try {
    const updatedUser = await addUser.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error });
  }
});


// 📌 دالة إضافة المنتج (POST)
app.post("/api/products", async (req, res) => {

  try {
    const { name, type, wholesalePrice, salePrice, quantity } = req.body;

    // التحقق من البيانات
    if (!name || !type || !wholesalePrice || !salePrice || !quantity) {
      return res.status(400).json({ error: "❌ جميع الحقول مطلوبة!" });
    }

    if (wholesalePrice <= 0 || salePrice <= 0 || quantity <= 0) {
      return res.status(400).json({ error: "❌ يجب أن تكون القيم أكبر من 0!" });
    }

    // إنشاء كائن المنتج
    const newProduct = new Product({
      name,
      type,
      wholesalePrice,
      salePrice,
      quantity,
      balance: salePrice * quantity, // إضافة الرصيد كقيمة محسوبة
      totalSales: 0, // تعيين المبيعات الافتراضية إلى 0
    });

    // حفظ المنتج في قاعدة البيانات
    await newProduct.save();

    res.status(201).json({ message: "✅ تم إضافة المنتج بنجاح!", product: newProduct });
  } catch (error) {
    console.error("❌ خطأ في السيرفر:", error);
    res.status(500).json({ error: "❌ حدث خطأ في الخادم!" });
  }
});


// ✅ 📌 جلب المنتجات
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find(); // جلب جميع المنتجات
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "❌ فشل جلب المنتجات" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    console.log(req.body)
    const { quantity, totalSales } = req.body;
    console.log(req.body)  // تأكد من أن البيانات تصل بشكل صحيح
    await Product.findByIdAndUpdate(req.params.id, { quantity, totalSales });
    res.json({ message: "✅ تم التحديث بنجاح" });
  } catch (error) {
    res.status(500).json({ error: "❌ فشل التحديث" });
  }
});


// دالة تحديث المنتج بناءً على ID
app.put("/api/productss/:id", async (req, res) => {
  const { id } = req.params; // الحصول على الـ ID من URL
  const updatedProduct = req.body; // الحصول على البيانات من الجسم (body)

  

  try {
    // التحقق من وجود المنتج
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "❌ المنتج غير موجود!" });
    }

    // تحديث المنتج
    const result = await Product.findByIdAndUpdate(id, updatedProduct, { new: true });

    // التأكد من أن المنتج تم تحديثه بنجاح
    console.log("Updated Product:", result);

    // إعادة النتيجة (المنتج المحدث)
    res.json({ message: "✅ تم تعديل المنتج بنجاح!", product: result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "❌ حدث خطأ في الخادم!" });
  }
});



// 🔹 حفظ عملية البيع في قاعدة البيانات
app.post("/api/", async (req, res) => {
  try {
    const { productId, productName, quantitySold, salePrice, totalSale, paymentMethod, date } = req.body;

    // ✅ إنشاء سجل جديد في مجموعة المبيعات
    const newSale = new Sale({
      productId,
      productName,
      quantitySold,
      salePrice,
      totalSale,
      paymentMethod,
      date,
    });

    await newSale.save();

    // ✅ تحديث الكمية في مجموعة المنتجات
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: -quantitySold, totalSales: totalSale },
    });

    res.status(201).json({ message: "✅ عملية البيع ناجحة!", sale: newSale });
  } catch (error) {
    console.error("❌ خطأ أثناء تسجيل البيع:", error);
    res.status(500).json({ message: "❌ فشل في تسجيل البيع!" });
  }
});
// ✅ حذف المنتج من قاعدة البيانات
app.delete("/api/products/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "❌ المنتج غير موجود!" });
    }

    res.status(200).json({ message: "✅ تم حذف المنتج بنجاح!" });
  } catch (error) {
    console.error("❌ خطأ أثناء حذف المنتج:", error);
    res.status(500).json({ message: "❌ خطأ في الخادم!" });
  }

});

app.post("/api/sales", async (req, res) => {
  try {
    // استخراج البيانات من الجسم (req.body)
    const { productId, productName, quantitySold, salePrice, totalSale, paymentMethod, date } = req.body;

    // تحقق من وجود جميع الحقول الضرورية
    if (!productId || !productName || !quantitySold || !salePrice || !totalSale || !paymentMethod || !date) {
      return res.status(400).json({ error: "❌ جميع الحقول مطلوبة!" });
    }

    // تسجيل البيع في قاعدة البيانات
    const sale = new Sale(req.body);
    await sale.save();

    // تحديث الكمية في المنتج بعد البيع
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "❌ المنتج غير موجود!" });
    }
    
    product.quantity -= quantitySold;
    await product.save();

    // إرسال الاستجابة بنجاح
    res.status(201).json(sale);
  } catch (error) {
    console.error("❌ خطأ في تسجيل البيع:", error);
    res.status(500).json({ error: "❌ مشكلة في السيرفر أثناء تسجيل البيع!" });
  }
});


app.get("/api/sales", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1 }); // ترتيب تنازلي حسب التاريخ
    res.status(200).json(sales);
  } catch (error) {
    console.error("❌ خطأ أثناء جلب المبيعات:", error);
    res.status(500).json({ message: "❌ خطأ في الخادم!" });
  }
});



// 🗑 حذف عملية بيع
app.delete("/api/sales/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSale = await Sale.findByIdAndDelete(id);

    if (!deletedSale) {
      return res.status(404).json({ message: "❌ لم يتم العثور على العملية!" });
    }

    res.json({ message: "✅ تم حذف العملية بنجاح!", deletedSale });
  } catch (error) {
    console.error("❌ خطأ أثناء الحذف:", error);
    res.status(500).json({ message: "❌ خطأ في الخادم الداخلي" });
  }
});


// 🛠️ تحديث عملية بيع
app.put("/api/sales/:id", async (req, res) => {
  try {
    const { id } = req.params; // الحصول على معرف العملية
    const { productName, quantitySold, salePrice, paymentMethod } = req.body; // البيانات الجديدة

    // ✅ تحديث العملية في قاعدة البيانات
    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      {
        productName,
        quantitySold,
        salePrice,
        totalSale: quantitySold * salePrice, // إعادة حساب إجمالي البيع
        paymentMethod,
      },
      { new: true } // إرجاع الوثيقة المحدثة
    );

    // تحقق إذا لم يتم العثور على العملية
    if (!updatedSale) {
      return res.status(404).json({ message: "❌ لم يتم العثور على العملية!" });
    }

    res.status(200).json({ message: "✅ تم تحديث العملية بنجاح!", sale: updatedSale });
  } catch (error) {
    console.error("❌ خطأ أثناء التحديث:", error);
    res.status(500).json({ message: "❌ حدث خطأ أثناء التحديث!", error });
  }
});




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
app.listen(port, "0.0.0.0",() => {
  console.log(`Server running on port ${port}`);
});