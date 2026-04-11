// src/pages/ManualOrders.jsx
import { useEffect, useRef, useState } from "react";
import { getAgentMe } from "../api/api";
import { getBusinessMe } from "../api/business";
import apiClient from "../api/client";

// ─── UAE locations ─────────────────────────────────────────────────────────────
const UAE_LOCATIONS = [
  "Downtown Dubai","Dubai Marina","Jumeirah Beach Residence (JBR)","Palm Jumeirah",
  "Business Bay","DIFC","Deira","Bur Dubai","Jumeirah","Al Quoz","Al Barsha","Mirdif",
  "Karama","Satwa","Oud Metha","Al Nahda Dubai","Discovery Gardens","International City",
  "Dubai Silicon Oasis","Academic City","Dubai Hills Estate","Mohammed Bin Rashid City",
  "Jumeirah Village Circle (JVC)","Jumeirah Village Triangle (JVT)","Dubai Sports City",
  "Motor City","Arabian Ranches","Emirates Hills","The Meadows","The Springs","The Lakes",
  "The Greens","Dubai Internet City","Dubai Media City","Dubai Knowledge Park","Tecom",
  "Al Furjan","Dubai South","Town Square","Al Warqa","Rashidiya","Muhaisnah","Al Qusais",
  "Umm Suqeim","Festival City","Ras Al Khor","Jebel Ali","Nad Al Sheba","Meydan",
  "Abu Dhabi City Centre","Al Reem Island","Saadiyat Island","Yas Island","Al Khalidiyah",
  "Corniche Abu Dhabi","Al Bateen","Khalifa City A","Khalifa City B","Baniyas","Al Reef",
  "Masdar City","Al Raha Beach","Sharjah City","Al Majaz","Al Nahda Sharjah","Muwaileh",
  "Ajman City","Al Nuaimiyah","Ras Al Khaimah City","Al Hamra Village","Mina Al Arab",
  "Fujairah City","Umm Al Quwain City",
];

