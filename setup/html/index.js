document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0: CN, 1: T2 ... 6: T7
  const normalizedDay = currentDay === 0 ? 7 : currentDay; // 1..7

  // Kiểm tra lại quy ước id trong HTML: thu2..thu8 hay thu2..thu7
  const thu_id = "thu" + String(normalizedDay + 1);

  const hour = today.getHours();
  let buoi_id = "buoitoi";
  if (hour >= 5 && hour < 10) {
    buoi_id = "buoisang";
  } else if (hour >= 10 && hour < 15) {
    buoi_id = "buoitrua";
  } else if (hour >= 15 && hour < 18) {
    buoi_id = "buoichieu";
  }

  const input_buoi = document.getElementById(buoi_id);
  const input_ngay = document.getElementById(thu_id);

  if (input_buoi) {
    input_buoi.checked = true;
  } else {
    console.warn("Không tìm thấy input buổi:", buoi_id);
  }

  if (input_ngay) {
    input_ngay.checked = true;
  } else {
    console.warn("Không tìm thấy input ngày:", thu_id);
  }

  document.querySelectorAll("input[name='nhommon']").forEach((radio) => {
    radio.addEventListener("change", tai_ThucDon);
  });

  document.querySelectorAll('input[name="ngaytrongtuan"]').forEach((radio) => {
    radio.addEventListener("change", tai_ThucDon);
  });

  document.querySelectorAll('input[name="buoitrongngay"]').forEach((radio) => {
    radio.addEventListener("change", tai_ThucDon);
  });

  tai_Slider();
  tai_ThucDon();
  ghinhanClientGheTrang("/index.html");
  if (typeof khoitaoChiTietMonAn === "function") {
    khoitaoChiTietMonAn();
  }
});

const API_BASE_URL = "http://localhost:3002";

//======================= LẤY DỮ LIỆU ĐƯA VÀO SLIDER ===========================

// hàm render món cho slider
function renderSlider(listMon) {
  const container = document.getElementById("hot-dishes-track");
  const dotsContainer = document.getElementById("hot-slider-dots");
  const prevBtn = document.getElementById("hot-prev-btn");
  const nextBtn = document.getElementById("hot-next-btn");

  if (!container || !dotsContainer || !prevBtn || !nextBtn) return;

  if (listMon.length === 0) {
    container.innerHTML = "<p>Chưa đánh giá được!</p>";
    return;
  }

  let n = listMon.length;
  if (n > 6) n = 6;

  container.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const item = listMon[i];

    const card = document.createElement("div");
    card.className = "card hot-card";

    const image = document.createElement("div");
    image.className = "image-dish";
    image.style.backgroundImage = `url(${item.HinhAnh})`;

    const tenmon = document.createElement("span");
    tenmon.className = "tenMon";
    tenmon.textContent = item.TenMon;

    const divLikes = document.createElement("div");
    const iconHeart = document.createElement("span");
    iconHeart.innerHTML = "&#10084; ";
    iconHeart.style.color = "#f00";

    const likes = document.createElement("span");
    likes.className = "luotthich";
    likes.textContent = String(item.TongLuotThich);

    divLikes.appendChild(iconHeart);
    divLikes.appendChild(likes);

    image.appendChild(tenmon);
    image.appendChild(divLikes);

    card.appendChild(image);
    card.dataset.MaCT = item.MaChiTiet;
    card.dataset.MaMon = item.MaMon;
    // card.addEventListener("click", () => {
    //   showPopUp("container-detail");
    //   showChiTietMon(item.MaMon);
    // });

    container.appendChild(card);
  }

  const totalPages = Math.ceil(n / 3);
  dotsContainer.innerHTML = Array.from(
    { length: totalPages },
    (_, i) =>
      `<button class="slider-dot ${i == 0 ? "active" : ""}" data-page="${i}"></button>`,
  ).join("");

  prevBtn.addEventListener("click", () => {
    container.scrollBy({ left: -container.clientWidth, behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    container.scrollBy({ left: container.clientWidth, behavior: "smooth" });
  });

  container.addEventListener("scroll", () => {
    const currentPage = Math.round(
      container.scrollLeft / container.clientWidth,
    );

    document.querySelectorAll(".slider-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentPage);
    });
  });

  dotsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("slider-dot")) {
      const page = Number(e.target.dataset.page);
      container.scrollTo({
        left: page * container.clientWidth,
        behavior: "smooth",
      });
    }
  });
}

