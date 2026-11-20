document.addEventListener("DOMContentLoaded", () => {
  loadTableData();
  capnhatMonAn();
  loadDataList();
  loadAdminTable();
  createNewAdmin();
  tai_ChiTietThucDon();

  const userData = sessionStorage.getItem("adminUser");
  const adminName = document.getElementById("AdminName");
  if (userData && adminName) {
    try {
      const user = JSON.parse(userData);

      adminName.textContent = user.name || "Quản trị viên";
    } catch (err) {
      adminName.textContent = userData;
    }
  }

  const chonNgayInput = document.getElementById("chonNgay");

  if (chonNgayInput) {
    // Lấy ngày hiện tại của máy
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    // Gán giá trị mặc định là ngày hôm nay
    chonNgayInput.value = `${year}-${month}-${day}`;

    const dishList = document.getElementById("dish-list");

    if (dishList) {
      dishList.addEventListener("click", (e) => {
        // Tìm thẻ card món ăn gần nhất được bấm vào
        const card = e.target.closest(".card-monan");
        if (!card) return; // Nếu bấm ra ngoài thẻ card thì bỏ qua

        // (Tùy chọn) Xóa class 'selected' của tất cả các card khác nếu muốn chỉ chọn 1 card tại một thời điểm
        const allCards = dishList.querySelectorAll(".card-monan");
        allCards.forEach((c) => c.classList.remove("selected"));

        // Thêm class 'selected' cho card vừa được bấm
        card.classList.add("selected");
      });
    }
  }
});
//------------------------------------------------------------------------------

//============================= QUẢN LÝ MÓN ĂN =================================
//CREATE & UPDATE

let currentEditId = null;
//hàm lấy dữ liệu lên form
export function chuanbiForm(item) {
  currentEditId = item.MaMon;

  document.getElementById("tenmon").value = item.TenMon;
  document.getElementById("giaban").value = item.GiaBan;
  document.getElementById("mota").value = item.MoTa;
  //document.getElementById("hinhanh").value = item.HinhAnh;

  const fileInput = document.getElementById("hinhanh");
  if (fileInput) {
    fileInput.value = "";
  }

  const previewImg = document.getElementById("preview-anh");
  if (previewImg) {
    previewImg.src = item.HinhAnh || "";
    previewImg.style.display = item.HinhAnh ? "block" : "none";
  }

  const reverseNhomMap = {
    N01: "Món chính",
    N02: "Món phụ",
    N03: "Tráng miệng",
    N04: "Thức uống",
  };

  document.getElementById("nhommon").value = reverseNhomMap[item.MaNhom];
  console.log("Đang ở chế độ sửa món ăn có mã: " + currentEditId);
}

