document.addEventListener("DOMContentLoaded", () => {
  //kiểm tra phiên làm việc (nếu đã đăng nhập thì không cần đăng nhập lại)
  //Lấy trạng thái từ sessionStorage
  const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn");
  if (isLoggedIn === "true") {
    window.location.href = "admin.html";
    return;
  }

  //lấy các phần tử giao diện
  const loginForm = document.getElementById("frm-login");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorBox = document.getElementById("message-Error");

  //hàm hiển thị lỗi
  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }

  //hàm ẩn lỗi
  function hideError() {
    errorBox.style.display = "none";
    errorBox.textContent = "";
  }

  //tiếp nhận và kiểm tra
  loginForm.addEventListener("submit", async (e) => {
    //ngăn trang reload và ẩn lỗi
    e.preventDefault();
    hideError();

    //lấy nội dung tài khoản và mật khẩu
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    //kiểm tra rỗng
    if (!username || !password) {
      showError("Vui lòng điền đầy đủ thông tin Tên đăng nhập và mật khẩu!");
      return;
    }

    //khai báo port và hostname app `http://${hostname}:${port}/api/login`
    const port = 3002;
    const hostname = "localhost";
    try {
      //gửi request tới backend
      const respon = await fetch(`http://${hostname}:${port}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await respon.json();

      if (data.success) {
        //lưu vào sessionStorage
        sessionStorage.setItem("isAdminLoggedIn", "true");
        sessionStorage.setItem("adminUser", JSON.stringify(data.user));

        //chuyển hướng trang đến trang admin
        window.location.href = "admin.html";
      } else {
        showError(data.message);
        passwordInput.value = "";
        passwordInput.focus();
      }
    } catch (err) {
      showError("Không thể kết nối tới máy chủ!!");
    }
  });
});