async function tai_Slider() {
  try {
    const url = `${API_BASE_URL}/api/luotthich`;

    const res = await fetch(url);
    const dataSet = await res.json();

    if (dataSet.success) {
      const listData = dataSet.data;
      renderSlider(listData);
    } else {
      consolde.error("Nhận dữ liệu Lượt quan tâm từ server thất bại!");
    }
  } catch (err) {
    console.error("Kết nối dữ liệu lượt quan tâm không thành công!", err);
  }
}

//------------------------------------------------------------------------------

//====================== TẢI MÓN ĂN LÊN TRANG CHỦ THEO THỰC ĐƠN ================

// Hàm lấy ngày của các thứ trong tuần hiện tại
function getDateOfCurrentWeek(targetDayIndex) {
  const today = new Date();

  const currentDay = today.getDay();

  //đổi Chủ nhật thành 7 nếu không là chủ nhật thì giữ nguyên
  const normalizedToday = currentDay === 0 ? 7 : currentDay;

  //tính độ lệch ngày
  const diff = Number(targetDayIndex) - normalizedToday;

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);

  //định dạng lại
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// hàm render món ăn theo thực đơn
function renderThucDon(listMon) {
  const container = document.getElementById("dishes-container");
  if (!container) return;

  if (listMon.length === 0) {
    container.innerHTML = "<p>Hiện tại không có món nào trong thực đơn</p>";
    return;
  }

  container.innerHTML = "";
  for (let i = 0; i < listMon.length; i++) {
    const item = listMon[i];

    const card = document.createElement("div");
    card.className = "card card-dishes";

    const IMG = document.createElement("img");
    IMG.className = "image-dishes";
    IMG.src = item.HinhAnh;
    IMG.alt = item.TenMon;

    card.appendChild(IMG);

    const infor = document.createElement("div");
    infor.className = "infor-dishes";

    const name_price = document.createElement("div");
    name_price.className = "name-price-dishes";

    const name = document.createElement("span");
    const price = document.createElement("span");
    name.className = "name-dishes";
    name.textContent = item.TenMon;
    price.className = "price-dishes";
    price.textContent = formatTienViet(item.GiaBan);
    name_price.appendChild(name);
    name_price.appendChild(price);

    infor.appendChild(name_price);

    const divStatus = document.createElement("div");
    divStatus.className = "status-dishes";

    const status = document.createElement("p");
    if (
      String(item.TrangThai) === "1" ||
      String(item.TrangThai).trim().toLowerCase() === "true"
    ) {
      status.className = "status stock-status";
      status.textContent = "Còn món";
    } else {
      status.className = "status runout-status";
      status.textContent = "Hết món";
    }

    divStatus.appendChild(status);
    infor.appendChild(divStatus);
    card.appendChild(infor);

    const divLikes = document.createElement("div");
    divLikes.className = "likes-dishes";
    const label = document.createElement("label");
    label.for = item.MaMon;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = item.MaMon;
    const span = document.createElement("span");
    span.innerHTML = "&#9825; quan tâm";

    label.addEventListener("click", (e) => {
      e.stopPropagation(); // Ngăn click nổi bọt lên .card mở popup
    });

    input.addEventListener("change", (e) => {
      e.stopPropagation();
      capnhatGiaoDienNut(input.id, span);
      capnhatLuotthich(input.id, item.MaChiTiet);
    });
    label.appendChild(input);
    label.appendChild(span);

    divLikes.appendChild(label);

    card.appendChild(divLikes);

    card.dataset.MaCT = item.MaChiTiet;
    card.dataset.MaMon = item.MaMon;
    card.addEventListener("click", () => {
      showPopUp("container-detail");
      showChiTietMon(card.dataset.MaMon);
    });

    container.appendChild(card);
  }
}

