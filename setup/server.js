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
        message: "Vui lòng nhập đầy đủ thông tin!",
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
  const { maMon } = req.params;

  if (!maMon) {
    return res.status(400).json({
      success: false,
      message: "Thiếu mã món cần xóa!",
    });
  }

  let pool;
  let transaction;
  try {
    pool = await getConnection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // xóa trong thực đơn
    let deletedMenuRows = 0; // số lượng dòng đã xóa trong thực đơn
    const deleteChiTietResult = await new sql.Request(transaction)
      .input("MaMon", sql.VarChar(10), maMon)
      .query("DELETE FROM CHI_TIET_THUC_DON WHERE MaMon = @MaMon");

    deletedMenuRows = deleteChiTietResult.rowsAffected[0] || 0;

    // xóa món ăn
    const deleteMonAnResult = await new sql.Request(transaction)
      .input("MaMon", sql.VarChar(10), maMon)
      .query("DELETE FROM MONAN WHERE MaMon = @MaMon");

    if (
      !deleteMonAnResult.rowsAffected ||
      deleteMonAnResult.rowsAffected[0] === 0
    ) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn cần xóa",
      });
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: `Đã xóa thành công món ăn có mã ${maMon} (xóa ${deletedMenuRows} dòng trong thực đơn)`,
      deletedMenuRows,
    });
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("Lỗi rollback transaction:", rollbackErr);
      }
    }

    console.error("Lỗi xóa món ăn:", err);

    // Mã lỗi 547 của SQL Server thường là vi phạm ràng buộc FOREIGN KEY
    if (err.number === 547) {
      return res.status(409).json({
        success: false,
        message:
          "Món ăn đang tồn tại trong thực đơn, cần xác nhận xóa cả trong thực đơn trước.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa món ăn: " + err.message,
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
// api lấy dữ liệu từ bảng CHI_TIET_THUC_DON
app.get("/api/monan/thucdon", async (req, res) => {
  const { ngay, maBuoi } = req.query;

  if (!ngay || !maBuoi) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng chọn ngày và buổi",
    });
  }

  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input("NgayPhucVu", sql.Date, ngay)
      .input("MaBuoi", sql.VarChar(10), maBuoi)
      .query(
        "SELECT A.MaChiTiet, A.MaMon, B.TenMon, B.GiaBan, B.HinhAnh, A.NgayPhucVu, A.MaBuoi, C.TenBuoi, A.Trangthai, A.LuotQuanTam FROM CHI_TIET_THUC_DON AS A INNER JOIN MONAN AS B ON A.MaMon = B.MaMon INNER JOIN TD_BUOI AS C ON A.MaBuoi = C.MaBuoi WHERE A.NgayPhucVu = @NgayPhucVu AND A.MaBuoi = @MaBuoi ORDER BY A.MaBuoi, A.MaChiTiet",
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

app.post("/api/thucdon/themmon", async (req, res) => {
  const { maMon, ngay, maBuoi } = req.body;

  if (!maMon || !ngay || !maBuoi) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng chọn đầy đủ món ăn, ngày phục vụ và buổi!",
    });
  }

  try {
    const pool = await getConnection();

    const existMon = await pool
      .request()
      .input("MaMon", sql.VarChar(10), maMon)
      .input("NgayPhucVu", sql.Date, ngay)
      .input("MaBuoi", sql.VarChar(10), maBuoi)
      .query(
        "SELECT * FROM CHI_TIET_THUC_DON WHERE MaMon = @MaMon AND  NgayPhucVu = @NgayPhucVu AND MaBuoi = @MaBuoi",
      );

    if (existMon.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Món ăn này đã được thêm vào thực đơn",
      });
    }

    const checkID = await pool
      .request()
      .query(
        "SELECT MAX(CAST(SUBSTRING(MaChiTiet, 3, LEN(MaChiTiet)) AS INT)) AS MaxId FROM CHI_TIET_THUC_DON WHERE MaChiTiet LIKE 'CT%'",
      );

    let nextNum = 1;
    if (checkID.recordset.length > 0 && checkID.recordset[0].MaxId !== null) {
      nextNum = checkID.recordset[0].MaxId + 1;
    }

    const maCT = "CT" + String(nextNum).padStart(3, "0");

    await pool
      .request()
      .input("MaChiTiet", sql.VarChar(10), maCT)
      .input("MaMon", sql.VarChar(10), maMon)
      .input("NgayPhucVu", sql.Date, ngay)
      .input("MaBuoi", sql.VarChar(10), maBuoi)
      .query(
        "INSERT INTO CHI_TIET_THUC_DON (MaChiTiet, MaMon, NgayPhucVu, MaBuoi) VALUES (@MaChiTiet, @MaMon, @NgayPhucVu, @MaBuoi)",
      );

    return res.json({
      success: true,
      message: "Thêm thành công món ăn vào thực đơn",
    });
  } catch (err) {
    console.error("Lỗi server: ", err);
    return res.status(500).json({
      success: false,
      message: "Không thể kết nối server: " + err.message,
    });
  }
});

