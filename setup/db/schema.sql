CREATE DATABASE QUANLYTHUCDON
GO

USE QUANLYTHUCDON
GO

IF NOT EXISTS (
	SELECT *
	FROM sys.objects
	WHERE object_id = OBJECT_ID(N'[dbo.NHOMMON]') AND type in (N'U')
)
BEGIN
CREATE TABLE NHOMMON (
	MaNhom VARCHAR(10) primary key not null,
	TenNhom nvarchar(100) not null
);
END
GO

IF NOT EXISTS (
	SELECT *
	FROM sys.objects
	WHERE object_id = OBJECT_ID(N'[dbo.MONAN]') AND type in (N'U')
)
BEGIN
CREATE TABLE MONAN (
	MaMon VARCHAR(10) PRIMARY KEY NOT NULL,
	TenMon NVARCHAR(100) not null,
	HinhAnh NVARCHAR(255) not null,
	MoTa NVARCHAR(MAX),
	GiaBan decimal(18,2) not null,
	MaNhom VARCHAR(10) FOREIGN KEY REFERENCES NHOMMON(MaNhom)
);
END
GO

IF NOT EXISTS (
	SELECT *
	FROM sys.objects
	WHERE object_id = OBJECT_ID(N'[dbo.TD_BUOI]') AND type in (N'U')
)
BEGIN
CREATE TABLE TD_BUOI (
	MaBuoi VARCHAR(10) primary key not null,
	TenBuoi nvarchar(100)
);
END
GO

IF NOT EXISTS (
	SELECT *
	FROM sys.objects
	WHERE object_id = OBJECT_ID(N'[dbo.CHI_TIET_THUC_DON]') AND type in (N'U')
)
BEGIN
CREATE TABLE CHI_TIET_THUC_DON (
	MaChiTiet VARCHAR(10) primary key not null,
	NgayPhucVu datetime,
	MaMon VARCHAR(10) foreign key references MONAN(MaMon),
	MaBuoi VARCHAR(10) foreign key references TD_BUOI(MaBuoi),
	TrangThai BIT Not Null default 1,
	LuotQuanTam int default 0
);
END
GO

IF NOT EXISTS(
	SELECT *
	FROM sys.objects
	WHERE object_id = OBJECT_ID(N'[dbo.ADMINISTRATOR]') AND type in (N'U')
)
BEGIN
CREATE TABLE ADMINISTRATOR(
	MaAdmin INT IDENTITY(1,1) primary key,
	TenDangNhap varchar(50) not null unique,
	MatKhau varchar(255)not null,
	HoTen nvarchar(100) not null,
	Email nvarchar(100) null,
	Sodienthoai nvarchar(10) null,
	Trangthai BIT Not Null default 1,
	Ngaytao datetime not null default getdate(),
	Landangnhapcuoi datetime null
);
END
GO

IF NOT EXISTS (
	SELECT *
	FROM sys.objects
	WHERE object_id = OBJECT_ID(N'[dbo.LUOT_TRUY_CAP_NGAY') AND type in (N'U')
)
BEGIN
CREATE TABLE LUOT_TRUY_CAP_NGAY (
	NgayTruyCap DATE NOT NULL,
	DuongDan VarChar(100) NOT NULL DEFAULT '/thucdon',
	SoLuot INT NOT NULL DEFAULT 0,
	CONSTRAINT PK_LUOT_TRUY_CAP_NGAY PRIMARY KEY (NgayTruyCap, DuongDan)
);
END
GO

IF NOT EXISTS (
	SELECT * 
	FROM ADMINISTRATOR 
	WHERE TenDangNhap = 'admin'
) 
BEGIN 
	INSERT INTO ADMINISTRATOR (TenDangNhap, MatKhau, HoTen, Email, Trangthai) VALUES ('admin', 'admin123', N'Ngô Hoài Linh (Admin)', 'admin@cantin.edu.vn', 1); 
END

SELECT *
FROM ADMINISTRATOR
GO

UPDATE ADMINISTRATOR SET Trangthai = 1 WHERE MaAdmin = 2

IF NOT EXISTS (
	SELECT * 
	FROM ADMINISTRATOR 
	WHERE TenDangNhap = 'admin1'
)
BEGIN 
	INSERT INTO ADMINISTRATOR (TenDangNhap, MatKhau, HoTen, Email, Trangthai) VALUES ('admin1', 'admin123', N'Quản trị viên 1', 'admin1@cantin.edu.vn', 1); 
END
GO 

INSERT INTO NHOMMON (MaNhom, TenNhom) VALUES ('N01', N'Mon chinh');
INSERT INTO NHOMMON (MaNhom, TenNhom) VALUES ('N02', N'Mon phu');
INSERT INTO NHOMMON (MaNhom, TenNhom) VALUES ('N03', N'Trang mieng');
INSERT INTO NHOMMON (MaNhom, TenNhom) VALUES ('N04', N'Thuc uong');

update NHOMMON 
SET TenNhom = N'Món chính'
where MaNhom = 'N01'

select * from NHOMMON

INSERT INTO MONAN(MaMon, TenMon, HinhAnh, MoTa, GiaBan, MaNhom) VALUES ('MA001', N'Com suon', N'images/', N'Com trang, suon heo nuong, rau luoc, canh', 30000, 'N01');
INSERT INTO MONAN(MaMon, TenMon, HinhAnh, MoTa, GiaBan, MaNhom) VALUES ('MA002', N'Hoa qua got san', N'images/', N'cac loai trai cay theo mua', 50000, 'N03');

