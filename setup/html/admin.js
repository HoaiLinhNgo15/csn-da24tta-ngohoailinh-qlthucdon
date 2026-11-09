document.addEventListener("DOMContentLoaded", () => {
  loadTableData();
});

//Viết CRUD cho trang Admin
//CREATE
export function themMonan() {
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

      const response = await fetch("http://localhost:3002/api/monan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const results = await response.json();

      if (results.success) {
        alert(results.message);
        myFrm.reset(); //xóa form

        //làm mới danh sách món ăn
        if (typeof loadTableData === "function") {
          loadTableData();
        }
      } else {
        showError("Thêm món ăn thất bại!!");
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

      for (let i = 0; i < listMonAn.length; i++) {
        const row = document.createElement("tr");
        row.setAttribute("class", "record");

        const colSTT = document.createElement("td");
        colSTT.textContent = i + 1;
        row.appendChild(colSTT);

        const colIMG = document.createElement("td");
        const IMG = document.createElement("img");
        IMG.setAttribute("src", listMonAn[i].HinhAnh);
        IMG.setAttribute("alt", listMonAn[i].TenMon);
        colIMG.appendChild(IMG);
        row.appendChild(colIMG);

        const colName = document.createElement("td");
        const textName = document.createElement("span");
        textName.setAttribute("class", "dish-name");
        textName.textContent = listMonAn[i].TenMon;
        colName.appendChild(textName);
        row.appendChild(colName);

        const colGr = document.createElement("td");
        colGr.textContent = listMonAn[i].TenNhom;
        row.appendChild(colGr);

        const colPrice = document.createElement("td");
        const textPrice = document.createElement("span");
        textPrice.setAttribute("class", "dish-price");
        textPrice.textContent = listMonAn[i].GiaBan;
        colPrice.appendChild(textPrice);
        row.appendChild(colPrice);

        const colBadge = document.createElement("td");
        const textBadge = document.createElement("span");
        textBadge.setAttribute("class", "badge-status");
        textBadge.textContent = "Còn";
        colBadge.appendChild(textBadge);
        row.appendChild(colBadge);

        const colTT = document.createElement("td");
        colTT.setAttribute("id", "col-edit");
        const btn1 = document.createElement("button");
        btn1.setAttribute("class", "btn");
        btn1.textContent = "Sửa";
        btn1.setAttribute("onclick", "showFrm('update-container')");
        const btn2 = document.createElement("button");
        btn2.setAttribute("class", "btn");
        btn2.textContent = "Xóa";
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
window.themMonan = themMonan;
