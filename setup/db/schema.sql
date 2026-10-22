CREATE DATABASE QUANLYTHUCDON
GO

USE QUANLYTHUCDON
GO

CREATE TABLE NHOMMON (
	MaNhom char(3) primary key not null,
	TenNhom nvarchar(100) not null
);
GO

CREATE TABLE MONAN (
	MaMon CHAR(5) PRIMARY KEY NOT NULL,
	TenMon NVARCHAR(100) not null,
	HinhAnh NVARCHAR(50) not null,
	MoTa NVARCHAR(MAX),
	GiaBan decimal(18,2) not null,
	MaNhom char(3) FOREIGN KEY REFERENCES NHOMMON(MaNhom)
);
GO

CREATE TABLE TD_BUOI (
	MaBuoi Char(3) primary key not null,
	TenBuoi nvarchar(100)
);
GO

CREATE TABLE CHI_TIET_THUC_DON (
	MaChiTiet Char(4) primary key not null,
	NgayPhucVu datetime,
	MaMon Char(5) foreign key references MONAN(MaMon),
	MaBuoi char(3) foreign key references TD_BUOI(MaBuoi),
	TrangThai int,
	LuotQuanTam int
);
GO

CREATE TABLE ADMINISTRATOR(
	MaAdmin char(2) primary key not null,
	TenDangNhap char(10) not null,
	MatKhau Char(8) not null
);
GO

