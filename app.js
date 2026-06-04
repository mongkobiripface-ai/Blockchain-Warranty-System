const CONTRACT_ADDRESS = "0x6bBE29730088a63274e6Ad50c9D6EE3263dDb84A";

const ABI = [
  "function addProduct(string memory,string memory,address,uint256) public",
  "function getProduct(string memory) public view returns(string memory,string memory,address,uint256,uint256,string memory,bool)",
  "function addRepairHistory(string memory,string memory,string memory,string memory) public",
  "function getRepairHistory(string memory,uint256) public view returns(uint256,string memory,string memory,string memory)",
  "function isWarrantyValid(string memory) public view returns(bool)"
];

let provider;
let signer;
let contract;

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Không tìm thấy MetaMask!");
      return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = provider.getSigner();

    contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      signer
    );

    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    document.getElementById("walletAddress").innerText =
      address.slice(0, 6) + "..." + address.slice(-4);

    document.getElementById("networkName").innerText =
      "Network: " + network.name + " | Chain ID: " + network.chainId;

    document.getElementById("customerAddress").value = address;

    alert("Kết nối MetaMask thành công!");

  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối MetaMask!");
  }
}

function checkReady() {
  if (!contract || !signer) {
    alert("Bạn cần kết nối MetaMask trước!");
    return false;
  }

  return true;
}

function formatDate(timestamp) {
  return new Date(Number(timestamp) * 1000).toLocaleString("vi-VN");
}

// =========================
// ADD PRODUCT
// =========================

async function addProduct() {
  if (!checkReady()) return;

  try {
    const productId = document.getElementById("productId").value.trim();
    const productName = document.getElementById("productName").value.trim();
    const warrantyMonths = document.getElementById("warrantyMonths").value.trim();

    if (!productId || !productName || !warrantyMonths) {
      alert("Nhập đầy đủ thông tin!");
      return;
    }

    const customer = await signer.getAddress();

    document.getElementById("customerAddress").value = customer;

    const tx = await contract.addProduct(
      productId,
      productName,
      customer,
      Number(warrantyMonths)
    );

    alert("Đang gửi giao dịch lên Blockchain...");

    await tx.wait();

    saveTx("Thêm sản phẩm", tx.hash);
    updateStats("product");

    alert("Thêm sản phẩm thành công!");

  } catch (err) {
    console.error(err);

    alert(
      "Lỗi thêm sản phẩm:\n" +
      err.message
    );
  }
}

// =========================
// GET PRODUCT
// =========================

async function getProduct() {
  if (!checkReady()) return;

  try {
    const productId = document.getElementById("searchProductId").value.trim();

    if (!productId) {
      alert("Nhập mã sản phẩm!");
      return;
    }

    const result = await contract.getProduct(productId);

    document.getElementById("productResult").innerHTML = `
      <div>
        <b>Mã sản phẩm:</b> ${result[0]} <br>
        <b>Tên sản phẩm:</b> ${result[1]} <br>
        <b>Khách hàng:</b> ${result[2]} <br>
        <b>Ngày mua:</b> ${formatDate(result[3])} <br>
        <b>Hết hạn bảo hành:</b> ${formatDate(result[4])} <br>
        <b>Trạng thái:</b>
        <span class="success">${result[5]}</span> <br>
        <b>Tồn tại:</b> ${result[6]}
      </div>
    `;

    createQRCode(productId);

  } catch (err) {
    console.error(err);
    alert("Không tìm thấy sản phẩm!");
  }
}

// =========================
// ADD REPAIR HISTORY
// =========================

async function addRepairHistory() {
  if (!checkReady()) return;

  try {
    const productId = document.getElementById("repairProductId").value.trim();
    const issue = document.getElementById("repairIssue").value.trim();
    const solution = document.getElementById("repairSolution").value.trim();
    const technician = document.getElementById("technician").value.trim();

    if (!productId || !issue || !solution || !technician) {
      alert("Nhập đầy đủ thông tin sửa chữa!");
      return;
    }

    const tx = await contract.addRepairHistory(
      productId,
      issue,
      solution,
      technician
    );

    alert("Đang gửi giao dịch...");

    await tx.wait();

    saveTx("Thêm lịch sử sửa chữa", tx.hash);
    updateStats("repair");

    alert("Thêm lịch sử sửa chữa thành công!");

  } catch (err) {
    console.error(err);

    alert(
      "Lỗi thêm lịch sử:\n" +
      err.message
    );
  }
}

// =========================
// GET REPAIR HISTORY
// =========================

