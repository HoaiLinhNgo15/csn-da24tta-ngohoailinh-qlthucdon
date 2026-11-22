document.addEventListener("DOMContentLoaded", () => {
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
    let currentDay = `${year}-${month}-${day}`;
    chonNgayInput.value = currentDay;

    chonNgayInput.addEventListener("change", tai_ChiTietThucDon);

    const ngayhientai = document.getElementById("ngayhientai");
    const cahientai = document.getElementById("cahientai");
    ngayhientai.textContent = `(${day}/${month}/${year})`;
    const hour = today.getHours();
    //const hour = 19;
    if (hour >= 5 && hour < 10) {
      cahientai.textContent = "sáng";
    } else if (hour >= 10 && hour < 15) {
      cahientai.textContent = "trưa";
    } else if (hour >= 15 && hour < 18) {
      cahientai.textContent = "chiều";
    } else {
      cahientai.textContent = "tối";
    }
  }

  const dishList = document.getElementById("dish-list");
  if (dishList) {
    dishList.addEventListener("click", (e) => {
      // Tìm thẻ card món ăn gần nhất được bấm vào
      const card = e.target.closest(".card-monan.monan");
      if (!card) return; // Nếu bấm ra ngoài thẻ card thì bỏ qua

      // (Tùy chọn) Xóa class 'selected' của tất cả các card khác nếu muốn chỉ chọn 1 card tại một thời điểm
      const allCards = dishList.querySelectorAll(".card-monan.monan");
      allCards.forEach((c) => c.classList.remove("selected"));

      // Thêm class 'selected' cho card vừa được bấm
      card.classList.add("selected");
    });
  }

  const DS_ThucDon = document.getElementById("danhsachthedachon");
  if (DS_ThucDon) {
    DS_ThucDon.addEventListener("click", (e) => {
      // tìm thẻ gần nhất được bấm vào
      const card = e.target.closest(".card-monan.thucdon");
      if (!card) return;

      const allCards = DS_ThucDon.querySelectorAll(".card-monan.thucdon");
      allCards.forEach((c) => c.classList.remove("selected"));

      card.classList.add("selected");
    });
  }

  document.querySelectorAll('input[name="buoi"]').forEach((radio) => {
    radio.addEventListener("change", tai_ChiTietThucDon);
  });

  loadTableData();
  capnhatMonAn();
  loadDataList();
  loadAdminTable();
  createNewAdmin();
  tai_ChiTietThucDon();
  tai_TrangThaiMonAn();
});
//------------------------------------------------------------------------------