---neu chua ton tai record nao co MaMon la MA003 trong bang MONAN thi them moi vao
if not exists (
	select * 
	from MONAN
	where MaMon = 'MA003'
)
begin 
	insert into MONAN(MaMon, TenMon, HinhAnh, MoTa, GiaBan, MaNhom) values ('MA003', 'Bun thit xao', 'images/bunthit.png', 'Mon an tu bun va thit nuong', 350000, 'N01');
end

ALTER TABLE MONAN
ALTER COLUMN HinhAnh NVARCHAR(255) NOT NULL;

INSERT INTO TD_BUOI (MaBuoi, TenBuoi) VALUES ('B01', N'Sáng');
INSERT INTO TD_BUOI (MaBuoi, TenBuoi) VALUES ('B02', N'Trưa');
INSERT INTO TD_BUOI (MaBuoi, TenBuoi) VALUES ('B03', N'Chiều');

INSERT INTO CHI_TIET_THUC_DON (MaChiTiet, MaMon, NgayPhucVu, MaBuoi) VALUES ('CT001', 'MA001', '11/14/2026', 'B01');

SELECT A.MaChiTiet, A.MaMon, B.TenMon, B.GiaBan, B.HinhAnh, A.NgayPhucVu, A.MaBuoi, C.TenBuoi, A.TrangThai, A.LuotQuanTam
FROM CHI_TIET_THUC_DON AS A, MONAN AS B, TD_BUOI AS C
WHERE A.MaMon = B.MaMon AND A.MaBuoi = C.MaBuoi AND NgayPhucVu = '2026-11-14'

SELECT 
    A.MaChiTiet,
    A.MaMon,
    B.TenMon,
    B.GiaBan,
    B.HinhAnh,
    A.NgayPhucVu,
    A.MaBuoi,
    C.TenBuoi,
    A.TrangThai,
    A.LuotQuanTam
FROM CHI_TIET_THUC_DON AS A
INNER JOIN MONAN AS B ON A.MaMon = B.MaMon
INNER JOIN TD_BUOI AS C ON A.MaBuoi = C.MaBuoi
WHERE A.NgayPhucVu = '2026-11-14' AND A.MaBuoi = 'B01'
ORDER BY A.MaBuoi, A.MaChiTiet;

SELECT *
FROM CHI_TIET_THUC_DON
WHERE MaMon = 'MA001' AND  NgayPhucVu = '2026-11-14' AND MaBuoi = 'B01'

SELECT A.MaMon, A.TenMon, A.HinhAnh, A.GiaBan, B.TenNhom
FROM MONAN AS A
JOIN NHOMMON AS B ON A.MaNhom = B.MaNhom

SELECT MAX(CAST(SUBSTRING(MaChiTiet, 3, LEN(MaChiTiet)) AS INT)) AS MaxId
FROM CHI_TIET_THUC_DON
WHERE MaChiTiet LIKE 'CT%'

SELECT TOP 1 MaMon FROM MONAN ORDER BY MaMon DESC

SELECT A.MaMon, A.TenMon, A.HinhAnh, A.MoTa, A.GiaBan, B.TenNhom FROM MONAN AS A JOIN NHOMMON AS B ON A.MaNhom = B.MaNhom WHERE A.MaMon = 'MA002'

SELECT TOP 1 MaMon 
FROM MONAN 
ORDER BY CAST(SUBSTRING(MaMon, 3, LEN(MaMon)) AS INT) DESC;

SELECT MAX(CAST(SUBSTRING(MaMon, 3, LEN(MaMon)) AS INT)) FROM MONAN;

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MONAN';

DELETE FROM CHI_TIET_THUC_DON WHERE MaMon = 'MA001' AND NgayPhucVu = '2026-11-14' AND MaBuoi = 'B01'

UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 120 WHERE MaChiTiet = 'CT001'
UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 23 WHERE MaChiTiet = 'CT004'
UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 165 WHERE MaChiTiet = 'CT005'
UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 34 WHERE MaChiTiet = 'CT006'
UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 123 WHERE MaChiTiet = 'CT007'
UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 19 WHERE MaChiTiet = 'CT008'
UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 134 WHERE MaChiTiet = 'CT009'
UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 145 WHERE MaChiTiet = 'CT010'
UPDATE CHI_TIET_THUC_DON SET LuotQuanTam = 145 WHERE MaChiTiet = 'CT011'

SELECT A.MaMon, A.TenMon, A.HinhAnh, C.MaNhom, C.TenNhom, SUM(B.LuotQuanTam) AS TongLuotThich
FROM MONAN AS A
LEFT JOIN CHI_TIET_THUC_DON AS B ON A.MaMon = B.MaMon
INNER JOIN NHOMMON AS C ON C.MaNhom = A.MaNhom
GROUP BY A.MaMon, A.TenMon, A.HinhAnh, C.MaNhom, C.TenNhom
ORDER BY TongLuotThich DESC

SELECT A.MaMon, A.TenMon, A.HinhAnh, C.MaNhom, C.TenNhom, COALESCE(SUM(B.LuotQuanTam), 0) AS TongLuotThich FROM MONAN AS A LEFT JOIN CHI_TIET_THUC_DON AS B ON A.MaMon = B.MaMon INNER JOIN NHOMMON AS C ON C.MaNhom = A.MaNhom GROUP BY A.MaMon, A.TenMon, A.HinhAnh, C.MaNhom, C.TenNhom ORDER BY TongLuotThich DESC

SELECT * FROM LUOT_TRUY_CAP_NGAY