async function getRepairHistory() {
  if (!checkReady()) return;

  try {
    const productId = document.getElementById("historyProductId").value.trim();
    const index = document.getElementById("historyIndex").value.trim();

    if (!productId || index === "") {
      alert("Nhập mã sản phẩm và index!");
      return;
    }

    const result = await contract.getRepairHistory(
      productId,
      Number(index)
    );

    document.getElementById("historyResult").innerHTML = `
      <div>
        <b>Ngày sửa:</b>
        ${formatDate(result[0])} <br>

        <b>Lỗi:</b>
        ${result[1]} <br>

        <b>Cách xử lý:</b>
        ${result[2]} <br>

        <b>Kỹ thuật viên:</b>
        ${result[3]}
      </div>
    `;

  } catch (err) {
    console.error(err);
    alert("Không lấy được lịch sử sửa chữa!");
  }
}

// =========================
// CHECK WARRANTY
// =========================

async function isWarrantyValid() {
  if (!checkReady()) return;

  try {
    const productId = document.getElementById("validProductId").value.trim();

    if (!productId) {
      alert("Nhập mã sản phẩm!");
      return;
    }

    const valid = await contract.isWarrantyValid(productId);

    document.getElementById("validResult").innerHTML =
      valid
        ? `<span class="success">Sản phẩm còn bảo hành</span>`
        : `<span class="error">Sản phẩm hết bảo hành</span>`;

  } catch (err) {
    console.error(err);
    alert("Không kiểm tra được bảo hành!");
  }
}

// =========================
// QR CODE - BẢN CHẮC CHẮN HIỆN
// =========================

function createQRCode(productId) {
  let qrImage = document.getElementById("qrImage");

  if (!qrImage) {
    const oldCanvas = document.getElementById("qrCanvas");

    if (oldCanvas) {
      qrImage = document.createElement("img");
      qrImage.id = "qrImage";
      oldCanvas.replaceWith(qrImage);
    }
  }

  if (!qrImage) {
    alert("Không tìm thấy khu vực hiển thị QR!");
    return;
  }

  const qrData =
    "WarrantyChain - Ma san pham: " + productId;

  qrImage.src =
    "https://quickchart.io/qr?text=" +
    encodeURIComponent(qrData) +
    "&size=300";

  qrImage.style.display = "block";
  qrImage.style.width = "220px";
  qrImage.style.height = "220px";
  qrImage.style.background = "white";
  qrImage.style.padding = "12px";
  qrImage.style.borderRadius = "20px";
  qrImage.style.objectFit = "contain";

  console.log("QR created:", qrImage.src);
}

// =========================
// TRANSACTION HISTORY
// =========================

function saveTx(type, txHash) {
  const list = JSON.parse(
    localStorage.getItem("txHistory") || "[]"
  );

  list.unshift({
    type,
    txHash,
    time: new Date().toLocaleString("vi-VN")
  });

  localStorage.setItem(
    "txHistory",
    JSON.stringify(list.slice(0, 5))
  );

  renderTxHistory();
}

function renderTxHistory() {
  const list = JSON.parse(
    localStorage.getItem("txHistory") || "[]"
  );

  const box = document.getElementById("txHistory");

  if (!box) return;

  if (list.length === 0) {
    box.innerHTML = "Chưa có giao dịch.";
    return;
  }

  box.innerHTML = list.map(item => `
    <div class="tx-item">
      <b>${item.type}</b><br>
      <small>${item.time}</small><br>
      <a
        href="https://sepolia.etherscan.io/tx/${item.txHash}"
        target="_blank"
      >
        Xem trên Etherscan
      </a>
    </div>
  `).join("");
}

// =========================
// STATS
// =========================

function updateStats(type) {
  if (type === "product") {
    let count = Number(
      localStorage.getItem("totalProducts") || 0
    );

    count++;

    localStorage.setItem("totalProducts", count);
  }

  if (type === "repair") {
    let count = Number(
      localStorage.getItem("totalRepairs") || 0
    );

    count++;

    localStorage.setItem("totalRepairs", count);
  }

  document.getElementById("totalProducts").innerText =
    localStorage.getItem("totalProducts") || 0;

  document.getElementById("totalRepairs").innerText =
    localStorage.getItem("totalRepairs") || 0;
}

// =========================
// LOAD
// =========================

window.addEventListener("load", () => {
  renderTxHistory();
  updateStats();

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("productId");

  if (productId) {
    document.getElementById("searchProductId").value = productId;
  }
});

// =========================
// EXPORT
// =========================

window.connectWallet = connectWallet;
window.addProduct = addProduct;
window.getProduct = getProduct;
window.addRepairHistory = addRepairHistory;
window.getRepairHistory = getRepairHistory;
window.isWarrantyValid = isWarrantyValid;