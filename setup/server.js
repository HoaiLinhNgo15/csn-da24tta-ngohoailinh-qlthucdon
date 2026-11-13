//xây dựng api
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { sql, getConnection } from "./db/db.js";
import "dotenv/config";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "html")));
app.use(express.static(path.join(__dirname, "assets")));
app.use(cors());

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

    //kiểm tra mật khẩu
    if (user.MatKhau === password) {
      return res.json({
        success: true,
        message: "Đăng nhập thành công!",
        user: {
          id: user.MaAdmin,
          username: user.TenDangNhap,
          name: user.Hoten,
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

//API TẠO DỮ LIỆU - CREATE
app.post("/api/createmonan", async (req, res) => {
  try {
    //nhận dữ liệu yêu cầu req
    const { tenMon, hinhAnh, moTa, giaBan, maNhom } = req.body;

    //Kiểm tra các dữ liệu bắt buộc
    if (!tenMon || !giaBan || !maNhom) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin!",
      });
    }

    const pool = await getConnection();

    //cập nhật mã món mới nhất
    const checkId = await pool
      .request()
      .query("SELECT TOP 1 MaMon FROM MONAN ORDER BY MaMon DESC");

    let nextMaMon = "MA001";
    if (checkId.recordset.length > 0) {
      const currentMaxId = checkId.recordset[0].MaMon;
      const numPart = parseInt(currentMaxId.replace("MA", "")) + 1;
      nextMaMon = "MA" + String(numPart).padStart(3, "0");
    }

    await pool
      .request()
      .input("MaMon", sql.VarChar(10), nextMaMon)
      .input("TenMon", sql.NVarChar(100), tenMon)
      .input("HinhAnh", sql.NVarChar(50), hinhAnh)
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
app.put("/api/monan/:maMon", async (req, res) => {
  try {
    const { maMon } = req.params;
    const { tenMon, giaBan, moTa, hinhAnh, maNhom } = req.body;

    if (!tenMon || !maNhom || !giaBan) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin!!",
      });
    }

    const pool = await getConnection();

    await pool
      .request()
      .input("MaMon", sql.VarChar(10), maMon)
      .input("TenMon", sql.NVarChar(100), tenMon)
      .input("GiaBan", sql.Decimal(18, 2), giaBan)
      .input("HinhAnh", sql.NVarChar(100), hinhAnh)
      .input("MoTa", sql.NVarChar(100), moTa)
      .input("MaNhom", sql.VarChar(10), maNhom).query(`
        UPDATE MONAN
        SET TenMon = @TenMon, GiaBan = @GiaBan, HinhAnh = @HinhAnh, MoTa = @MoTa, MaNhom = @MaNhom
        WHERE MaMon = @MaMon
        `);

    return res.json({
      success: true,
      message: `Cập nhật món ăn có mã ${maMon} thành công!`,
    });
  } catch (err) {
    Console.error("Lỗi khi cập nhật món ăn: ", err);
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

app.get("/", (req, res) => {
  res.send("Chào mừng bạn đến với hệ thống Quản lý Canteen!");
});

app.listen(port, () => {
  console.log(`Server đang chạy tại: http://localhost:` + port);
});
