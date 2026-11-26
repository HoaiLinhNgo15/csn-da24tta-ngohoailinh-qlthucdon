document.addEventListener("DOMContentLoaded", () => {
  // chọn mặc định ngày và buổi hiện tại để hiển thị thực đơn
  const today = new Date();
  const currentDay = today.getDay();
  const normalizedDay = currentDay === 0 ? 7 : currentDay;
  const thu_id = "thu" + String(normalizedDay + 1);
  let buoi_id = "";
  const hour = today.getHours();
  //const hour = 19;
  if (hour >= 5 && hour < 10) {
    buoi_id = "buoisang";
  } else if (hour >= 10 && hour < 15) {
    buoi_id = "buoitrua";
  } else if (hour >= 15 && hour < 18) {
    buoi_id = "buoichieu";
  } else {
    buoi_id = "buoitoi";
  }
  document.getElementById(buoi_id).checked = true;
  document.getElementById(thu_id).checked = true;

  // thiết lập tự động tải lại danh sách thực đơn khi người dùng thay đổi lựa chọn
  // với nhóm món
  document.querySelectorAll("input[name='nhommon']").forEach((radio) => {
    radio.addEventListener("change", tai_ThucDon);
  });

  // với các thứ trong tuần
  document.querySelectorAll('input[name="ngaytrongtuan"]').forEach((radio) => {
    radio.addEventListener("change", tai_ThucDon);
  });

  // với các buổi trong ngay
  document.querySelectorAll('input[name="buoitrongngay"]').forEach((radio) => {
    radio.addEventListener("change", tai_ThucDon);
  });

  tai_Slider();
  getDateOfCurrentWeek(normalizedDay);
  tai_ThucDon();
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
    card.addEventListener("click", () => {
      showPopUp("container-detail");
    });

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

    label.appendChild(input);
    const span = document.createElement("span");
    span.innerHTML = "&#9825; quan tâm";
    label.appendChild(span);

    divLikes.appendChild(label);

    card.appendChild(divLikes);

    card.dataset.MaCT = item.MaChiTiet;
    card.dataset.MaMon = item.MaMon;
    card.addEventListener("click", () => {
      showPopUp("container-detail");
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
//------------------------------------------------------------------------------

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
