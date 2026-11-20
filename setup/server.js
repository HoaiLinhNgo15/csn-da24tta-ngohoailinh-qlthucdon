//xây dựng api
// Nhập các framework cần thiết
import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";
import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import { sql, getConnection } from "./db/db.js";

//==============================================================================

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "html")));
app.use(express.static(path.join(__dirname, "assets")));
app.use(cors());

const uploadDir = path.join(__dirname, "images");
fs.mkdirSync(uploadDir, { recursive: true });

app.use("/images", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-");
    const safeName = (baseName || "mon-an").slice(0, 40);
    cb(null, `${Date.now()}-${safeName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

//Khai báo port và host name;
const port = process.env.PORT || 8082;
const hostname = process.env.HOST_NAME;

//đọc dữ liệu json gửi từ front-end
app.use(express.json());

//route cho trang login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await getConnection();

    //truy vấn SQL bằng Prepair Statement tránh SQL Injection
    const results = await pool
      .request()
      .input("Username", sql.NVarChar(50), username)
      .query(
        "SELECT MaAdmin, TenDangNhap, MatKhau, HoTen, Trangthai FROM ADMINISTRATOR WHERE TenDangNhap = @Username AND Trangthai = 1",
      );
    if (results.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản đăng nhập không tồn tại hoặc đã bị khóa",
      });
    }

    const user = results.recordset[0];

    const isMatch = await bcrypt.compare(password, user.MatKhau);
    //kiểm tra mật khẩu
    if (isMatch) {
      const { MatKhau: _, ...safeAdminInfo } = user;
      return res.json({
        success: true,
        message: "Đăng nhập thành công!",
        user: {
          id: user.MaAdmin,
          username: user.TenDangNhap,
          name: user.HoTen,
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không chính xác!",
      });
    }
  } catch (err) {
    console.error("CHI TIẾT LỖI TẠI API LOGIN:", err);
    res.status(500).json({ success: false, message: "Lỗi kết nối server!" });
  }
});

//====================== QUẢN LÝ MÓN ĂN =================================

//API TẠO DỮ LIỆU - CREATE
app.post("/api/createmonan", upload.single("hinhAnh"), async (req, res) => {
  try {
    //nhận dữ liệu yêu cầu req
    const { tenMon, moTa, giaBan, maNhom } = req.body;

    //Kiểm tra các dữ liệu bắt buộc
    if (!tenMon || !giaBan || !maNhom || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin!",
      });
    }
    const duongdananh = `/images/${req.file.filename}`;

    const pool = await getConnection();

    /*
    //cập nhật mã món mới nhất
    const checkId = await pool
      .request()
      .query(
        "SELECT TOP 1 MaMon FROM MONAN ORDER BY CAST(SUBSTRING(MaMon, 3, LEN(MaMon)) AS INT) DESC",
      );

    let nextMaMon = "MA001";
    if (checkId.recordset.length > 0) {
      const currentMaxId = checkId.recordset[0].MaMon;
      const numPart = parseInt(currentMaxId.replace("MA", "")) + 1;
      nextMaMon = "MA" + String(numPart).padStart(3, "0");
    }
    */

    // Lấy số thứ tự lớn nhất hiện tại bằng hàm MAX trong SQL Server
    const checkId = await pool.request().query(`
      SELECT MAX(CAST(SUBSTRING(MaMon, 3, LEN(MaMon)) AS INT)) AS MaxId
      FROM MONAN
      WHERE MaMon LIKE 'MA%'
    `);

    let nextNum = 1;
    if (checkId.recordset.length > 0 && checkId.recordset[0].MaxId !== null) {
      nextNum = checkId.recordset[0].MaxId + 1; // Lấy số lớn nhất + 1
    }

    const nextMaMon = "MA" + String(nextNum).padStart(3, "0"); // VD: Nếu lớn nhất là 6 thì thành MA007

    await pool
      .request()
      .input("MaMon", sql.VarChar(10), nextMaMon)
      .input("TenMon", sql.NVarChar(100), tenMon)
      .input("HinhAnh", sql.NVarChar(50), duongdananh)
      .input("MoTa", sql.NVarChar(255), moTa)
      .input("GiaBan", sql.Decimal(18, 2), giaBan)
      .input("MaNhom", sql.VarChar(10), maNhom)
      .query(
        `INSERT INTO MONAN (MaMon, TenMon, HinhAnh, MoTa, GiaBan, MaNhom) VALUES (@MaMon, @TenMon, @HinhAnh, @MoTa, @GiaBan, @MaNhom)`,
      );

    return res.json({
      success: true,
      message: `Thêm món ăn thành công với mã ${nextMaMon}!`,
    });
  } catch (err) {
    console.error("Lỗi khi thêm món: ", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
});

// API đọc dữ liệu - READ
app.get("/api/admin", async (req, res) => {
  try {
    const pool = await getConnection();

    const results = await pool
      .request()
      .query(
        "SELECT A.MaMon, A.TenMon, A.HinhAnh, A.GiaBan, A.MoTa, A.MaNhom, B.TenNhom FROM MONAN AS A, NHOMMON AS B WHERE A.MaNhom = B.MaNhom",
      );

    return res.json({
      success: true,
      data: results.recordset,
    });
  } catch (err) {
    console.error("CHI TIẾT LỖI TẠI API LOGIN:", err);
    res.status(500).json({ success: false, message: "Lỗi kết nối server!" });
  }
});

// API cập nhật dữ liệu
app.put("/api/monan/:maMon", upload.single("hinhAnh"), async (req, res) => {
  try {
    const { maMon } = req.params;
    const { tenMon, giaBan, moTa, maNhom } = req.body;

    if (!tenMon || !maNhom || !giaBan) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin!!",
      });
    }

    const pool = await getConnection();

    const existingRes = await pool
      .request()
      .input("MaMon", sql.VarChar(10), maMon)
      .query("SELECT HinhAnh FROM MONAN WHERE MaMon = @MaMon");

    if (existingRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy món ăn có mã ${maMon}`,
      });
    }

    const OldImg = existingRes.recordset[0].HinhAnh;

    const DuongDanAnh = req.file ? `/images/${req.file.filename}` : OldImg;

    await pool
      .request()
      .input("MaMon", sql.VarChar(10), maMon)
      .input("TenMon", sql.NVarChar(100), tenMon)
      .input("GiaBan", sql.Decimal(18, 2), giaBan)
      .input("HinhAnh", sql.NVarChar(255), DuongDanAnh)
      .input("MoTa", sql.NVarChar(100), moTa)
      .input("MaNhom", sql.VarChar(10), maNhom).query(`
        UPDATE MONAN
        SET TenMon = @TenMon, GiaBan = @GiaBan, HinhAnh = @HinhAnh, MoTa = @MoTa, MaNhom = @MaNhom
        WHERE MaMon = @MaMon
        `);

    if (req.file && OldImg && OldImg.startsWith("/images/")) {
      const oldFileName = path.basename(OldImg);
      const oldFilePath = path.join(uploadDir, oldFileName);
      fs.unlink(oldFilePath, (unlinkErr) => {
        if (unlinkErr && unlinkErr.code !== "ENOENT") {
          console.error("Không xóa được ảnh cũ: ", unlinkErr);
        }
      });
    }

    return res.json({
      success: true,
      message: `Cập nhật món ăn có mã ${maMon} thành công!`,
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật món ăn: ", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err,
    });
  }
});

