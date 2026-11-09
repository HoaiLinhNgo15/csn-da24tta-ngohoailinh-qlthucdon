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

INSERT INTO NHOMMON (MaNhom, TenNhom) VALUES ('N01', N'Mon chinh');
INSERT INTO NHOMMON (MaNhom, TenNhom) VALUES ('N02', N'Mon phu');
INSERT INTO NHOMMON (MaNhom, TenNhom) VALUES ('N03', N'Trang mieng');

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

SELECT A.MaMon, A.TenMon, A.HinhAnh, A.GiaBan, B.TenNhom
FROM MONAN AS A, NHOMMON AS B
WHERE A.MaNhom = B.MaNhom