app.delete("/api/thucdon/xoamon", async (req, res) => {
  const { maMon, ngay, maBuoi } = req.query;

  try {
    if (!maMon || !ngay || !maBuoi) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn đầy đủ mã món, ngày và buổi",
      });
    }
    const pool = await getConnection();

    await pool
      .request()
      .input("MaMon", sql.VarChar(10), maMon)
      .input("NgayPhucVu", sql.Date, ngay)
      .input("MaBuoi", sql.VarChar(10), maBuoi)
      .query(
        "DELETE FROM CHI_TIET_THUC_DON WHERE MaMon = @MaMon AND NgayPhucVu = @NgayPhucVu AND MaBuoi = @MaBuoi",
      );
    return res.json({
      success: true,
      message: "Xóa món này ra khỏi thực đơn thành công!",
    });
  } catch (err) {
    console.error("Lỗi kết nối Server: ", err);
    return res.status(500).json({
      success: false,
      message: "Kết nối với Server không thành công: " + err.message,
    });
  }
});

//------------------------------------------------------------------------------

//====================== THAY ĐỔI TRẠNG THÁI MÓN ĂN ============================
app.post("/api/thucdon/capnhattrangthai", async (req, res) => {
  const { maMon, trangthaiMoi } = req.body;
  const { ngay, maBuoi } = req.query;

  const trangThaiCoHopLe =
    trangthaiMoi !== undefined &&
    trangthaiMoi !== null &&
    trangthaiMoi !== "" &&
    (trangthaiMoi === 0 ||
      trangthaiMoi === 1 ||
      trangthaiMoi === "0" ||
      trangthaiMoi === "1" ||
      typeof trangThaiCoHopLe === "boolean");

  if (!maMon || !trangThaiCoHopLe || !ngay || !maBuoi) {
    return res.status(400).json({
      success: false,
      message: "Không đủ dữ liệu để truy vấn!",
    });
  }

  const bitValue =
    typeof trangthaiMoi === "boolean"
      ? trangthaiMoi
      : Number(trangthaiMoi) === 1;

  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input("MaMon", sql.VarChar(10), maMon)
      .input("MaBuoi", sql.VarChar(10), maBuoi)
      .input("NgayPhucVu", sql.Date, ngay)
      .input("Trangthai", sql.Bit, bitValue)
      .query(
        "UPDATE CHI_TIET_THUC_DON SET Trangthai = @Trangthai WHERE MaMon = @MaMon AND MaBuoi = @MaBuoi AND NgayPhucVu = @NgayPhucVu",
      );

    const soDongCapNhat = result.rowsAffected?.[0] ?? 0;
    if (soDongCapNhat === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn trong thực đơn ngày/buổi đã chọn!",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật món ăn thành công!",
      data: {
        maMon,
        maBuoi,
        ngay,
        trangthai: bitValue ? 1 : 0,
      },
    });
  } catch (err) {
    console.error("Lỗi kết nối server: ", err);
    return res.status(500).json({
      success: false,
      message: "Kết nối server không thành công!" + err.message,
    });
  }
});
//------------------------------------------------------------------------------

//====================== THEO DÕI LƯỢT THÍCH CỦA MÓN ĂN ========================