//api xóa món ăn
app.delete("/api/monan/:maMon", async (req, res) => {
  try {
    const { maMon } = req.params;

    const pool = await getConnection();

    await pool
      .request()
      .input("MaMon", sql.VarChar(10), maMon)
      .query("DELETE FROM MONAN WHERE MaMon = @MaMon");

    return res.json({
      success: true,
      message: `Đã xóa thành công món ăn có mã ${maMon}`,
    });
  } catch (err) {
    console.error("Lỗi khi xóa món ăn: ", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
});

/*
app.get("/api/showmonan", async (req, res) => {
  const { Mamon } = req.body;
  try {
    const pool = await getConnection();

    const results = await pool
      .request()
      .input(Mamon, sql.VarChar(), Mamon)
      .query(
        "SELECT A.MaMon, A.TenMon, A.HinhAnh, A.MoTa, A.GiaBan, A.MoTa, B.TenNhom FROM MONAN AS A JOIN NHOMMON AS B ON A.MaNhom = B.MaNhom WHERE A.MaMon = @Mamon",
      );

    return res.json({
      success: true,
      data: results.recordset,
    });
  } catch (err) {
    Console.error("Lỗi kết nối: ", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server: " + err,
    });
  }
});
*/
//-----------------------------------------------------------------------

/// ==================== QUẢN LÝ LẬP THỰC ĐƠN =============================

app.get("/api/monan/thucdon", async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .query(
        "SELECT A.MaChiTiet, A.MaMon, B.TenMon, B.GiaBan, B.HinhAnh, A.NgayPhucVu, A.MaBuoi, C.TenBuoi, A.TrangThai, A.LuotQuanTam FROM CHI_TIET_THUC_DON AS A, MONAN AS B, TD_BUOI AS C WHERE A.MaMon = B.MaMon AND A.MaBuoi = C.MaBuoi",
      );

    return res.json({
      success: true,
      message: "Kết nối server thành công!",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Lỗi server: ", err);
    return res.status(500).json({
      success: false,
      message: "Kết nối server không thành công!!" + err.message,
    });
  }
});

//-------------------------------------------------------------------------

///===================== QUẢN LÝ TÀI KHOẢN ADMIN ============================

// api đọc dữ liệu thực thể admin
app.get("/api/readuser", async (req, res) => {
  try {
    const pool = await getConnection();

    const results = await pool.request().query("SELECT *FROM ADMINISTRATOR");

    return res.json({
      success: true,
      data: results.recordset,
    });
  } catch (err) {
    console.error("Lỗi server: ", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi kết nối: " + err,
    });
  }
});

// api đổi/reset mật khẩu admin
const saltRounds = 10; //độ phức tạp mã hóa = 10
app.put("/api/admin/reset-pwd/:id", async (req, res) => {
  try {
    const adminId = req.params.id;
    const { matKhau } = req.body;

    if (!matKhau) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu",
      });
    }

    const hashedPwd = await bcrypt.hash(matKhau, saltRounds);

    const pool = await getConnection();
    await pool
      .request()
      .input("MatKhau", sql.VarChar(255), hashedPwd)
      .input("MaAdmin", sql.Int, adminId)
      .query(
        "UPDATE ADMINISTRATOR SET MatKhau = @MatKhau WHERE MaAdmin = @MaAdmin",
      );

    return res.json({
      success: true,
      message: "Đã thiết lập mật khẩu thành công!!",
    });
  } catch (err) {
    console.error("Lỗi reset mật khẩu: ", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
});

