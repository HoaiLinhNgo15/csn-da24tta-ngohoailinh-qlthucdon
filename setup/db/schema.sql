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
	MaNhom char(3) primary key not null,
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
	MaMon CHAR(5) PRIMARY KEY NOT NULL,
	TenMon NVARCHAR(100) not null,
	HinhAnh NVARCHAR(50) not null,
	MoTa NVARCHAR(MAX),
	GiaBan decimal(18,2) not null,
	MaNhom char(3) FOREIGN KEY REFERENCES NHOMMON(MaNhom)
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
	MaBuoi Char(3) primary key not null,
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
	MaChiTiet Char(4) primary key not null,
	NgayPhucVu datetime,
	MaMon Char(5) foreign key references MONAN(MaMon),
	MaBuoi char(3) foreign key references TD_BUOI(MaBuoi),
	TrangThai int,
	LuotQuanTam int
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
	TenDangNhap nvarchar(50) not null unique,
	MatKhau nvarchar(255) not null,
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
	FROM ADMINISTRATOR 
	WHERE TenDangNhap = 'admin'
) 
BEGIN 
	INSERT INTO ADMINISTRATOR (TenDangNhap, MatKhau, HoTen, Email, Trangthai) VALUES ('admin', 'admin123', N'Ngô Hoài Linh (Admin)', 'admin@cantin.edu.vn', 1); 
END

SELECT *
FROM ADMINISTRATOR
GO
