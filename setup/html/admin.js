document.addEventListener("DOMContentLoaded", async () => {
  const respon = await fetch("http://localhost:3002/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const dataset = await respon.json();

  //lấy thành phần table từ html
  const table = document.getElementById("table-admin");

  for (let i = 0; i < dataset.length; i++) {
    const row = document.createElement("tr");
    row.setAttribute("class", "record");

    const colSTT = document.createElement("td");
    colSTT.textContent = i + 1;
    row.appendChild(colSTT);

    const colIMG = document.createElement("td");
    const IMG = document.createElement("img");
    IMG.setAttribute("src", dataset[i].HinhAnh);
    IMG.setAttribute("alt", dataset[i].TenMon);
    colIMG.appendChild(IMG);
    row.appendChild(colIMG);

    const colName = document.createElement("td");
    const textName = document.createElement("span");
    textName.setAttribute("class", "dish-name");
    textName.textContent = dataset[i].TenMon;
    colName.appendChild(textName);
    row.appendChild(colName);

    const colGr = document.createElement("td");
    colGr.textContent = dataset[i].TenNhom;
    row.appendChild(colGr);

    const colPrice = document.createElement("td");
    const textPrice = document.createElement("span");
    textPrice.setAttribute("class", "dish-price");
    textPrice.textContent = dataset[i].GiaBan;
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

    table.appendChild(row);
  }
});