const API_BASE_URL = "http://localhost:3002";
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
        // const colBadge = document.createElement("td");
        // const textBadge = document.createElement("span");
        // textBadge.setAttribute("class", "badge-status");
        // textBadge.textContent = "Còn";
        // colBadge.appendChild(textBadge);
        // row.appendChild(colBadge);

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
        //bổ sung sự kiện xóa vào đây
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
async function xoaMonAn(maMon, tenMon = "") {
  if (!maMon) {
    alert("Không tìm thấy món cần xóa!");
    return;
  }

  const tenHienThi = tenMon ? `"${tenMon}" (${maMon})` : `mã ${maMon}`;
  const chapnhanRuiRo = window.confirm(
    `Món ăn ${tenHienThi} có thể đang nằm trong thực đơn.\n` +
      `Nếu tiếp tục, hệ thống sẽ xóa món ăn này ra khỏi "Tất cả" thực đơn trước rồi mới xóa món ăn.\n\n` +
      `Bạn có chắc chắn muốn tiếp tục?`,
  );

  if (!chapnhanRuiRo) {
    return;
  }

  try {
    const url = `${API_BASE_URL}/api/monan/${encodeURIComponent(maMon)}?cascadeThucDon = true`;
    const response = await fetch(url, {
      method: "DELETE",
    });

    const results = await response.json();

    if (response.ok && results.success) {
      alert(results.message);
      if (typeof loadTableData === "function") {
        loadTableData();
      }
      if (typeof tai_ChiTietThucDon === "function") {
        tai_ChiTietThucDon();
      }
      if (typeof loadDataList === "function") loadDataList();
      if (typeof tai_TrangThaiMonAn === "function") {
        tai_TrangThaiMonAn();
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
        dishCard.setAttribute("class", "card-monan monan");

        // tạo hình ảnh món ăn
        const IMG = document.createElement("img");
        IMG.setAttribute("src", dishList[i].HinhAnh);
        IMG.setAttribute("alt", dishList[i].TenMon);

        // tạo khung chứa tên món ăn
        const dishName = document.createElement("p");
        dishName.setAttribute("class", "tenmon");
        dishName.textContent = dishList[i].TenMon;

        // cài mã món ẩn
        // const maMon = document.createElement("span");
        // maMon.style.display = "none";
        // maMon.textContent = dishList[i].MaMon;
        dishCard.dataset.maMon = dishList[i].MaMon;

        // thêm phẩn tử IMG & dishName vào dishCard
        dishCard.appendChild(IMG);
        dishCard.appendChild(dishName);
        //dishCard.appendChild(maMon);

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
  const ngayInput = document.getElementById("chonNgay");
  const maBuoiInput = document.querySelector('input[name="buoi"]:checked');
  const listCard = document.getElementById("danhsachthedachon");

  const ngay = ngayInput ? ngayInput.value.trim() : "";
  const maBuoi = maBuoiInput ? maBuoiInput.value.trim() : "";

  if (!ngay || !maBuoi) {
    if (listCard) {
      listCard.innerHTML = "<p>Vui lòng chọn ngày và buổi.</p>";
    }
    return;
  }
  try {
    if (listCard) {
      listCard.innerHTML = "<p>Đang tải thực đơn...</p>";
    }
    // const formData = {
    //   ngay: ngay,
    //   maBuoi: maBuoi,
    // };

    const url = `${API_BASE_URL}/api/monan/thucdon?ngay=${encodeURIComponent(ngay)}&maBuoi=${encodeURIComponent(maBuoi)}`;
    const res = await fetch(url);
    const dataSet = await res.json();

    //const dataSet = await response.json();
    if (dataSet.success) {
      const listThucDon = dataSet.data;
      if (listThucDon.length === 0) {
        listCard.innerHTML = "Không có món trong thực đơn";
        return;
      }
      listCard.innerHTML = "";
      for (let i = 0; i < listThucDon.length; i++) {
        const item = listThucDon[i];
        // tạo phần tử làm thẻ chứa thông tin của mỗi món
        const card = document.createElement("div");
        card.setAttribute("class", "card-monan thucdon");

        // tạo thẻ thành phần món
        const IMG = document.createElement("img");
        const imgSrc =
          item.HinhAnh && item.HinhAnh.startsWith("/")
            ? `${API_BASE_URL}${item.HinhAnh}`
            : item.HinhAnh || "";
        IMG.setAttribute("src", imgSrc);
        IMG.setAttribute("alt", listThucDon[i].TenMon);

        const tenMon = document.createElement("p");
        tenMon.setAttribute("class", "tenmon");
        tenMon.textContent = listThucDon[i].TenMon;

        card.appendChild(IMG);
        card.appendChild(tenMon);
        card.dataset.maMon = listThucDon[i].MaMon;

        listCard.appendChild(card);
      }
    } else {
      console.error("Không thể lấy dữ liệu", dataSet.message);
    }
  } catch (err) {
    console.error("Không kết nối được server: ", err);
  }
}

// gọi api và xử lý thêm món ăn vào thực đơn
export async function themThucDon() {
  //lấy form chứa thông tin ngày và buổi
  //const myFrm = document.getElementById("phanloai");
  const date = document.getElementById("chonNgay");
  const partDate = document.querySelector('input[name="buoi"]:checked');
  const cardSelected = document.querySelector(".monan.selected");

  const convertMaBuoi = {
    B01: "Sáng",
    B02: "Trưa",
    B03: "Chiều",
  };

  if (!cardSelected) {
    alert("Vui lòng chọn một món ăn trước!");
    return;
  }

  if (!partDate || !date) {
    //const card = cardSelected[0];
    alert("Lỗi truy cập phần tử HTML");
    return;
  }

  const maMon = cardSelected.dataset.maMon;
  const day = date.value;
  const maBuoi = partDate.value;

  try {
    //đóng gói dữ liệu
    const formData = {
      maMon: maMon,
      ngay: day,
      maBuoi: maBuoi,
    };

    const response = await fetch("http://localhost:3002/api/thucdon/themmon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message);
      if (typeof tai_ChiTietThucDon === "function") {
        tai_ChiTietThucDon();
      }
      if (typeof tai_TrangThaiMonAn === "function") {
        tai_TrangThaiMonAn();
      }
    } else {
      alert(result.message);
      console.error("Lỗi không thể thêm món vào thực đơn: ", result.message);
    }
  } catch (err) {
    console.error("Không thể kết nối server: ", err);
  }
}

export async function xoaThucDon() {
  const date = document.getElementById("chonNgay");
  const partDate = document.querySelector('input[name="buoi"]:checked');
  const cardSelected = document.querySelector(".thucdon.selected");

  if (!cardSelected) {
    alert("Vui lòng chọn 1 món ăn trước!");
    return;
  }

  try {
    const ngay = date.value.trim();
    const maBuoi = partDate.value.trim();
    const maMon = cardSelected.dataset.maMon.trim();

    if (!maMon || !ngay || !maBuoi) {
      console.error("Lỗi khi lấy dữ liệu cho thực hiện xóa!");
      return;
    }

    //alert(`Mã Món: ${maMon}, ${ngay}, ${maBuoi}`);
    const url = `${API_BASE_URL}/api/thucdon/xoamon?maMon=${encodeURIComponent(maMon)}&ngay=${encodeURIComponent(ngay)}&maBuoi=${encodeURIComponent(maBuoi)}`;
    const response = await fetch(url, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message);
      if (typeof tai_ChiTietThucDon === "function") {
        tai_ChiTietThucDon();
      }
      if (typeof tai_TrangThaiMonAn === "function") {
        tai_TrangThaiMonAn();
      }
    } else {
      alert("Xóa thất bại: " + result.message);
      return;
    }
  } catch (err) {
    console.error("Không thể kết nối Server: ", err);
  }
}

//------------------------------------------------------------------------------

//=============================== THAY ĐỔI TRẠNG THÁI MÓN ĂN ===================

// hàm render món lên web
function renderTrangthaimon(listMon) {
  const container = document.getElementById("trangthai-container");
  if (!Array.isArray(listMon) || listMon.length === 0) {
    container.innerHTML = "<p>Thực đơn hôm nay không có món nào!</p>";
    return;
  }

  container.innerHTML = "";
  for (let i = 0; i < listMon.length; i++) {
    const item = listMon[i];

    const card = document.createElement("div");
    card.setAttribute("class", "trangthai-card");

    const img_price = document.createElement("div");
    img_price.setAttribute("class", "trangthai-IMG-Price");
    img_price.style.backgroundImage = `url(..${item.HinhAnh})`;
    const price = document.createElement("span");
    price.setAttribute("class", "trangthai-price");
    price.textContent = formatTienViet(item.GiaBan);
    img_price.appendChild(price);

    const tenmon = document.createElement("p");
    tenmon.setAttribute("class", "trangthai-tenmon");
    tenmon.textContent = item.TenMon;

    const lbl = document.createElement("label");
    lbl.setAttribute("class", "switch");

    const checkBox = document.createElement("input");
    checkBox.setAttribute("type", "checkbox");
    checkBox.checked = Number(item.Trangthai) === 1;

    checkBox.addEventListener("change", async () => {
      const trangthaiMoi = checkBox.checked ? 1 : 0;
      checkBox.disabled = true;

      try {
        const url = `${API_BASE_URL}/api/thucdon/capnhattrangthai?ngay=${encodeURIComponent(item.NgayPhucVu)}&maBuoi=${encodeURIComponent(item.MaBuoi)}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maMon: item.MaMon,
            trangthaiMoi: trangthaiMoi,
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Cập nhật trạng thái thất bại!");
        }
        item.Trangthai = trangthaiMoi;
      } catch (err) {
        console.error("Lỗi cập nhật trạng thái: ", err);
        checkBox.checked = !checkBox.checked;
        alert("Không thể thay đổi trạng thái món, vui lòng thử lại!");
      } finally {
        checkBox.disabled = false;
      }
    });

    const slider = document.createElement("span");
    slider.setAttribute("class", "slider round");
    lbl.appendChild(checkBox);
    lbl.appendChild(slider);

    card.appendChild(img_price);
    card.appendChild(tenmon);
    card.appendChild(lbl);
    card.dataset.MaMon = item.MaMon;
    card.dataset.MaChiTiet = item.MaChiTiet;

    container.appendChild(card);
  }
}

// gọi api tải dữ liệu tên danh mục trạng thái món
// dùng /api/monan/thucdon?
async function tai_TrangThaiMonAn() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const hour = today.getHours();
  const ngay = `${year}-${month}-${day}`;
  let maBuoi;
  if (hour >= 5 && hour < 10) maBuoi = "B01";
  else if (hour >= 10 && hour < 15) maBuoi = "B02";
  else if (hour >= 15 && hour < 18) maBuoi = "B03";
  else {
    document.getElementById("trangthai-container").innerHTML =
      "<p>Hiện tại căn tin không phục vụ. Vui lòng chờ đến ngày mai!</p>";
    return;
  }
  try {
    if (!ngay || !maBuoi) {
      console.error("Không lấy được thông tin ngày và buổi hiện tại");
      document.getElementById("trangthai-container").innerHTML =
        "<p>Đang tải thông tin....</p>";
      return;
    }
    const url = `${API_BASE_URL}/api/monan/thucdon?ngay=${encodeURIComponent(ngay)}&maBuoi=${encodeURIComponent(maBuoi)}`;
    const response = await fetch(url);
    const dataSet = await response.json();

    if (dataSet.success) {
      if (typeof renderTrangthaimon === "function") {
        renderTrangthaimon(dataSet.data);
      }
    } else {
      document.getElementById("trangthai-container").innerHTML =
        "<p>Không có dữ liệu!</p>";
    }
  } catch (err) {
    console.error("Không kết nối được đến server!", err);
  }
}

// -----------------------------------------------------------------------------

//=============================== QUẢN LÝ TÀI KHOẢN ADMIN ======================
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
          const userData = sessionStorage.getItem("adminUser");
          const user = JSON.parse(userData);
          if (user.id !== 1) {
            alert(
              "Bạn không có quyền sửa mật khẩu. Vui lòng liên hệ Admin hoặc vào tài khoản của admin!",
            );
            return;
          }
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
  if (item.MaAdmin == 1) {
    alert("Không thể khóa tài khoản này!");
    return;
  }

  if (user.id != 1) {
    alert("Bạn không có quyền khóa tài khoản khác!");
    return;
  }
  try {
    const url = `${API_BASE_URL}/api/admin/trangthai/${item.MaAdmin}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    if (result.success) {
      alert(result.message);
      if (typeof loadAdminTable === "function") {
        loadAdminTable();
      }
    } else {
      alert(result.message);
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
window.themThucDon = themThucDon;
window.xoaThucDon = xoaThucDon;
