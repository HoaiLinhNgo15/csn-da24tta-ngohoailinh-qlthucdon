import 'dotenv/config';
//cấu hình sql server
import sql from "mssql";
/*
const config = {
  user: "sa",
  password: "Linh2006@@", //phát triển .env để ẩn mật khẩu
  server: "localhost",
  database: "QUANLYTHUCDON",
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};
*/
const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD, //phát triển .env để ẩn mật khẩu
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

//Kết nối csdl
async function getConnection() {
  try {
    const pool = await sql.connect(config);
    console.log("kết nối SQL Server thành công!");
    return pool;
  } catch (err) {
    console.error("Lỗi kết nối SQL Server: ", err);
  }
}

export { sql, getConnection };