// api lấy tổng số lượt thích của từng món ăn
app.get("/api/luotthich", async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .query(
        "SELECT A.MaMon, A.TenMon, A.HinhAnh, C.MaNhom, C.TenNhom, COALESCE(SUM(B.LuotQuanTam), 0) AS TongLuotThich FROM MONAN AS A LEFT JOIN CHI_TIET_THUC_DON AS B ON A.MaMon = B.MaMon INNER JOIN NHOMMON AS C ON C.MaNhom = A.MaNhom GROUP BY A.MaMon, A.TenMon, A.HinhAnh, C.MaNhom, C.TenNhom ORDER BY TongLuotThich DESC",
      );

    return res.json({
      success: true,
      message: "Lấy dữ liệu thành công!",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Lỗi server: ", err);
    return res.status(500).json({
      success: false,
      message: "Không kết nối được Server!" + err.message,
    });
  }
});

//------------------------------------------------------------------------------

///===================== QUẢN LÝ TÀI KHOẢN ADMIN ===============================

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
app.post("/api/admin/trangthai/:id", async (req, res) => {
  const maAdmin = Number(req.params.id);

  if (!Number.isInteger(maAdmin) || maAdmin <= 0) {
    return res.status(400).json({
      success: false,
      message: "Mã admin không hợp lệ!",
    });
  }

  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input("MaAdmin", sql.Int, maAdmin)
      .query(
        "SELECT MaAdmin, TenDangNhap, HoTen, Trangthai FROM ADMINISTRATOR WHERE MaAdmin = @MaAdmin",
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản admin!",
      });
    }
    const adminHientai = result.recordset[0];
    const trangthaiHientai = Number(adminHientai.Trangthai);

    const trangThaiMoi = trangthaiHientai === 1 ? 0 : 1;

    await pool
      .request()
      .input("MaAdmin", sql.Int, maAdmin)
      .input("Trangthai", sql.Bit, trangThaiMoi)
      .query(
        "UPDATE ADMINISTRATOR SET Trangthai = @Trangthai WHERE MaAdmin = @MaAdmin",
      );

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

//------------------------------------------------------------------------------

//========================== THEO DÕI LƯỢT TRUY CẬP HÀNG NGÀY ==================

// api lấy lượt truy cập từ cơ sở dữ liệu
app.get("/api/luottruycap/homnay", async (req, res) => {
  const duongDan = (req.query?.duongDan || "").toString().trim();

  try {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT COALESCE(SUM(SoLuot), 0) AS TongLuotHomNay
      FROM LUOT_TRUY_CAP_NGAY
      WHERE NgayTruyCap = CAST(GETDATE() AS DATE)
    `;

    if (duongDan) {
      request.input("DuongDan", sql.VarChar(100), duongDan);
      query += " AND DuongDan = @DuongDan";
    }

    const result = await request.query(query);
    const TongLuot = Number(result.recordset[0]?.TongLuotHomNay) || 0;
    return res.json({
      success: true,
      data: {
        tongLuotHomNay: TongLuot,
      },
    });
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu!", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy dữ liệu truy cập: " + err.message,
    });
  }
});

// api cập nhật lượt truy cập
app.post("/api/luottruycap", async (req, res) => {
  const duongDan = (req.body?.duongDan || req.query?.duongDan || "/")
    .toString()
    .slice(0, 100);

  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input("DuongDan", sql.VarChar(100), duongDan).query(`
      MERGE LUOT_TRUY_CAP_NGAY AS target
      USING (
        SELECT CAST(GETDATE() AS DATE) AS NgayTruyCap, @DuongDan AS DuongDan
      ) AS Source
       ON target.NgayTruyCap = Source.NgayTruyCap
       AND target.DuongDan = Source.DuongDan
       WHEN MATCHED THEN
       UPDATE SET target.SoLuot = target.SoLuot + 1
       WHEN NOT MATCHED THEN
       INSERT (NgayTruyCap, DuongDan, SoLuot)
       VALUES (Source.NgayTruyCap, Source.DuongDan, 1)
       OUTPUT inserted.NgayTruyCap, inserted.DuongDan, inserted.SoLuot;
      `);

    return res.json({
      success: true,
      message: "Đâ ghi nhận lượt truy cập hôm nay!",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("Lỗi ghi nhận lượt truy cập: ", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi kêt nối server khi ghi nhận lượt truy cập!" + err.message,
    });
  }
});

//------------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("Chào mừng bạn đến với hệ thống Quản lý Canteen!");
});

app.listen(port, () => {
  console.log(`Server đang chạy tại: http://localhost:` + port);
});