// api thêm một tài khoản admin khác
app.post("/api/admin/create", async (req, res) => {
  try {
    const { tenDangNhap, matKhau, tenTaiKhoan } = req.body;

    // kiểm tra rỗng của từng trường
    if (!tenDangNhap || !matKhau || !tenTaiKhoan) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng điền đẩy đủ thông tin Tên đăng nhập, mật khẩu và tên tài khoản!",
      });
    }

    const pool = await getConnection();

    const checkExisted = await pool
      .request()
      .input("TenDangNhap", sql.VarChar(50), tenDangNhap)
      .query("SELECT * FROM ADMINISTRATOR WHERE TenDangNhap = @TenDangNhap");

    if (checkExisted.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Tên đăng nhập này đã tồn tại!",
      });
    }

    const hashedPwd = await bcrypt.hash(matKhau, saltRounds);

    await pool
      .request()
      .input("TenDangNhap", sql.VarChar(50), tenDangNhap)
      .input("MatKhau", sql.VarChar(255), hashedPwd)
      .input("HoTen", sql.NVarChar(100), tenTaiKhoan)
      .query(
        "INSERT INTO ADMINISTRATOR (TenDangNhap, MatKhau, HoTen, Email, Trangthai) VALUES (@TenDangNhap, @MatKhau, @HoTen, 'admin@cantin.edu.vn', 1)",
      );

    return res.json({
      success: true,
      message: "Tạo tài khoản admin mới thành công!",
    });
  } catch (err) {
    console.error("Lỗi khi thêm tài khoản mới: ", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
});

// api đổi trạng thái của admin từ 1 về 0 - bị vô hiệu hóa
app.put("/api/admin/trangthai/:id", async (req, res) => {
  const maAdmin = req.params.id;

  try {
    const pool = await getConnection();

    await pool
      .request()
      .input("MaAdmin", sql.Int, maAdmin)
      .query("UPDATE ADMINISTRATOR SET Trangthai = 0 WHERE MaAdmin = @MaAdmin");

    return res.json({
      success: true,
      message: "Cập nhật thành công!",
    });
  } catch (err) {
    console.error("Lỗi server: ", err);
    return res.status(500).json({
      success: false,
      message: "Cập nhật thất bại!!" + err.message,
    });
  }
});

//----------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("Chào mừng bạn đến với hệ thống Quản lý Canteen!");
});

app.listen(port, () => {
  console.log(`Server đang chạy tại: http://localhost:` + port);
});