export function capnhatMonAn() {
  const myFrm = document.getElementById("frm-update");

  if (!myFrm) return;

  const Tenmon = document.getElementById("tenmon");
  const Nhommon = document.getElementById("nhommon");
  const Giaban = document.getElementById("giaban");
  const Mota = document.getElementById("mota");
  const Hinhanh = document.getElementById("hinhanh");
  const ErrorBox = document.getElementById("Error-message");

  if (myFrm.dataset.listenerAttached === "true") return;
  myFrm.dataset.listenerAttached = "true";

  //hàm hiển thị thông báo lỗi
  function showError(message) {
    ErrorBox.textContent = message;
    ErrorBox.style.display = "block";
  }

  //Hàm ẩn thông báo lỗi
  function hideError() {
    ErrorBox.style.display = "none";
    ErrorBox.textContent = "";
  }

  //Bảng ánh xạ mã nhóm
  const nhomMonMap = {
    "Món chính": "N01",
    "Món phụ": "N02",
    "Tráng miệng": "N03",
    "Thức uống": "N04",
  };

  myFrm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const _tenmon = Tenmon.value.trim();
    const _nhommon = Nhommon.value.trim();
    const _giaban = Giaban.value.trim();
    const _mota = Mota.value.trim();
    //const _hinhanh = Hinhanh.value.trim();
    const _hinhanh = Hinhanh.files[0];

    //kiểm tra các ô đã được điền đủ thông tin hay chưa
    if (!_tenmon || !_nhommon || !_giaban || !_mota) {
      showError("Vui lòng điền đầy đủ thông tin món ăn!");
      return;
    }

    const _manhom = nhomMonMap[_nhommon];
    if (!_manhom) {
      showError(
        "Nhóm món không hợp lệ! Vui lòng chọn đúng theo danh sách gợi ý!",
      );
      return;
    }

    // vô hiệu hóa nút submit khi server đang xử lý tránh lỗi
    const submitBtn =
      myFrm.querySelector("button[type='submit']") ||
      myFrm.querySelector(".btn-submit");
    if (submitBtn) submitBtn.disabled = true;

    //thông tin các ô đã được điền đầy đủ tiến hành thêm vào cơ sở dữ liệu
    try {
      //đóng gói dữ liệu để gửi lên backend
      // const formData = {
      //   tenMon: _tenmon,
      //   hinhAnh: _hinhanh,
      //   moTa: _mota,
      //   giaBan: parseFloat(_giaban),
      //   maNhom: _manhom,
      // };
      const formData = new FormData();
      formData.append("tenMon", _tenmon);
      formData.append("hinhAnh", _hinhanh);
      formData.append("moTa", _mota);
      formData.append("giaBan", parseFloat(_giaban));
      formData.append("maNhom", _manhom);

      let url = "http://localhost:3002/api/createmonan";
      let method = "POST";

      if (currentEditId) {
        url = `http://localhost:3002/api/monan/${currentEditId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        //headers: { "Content-Type": "application/json" },
        //body: JSON.stringify(formData),
        body: formData,
      });

      const results = await response.json();

      if (results.success) {
        alert(results.message);
        myFrm.reset(); //xóa form
        currentEditId = null;
        const previewImg = document.getElementById("preview-anh");
        if (previewImg) {
          previewImg.src = "";
          previewImg.style.display = "none";
        }

        //làm mới danh sách món ăn
        if (typeof loadTableData === "function") {
          loadTableData();
        }
        if (typeof loadDataList == "function") {
          loadDataList();
        }
      } else {
        showError(results.message || "Thêm món ăn thất bại!!");
      }
    } catch (err) {
      console.error("Lỗi kết nối: ", err);
      showError("Không thể kết nối tới Server!!");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

//READ
async function loadTableData() {
  try {
    const respon = await fetch("http://localhost:3002/api/admin", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const dataset = await respon.json();

    if (dataset.success) {
      //lấy thành phần table từ html
      const table = document.getElementById("table-admin");
      const tbody = document.getElementById("table-monan");
      const listMonAn = dataset.data;
      tbody.innerHTML = ""; //xóa các thành phần cũ tránh lặp

      for (let i = 0; i < listMonAn.length; i++) {
        const item = listMonAn[i]; //lưu phần tử hiện tại
        const row = document.createElement("tr");
        row.setAttribute("class", "record");

        //cột mã món
        const colID = document.createElement("td");
        colID.setAttribute("id", "dish-id");
        colID.textContent = listMonAn[i].MaMon;
        row.appendChild(colID);

        //cột hình ảnh
        const colIMG = document.createElement("td");
        const IMG = document.createElement("img");
        IMG.setAttribute("src", listMonAn[i].HinhAnh);
        IMG.setAttribute("alt", listMonAn[i].TenMon);
        colIMG.appendChild(IMG);
        row.appendChild(colIMG);

        //cột tên món
        const colName = document.createElement("td");
        const textName = document.createElement("span");
        textName.setAttribute("class", "dish-name");
        textName.textContent = listMonAn[i].TenMon;
        colName.appendChild(textName);
        row.appendChild(colName);

        //cột nhóm món
        const colGr = document.createElement("td");
        colGr.textContent = listMonAn[i].TenNhom;
        row.appendChild(colGr);

        //cột giá bán
        const colPrice = document.createElement("td");
        const textPrice = document.createElement("span");
        textPrice.setAttribute("class", "dish-price");
        textPrice.textContent = formatTienViet(listMonAn[i].GiaBan);
        colPrice.appendChild(textPrice);
        row.appendChild(colPrice);

        //cột trạng thái --bổ sung class còn/hết món
        const colBadge = document.createElement("td");
        const textBadge = document.createElement("span");
        textBadge.setAttribute("class", "badge-status");
        textBadge.textContent = "Còn";
        colBadge.appendChild(textBadge);
        row.appendChild(colBadge);

        //cột thao tác
        const colTT = document.createElement("td");
        colTT.setAttribute("id", "col-edit");

        //nút SỬA
        const btn1 = document.createElement("button");
        btn1.setAttribute("class", "btn");
        btn1.textContent = "Sửa";

        //gắn sự kiện click bằng js
        btn1.addEventListener("click", () => {
          chuanbiForm(item);
          showFrm("update-container");
        });

        //NÚT XÓA
        const btn2 = document.createElement("button");
        btn2.setAttribute("class", "btn");
        btn2.textContent = "Xóa";
        //bổ sung sự kiện xóa vào đây--------------------------------
        btn2.addEventListener("click", () => {
          xoaMonAn(item.MaMon);
        });

        colTT.appendChild(btn1);
        colTT.appendChild(btn2);
        row.appendChild(colTT);
        tbody.appendChild(row);

        table.appendChild(tbody);
      }
    } else {
      console.error("Không thể lấy dữ liệu:", dataset.message);
    }
  } catch (err) {
    console.error("Lỗi kêt nối: ", err);
  }
}

// DELETE
async function xoaMonAn(maMon) {
  if (!confirm(`Bạn có chắc muốn xóa món ăn có mã ${maMon} không?`)) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3002/api/monan/${maMon}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const results = await response.json();

    if (results.success) {
      alert(results.message);
      if (typeof loadTableData === "function") {
        loadTableData();
      }
    } else {
      alert(results.message || "Xóa thất bại!");
    }
  } catch (err) {
    console.error("Lỗi kết nối server!", err);
    alert("Không thể kết nối đến server!");
  }
}

//---------------------------------------------------------------------------------------

//============================= CHỨC NĂNG LẬP THỰC ĐƠN ==================================

// Gọi API lấy dữ liệu từ CSDL đưa vào danh mục lập thực đơn bên trái
async function loadDataList() {
  try {
    const response = await fetch("http://localhost:3002/api/admin", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const dataSet = await response.json();
    if (dataSet.success) {
      const dishContainer = document.getElementById("dish-list");
      const dishList = dataSet.data;
      dishContainer.innerHTML = "";

      for (let i = 0; i < dishList.length; i++) {
        // tạo phần tử chứa thành phần ảnh và tên món ăn
        const dishCard = document.createElement("div");
        dishCard.setAttribute("class", "card-monan");

        // tạo hình ảnh món ăn
        const IMG = document.createElement("img");
        IMG.setAttribute("src", dishList[i].HinhAnh);
        IMG.setAttribute("alt", dishList[i].TenMon);

        // tạo khung chứa tên món ăn
        const dishName = document.createElement("p");
        dishName.setAttribute("class", "tenmon");
        dishName.textContent = dishList[i].TenMon;

        // thêm phẩn tử IMG & dishName vào dishCard
        dishCard.appendChild(IMG);
        dishCard.appendChild(dishName);

        // thêm dishCard vào khung chứa trên web
        dishContainer.appendChild(dishCard);
      }
    } else {
      console.error("Lấy dữ liệu không thành công!", dataSet.message);
    }
  } catch (err) {
    console.error("Lỗi kết nối server: ", err);
  }
}

// gọi api đưa dữ liệu từ bảng CHI_TIET_THUC_DON vào giao diện web
async function tai_ChiTietThucDon() {
  try {
    const response = await fetch("http://localhost:3002/api/monan/thucdon", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const dataSet = await response.json();
    if (dataSet.success) {
      const listThucDon = dataSet.data;
      const listCard = document.getElementById("danhsachthedachon");
      listCard.innerHTML = "";
      for (let i = 0; i < listThucDon.length; i++) {
        // tạo phần tử làm thẻ chứa thông tin của mỗi món
        const card = document.createElement("div");
        card.setAttribute("class", "card-monan");

        // tạo thẻ thành phần món
        const IMG = document.createElement("img");
        IMG.setAttribute("src", listThucDon[i].HinhAnh);
        IMG.setAttribute("alt", listThucDon[i].TenMon);

        const tenMon = document.createElement("p");
        tenMon.setAttribute("class", "tenmon");
        tenMon.textContent = listThucDon[i].TenMon;

        card.appendChild(IMG);
        card.appendChild(tenMon);

        listCard.appendChild(card);
      }
    } else {
      console.error("Không thể lấy dữ liệu", dataSet.message);
    }
  } catch (err) {
    console.error("Không kết nối được server: ", err);
  }
}

//-------------------------------------------------------------------------------

///============================== QUẢN LÝ TÀI KHOẢN ADMIN ========================
// gọi API cho quản lý tài khoản admin
// đọc
async function loadAdminTable() {
  try {
    const response = await fetch("http://localhost:3002/api/readuser", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      const listAdmin = result.data;
      const tbody = document.getElementById("table-account");
      tbody.innerHTML = "";
      for (let i = 0; i < listAdmin.length; i++) {
        //tạo ra 1 thẻ lưu dữ liệu theo dòng
        const row = document.createElement("tr");
        row.setAttribute("class", "record");

        // tạo 1 thẻ td lưu mã admin
        const colID = document.createElement("td");
        colID.textContent = listAdmin[i].MaAdmin;

        // tạo thẻ td lưu Tên đăng nhập
        const colLoginName = document.createElement("td");
        colLoginName.textContent = listAdmin[i].TenDangNhap;

        // tạo thẻ td lưu Mật khẩu
        const colPassword = document.createElement("td");
        //colPassword.textContent = listAdmin[i].MatKhau;
        colPassword.textContent = "**********";

        // tạo thẻ td lưu Tên tài khoản
        const colUserName = document.createElement("td");
        colUserName.textContent = listAdmin[i].HoTen;

        //tạo thẻ td lưu Trạng thái hoạt động
        const colStatus = document.createElement("td");
        if (listAdmin[i].Trangthai) {
          colStatus.textContent = "Đang hoạt động";
        } else {
          colStatus.textContent = "Ngừng hoạt động";
        }

        //tạo thẻ thao tác với tài khoản
        const colTT = document.createElement("td");
        colTT.setAttribute("id", "col-edit");

        const btn1 = document.createElement("button");
        const btn2 = document.createElement("button");

        btn1.setAttribute("class", "btn");
        btn1.textContent = "Sửa";
        btn2.setAttribute("class", "btn");
        btn2.textContent = "Khóa";

        //thêm sự kiện click cho các nút ở đây
        btn1.addEventListener("click", () => {
          resetAdmin(listAdmin[i]);
          showFrm("quanlyadmin");
        });

        btn2.addEventListener("click", () => {
          delAdmin(listAdmin[i]);
        });

        colTT.appendChild(btn1);
        colTT.appendChild(btn2);

        row.appendChild(colID);
        row.appendChild(colLoginName);
        row.appendChild(colPassword);
        row.appendChild(colUserName);
        row.appendChild(colStatus);
        row.appendChild(colTT);

        tbody.appendChild(row);
      }
    } else {
      console.error("Không thể lấy dữ liệu!");
    }
  } catch (err) {
    console.error("Lỗi kết nối Server: ", err);
  }
}

// gọi api reset hoặc đổi mật khẩu admin
let currentAdmin = null;
function resetAdmin(item) {
  currentAdmin = item.MaAdmin;
  document.getElementById("userlogin").value = item.TenDangNhap;
  document.getElementById("username").value = item.HoTen;
  document.getElementById("pwd").placeholder = "Nhập mật khẩu mới";

  console.log(`Đang ở chế độ sửa tài khoản Admin ${currentAdmin}`);
}

// gọi api thêm tài khoản admin mới
export function createNewAdmin() {
  const myFrm = document.getElementById("frm-quanlyadmin");
  const error = document.getElementById("error-admin");

  if (myFrm.dataset.listenerAttached === "true") return;
  myFrm.dataset.listenerAttached = "true";

  function hideError() {
    error.textContent = "";
    error.style.display = "none";
  }

  function showError(message) {
    error.textContent = message;
    error.style.display = "block";
  }

  myFrm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const tendangnhap = document.getElementById("userlogin").value.trim();
    const matkhau = document.getElementById("pwd").value.trim();
    const tentaikhoan = document.getElementById("username").value.trim();

    if (!tendangnhap || !matkhau || !tentaikhoan) {
      showError("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      // đóng gói dữ liệu gửi vào body của req thông qua thuộc tính body của fetch
      const packetAdmin = {
        tenDangNhap: tendangnhap,
        matKhau: matkhau,
        tenTaiKhoan: tentaikhoan,
      };

      let url = "http://localhost:3002/api/admin/create";
      let method = "POST";

      if (currentAdmin) {
        url = `http://localhost:3002/api/admin/reset-pwd/${currentAdmin}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packetAdmin),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);

        myFrm.reset();
        currentAdmin = null;
        document.getElementById("pwd").placeholder = "";

        if (typeof loadAdminTable === "function") {
          loadAdminTable();
        }
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Không thể kết nối tới server: ", err);
    }
  });
}

