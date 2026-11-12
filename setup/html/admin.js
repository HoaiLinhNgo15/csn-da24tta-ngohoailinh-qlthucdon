document.addEventListener("DOMContentLoaded", () => {
  loadTableData();
  capnhatMonAn();
});

//Viết CRUD cho trang Admin
//CREATE

let currentEditId = null;
//hàm lấy dữ liệu lên form
export function chuanbiForm(item) {
  currentEditId = item.MaMon;

  document.getElementById("tenmon").value = item.TenMon;
  document.getElementById("giaban").value = item.GiaBan;
  document.getElementById("mota").value = item.MoTa;
  document.getElementById("hinhanh").value = item.HinhAnh;

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
  const Tenmon = document.getElementById("tenmon");
  const Nhommon = document.getElementById("nhommon");
  const Giaban = document.getElementById("giaban");
  const Mota = document.getElementById("mota");
  const Hinhanh = document.getElementById("hinhanh");
  const ErrorBox = document.getElementById("Error-message");

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
    const _hinhanh = Hinhanh.value.trim();

    //kiểm tra các ô đã được điền đủ thông tin hay chưa
    if (!_tenmon || !_nhommon || !_giaban || !_mota || !_hinhanh) {
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

    //thông tin các ô đã được điền đầy đủ tiến hành thêm vào cơ sở dữ liệu
    try {
      //đóng gói dữ liệu để gửi lên backend
      const formData = {
        tenMon: _tenmon,
        hinhAnh: _hinhanh,
        moTa: _mota,
        giaBan: parseFloat(_giaban),
        maNhom: _manhom,
      };

      let url = "http://localhost:3002/api/createmonan";
      let method = "POST";

      if (currentEditId) {
        url = `http://localhost:3002/api/monan/${currentEditId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const results = await response.json();

      if (results.success) {
        alert(results.message);
        myFrm.reset(); //xóa form
        currentEditId = null;

        //làm mới danh sách món ăn
        if (typeof loadTableData === "function") {
          loadTableData();
        }
      } else {
        showError(results.message || "Thêm món ăn thất bại!!");
      }
    } catch (err) {
      console.error("Lỗi kết nối: ", err);
      showError("Không thể kết nối tới Server!!");
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
        textPrice.textContent = listMonAn[i].GiaBan + " VND";
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

/*
export async function hienthiMonAn(button) {
  showFrm("update-container");
  const myFrm = document.getElementById("frm-update");
  const Tenmon = document.getElementById("tenmon");
  const Nhommon = document.getElementById("nhommon");
  const Giaban = document.getElementById("giaban");
  const Mota = document.getElementById("mota");
  const Hinhanh = document.getElementById("hinhanh");
  const ErrorBox = document.getElementById("Error-message");
  const row = button.closest("tr");
  const Mamon = row.cells[0].innerText;

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

  try {
    const response = await fetch("http://localhost:3002/api/showmonan", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Mamon),
    });

    const dataset = response.json();
    if (dataset.success) {
      const Monan = dataset.data[0];
      /// hàm updata đang xử lý đến đây-------------------------------------------------
      Tenmon.textContent = Monan.TenMon;
      Nhommon.textContent = Monan.NhomMon;
      Giaban.textContent = Monan.GiaBan;
      Hinhanh.textContent = Monan.HinhAnh;
      Mota.textContent = Monan.MoTa;
    }
  } catch (err) {
    console.error("Lỗi kết nối: ", err);
  }
}
*/

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