// ─── LuxuryTimePicker ─────────────────────────────────────────────────────────
function LuxuryTimePicker({ value, onChange, label }) {
  const now = new Date();
  const [date,   setDate]   = useState(() => value ? value.split("T")[0] : now.toISOString().split("T")[0]);
  const [hour,   setHour]   = useState(() => { const h = value ? parseInt(value.split("T")[1]?.split(":")[0]||"12") : now.getHours(); return h%12===0?12:h%12; });
  const [minute, setMinute] = useState(() => value ? parseInt(value.split("T")[1]?.split(":")[1]||"0") : Math.ceil(now.getMinutes()/15)*15%60);
  const [ampm,   setAmpm]   = useState(() => { const h = value ? parseInt(value.split("T")[1]?.split(":")[0]||"12") : now.getHours(); return h>=12?"PM":"AM"; });

  const days = Array.from({length:14},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()+i);
    return { value: d.toISOString().split("T")[0], label: i===0?"Today":i===1?"Tomorrow":d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) };
  });
  const hours=[1,2,3,4,5,6,7,8,9,10,11,12];
  const minutes=[0,15,30,45];

  useEffect(()=>{
    const h24=ampm==="PM"?(hour===12?12:hour+12):(hour===12?0:hour);
    onChange(`${date}T${String(h24).padStart(2,"0")}:${String(minute).padStart(2,"0")}`);
  },[date,hour,minute,ampm]);

  return (
    <div style={{marginBottom:14}}>
      <label style={fieldLabel}>{label}</label>
      <div style={{marginBottom:10}}>
        <div style={microLabel}>DATE</div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
          {days.map(d=>(
            <button key={d.value} onClick={()=>setDate(d.value)} style={{padding:"8px 14px",borderRadius:10,border:"1.5px solid",borderColor:date===d.value?"#0071E3":"rgba(0,0,0,0.10)",background:date===d.value?"rgba(0,113,227,0.08)":"#fff",color:date===d.value?"#0071E3":"#1D1D1F",fontWeight:date===d.value?700:500,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
        <div style={{flex:1}}>
          <div style={microLabel}>HOUR</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {hours.map(h=>(
              <button key={h} onClick={()=>setHour(h)} style={{width:38,height:38,borderRadius:10,border:"1.5px solid",borderColor:hour===h?"#0071E3":"rgba(0,0,0,0.10)",background:hour===h?"#0071E3":"#fff",color:hour===h?"#fff":"#1D1D1F",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                {h}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={microLabel}>MIN</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {minutes.map(m=>(
              <button key={m} onClick={()=>setMinute(m)} style={{width:48,height:32,borderRadius:8,border:"1.5px solid",borderColor:minute===m?"#0071E3":"rgba(0,0,0,0.10)",background:minute===m?"#0071E3":"#fff",color:minute===m?"#fff":"#1D1D1F",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                :{String(m).padStart(2,"0")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={microLabel}>AM/PM</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {["AM","PM"].map(p=>(
              <button key={p} onClick={()=>setAmpm(p)} style={{width:52,height:32,borderRadius:8,border:"1.5px solid",borderColor:ampm===p?"#0071E3":"rgba(0,0,0,0.10)",background:ampm===p?"#0071E3":"#fff",color:ampm===p?"#fff":"#1D1D1F",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
      {value && (
        <div style={{marginTop:10,padding:"8px 12px",borderRadius:10,background:"rgba(0,113,227,0.06)",fontSize:13,fontWeight:600,color:"#0071E3"}}>
          ⏰ {days.find(d=>d.value===date)?.label} · {hour}:{String(minute).padStart(2,"0")} {ampm}
        </div>
      )}
    </div>
  );
}

// ─── UAE address input ─────────────────────────────────────────────────────────
function UAEAddressInput({ value, onChange }) {
  const [query, setQuery] = useState(value||"");
  const [show,  setShow]  = useState(false);
  const [opts,  setOpts]  = useState([]);
  const ref = useRef(null);

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setShow(false);};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);

  function handleChange(e){
    const v=e.target.value; setQuery(v); onChange(v);
    if(v.length>=2){setOpts(UAE_LOCATIONS.filter(l=>l.toLowerCase().includes(v.toLowerCase())).slice(0,8));setShow(true);}
    else setShow(false);
  }

  return (
    <div ref={ref} style={{position:"relative",marginBottom:14}}>
      <label style={fieldLabel}>Delivery Address</label>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>📍</span>
        <input value={query} onChange={handleChange} onFocus={()=>query.length>=2&&setShow(true)} placeholder="Search area…" style={{...inputStyle,paddingLeft:36,marginTop:4}}/>
      </div>
      {show&&opts.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:999,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.14)",border:"1px solid rgba(0,0,0,0.08)",marginTop:4,overflow:"hidden"}}>
          {opts.map(loc=>(
            <div key={loc} onClick={()=>{setQuery(loc);onChange(loc);setShow(false);}} style={{padding:"10px 16px",cursor:"pointer",fontSize:13,borderBottom:"1px solid rgba(0,0,0,0.05)"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,113,227,0.06)"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              📍 {loc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── order confirm modal ───────────────────────────────────────────────────────
function OrderModal({ cart, vatPct, onConfirm, onClose }) {
  const [type,            setType]            = useState(null);
  const [customerName,    setCustomerName]    = useState("");
  const [customerPhone,   setCustomerPhone]   = useState("");
  const [scheduledTime,   setScheduledTime]   = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [sending,         setSending]         = useState(false);

  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const vat      = (subtotal*vatPct)/100;
  const total    = subtotal+vat;

  const TYPES = [
    {value:"walkin",   icon:"🚶", label:"Walk-in",  desc:"Immediate"},
    {value:"pickup",   icon:"⏰", label:"Pickup",   desc:"Scheduled"},
    {value:"delivery", icon:"🚗", label:"Delivery", desc:"To address"},
  ];

  const needsTime    = type==="pickup"||type==="delivery";
  const needsAddress = type==="delivery";
  const canConfirm   = type && (needsTime?!!scheduledTime:true) && (needsAddress?!!deliveryAddress:true);

  async function handleConfirm(){
    setSending(true);
    try {
      await apiClient.post("/orders/pickup",{
        customerName: customerName||"Walk-in",
        customerPhone: customerPhone||null,
        orderType: type==="delivery"?"delivery":"pickup",
        scheduledTime: needsTime&&scheduledTime ? new Date(scheduledTime).toISOString() : null,
        deliveryAddress: needsAddress?deliveryAddress:null,
        items: cart.map(i=>({name:i.name,quantity:i.qty,price:i.price,extras:i.extras||[],notes:i.notes||null})),
      });
      onConfirm();
    } catch { alert("Failed to create order"); }
    finally { setSending(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:20,padding:28,width:440,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

        <h3 style={{margin:"0 0 16px",fontSize:17,fontWeight:700}}>Confirm Order</h3>

        {/* cart summary */}
        <div style={{background:"rgba(0,113,227,0.04)",borderRadius:12,padding:"12px 14px",marginBottom:20}}>
          {cart.map((i,idx)=>(
            <div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
              <span>{i.name} × {i.qty}{i.notes?` · ${i.notes}`:""}</span>
              <span style={{fontWeight:600}}>{(i.price*i.qty).toFixed(2)} AED</span>
            </div>
          ))}
          <div style={{borderTop:"1px solid rgba(0,0,0,0.07)",marginTop:8,paddingTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"#86868B"}}>Subtotal</span><span>{subtotal.toFixed(2)} AED</span></div>
            {vatPct>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"#86868B"}}>VAT ({vatPct}%)</span><span>{vat.toFixed(2)} AED</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:800,marginTop:4}}><span>Total</span><span style={{color:"#0071E3"}}>{total.toFixed(2)} AED</span></div>
          </div>
        </div>

        {/* type */}
        <label style={fieldLabel}>Order Type</label>
        <div style={{display:"flex",gap:8,marginTop:8,marginBottom:18}}>
          {TYPES.map(t=>(
            <button key={t.value} onClick={()=>setType(t.value)} style={{flex:1,padding:"12px 6px",borderRadius:12,border:"1.5px solid",borderColor:type===t.value?"#0071E3":"rgba(0,0,0,0.10)",background:type===t.value?"rgba(0,113,227,0.07)":"#fff",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{t.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:type===t.value?"#0071E3":"#1D1D1F"}}>{t.label}</div>
              <div style={{fontSize:10,color:"#86868B",marginTop:2}}>{t.desc}</div>
            </button>
          ))}
        </div>

        {type&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <div style={{flex:1}}>
                <label style={fieldLabel}>Name</label>
                <input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Customer name" style={{...inputStyle,marginTop:4}}/>
              </div>
              <div style={{flex:1}}>
                <label style={fieldLabel}>Phone</label>
                <input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="+971…" style={{...inputStyle,marginTop:4}}/>
              </div>
            </div>
            {needsTime&&<LuxuryTimePicker value={scheduledTime} onChange={setScheduledTime} label={type==="delivery"?"Delivery Time":"Pickup Time"}/>}
            {needsAddress&&<UAEAddressInput value={deliveryAddress} onChange={setDeliveryAddress}/>}
          </>
        )}

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={handleConfirm} disabled={!canConfirm||sending} style={{...primaryBtn,flex:1,opacity:(!canConfirm||sending)?0.5:1}}>
            {sending?"Creating…":"✅ Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── new booking modal ─────────────────────────────────────────────────────────
function BookingModal({ onConfirm, onClose, loading }) {
  const [name,    setName]    = useState("");
  const [guests,  setGuests]  = useState(2);
  const [phone,   setPhone]   = useState("");
  const [notes,   setNotes]   = useState("");
  const [startTime, setStartTime] = useState("");
  const valid = name.trim()&&guests>0&&startTime;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:20,padding:28,width:420,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 20px",fontSize:17,fontWeight:700}}>📅 New Booking</h3>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <div style={{flex:1}}>
            <label style={fieldLabel}>Guest Name *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sara" style={{...inputStyle,marginTop:4}}/>
          </div>
          <div style={{width:80}}>
            <label style={fieldLabel}>Guests</label>
            <input type="number" min={1} max={20} value={guests} onChange={e=>setGuests(Number(e.target.value))} style={{...inputStyle,marginTop:4}}/>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={fieldLabel}>Phone</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+971…" type="tel" style={{...inputStyle,marginTop:4}}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={fieldLabel}>Notes</label>
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Special requests…" style={{...inputStyle,marginTop:4}}/>
        </div>
        <LuxuryTimePicker value={startTime} onChange={setStartTime} label="Booking Time *"/>
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button disabled={!valid||loading} onClick={()=>onConfirm({customerName:name,partySize:guests,customerPhone:phone,notes,startTime})} style={{...primaryBtn,flex:1,opacity:(!valid||loading)?0.5:1}}>
            {loading?"Creating…":"Create Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── menu item card ────────────────────────────────────────────────────────────
function MenuItemCard({ item, qty, onAdd, onRemove }) {
  return (
    <div onClick={onAdd} style={{
      background: qty>0?"rgba(0,113,227,0.04)":"#fff",
      border: `1.5px solid ${qty>0?"#0071E3":"rgba(0,0,0,0.08)"}`,
      borderRadius: 12, padding: "12px 10px",
      cursor: "pointer", transition: "all 150ms",
      display: "flex", flexDirection: "column", gap: 4,
      position: "relative", userSelect: "none",
    }}>
      {qty>0&&(
        <div style={{position:"absolute",top:8,right:8,width:22,height:22,borderRadius:"50%",background:"#0071E3",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {qty}
        </div>
      )}
      <div style={{fontSize:13,fontWeight:700,color:"#1D1D1F",lineHeight:1.3,paddingRight:qty>0?24:0}}>
        {item.name}
      </div>
      <div style={{fontSize:12,color:"#0071E3",fontWeight:700}}>
        {item.price} {item.currency||"AED"}
      </div>
      {item.description&&(
        <div style={{fontSize:11,color:"#86868B",lineHeight:1.4,marginTop:2}}>
          {item.description.length>55?item.description.slice(0,55)+"…":item.description}
        </div>
      )}
      {qty>0&&(
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}} onClick={e=>e.stopPropagation()}>
          <button onClick={onRemove} style={qtyBtnStyle}>−</button>
          <span style={{fontWeight:700,fontSize:14,minWidth:20,textAlign:"center"}}>{qty}</span>
          <button onClick={onAdd} style={qtyBtnStyle}>+</button>
        </div>
      )}
    </div>
  );
}

// ─── swipeable page ────────────────────────────────────────────────────────────
function SwipeablePages({ categories, grouped, cart, onAdd, onRemove, activePage, onPageChange }) {
  const trackRef   = useRef(null);
  const startXRef  = useRef(null);
  const dragging   = useRef(false);

  function handleTouchStart(e) {
    startXRef.current = e.touches[0].clientX;
    dragging.current  = false;
  }

  function handleTouchMove(e) {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    if (Math.abs(dx) > 8) dragging.current = true;
  }

  function handleTouchEnd(e) {
    if (!dragging.current || startXRef.current === null) { startXRef.current = null; return; }
    const dx = e.changedTouches[0].clientX - startXRef.current;
    startXRef.current = null;
    if (dx < -50 && activePage < categories.length - 1) onPageChange(activePage + 1);
    if (dx >  50 && activePage > 0)                    onPageChange(activePage - 1);
  }

  // Mouse drag support for desktop
  const mouseStart = useRef(null);
  function handleMouseDown(e) { mouseStart.current = e.clientX; }
  function handleMouseUp(e) {
    if (mouseStart.current === null) return;
    const dx = e.clientX - mouseStart.current;
    mouseStart.current = null;
    if (Math.abs(dx) < 10) return;
    if (dx < -50 && activePage < categories.length - 1) onPageChange(activePage + 1);
    if (dx >  50 && activePage > 0)                    onPageChange(activePage - 1);
  }

  return (
    <div
      ref={trackRef}
      style={{ flex: 1, overflow: "hidden", position: "relative", cursor: "grab" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* sliding track */}
      <div style={{
        display: "flex",
        width: `${categories.length * 100}%`,
        height: "100%",
        transform: `translateX(-${activePage * (100 / categories.length)}%)`,
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {categories.map(cat => (
          <div key={cat} style={{
            width: `${100 / categories.length}%`,
            height: "100%",
            overflowY: "auto",
            padding: "16px 24px",
            boxSizing: "border-box",
          }}>
            {/* category header on page */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              {cat} <span style={{ fontWeight: 400 }}>({grouped[cat].length})</span>
            </div>
            {/* grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
            }}>
              {grouped[cat].map(item => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  qty={cart[item._id]?.qty || 0}
                  onAdd={() => onAdd(item)}
                  onRemove={() => onRemove(item._id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────
export default function ManualOrders() {
  const [menu,        setMenu]        = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [vatPct,      setVatPct]      = useState(5);
  const [activePage,  setActivePage]  = useState(0);
  const [cart,        setCart]        = useState({});
  const [showOrder,   setShowOrder]   = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast,       setToast]       = useState(null);

  useEffect(() => {
    async function load() {
      setMenuLoading(true);
      try {
        const [agentData, bizData] = await Promise.all([getAgentMe(), getBusinessMe()]);
        setMenu(agentData.agent?.menu?.filter(m => m.available) || []);
        setVatPct(bizData.business?.vatPercentage ?? 5);
      } catch {}
      finally { setMenuLoading(false); }
    }
    load();
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(null), 2800); }

  // ── cart ───────────────────────────────────────────────────────────────────
  function addItem(item) {
    setCart(prev => {
      const ex = prev[item._id];
      return { ...prev, [item._id]: ex ? { ...ex, qty: ex.qty+1 } : { ...item, qty:1, notes:"" } };
    });
  }
  function removeItem(id) {
    setCart(prev => {
      const ex = prev[id]; if (!ex) return prev;
      if (ex.qty<=1) { const n={...prev}; delete n[id]; return n; }
      return { ...prev, [id]: { ...ex, qty: ex.qty-1 } };
    });
  }

  const cartItems    = Object.values(cart).filter(i=>i.qty>0);
  const cartCount    = cartItems.reduce((s,i)=>s+i.qty, 0);
  const cartSubtotal = cartItems.reduce((s,i)=>s+i.price*i.qty, 0);

  // ── grouped menu ───────────────────────────────────────────────────────────
  const grouped = menu.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  // ── booking ────────────────────────────────────────────────────────────────
  async function handleBookingConfirm({ customerName, partySize, customerPhone, notes, startTime }) {
    setBookingLoading(true);
    try {
      await apiClient.post("/bookings/manual", {
        customerName, partySize,
        customerPhone: customerPhone || null,
        notes: notes || null,
        startTime: new Date(startTime).toISOString(),
      });
      setShowBooking(false);
      showToast("✅ Booking created");
    } catch { showToast("❌ Failed to create booking"); }
    finally { setBookingLoading(false); }
  }

  function handleOrderConfirmed() {
    setCart({});
    setShowOrder(false);
    showToast("✅ Order created");
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"var(--bg-page,#f5f5f7)" }}>

      {/* ── top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px 0", flexShrink:0 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, letterSpacing:"-0.02em", color:"#1D1D1F" }}>Manual Orders</h1>
          <p style={{ margin:"2px 0 0", fontSize:13, color:"#86868B" }}>Tap items to add to cart</p>
        </div>
        <button onClick={()=>setShowBooking(true)} style={{...primaryBtn,display:"flex",alignItems:"center",gap:6}}>
          📅 New Booking
        </button>
      </div>

      {/* ── category tabs ────────────────────────────────────────────────────── */}
      {!menuLoading && categories.length > 0 && (
        <div style={{ flexShrink:0, padding:"14px 24px 0" }}>
          {/* tab pills */}
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:12, scrollbarWidth:"none" }}>
            {categories.map((cat, idx) => (
              <button key={cat} onClick={()=>setActivePage(idx)} style={{
                padding:"7px 18px", borderRadius:999, border:"1.5px solid",
                borderColor: activePage===idx ? "#0071E3" : "rgba(0,0,0,0.10)",
                background:  activePage===idx ? "#0071E3" : "#fff",
                color:       activePage===idx ? "#fff"    : "#1D1D1F",
                fontWeight:600, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                transition:"all 150ms",
              }}>{cat}</button>
            ))}
          </div>

          {/* dot indicators */}
          <div style={{ display:"flex", justifyContent:"center", gap:6, paddingBottom:8 }}>
            {categories.map((_,idx) => (
              <div key={idx} onClick={()=>setActivePage(idx)} style={{
                width: activePage===idx ? 20 : 6,
                height:6, borderRadius:3,
                background: activePage===idx ? "#0071E3" : "rgba(0,0,0,0.15)",
                transition:"all 0.25s", cursor:"pointer",
              }}/>
            ))}
          </div>
        </div>
      )}

      {/* ── swipeable menu pages ─────────────────────────────────────────────── */}
      {menuLoading ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#86868B" }}>
          Loading menu…
        </div>
      ) : menu.length === 0 ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#86868B" }}>
          No menu items available.
        </div>
      ) : (
        <SwipeablePages
          categories={categories}
          grouped={grouped}
          cart={cart}
          onAdd={addItem}
          onRemove={removeItem}
          activePage={activePage}
          onPageChange={setActivePage}
        />
      )}

      {/* ── sticky cart bar ──────────────────────────────────────────────────── */}
      {cartCount > 0 && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0,
          background:"rgba(255,255,255,0.94)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          borderTop:"1px solid rgba(0,0,0,0.08)",
          padding:"14px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          zIndex:100, boxShadow:"0 -4px 24px rgba(0,0,0,0.08)",
        }}>
          <div>
            <span style={{ fontWeight:700, fontSize:15, color:"#1D1D1F" }}>
              {cartCount} item{cartCount!==1?"s":""}
            </span>
            <span style={{ fontSize:13, color:"#86868B", marginLeft:10 }}>
              {cartSubtotal.toFixed(2)} AED
              {vatPct>0&&` + ${((cartSubtotal*vatPct)/100).toFixed(2)} VAT`}
            </span>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setCart({})} style={ghostBtn}>Clear</button>
            <button onClick={()=>setShowOrder(true)} style={primaryBtn}>Confirm Order →</button>
          </div>
        </div>
      )}

      {/* modals */}
      {showOrder && (
        <OrderModal cart={cartItems} vatPct={vatPct} onConfirm={handleOrderConfirmed} onClose={()=>setShowOrder(false)} />
      )}
      {showBooking && (
        <BookingModal onConfirm={handleBookingConfirm} onClose={()=>setShowBooking(false)} loading={bookingLoading} />
      )}

      {/* toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
          background:"#1D1D1F", color:"#fff", padding:"12px 24px", borderRadius:100,
          fontSize:14, fontWeight:500, zIndex:3000, whiteSpace:"nowrap",
          boxShadow:"0 4px 20px rgba(0,0,0,0.2)",
        }}>{toast}</div>
      )}
    </div>
  );
}

// ─── shared styles ─────────────────────────────────────────────────────────────
const primaryBtn  = { padding:"10px 20px", borderRadius:12, border:"none", background:"#0071E3", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" };
const ghostBtn    = { padding:"9px 16px", borderRadius:10, border:"1px solid rgba(0,0,0,0.12)", background:"#fff", fontWeight:600, fontSize:13, cursor:"pointer" };
const inputStyle  = { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid rgba(0,0,0,0.12)", fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:"inherit" };
const fieldLabel  = { fontSize:12, color:"#86868B", fontWeight:500, display:"block" };
const microLabel  = { fontSize:11, color:"#86868B", fontWeight:600, marginBottom:6 };
const qtyBtnStyle = { width:28, height:28, borderRadius:8, border:"1px solid rgba(0,0,0,0.12)", background:"rgba(0,0,0,0.04)", cursor:"pointer", fontWeight:700, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" };