// gọi api vô hiệu hóa quyền admin
async function delAdmin(item) {
  const userData = sessionStorage.getItem("adminUser");
  const user = JSON.parse(userData);
  if (item.MaAdmin === user.id) {
    alert("Không thể khóa tài khoản đang đăng nhập!");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3002/api/admin/trangthai/${item.MaAdmin}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
    );

    const result = await response.json();
    if (result.success) {
      alert(result.message);
      if (typeof loadAdminTable === "function") {
        loadAdminTable();
      }
    }
  } catch (err) {
    console.error("Không thể kết nối server: ", err);
  }
}

//------------------------------------------------------------------------------------------------------------------

//==================================== MỘT SỐ HÀM CHUNG ==============================================
// Định dang kiểu tiền tệ Việt Nam từ kiểu dữ liệu decimal(18,2) trong SQL Server
function formatTienViet(amount) {
  if (
    amount === null ||
    amount === undefined ||
    amount === "" ||
    isNaN(amount)
  ) {
    return "0 VND";
  }
  const dinhDangSo = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  });
  return dinhDangSo.format(Number(amount)) + " VND";
}

export function logoutforAdmin() {
  if (confirm("Bạn có chắc chắn muốn kết thúc phiên làm việc này?")) {
    sessionStorage.clear();
    window.location.href = "login.html";
  }
}

