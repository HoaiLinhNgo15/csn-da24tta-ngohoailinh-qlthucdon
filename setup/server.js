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
  } catch(err) {
    console.error("CHI TIẾT LỖI TẠI API LOGIN:", err);
    res.status(500).json({ success: false, message: "Lỗi kết nối server!" });
  }
});

app.get("/", (req, res) => {
  res.send("Chào mừng bạn đến với hệ thống Quản lý Canteen!");
});

app.listen(port, () => {
  console.log(`Server đang chạy tại: http://localhost:` + port);
});