async function tai_ThucDon() {
  const inputNhom = document.querySelector('input[name="nhommon"]:checked');
  const inputNgay = document.querySelector(
    'input[name="ngaytrongtuan"]:checked',
  );
  const inputBuoi = document.querySelector(
    'input[name="buoitrongngay"]:checked',
  );

  if (!inputNhom || !inputNgay || !inputBuoi) return;

  try {
    const maNhom = inputNhom.value.trim();
    const ngay = getDateOfCurrentWeek(inputNgay.dataset.day);
    const maBuoi = inputBuoi.value.trim();

    if (!maBuoi || maBuoi === "B04") {
      document.getElementById("dishes-container").innerHTML =
        "<p>Hiện tại không có món nào trong thực đơn</p>";
      return;
    }

    let url = `${API_BASE_URL}/api/trangchu/thucdon?ngay=${ngay}&maBuoi=${maBuoi}`;

    if (String(maNhom) !== "All") {
      url = `${API_BASE_URL}/api/trangchu/thucdon?maNhom=${maNhom}&ngay=${ngay}&maBuoi=${maBuoi}`;
    }

    const res = await fetch(url);
    const dataSet = await res.json();
    if (res.ok && dataSet.success && dataSet.data) {
      renderThucDon(dataSet.data);
    } else {
      console.error(
        dataSet.message || "Nhận dữ liệu thực đơn không thành công!",
      );
    }
  } catch (err) {
    console.error("Không lấy dữ liệu thực đơn được (TRANG CHỦ)!", err);
  }
}

// hàm tương tác với món ăn trong thực đơn
function capnhatGiaoDienNut(id, element) {
  const likebtn = document.getElementById(id);
  if (!likebtn || !element) {
    console.error("Không truy cập được phần tử!");
    return;
  }

  if (likebtn.checked) {
    element.innerHTML = "&#10084; đã quan tâm";
  } else {
    element.innerHTML = "&#9825; quan tâm";
  }
}

// Hàm cập nhật lượt quan tâm món ăn
async function capnhatLuotthich(id, maCT) {
  const likebtn = document.getElementById(id);
  if (!likebtn || !maCT) {
    console.error("Không truy cập được phần tử!");
    return;
  }

  likebtn.disable = true;

  try {
    let url;
    if (likebtn.checked) {
      url = `${API_BASE_URL}/api/trangchu/luotquantam?liked=true&maCT=${encodeURIComponent(maCT)}`;
    } else {
      url = `${API_BASE_URL}/api/trangchu/luotquantam?liked=false&maCT=${encodeURIComponent(maCT)}`;
    }

    const res = await fetch(url, {
      method: "POST",
    });

    const result = await res.json();

    if (result.success) {
      console.log(
        result.message +
          " Mã chi tiết: " +
          result.data.maChiTiet +
          " Lượt quan tâm mới: " +
          result.data.LuotQuanTam,
      );
      if (typeof tai_Slider === "function") tai_Slider();
    } else {
      console.log(result.message);
    }
  } catch (err) {
    console.error(
      "Có lỗi trong quá trình gọi api cập nhật lượt quan tâm!",
      err,
    );
  } finally {
    likebtn.disable = false;
  }
}