let currentElement = document.getElementById("ql-monan");

export function showElementById(id) {
  // Ẩn phần tử cũ nếu có
  if (currentElement) {
    currentElement.style.display = "none";
  }

  // Hiển thị phần tử mới
  const element = document.getElementById(id);
  if (element) {
    element.style.display = "block";
    currentElement = element; // Cập nhật phần tử hiện đang hiển thị
  }
}

export function showElement(classElement, id) {
  const elements = document.getElementsByClassName(classElement);

  for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = "none";
  }

  const targetElement = document.getElementById(id);

  if (targetElement) {
    targetElement.style.display = "block";
    currentElement = targetElement;
  }
}
document.addEventListener("DOMContentLoaded", function () {
  showElement("layout-works", "ql-monan");
});

export function showFrm(id) {
  const element = document.getElementById(id);
  element.style.display = "flex";
}

export function hideFrm(id) {
  const element = document.getElementById(id);
  element.style.display = "none";
}

//export các hàm đã viết ra trang admin.html
window.logoutforAdmin = logoutforAdmin;
window.showElementById = showElementById;
window.showElement = showElement;
window.showFrm = showFrm;
window.hideFrm = hideFrm;
window.capnhatMonAn = capnhatMonAn;
window.chuanbiForm = chuanbiForm;
window.createNewAdmin = createNewAdmin;
