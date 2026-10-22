import { useState, useEffect } from "react";

const WA = "919366747560";
const GPAY = "919366747560";
const GPAY_ACC = "35068540552";
const GPAY_IFSC = "SBIN0005826";
const GPAY_BANK = "SBI";
const GPAY_BRANCH = "Serchhip";
const ADMIN_PHONE = "9366747560";
const DEFAULT_PASS = "lydia2026";

const CATEGORIES = ["Kawr", "Kekawr", "Toys", "Lukhum", "Pheikhawk", "Others"];
const SIZES = ["S", "M", "L", "XL", "XXL", "Free Size"];
const STATUSES = ["Order Received", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

const DEFAULT_PRODUCTS = [
  { id: "p1", n: "Naupang Kawr Fual Pink", p: 450, i: "https://images.pexels.com/photos/38775757/pexels-photo-38775757.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", desc: "Cute pink dress for baby girls", cat: "Kawr", size: ["S"] },
  { id: "p2", n: "Baby Diaper Pants", p: 599, i: "https://images.pexels.com/photos/30344708/pexels-photo-30344708.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", desc: "Soft comfortable diaper pants", cat: "Kawr", size: ["M"] },
  { id: "p3", n: "Toys Car Set", p: 350, i: "https://images.pexels.com/photos/35912119/pexels-photo-35912119.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", desc: "Colorful mini toy cars for kids", cat: "Toys", size: ["L"] },
  { id: "p4", n: "Wool Lukhum", p: 199, i: "https://images.pexels.com/photos/3889818/pexels-photo-3889818.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", desc: "Warm knitted winter hat for baby", cat: "Lukhum", size: ["S"] },
  { id: "p5", n: "Jean Kekawr", p: 550, i: "https://images.pexels.com/photos/6261888/pexels-photo-6261888.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", desc: "Stylish kids jeans pants", cat: "Kekawr", size: ["L"] },
  { id: "p6", n: "Teddy Toy", p: 399, i: "https://images.pexels.com/photos/20692469/pexels-photo-20692469.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", desc: "Soft plush teddy bear", cat: "Toys", size: ["M"] },
];

function lsRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function lsWrite(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function getAdminPass() {
  const raw = localStorage.getItem("lydia_admin_pass");
  return raw || DEFAULT_PASS;
}

function last10Digits(phone) {
  return (phone || "").replace(/\D/g, "").slice(-10);
}

function getCustomer() {
  const phone = localStorage.getItem("lydia_customer_login");
  if (!phone) return null;
  const name = localStorage.getItem("lydia_customer_" + phone + "_name");
  if (!name) return null;
  return { name, phone };
}

function generateOTP(phone) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem("otp_" + phone, otp);
  sessionStorage.setItem("otp_time_" + phone, String(Date.now()));
  return otp;
}

function verifyOTP(phone, input) {
  const stored = sessionStorage.getItem("otp_" + phone);
  const time = parseInt(sessionStorage.getItem("otp_time_" + phone) || "0", 10);
  if (!stored || !time) return false;
  if (Date.now() - time > 5 * 60 * 1000) return false;
  return stored === input.trim();
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const isAdmin = path === "/admin" || path === "/admin/";
  const isMyOrders = path === "/my-orders" || path === "/my-orders/";

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return isAdmin ? <AdminApp /> : <Shop myOrdersRoute={isMyOrders} />;
}

/* ============ SHOP ============ */

function Shop({ myOrdersRoute }) {
  const [view, setView] = useState(myOrdersRoute ? "my-orders" : "shop");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wish, setWish] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [customer, setCustomer] = useState(() => getCustomer());
  const [showLogin, setShowLogin] = useState(false);

  function customerLogin(name, phone) {
    localStorage.setItem("lydia_customer_login", phone);
    localStorage.setItem("lydia_customer_name", name);
    setCustomer({ name, phone });
    setShowLogin(false);
  }

  function customerLogout() {
    localStorage.removeItem("lydia_customer_login");
    localStorage.removeItem("lydia_customer_name");
    setCustomer(null);
    setView("shop");
  }

  useEffect(() => {
    const stored = lsRead("lydia_products", null);
    if (stored && Array.isArray(stored)) setProducts(stored);
    else { lsWrite("lydia_products", DEFAULT_PRODUCTS); setProducts(DEFAULT_PRODUCTS); }
    setCart(lsRead("lydia_cart", []));
    setWish(lsRead("lydia_wish", []));
  }, [refresh]);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const wishCount = wish.length;

  const filteredProducts = products.filter(p => {
    const matchSearch = searchTerm ? p.n.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchCat = activeCat === "All" || p.cat === activeCat;
    return matchSearch && matchCat;
  });

  function addToCart(id) {
    const c = [...cart];
    const existing = c.find(x => x.id === id);
    if (existing) existing.qty += 1; else c.push({ id, qty: 1 });
    lsWrite("lydia_cart", c); setCart(c);
  }

  function toggleWish(id) {
    const w = [...wish];
    const idx = w.indexOf(id);
    if (idx >= 0) w.splice(idx, 1); else w.push(id);
    lsWrite("lydia_wish", w); setWish(w);
  }

  function orderWhatsApp(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const msg = `Chibai! Shop at Lydia - ${p.n} Rs${p.p} ka duh e. GPay: ${GPAY} Acc: ${GPAY_ACC} IFSC: ${GPAY_IFSC}`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function changeQty(id, qty) {
    if (qty < 1) return;
    const c = cart.map(x => x.id === id ? { ...x, qty } : x);
    lsWrite("lydia_cart", c); setCart(c);
  }

  function removeItem(id) {
    const c = cart.filter(x => x.id !== id);
    lsWrite("lydia_cart", c); setCart(c);
  }

  function placeOrder(cust, payMethod) {
    const items = cart.map(c => {
      const p = products.find(x => x.id === c.id);
      return p ? { n: p.n, p: p.p, qty: c.qty } : null;
    }).filter(Boolean);
    if (items.length === 0) return null;
    const total = items.reduce((s, c) => s + c.p * c.qty, 0);
    const id = "LYD-" + Math.floor(10000 + Math.random() * 90000);
    const order = {
      id, status: "Order Received", date: new Date().toISOString(),
      items, total,
      name: cust.name, phone: cust.phone, address: cust.address, village: cust.village,
      paymentMethod: payMethod,
    };
    const orders = lsRead("lydia_orders", []);
    orders.unshift(order);
    lsWrite("lydia_orders", orders);
    lsWrite("lydia_cart", []); setCart([]);

    let msg = `*Shop at Lydia - New Order*\n\nOrder ID: ${id}\n\n*Products:*\n`;
    items.forEach(c => { msg += `\u2022 ${c.n} x${c.qty} = \u20b9${c.p * c.qty}\n`; });
    msg += `\n*Total: \u20b9${total}*\n\n*Customer Details:*\nName: ${cust.name}\nPhone: ${cust.phone}\nAddress: ${cust.address}\nVillage: ${cust.village}\n\n*Payment: ${payMethod}*\n`;
    if (payMethod === "GPay") msg += `GPay: ${GPAY}\nAcc: ${GPAY_ACC} IFSC: ${GPAY_IFSC}\n`;
    else msg += `Cash on Delivery - Free Delivery in Mizoram\n`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
    return id;
  }

  const sizeLabel = (s) => Array.isArray(s) ? s.join(", ") : s;

  return (
    <>
      {view === "shop" && (
        <ShopHome
          products={filteredProducts} wish={wish} cartCount={cartCount} wishCount={wishCount}
          searchOpen={searchOpen} searchTerm={searchTerm} activeCat={activeCat}
          setSearchOpen={setSearchOpen} setSearchTerm={setSearchTerm} setActiveCat={setActiveCat}
          addToCart={addToCart} toggleWish={toggleWish} orderWhatsApp={orderWhatsApp} setView={setView}
          sizeLabel={sizeLabel} customer={customer} setShowLogin={setShowLogin} customerLogout={customerLogout}
        />
      )}
      {view === "wishlist" && <WishlistPage products={products} wish={wish} toggleWish={toggleWish} addToCart={addToCart} setView={setView} customer={customer} setShowLogin={setShowLogin} customerLogout={customerLogout} />}
      {view === "cart" && <CartPage products={products} cart={cart} changeQty={changeQty} removeItem={removeItem} placeOrder={placeOrder} setView={setView} customer={customer} setShowLogin={setShowLogin} customerLogout={customerLogout} />}
      {view === "my-orders" && <MyOrdersPage setView={setView} customer={customer} setShowLogin={setShowLogin} customerLogout={customerLogout} />}
      {showLogin && <CustomerLoginModal onLogin={customerLogin} onClose={() => setShowLogin(false)} />}
      <a className="float-wa" href={`https://wa.me/${WA}`} target="_blank" rel="noopener" title="Chat on WhatsApp">
        <i className="fa-brands fa-whatsapp"></i>
      </a>
    </>
  );
}

function ShopHome({ products, wish, cartCount, wishCount, searchOpen, searchTerm, activeCat, setSearchOpen, setSearchTerm, setActiveCat, addToCart, toggleWish, orderWhatsApp, setView, sizeLabel, customer, setShowLogin, customerLogout }) {
  return (
    <>
      <header>
        <div className="topbar">Free Delivery Mizoram | COD & GPay Available</div>
        <div className="nav">
          <div className="logo" onClick={() => setView("shop")}><div className="logo-icon"><i className="fa-solid fa-bag-shopping"></i></div>Shop at Lydia</div>
          <div className="nav-icons">
            <span onClick={() => setSearchOpen(!searchOpen)} title="Search"><i className="fa-solid fa-magnifying-glass"></i></span>
            <span onClick={() => setView("wishlist")} title="Wishlist"><i className="fa-regular fa-heart"></i>{wishCount > 0 && <span className="badge">{wishCount}</span>}</span>
            <span onClick={() => setView("cart")} title="Cart"><i className="fa-solid fa-cart-shopping"></i>{cartCount > 0 && <span className="badge">{cartCount}</span>}</span>
            {customer ? (
              <span onClick={() => setView("my-orders")} title="My Orders" style={{ fontSize: 15 }}>
                <i className="fa-solid fa-user"></i>
              </span>
            ) : (
              <span onClick={() => setShowLogin(true)} title="Login"><i className="fa-solid fa-right-to-bracket"></i></span>
            )}
          </div>
        </div>
        <div className={`search-bar ${searchOpen ? "active" : ""}`}>
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus={searchOpen} />
        </div>
        {customer && (
          <div style={{ background: "var(--pink)", color: "white", padding: "6px 15px", fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><i className="fa-solid fa-user"></i> {customer.name}</span>
            <span style={{ display: "flex", gap: 15 }}>
              <a href="/my-orders" onClick={e => { e.preventDefault(); setView("my-orders"); }} style={{ color: "white", textDecoration: "none" }}>My Orders</a>
              <button onClick={customerLogout} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 12 }}>Logout</button>
            </span>
          </div>
        )}
      </header>
      <div className="hero">
        <h1>Veronica Collection</h1>
        <p>Naupang thawmhnaw mawi - Direct WhatsApp Order</p>
        <div className="gp-info">GPay: {GPAY} | Acc: {GPAY_ACC} {GPAY_BANK}</div>
      </div>
      <div className="categories">
        {["All", ...CATEGORIES].map(c => (
          <div key={c} className={`cat ${activeCat === c ? "active" : ""}`} onClick={() => setActiveCat(c)}>{c}</div>
        ))}
      </div>
      <div className="products">
        {products.length > 0 ? products.map(p => (
          <ProductCard key={p.id} p={p} wished={wish.includes(p.id)} addToCart={addToCart} toggleWish={toggleWish} orderWhatsApp={orderWhatsApp} sizeLabel={sizeLabel} />
        )) : (
          <div className="empty-state"><i className="fa-solid fa-magnifying-glass"></i><p>No products found{searchTerm ? ` for "${searchTerm}"` : ""}</p></div>
        )}
      </div>
    </>
  );
}

function ProductCard({ p, wished, addToCart, toggleWish, orderWhatsApp, sizeLabel }) {
  return (
    <div className="product-card">
      <img src={p.i} alt={p.n} loading="lazy" />
      <button className={`wish-btn ${wished ? "active" : ""}`} onClick={() => toggleWish(p.id)} title="Wishlist">
        <i className={`fa-${wished ? "solid" : "regular"} fa-heart`}></i>
      </button>
      <div className="card-body">
        <h3>{p.n}</h3>
        {p.desc && <div className="card-desc">{p.desc}</div>}
        <div className="card-meta">
          {p.cat && <span className="tag">{p.cat}</span>}
          {p.size && <span className="tag">Size: {sizeLabel(p.size)}</span>}
        </div>
        <div className="price">&#8377;{p.p}</div>
        <div className="card-buttons">
          <button className="btn-cart" onClick={() => addToCart(p.id)}>Add</button>
          <button className="btn-buy" onClick={() => orderWhatsApp(p.id)}>WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

function WishlistPage({ products, wish, toggleWish, addToCart, setView, customer, setShowLogin, customerLogout }) {
  const items = products.filter(p => wish.includes(p.id));
  return (
    <div className="page">
      <h2 className="page-title"><button className="back-btn" onClick={() => setView("shop")}><i className="fa-solid fa-arrow-left"></i></button>My Wishlist</h2>
      <CustomerBar customer={customer} setShowLogin={setShowLogin} customerLogout={customerLogout} setView={setView} />
      {items.length > 0 ? items.map(p => (
        <div key={p.id} className="item-row">
          <img src={p.i} alt={p.n} />
          <div className="item-info"><h3>{p.n}</h3><div className="price">&#8377;{p.p}</div></div>
          <button className="btn-cart" onClick={() => { addToCart(p.id); toggleWish(p.id); }}>Add to Cart</button>
          <button className="remove-btn" onClick={() => toggleWish(p.id)}><i className="fa-solid fa-trash"></i></button>
        </div>
      )) : <div className="empty-state"><i className="fa-regular fa-heart"></i><p>Your wishlist is empty</p></div>}
    </div>
  );
}

function CartPage({ products, cart, changeQty, removeItem, placeOrder, setView, customer, setShowLogin, customerLogout }) {
  const [cust, setCust] = useState(() => ({
    name: customer?.name || "",
    phone: customer?.phone || "",
    address: "",
    village: "",
  }));
  const [payMethod, setPayMethod] = useState("GPay");
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  const cartItems = cart.map(c => { const p = products.find(x => x.id === c.id); return p ? { ...p, qty: c.qty } : null; }).filter(Boolean);
  const total = cartItems.reduce((s, c) => s + c.p * c.qty, 0);

  function handlePlaceOrder() {
    if (!cust.name || !cust.phone || !cust.address || !cust.village) { alert("Please fill all customer details"); return; }
    const id = placeOrder(cust, payMethod);
    if (id) { setOrderConfirmed(id); setCust({ name: customer?.name || "", phone: customer?.phone || "", address: "", village: "" }); }
  }

  if (orderConfirmed) {
    return (
      <div className="page">
        <h2 className="page-title"><button className="back-btn" onClick={() => setView("shop")}><i className="fa-solid fa-arrow-left"></i></button>Order Confirmed</h2>
        <div className="empty-state">
          <i className="fa-solid fa-circle-check" style={{ color: "var(--success)" }}></i>
          <p>Order placed successfully!</p>
          <p style={{ marginTop: 8, fontWeight: 700, color: "var(--pink)" }}>Order ID: {orderConfirmed}</p>
          <p style={{ marginTop: 4, fontSize: 13 }}>WhatsApp has opened with your order details.</p>
          <button className="btn-place-order" style={{ marginTop: 15, maxWidth: 200 }} onClick={() => setView("shop")}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <h2 className="page-title"><button className="back-btn" onClick={() => setView("shop")}><i className="fa-solid fa-arrow-left"></i></button>Cart</h2>
      <CustomerBar customer={customer} setShowLogin={setShowLogin} customerLogout={customerLogout} setView={setView} />
        <div className="empty-state"><i className="fa-solid fa-cart-shopping"></i><p>Your cart is empty</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2 className="page-title"><button className="back-btn" onClick={() => setView("shop")}><i className="fa-solid fa-arrow-left"></i></button>Checkout</h2>
      <CustomerBar customer={customer} setShowLogin={setShowLogin} customerLogout={customerLogout} setView={setView} />
      {cartItems.map(c => (
        <div key={c.id} className="item-row">
          <img src={c.i} alt={c.n} />
          <div className="item-info"><h3>{c.n}</h3><div className="price">&#8377;{c.p}</div></div>
          <div className="qty-controls">
            <button className="qty-btn" onClick={() => changeQty(c.id, c.qty - 1)}>-</button>
            <span className="qty-val">{c.qty}</span>
            <button className="qty-btn" onClick={() => changeQty(c.id, c.qty + 1)}>+</button>
          </div>
          <button className="remove-btn" onClick={() => removeItem(c.id)}><i className="fa-solid fa-trash"></i></button>
        </div>
      ))}
      <div className="cart-total"><div className="label">Total Amount</div><div className="amount">&#8377;{total}</div></div>
      <div className="checkout-form">
        <h3>Customer Details</h3>
        <div className="form-group"><label>Name *</label><input type="text" value={cust.name} onChange={e => setCust({ ...cust, name: e.target.value })} placeholder="Your name" /></div>
        <div className="form-group"><label>Phone *</label><input type="tel" value={cust.phone} onChange={e => setCust({ ...cust, phone: e.target.value })} placeholder="Phone number" /></div>
        <div className="form-group"><label>Address *</label><textarea rows="2" value={cust.address} onChange={e => setCust({ ...cust, address: e.target.value })} placeholder="House no, street" /></div>
        <div className="form-group"><label>Village / Town *</label><input type="text" value={cust.village} onChange={e => setCust({ ...cust, village: e.target.value })} placeholder="Village" /></div>
      </div>
      <div className="checkout-form">
        <h3>Payment Method</h3>
        <div className="payment-options">
          <label className={`payment-radio ${payMethod === "GPay" ? "selected" : ""}`} onClick={() => setPayMethod("GPay")}>
            <input type="radio" name="pay" value="GPay" checked={payMethod === "GPay"} onChange={() => setPayMethod("GPay")} />
            <div className="pay-content"><div className="pay-title">GPay</div><div className="pay-detail">Pay to {GPAY}</div></div>
          </label>
          <label className={`payment-radio ${payMethod === "COD" ? "selected" : ""}`} onClick={() => setPayMethod("COD")}>
            <input type="radio" name="pay" value="COD" checked={payMethod === "COD"} onChange={() => setPayMethod("COD")} />
            <div className="pay-content"><div className="pay-title">Cash on Delivery</div><div className="pay-detail">Free Delivery in Mizoram</div></div>
          </label>
        </div>
        {payMethod === "GPay" && (
          <div className="gpay-box">
            <div className="qr-code-wrap">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${GPAY}@ok&pn=Shop%20at%20Lydia&am=&cu=INR`} alt="GPay QR Code" />
            </div>
            <div className="qr-label">Scan to pay via GPay / UPI</div>
            <div className="gp-detail">
              GPay / UPI: <strong>{GPAY}</strong><br />
              Account: <strong>{GPAY_ACC}</strong><br />
              IFSC: <strong>{GPAY_IFSC}</strong><br />
              Bank: <strong>{GPAY_BANK}</strong>
            </div>
          </div>
        )}
      </div>
      <button className="btn-place-order" onClick={handlePlaceOrder}>Place Order</button>
    </div>
  );
}

/* ============ CUSTOMER COMPONENTS ============ */

function CustomerBar({ customer, setShowLogin, customerLogout, setView }) {
  if (!customer) {
    return (
      <div style={{ background: "var(--light)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--text-light)" }}>Guest checkout - Login to track orders</span>
        <button onClick={() => setShowLogin(true)} style={{ background: "var(--pink)", color: "white", border: "none", padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Login</button>
      </div>
    );
  }
  return (
    <div style={{ background: "var(--light)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--pink)", fontWeight: 600 }}><i className="fa-solid fa-user"></i> {customer.name}</span>
      <span style={{ display: "flex", gap: 12 }}>
        <a href="/my-orders" onClick={e => { e.preventDefault(); setView("my-orders"); }} style={{ color: "var(--pink)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>My Orders</a>
        <button onClick={customerLogout} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 12 }}>Logout</button>
      </span>
    </div>
  );
}

function CustomerLoginModal({ onLogin, onClose }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [err, setErr] = useState("");

  const p10 = last10Digits(phone);
  const passKey = "lydia_customer_" + p10 + "_pass";
  const nameKey = "lydia_customer_" + p10 + "_name";
  const existingPass = localStorage.getItem(passKey);
  const existingName = localStorage.getItem(nameKey);

  function checkPhone() {
    if (p10.length !== 10) { setErr("Enter 10 digit phone number"); return; }
    setErr("");
    if (existingPass) setStep("login");
    else setStep("register");
  }

  function doLogin() {
    if (pass !== existingPass) { setErr("Wrong password!"); return; }
    setErr("");
    onLogin(existingName || name, p10);
  }

  function doRegister() {
    if (!name.trim()) { setErr("Enter your name"); return; }
    if (pass.length < 6) { setErr("Password min 6 characters"); return; }
    if (pass !== confirmPass) { setErr("Passwords do not match"); return; }
    setErr("");
    localStorage.setItem(passKey, pass);
    localStorage.setItem(nameKey, name.trim());
    onLogin(name.trim(), p10);
  }

  function sendOTP() {
    if (p10.length !== 10) { setErr("Enter 10 digit phone number"); return; }
    setErr("");
    const code = generateOTP(p10);
    alert("OTP: " + code + " (Demo - SMS awm loh vangin heta en tur)");
    setOtpHint("Demo OTP: " + code);
    setStep("otp");
  }

  function verifyOtp() {
    if (!verifyOTP(p10, otp)) { setErr("Wrong or expired OTP"); return; }
    setErr("");
    setStep("reset");
  }

  function doReset() {
    if (newPass.length < 6) { setErr("Password min 6 characters"); return; }
    if (newPass !== confirmNewPass) { setErr("Passwords do not match"); return; }
    setErr("");
    localStorage.setItem(passKey, newPass);
    const savedName = localStorage.getItem(nameKey) || name;
    onLogin(savedName, p10);
  }

  const inp = (val, set, ph, type) => (
    <input type={type || "text"} value={val} onChange={e => set(e.target.value)} placeholder={ph}
      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, outline: "none" }} />
  );
  const btn = (label, onClick) => (
    <button onClick={onClick} style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>Login</button>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 18, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,.2)" }}>
        <div style={{ width: 50, height: 50, background: "var(--pink)", color: "white", borderRadius: 14, display: "grid", placeItems: "center", fontSize: 22, margin: "0 auto 14px" }}><i className="fa-solid fa-user"></i></div>
        <h2 style={{ color: "var(--pink)", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Customer Login</h2>
        <p style={{ fontSize: 12, color: "#999", marginBottom: 18 }}>
          {step === "phone" && "Enter your WhatsApp number"}
          {step === "register" && "New account - Create password"}
          {step === "login" && "Welcome back " + (existingName || "")}
          {step === "forgot-phone" && "Forgot Password - Enter phone"}
          {step === "otp" && "Enter the OTP sent to your phone"}
          {step === "reset" && "Set your new password"}
        </p>
        {err && <div style={{ color: "var(--error)", fontSize: 13, marginBottom: 10 }}>{err}</div>}

        {step === "phone" && (
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>Phone (10 digit)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9366747560" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, outline: "none" }} autoFocus onKeyDown={e => e.key === "Enter" && checkPhone()} />
            <button onClick={checkPhone} style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>Continue</button>
            <button onClick={() => { setErr(""); setStep("forgot-phone"); }} style={{ marginTop: 10, background: "none", border: "none", color: "var(--pink)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Forgot Password?</button>
          </div>
        )}

        {step === "register" && (
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>Name</label>{inp(name, setName, "Your name")}</div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>Password (min 6 chars)</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Create password" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, outline: "none", paddingRight: 36 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#999", cursor: "pointer" }}><i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i></button>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>Confirm Password</label>{inp(confirmPass, setConfirmPass, "Confirm password", showPass ? "text" : "password")}</div>
            <button onClick={doRegister} style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Create Account & Login</button>
            <button onClick={() => { setErr(""); setStep("phone"); setPass(""); setConfirmPass(""); }} style={{ marginTop: 8, background: "none", border: "none", color: "#999", fontSize: 12, cursor: "pointer" }}>Back</button>
          </div>
        )}

        {step === "login" && (
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, outline: "none", paddingRight: 36 }} autoFocus onKeyDown={e => e.key === "Enter" && doLogin()} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#999", cursor: "pointer" }}><i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i></button>
              </div>
            </div>
            <button onClick={doLogin} style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Login</button>
            <button onClick={() => { setErr(""); setPass(""); setStep("forgot-phone"); }} style={{ marginTop: 8, background: "none", border: "none", color: "var(--pink)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Forgot Password?</button>
          </div>
        )}

        {step === "forgot-phone" && (
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>Phone (10 digit)</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your registered phone" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, outline: "none" }} autoFocus onKeyDown={e => e.key === "Enter" && sendOTP()} />
            </div>
            <button onClick={sendOTP} style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Send OTP</button>
            <button onClick={() => { setErr(""); setStep("phone"); }} style={{ marginTop: 8, background: "none", border: "none", color: "#999", fontSize: 12, cursor: "pointer" }}>Back to Login</button>
          </div>
        )}

        {step === "otp" && (
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>Enter OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6 digit OTP" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, outline: "none", textAlign: "center", letterSpacing: 3 }} autoFocus onKeyDown={e => e.key === "Enter" && verifyOtp()} />
            </div>
            {otpHint && <p style={{ fontSize: 11, color: "var(--pink)", marginBottom: 8 }}>{otpHint}</p>}
            <button onClick={verifyOtp} style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Verify OTP</button>
            <button onClick={sendOTP} style={{ marginTop: 8, background: "none", border: "none", color: "var(--pink)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Resend OTP</button>
          </div>
        )}

        {step === "reset" && (
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>New Password (min 6)</label>{inp(newPass, setNewPass, "New password", showPass ? "text" : "password")}</div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>Confirm Password</label>{inp(confirmNewPass, setConfirmNewPass, "Confirm password", showPass ? "text" : "password")}</div>
            <button onClick={doReset} style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Reset & Login</button>
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 6, background: "none", border: "none", color: "#999", fontSize: 13, cursor: "pointer" }}>Cancel</button>
        <p style={{ marginTop: 8, fontSize: 11, color: "#bbb" }}>Guest checkout still available without login</p>
      </div>
    </div>
  );
}

function MyOrdersPage({ setView, customer, setShowLogin, customerLogout }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const all = lsRead("lydia_orders", []);
    if (customer) {
      const myPhone = last10Digits(customer.phone);
      setOrders(all.filter(o => last10Digits(o.phone) === myPhone));
    } else {
      setOrders([]);
    }
  }, [customer]);

  const statusColor = (s) => {
    const k = s.split(" ")[0];
    const map = { Order: "#1565c0", Received: "#1565c0", Packed: "#e65100", Shipped: "#7b1fa2", Out: "#2e7d32", Delivered: "#1b5e20", Cancelled: "#c62828" };
    return map[k] || "#666";
  };

  return (
    <div className="page">
      <h2 className="page-title"><button className="back-btn" onClick={() => setView("shop")}><i className="fa-solid fa-arrow-left"></i></button>My Orders</h2>
      <CustomerBar customer={customer} setShowLogin={setShowLogin} customerLogout={customerLogout} setView={setView} />
      {!customer ? (
        <div className="empty-state">
          <i className="fa-solid fa-right-to-bracket"></i>
          <p>Please login to see your orders</p>
          <button className="btn-place-order" style={{ marginTop: 15, maxWidth: 180 }} onClick={() => setShowLogin(true)}>Login Now</button>
        </div>
      ) : orders.length > 0 ? orders.map(o => {
        const dateStr = new Date(o.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        return (
          <div key={o.id} className="admin-order-card">
            <div className="order-header">
              <span className="order-id">{o.id}</span>
              <span className="order-date">{dateStr}</span>
            </div>
            <div className="order-items">
              {o.items.map((i, idx) => <div key={idx}>&bull; {i.n} x{i.qty} = &#8377;{i.p * i.qty}</div>)}
            </div>
            <div style={{ fontWeight: 800, color: "var(--pink)", fontSize: 16, margin: "4px 0" }}>Total: &#8377;{o.total}</div>
            <div className="order-customer">
              {o.address} {o.village}<br />
              Payment: {o.paymentMethod}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className="status-badge" style={{ background: statusColor(o.status) + "22", color: statusColor(o.status), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{o.status}</span>
            </div>
          </div>
        );
      }) : (
        <div className="empty-state"><i className="fa-solid fa-receipt"></i><p>No orders yet. Start shopping!</p></div>
      )}
    </div>
  );
}

/* ============ ADMIN ============ */

function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem("lydia_admin_login") === "1");
  const [tab, setTab] = useState("dashboard");

  function logout() {
    localStorage.removeItem("lydia_admin_login");
    setLoggedIn(false);
  }

  function doLogin() {
    localStorage.setItem("lydia_admin_login", "1");
    setLoggedIn(true);
  }

  if (!loggedIn) return <AdminLogin onLogin={doLogin} />;

  const tabBtn = (id, icon, label) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`flex-1 py-2.5 text-center text-xs sm:text-sm font-semibold border-b-[3px] transition-all ${
        tab === id
          ? "text-pink-600 border-pink-500 bg-pink-50"
          : "text-gray-400 border-transparent hover:text-pink-400"
      }`}
    >
      <i className={`fa-solid ${icon} sm:mr-1`}></i><span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-pink-500 text-white rounded-xl grid place-items-center text-sm"><i className="fa-solid fa-bag-shopping"></i></div>
            <span className="font-bold text-pink-600 text-sm sm:text-lg">Shop at Lydia <span className="text-gray-400 font-normal text-xs sm:text-sm">- Admin</span></span>
          </div>
          <button onClick={logout} className="text-pink-500 text-sm font-semibold hover:text-pink-700 flex items-center gap-1">
            <i className="fa-solid fa-right-from-bracket"></i><span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 pt-3">
        <div className="flex bg-white rounded-xl shadow-sm overflow-hidden">
          {tabBtn("dashboard", "fa-gauge-high", "Dashboard")}
          {tabBtn("products", "fa-box", "Products")}
          {tabBtn("orders", "fa-receipt", "Orders")}
          {tabBtn("customers", "fa-users", "Customers")}
          {tabBtn("settings", "fa-gear", "Settings")}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-4">
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "products" && <AdminProducts />}
        {tab === "orders" && <AdminOrders />}
        {tab === "customers" && <AdminCustomers />}
        {tab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [phone, setPhone] = useState(ADMIN_PHONE);
  const [password, setPassword] = useState(DEFAULT_PASS);
  const [showPass, setShowPass] = useState(false);
  const [showErr, setShowErr] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState("phone");
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetReady, setResetReady] = useState(false);
  const [err, setErr] = useState("");

  function login() {
    const correctPass = getAdminPass();
    if (last10Digits(phone) === ADMIN_PHONE && password === correctPass) {
      localStorage.setItem("lydia_admin_login", "1");
      onLogin();
    } else {
      setShowErr(true);
    }
  }

  function sendAdminOTP() {
    if (last10Digits(phone) !== ADMIN_PHONE) { setErr("Wrong admin phone!"); return; }
    setErr("");
    const code = generateOTP(ADMIN_PHONE);
    alert("Admin OTP: " + code);
    setOtpHint("Demo OTP: " + code);
    setForgotStep("verify");
  }

  function verifyAdminOTP() {
    if (verifyOTP(ADMIN_PHONE, otp)) {
      setErr("");
      setResetReady(true);
      setForgotStep("reset");
    } else if (securityAnswer.trim().toLowerCase().includes("lydia")) {
      setErr("");
      setResetReady(true);
      setForgotStep("reset");
    } else {
      setErr("Wrong OTP or answer!");
    }
  }

  function resetAdminPass() {
    if (newPass.length < 4) { setErr("Password too short!"); return; }
    if (newPass !== confirmPass) { setErr("Passwords do not match!"); return; }
    setErr("");
    localStorage.setItem("lydia_admin_pass", newPass);
    alert("Password thar: " + newPass + " - hriat reng tur");
    localStorage.setItem("lydia_admin_login", "1");
    onLogin();
  }

  if (forgotMode) {
    return (
      <div className="min-h-screen bg-pink-50 grid place-items-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-pink-500 text-white rounded-2xl grid place-items-center text-2xl mx-auto mb-4"><i className="fa-solid fa-shield-halved"></i></div>
          <h2 className="text-pink-600 font-bold text-xl mb-2">Forgot Password</h2>
          <p className="text-xs text-gray-400 mb-4">
            {forgotStep === "phone" && "Enter admin phone to get OTP"}
            {forgotStep === "verify" && "Enter OTP or answer security question"}
            {forgotStep === "reset" && "Set your new password"}
          </p>
          {err && <div className="text-red-500 text-sm mb-3">{err}</div>}

          {forgotStep === "phone" && (
            <div className="text-left mb-4">
              <label className="text-xs font-semibold text-gray-400 block mb-1">Admin Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9366747560" className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500 mb-3" autoFocus onKeyDown={e => e.key === "Enter" && sendAdminOTP()} />
              <button onClick={sendAdminOTP} className="w-full bg-pink-500 text-white py-2.5 rounded-xl font-semibold hover:bg-pink-600">Send OTP</button>
            </div>
          )}

          {forgotStep === "verify" && (
            <div className="text-left mb-4">
              <label className="text-xs font-semibold text-gray-400 block mb-1">OTP (6 digit)</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500 mb-2 text-center tracking-widest" />
              {otpHint && <p className="text-xs text-pink-500 mb-3">{otpHint}</p>}
              <div className="text-center text-xs text-gray-400 my-3">OR - Answer security question</div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Shop hming eng nge?</label>
              <input type="text" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} placeholder="Answer" className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500 mb-3" onKeyDown={e => e.key === "Enter" && verifyAdminOTP()} />
              <button onClick={verifyAdminOTP} className="w-full bg-pink-500 text-white py-2.5 rounded-xl font-semibold hover:bg-pink-600">Verify</button>
              <button onClick={sendAdminOTP} className="mt-2 text-pink-400 text-xs font-medium hover:text-pink-600">Resend OTP</button>
            </div>
          )}

          {forgotStep === "reset" && (
            <div className="text-left mb-4">
              <label className="text-xs font-semibold text-gray-400 block mb-1">New Password</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500 mb-3" autoFocus />
              <label className="text-xs font-semibold text-gray-400 block mb-1">Confirm Password</label>
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm password" className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500 mb-3" onKeyDown={e => e.key === "Enter" && resetAdminPass()} />
              <button onClick={resetAdminPass} className="w-full bg-pink-500 text-white py-2.5 rounded-xl font-semibold hover:bg-pink-600">Reset Password & Login</button>
            </div>
          )}

          <button onClick={() => { setForgotMode(false); setForgotStep("phone"); setErr(""); setOtp(""); setSecurityAnswer(""); setNewPass(""); setConfirmPass(""); }} className="mt-3 text-pink-500 text-sm font-medium">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 grid place-items-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-pink-500 text-white rounded-2xl grid place-items-center text-2xl mx-auto mb-4"><i className="fa-solid fa-lock"></i></div>
        <h2 className="text-pink-600 font-bold text-xl mb-1">Shop at Lydia <span className="text-gray-400 font-normal text-sm">- Admin</span></h2>
        <div className={`text-red-500 text-sm mb-2 ${showErr ? "block" : "hidden"}`}>Wrong phone or password!</div>
        <div className="text-left mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Phone</label>
          <input id="adminPhone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500" placeholder="9366747560" />
        </div>
        <div className="text-left mb-4">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Password</label>
          <div className="relative">
            <input id="adminPass" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} className="w-full px-4 py-2.5 pr-10 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500" placeholder="password" />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500">
              <i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>
        </div>
        <button onClick={login} className="w-full bg-pink-500 text-white py-2.5 rounded-xl font-semibold hover:bg-pink-600 transition-colors">Login</button>
        <button onClick={() => setForgotMode(true)} className="mt-3 text-pink-400 text-xs font-medium hover:text-pink-600">Forgot Password?</button>
        <a href="/" className="block mt-3 text-pink-500 text-sm font-medium hover:underline">&larr; Back to Shop</a>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishCount, setWishCount] = useState(0);

  useEffect(() => {
    const stored = lsRead("lydia_products", null);
    if (stored && Array.isArray(stored)) setProducts(stored);
    else { lsWrite("lydia_products", DEFAULT_PRODUCTS); setProducts(DEFAULT_PRODUCTS); }
    setOrders(lsRead("lydia_orders", []));
    setWishCount(lsRead("lydia_wish", []).length);
  }, []);

  const totalSales = orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;
  const gpayTotal = orders.filter(o => o.paymentMethod === "GPay" && o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const codTotal = orders.filter(o => o.paymentMethod === "COD" && o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today);

  const card = (val, label, icon, color) => (
    <div className="flex-1 bg-white rounded-xl shadow-sm p-4 text-center min-w-[140px]">
      <div className={`w-10 h-10 ${color} text-white rounded-xl grid place-items-center mx-auto mb-2 text-sm`}><i className={`fa-solid ${icon}`}></i></div>
      <div className="text-xl font-bold text-pink-600">{val}</div>
      <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
    </div>
  );

  return (
    <div>
      <div className="flex gap-3 flex-wrap mb-4">
        {card(products.length, "Total Products", "fa-box", "bg-pink-500")}
        {card(orders.length, "Total Orders", "fa-receipt", "bg-purple-500")}
        {card(`₹${totalSales}`, "Total Sales", "fa-indian-rupee-sign", "bg-green-500")}
        {card(pendingOrders, "Pending Orders", "fa-clock", "bg-orange-500")}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm"><i className="fa-solid fa-chart-pie text-pink-500 mr-1"></i> Sales Breakdown</h3>
        <div className="flex justify-between py-2 border-b border-pink-50 text-sm">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-green-400 rounded-full"></span>GPay Sales</span>
          <span className="font-bold text-pink-600">₹{gpayTotal}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-pink-50 text-sm">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-400 rounded-full"></span>COD Sales</span>
          <span className="font-bold text-pink-600">₹{codTotal}</span>
        </div>
        <div className="flex justify-between py-2 text-sm font-bold">
          <span>Grand Total</span>
          <span className="text-pink-600">₹{totalSales}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm"><i className="fa-solid fa-calendar-day text-pink-500 mr-1"></i> Today's Orders ({todayOrders.length})</h3>
        {todayOrders.length > 0 ? todayOrders.map(o => (
          <div key={o.id} className="flex justify-between items-center py-2 border-b border-pink-50 last:border-0">
            <div>
              <span className="font-bold text-pink-600 text-sm">{o.id}</span>
              <span className="text-xs text-gray-400 ml-2">{o.name}</span>
            </div>
            <span className="font-bold text-sm">₹{o.total}</span>
          </div>
        )) : <p className="text-sm text-gray-300 text-center py-2">No orders today</p>}
      </div>

      <div className="bg-pink-100 rounded-xl p-4 text-center">
        <p className="text-sm text-pink-600 font-semibold"><i className="fa-solid fa-heart"></i> {wishCount} items in customer wishlists</p>
      </div>
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ n: "", p: "", i: "", desc: "", cat: CATEGORIES[0], size: [] });

  useEffect(() => {
    const stored = lsRead("lydia_products", null);
    if (stored && Array.isArray(stored)) setProducts(stored);
    else { lsWrite("lydia_products", DEFAULT_PRODUCTS); setProducts(DEFAULT_PRODUCTS); }
  }, []);

  function toggleSize(s) {
    setForm(f => {
      const sizes = f.size.includes(s) ? f.size.filter(x => x !== s) : [...f.size, s];
      return { ...f, size: sizes };
    });
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("5MB ai tlem thlang rawh"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setForm(f => ({ ...f, i: dataUrl }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function triggerGallery() {
    const fi = document.getElementById("productImageFile");
    if (fi) { fi.removeAttribute("capture"); fi.click(); }
  }

  function triggerCamera() {
    const fi = document.getElementById("productImageFile");
    if (fi) { fi.setAttribute("capture", "environment"); fi.click(); }
  }

  function saveProduct() {
    if (!form.n || !form.p || !form.i) { alert("Please fill name, price, and upload an image"); return; }
    if (editingId) {
      const updated = products.map(p => p.id === editingId ? { ...p, n: form.n, p: parseInt(form.p, 10), i: form.i, desc: form.desc, cat: form.cat, size: form.size } : p);
      lsWrite("lydia_products", updated); setProducts(updated);
      setEditingId(null);
    } else {
      const newProduct = { id: "p" + Date.now(), n: form.n, p: parseInt(form.p, 10), i: form.i, desc: form.desc, cat: form.cat, size: form.size };
      const updated = [...products, newProduct];
      lsWrite("lydia_products", updated); setProducts(updated);
    }
    setForm({ n: "", p: "", i: "", desc: "", cat: CATEGORIES[0], size: [] });
  }

  function editProduct(p) {
    setEditingId(p.id);
    setForm({ n: p.n, p: String(p.p), i: p.i, desc: p.desc || "", cat: p.cat || CATEGORIES[0], size: Array.isArray(p.size) ? p.size : [p.size].filter(Boolean) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    const updated = products.filter(p => p.id !== id);
    lsWrite("lydia_products", updated); setProducts(updated);
  }

  const filtered = search ? products.filter(p => p.n.toLowerCase().includes(search.toLowerCase())) : products;
  const sizeLabel = (s) => Array.isArray(s) ? s.join(", ") : (s || "");

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm"><i className={`fa-solid ${editingId ? "fa-pen" : "fa-plus"} text-pink-500 mr-1`}></i> {editingId ? "Edit Product" : "Add Product"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Hming (Name) *</label>
            <input type="text" value={form.n} onChange={e => setForm({ ...form, n: e.target.value })} placeholder="Product name" className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg text-sm outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Man (Price ₹) *</label>
            <input type="number" value={form.p} onChange={e => setForm({ ...form, p: e.target.value })} placeholder="Price" className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg text-sm outline-none focus:border-pink-500" />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Thlalak (Image) *</label>
          <input type="file" id="productImageFile" accept="image/*" hidden onChange={handleImageUpload} />
          <div className="border-2 border-dashed border-pink-500 rounded-xl p-5 text-center">
            {form.i ? (
              <div className="relative inline-block">
                <img src={form.i} alt="Preview" className="w-32 h-32 rounded-lg object-cover border-2 border-pink-300 mx-auto" />
                <button onClick={() => setForm(f => ({ ...f, i: "" }))} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs grid place-items-center hover:bg-red-600"><i className="fa-solid fa-xmark"></i></button>
                <p className="text-xs text-gray-400 mt-2">Click image to change</p>
              </div>
            ) : (
              <>
                <div className="text-4xl text-pink-400 mb-2"><i className="fa-solid fa-camera"></i></div>
                <p className="text-sm text-gray-400 mb-3">Thlalak thlang rawh - Gallery atang</p>
              </>
            )}
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={triggerGallery} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-pink-600"><i className="fa-solid fa-images mr-1"></i>Gallery atang thlang</button>
              <button type="button" onClick={triggerCamera} className="bg-pink-100 text-pink-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-pink-200"><i className="fa-solid fa-camera mr-1"></i>Camera hmang</button>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Description</label>
          <textarea rows="2" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Short description" className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg text-sm outline-none focus:border-pink-500 resize-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Category</label>
            <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg text-sm outline-none focus:border-pink-500 bg-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Size (check all)</label>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map(s => (
                <button key={s} onClick={() => toggleSize(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                  form.size.includes(s) ? "bg-pink-500 text-white border-pink-500" : "bg-white text-gray-400 border-pink-200 hover:border-pink-400"
                }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={saveProduct} className="flex-1 bg-pink-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-pink-600">{editingId ? "Update Product" : "Add Product"}</button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm({ n: "", p: "", i: "", desc: "", cat: CATEGORIES[0], size: [] }); }} className="px-4 bg-gray-100 text-gray-500 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200">Cancel</button>
          )}
        </div>
      </div>

      <input type="text" placeholder="Search products by name..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500 mb-3 bg-white" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-3 flex gap-3">
            <img src={p.i} alt={p.n} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-700 truncate">{p.n}</h3>
              <div className="text-pink-600 font-bold text-sm">₹{p.p}</div>
              <div className="flex gap-1 flex-wrap mt-1">
                {p.cat && <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-semibold">{p.cat}</span>}
                {p.size && sizeLabel(p.size) && <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-semibold">{sizeLabel(p.size)}</span>}
              </div>
              {p.desc && <p className="text-xs text-gray-400 mt-1 truncate">{p.desc}</p>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => editProduct(p)} className="text-pink-500 text-xs font-semibold hover:text-pink-700"><i className="fa-solid fa-pen"></i> Edit</button>
                <button onClick={() => deleteProduct(p.id)} className="text-red-400 text-xs font-semibold hover:text-red-600"><i className="fa-solid fa-trash"></i> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setOrders(lsRead("lydia_orders", []));
  }, [refresh]);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || (o.name || "").toLowerCase().includes(search.toLowerCase()) || (o.phone || "").includes(search);
    const matchFilter = filter === "All" || o.paymentMethod === filter || o.status === filter;
    return matchSearch && matchFilter;
  });

  const gpayTotal = orders.filter(o => o.paymentMethod === "GPay" && o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const codTotal = orders.filter(o => o.paymentMethod === "COD" && o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const grandTotal = gpayTotal + codTotal;

  function changeStatus(orderId, status) {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    lsWrite("lydia_orders", updated); setOrders(updated);
  }

  function deleteOrder(orderId) {
    if (!confirm("Delete this order?")) return;
    const updated = orders.filter(o => o.id !== orderId);
    lsWrite("lydia_orders", updated); setOrders(updated);
  }

  function whatsappOrder(o) {
    let msg = `Order ${o.id}\n\n`;
    msg += `Customer: ${o.name}\nPhone: ${o.phone}\n`;
    o.items.forEach(i => { msg += `\u2022 ${i.n} x${i.qty} = ₹${i.p * i.qty}\n`; });
    msg += `\nTotal: ₹${o.total}\nPayment: ${o.paymentMethod}`;
    window.open(`https://wa.me/91${(o.phone || "").replace(/^91/, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const statusColor = (s) => {
    const k = s.split(" ")[0];
    const map = { Order: "bg-blue-100 text-blue-700", Received: "bg-blue-100 text-blue-700", Packed: "bg-orange-100 text-orange-700", Shipped: "bg-purple-100 text-purple-700", Out: "bg-green-100 text-green-700", Delivered: "bg-green-200 text-green-800", Cancelled: "bg-red-100 text-red-700" };
    return map[k] || "bg-gray-100 text-gray-600";
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="flex-1 bg-white rounded-xl shadow-sm p-3 text-center min-w-[100px]">
          <div className="text-lg font-bold text-green-600">₹{gpayTotal}</div>
          <div className="text-[11px] text-gray-400">GPay Total</div>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm p-3 text-center min-w-[100px]">
          <div className="text-lg font-bold text-yellow-600">₹{codTotal}</div>
          <div className="text-[11px] text-gray-400">COD Total</div>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm p-3 text-center min-w-[100px]">
          <div className="text-lg font-bold text-pink-600">₹{grandTotal}</div>
          <div className="text-[11px] text-gray-400">Grand Total</div>
        </div>
      </div>

      <input type="text" placeholder="Search by ID, name, phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500 mb-2 bg-white" />
      <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl text-sm outline-none focus:border-pink-500 mb-3 bg-white">
        <option value="All">All Orders</option>
        <option value="GPay">GPay Only</option>
        <option value="COD">COD Only</option>
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {filtered.length > 0 ? filtered.map(o => {
        const dateStr = new Date(o.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        const custPhone = (o.phone || "").replace(/^91/, "");
        return (
          <div key={o.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-pink-600">{o.id}</span>
              <span className="text-[11px] text-gray-400">{dateStr}</span>
            </div>
            <div className="text-sm text-gray-600 mb-1"><i className="fa-solid fa-user text-pink-400 mr-1"></i>{o.name}</div>
            <a href={`https://wa.me/91${custPhone}`} target="_blank" className="text-sm text-green-600 block mb-1 hover:underline"><i className="fa-brands fa-whatsapp mr-1"></i>{o.phone}</a>
            <div className="text-xs text-gray-400 mb-2"><i className="fa-solid fa-location-dot text-pink-400 mr-1"></i>{o.address}, {o.village}</div>
            <div className="bg-pink-50 rounded-lg p-2 mb-2">
              {o.items.map((i, idx) => <div key={idx} className="text-xs text-gray-600 py-0.5">&bull; {i.n} x{i.qty} = ₹{i.p * i.qty}</div>)}
            </div>
            <div className="font-bold text-pink-600 mb-2">Total: ₹{o.total}</div>
            <div className="flex gap-2 items-center flex-wrap mb-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${o.paymentMethod === "GPay" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {o.paymentMethod === "GPay" ? `GPay ${GPAY}` : "COD"}
              </span>
              {o.paymentMethod === "GPay" && <span className="text-[10px] text-gray-400">Acc: {GPAY_ACC} IFSC: {GPAY_IFSC}</span>}
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusColor(o.status)}`}>{o.status}</span>
            </div>
            <div className="flex gap-2 items-center">
              <select value={o.status} onChange={e => changeStatus(o.id, e.target.value)} className="flex-1 px-2 py-1.5 border-2 border-pink-200 rounded-lg text-xs outline-none focus:border-pink-500 bg-white">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => whatsappOrder(o)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600"><i className="fa-brands fa-whatsapp mr-1"></i>WA</button>
              <button onClick={() => deleteOrder(o.id)} className="text-red-400 px-2 py-1.5 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
            </div>
          </div>
        );
      }) : <div className="text-center py-16 text-gray-300"><i className="fa-solid fa-receipt text-5xl mb-2"></i><p className="text-sm">No orders found</p></div>}
    </div>
  );
}

function AdminCustomers() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders(lsRead("lydia_orders", []));
  }, []);

  const customers = {};
  orders.forEach(o => {
    const key = o.phone || "unknown";
    if (!customers[key]) {
      customers[key] = { phone: o.phone || "-", name: o.name || "-", orders: 0, spent: 0, lastDate: o.date };
    }
    customers[key].orders += 1;
    if (o.status !== "Cancelled") customers[key].spent += o.total;
    if (new Date(o.date) > new Date(customers[key].lastDate)) customers[key].lastDate = o.date;
  });

  const list = Object.values(customers).sort((a, b) => b.spent - a.spent);

  if (list.length === 0) {
    return <div className="text-center py-16 text-gray-300"><i className="fa-solid fa-users text-5xl mb-2"></i><p className="text-sm">No customers yet</p></div>;
  }

  return (
    <div>
      {list.map((c, idx) => {
        const custPhone = (c.phone || "").replace(/^91/, "");
        const dateStr = new Date(c.lastDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        return (
          <div key={idx} className="bg-white rounded-xl shadow-sm p-4 mb-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full grid place-items-center font-bold text-sm flex-shrink-0">
              {(c.name || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-700">{c.name}</div>
              <div className="text-xs text-gray-400">{c.phone}</div>
              <div className="flex gap-3 mt-1">
                <span className="text-[11px] text-gray-500"><i className="fa-solid fa-bag-shopping text-pink-400"></i> {c.orders} orders</span>
                <span className="text-[11px] font-semibold text-pink-600">₹{c.spent} spent</span>
                <span className="text-[11px] text-gray-400">Last: {dateStr}</span>
              </div>
            </div>
            <a href={`https://wa.me/91${custPhone}`} target="_blank" className="bg-green-500 text-white w-9 h-9 rounded-full grid place-items-center text-sm hover:bg-green-600 flex-shrink-0">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
          </div>
        );
      })}
    </div>
  );
}

function AdminSettings() {
  const [shopName, setShopName] = useState(lsRead("lydia_shop_name", "Shop at Lydia"));
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  function saveSettings() {
    lsWrite("lydia_shop_name", shopName);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  function changePassword() {
    const current = getAdminPass();
    if (oldPass !== current) { setPassMsg("Wrong old password!"); return; }
    if (newPass.length < 4) { setPassMsg("Password too short!"); return; }
    if (newPass !== confirmPass) { setPassMsg("Passwords do not match!"); return; }
    localStorage.setItem("lydia_admin_pass", newPass);
    setPassMsg("Password changed successfully!");
    setOldPass(""); setNewPass(""); setConfirmPass("");
    setTimeout(() => setPassMsg(""), 3000);
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm"><i className="fa-solid fa-store text-pink-500 mr-1"></i> Shop Information</h3>
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Shop Name</label>
          <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg text-sm outline-none focus:border-pink-500" />
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">WhatsApp</span><span className="font-semibold text-gray-600">{ADMIN_PHONE} / {WA}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">GPay</span><span className="font-semibold text-gray-600">{GPAY}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Account</span><span className="font-semibold text-gray-600">{GPAY_ACC}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">IFSC</span><span className="font-semibold text-gray-600">{GPAY_IFSC}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Bank</span><span className="font-semibold text-gray-600">{GPAY_BANK} {GPAY_BRANCH}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Delivery</span><span className="font-semibold text-green-600">Free Delivery Mizoram</span></div>
        </div>
        <button onClick={saveSettings} className="w-full bg-pink-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-pink-600 mt-4">Save Settings</button>
        {savedMsg && <p className="text-center text-green-500 text-xs mt-2"><i className="fa-solid fa-circle-check"></i> Settings saved!</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-700 mb-3 text-sm"><i className="fa-solid fa-key text-pink-500 mr-1"></i> Change Password</h3>
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Old Password</label>
          <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg text-sm outline-none focus:border-pink-500" placeholder="Current password" />
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">New Password</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg text-sm outline-none focus:border-pink-500" placeholder="New password" />
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-400 block mb-1">Confirm Password</label>
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg text-sm outline-none focus:border-pink-500" placeholder="Confirm new password" />
        </div>
        <button onClick={changePassword} className="w-full bg-pink-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-pink-600">Change Password</button>
        {passMsg && <p className={`text-center text-xs mt-2 ${passMsg.includes("success") ? "text-green-500" : "text-red-500"}`}><i className={`fa-solid ${passMsg.includes("success") ? "fa-circle-check" : "fa-circle-exclamation"}`}></i> {passMsg}</p>}
      </div>
    </div>
  );
}