// hàm hiển thị chi tiết món ăn
async function showChiTietMon(maMon) {
  const eleIMG = document.getElementById("chitiet-hinhanh");
  const eleTenMon = document.getElementById("tenmon-monan");
  const eleGiaBan = document.getElementById("giaban-monan");
  const divBuoiPV = document.getElementById("buoiphucvu-monan");
  const eleMoTa = document.getElementById("mota-monan");
  const eleStatus = document.getElementById("tinhtrang-monan");
  const inputNgay = document.querySelector(
    'input[name="ngaytrongtuan"]:checked',
  );
  const eleInput = document.getElementById("btn-quantam");
  const eleIcon = document.getElementById("icon-heart-chitiet");

  if (
    !eleIMG ||
    !eleTenMon ||
    !eleGiaBan ||
    !divBuoiPV ||
    !eleMoTa ||
    !eleStatus ||
    !inputNgay ||
    !maMon ||
    !eleInput ||
    !eleIcon
  ) {
    console.error("Không truy cập được các phần tử hiển thị!");
    return;
  }

  eleIMG.src = "";
  eleTenMon.textContent = "";
  eleGiaBan.textContent = "";
  divBuoiPV.innerHTML = "";
  eleMoTa.textContent = "";
  eleStatus.textContent = "";
  eleInput.dataset.maChiTiet = "";
  eleInput.checked = false;

  const ngay = getDateOfCurrentWeek(inputNgay.dataset.day);
  try {
    let url = `${API_BASE_URL}/api/trangchu/chitietmonan?maMon=${encodeURIComponent(maMon)}&ngay=${encodeURIComponent(ngay)}`;
    const res = await fetch(url);
    const dataSet = await res.json();

    if (
      !res.ok ||
      !dataSet.success ||
      !Array.isArray(dataSet.data) ||
      dataSet.data.length === 0
    ) {
      eleTenMon.textContent =
        "Không tìm thấy thông tin món ăn cho ngày đã chọn";
      return;
    }

    const listMon = dataSet.data;
    const MonAn = listMon[0];

    eleIMG.src = MonAn.HinhAnh || "";
    eleIMG.alt = MonAn.TenMon || "";
    eleTenMon.textContent = MonAn.TenMon || "";
    eleGiaBan.textContent = formatTienViet(MonAn.GiaBan);

    for (let i = 0; i < listMon.length; i++) {
      const buoi = document.createElement("p");
      buoi.textContent = listMon[i].TenBuoi;

      divBuoiPV.appendChild(buoi);
    }

    eleMoTa.textContent = MonAn.MoTa || "";

    const trangThaiRaw = MonAn.TrangThai;
    const isConMon =
      Number(trangThaiRaw) === 1 ||
      String(trangThaiRaw).trim().toLowerCase() === "true";

    if (isConMon) {
      eleStatus.className = "status stock-status";
      eleStatus.textContent = "còn món";
    } else {
      eleStatus.className = "status runout-status";
      eleStatus.textContent = "Hết món";
    }

    eleInput.dataset.maChiTiet = MonAn.MaChiTiet || "";
    const daThich =
      MonAn.MaChiTiet &&
      localStorage.getItem(`liked_${MonAn.MaChiTiet}`) === "1";
    eleInput.checked = Boolean(daThich);
    capnhatGiaoDienNut("btn-quantam", eleIcon);
  } catch (err) {
    console.error("Kết nối server không thành công: ", err);
    capnhatGiaoDienNut("btn-quantam", eleIcon);
  }
}

//------------------------------------------------------------------------------

//============================== GHI NHẬN LƯỢT TRUY CẬP ========================
const URL_TRANGCHU = "/index.html";
async function ghinhanClientGheTrang(duongDan = URL_TRANGCHU || "/") {
  try {
    //tránh bấm f5 liên tục trên cùng 1 tab
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `visited_${duongDan}_${today}`;
    if (sessionStorage.getItem(cacheKey)) {
      //await tai_LuotKhachTruyCap();
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/luottruycap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duongDan }),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      sessionStorage.setItem(cacheKey, "1");
      //await tai_LuotKhachTruyCap();
    }
  } catch (err) {
    console.error("Không ghi nhận được lượt truy cập: ", err);
  }
}

//============================== HÀM DÙNG CHUNG ================================

// hàm khởi tạo sự kiện cho popup chi tiết món ăn
function khoitaoChiTietMonAn() {
  const eleInput = document.getElementById("btn-quantam");
  const eleHeart = document.getElementById("icon-heart-chitiet");
  if (!eleInput || !eleHeart) {
    return;
  }

  eleInput.addEventListener("change", () => {
    const maCT = eleInput.dataset.maChiTiet;
    capnhatGiaoDienNut("btn-quantam", eleHeart);
    if (maCT) {
      capnhatLuotthich("btn-quantam", maCT);
    }
  });
}

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

export function hidePopUp(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = "none";
  }
}

export function showPopUp(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = "flex";
  }
}

window.hidePopUp = hidePopUp;
window.showPopUp = showPopUp;
