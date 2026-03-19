import { useState, useEffect } from "react";

const GOOGLE_MAPS_API = "https://maps.googleapis.com/maps/api/staticmap";

const initialClasses = [
  {
    id: 1,
    title: "Morning Yoga Flow",
    teacher: "Sofia Martens",
    category: "Wellness",
    description: "A gentle morning flow to start your day with clarity and energy.",
    address: "Rue de la Loi 42, Brussels",
    lat: 50.8467,
    lng: 4.3572,
    date: "2026-03-10",
    time: "08:00",
    duration: 60,
    capacity: 15,
    enrolled: 8,
    basePrice: 22,
    discounts: { student: 20, retired: 30 },
    color: "#a8d8b9",
  },
  {
    id: 2,
    title: "Advanced Photography",
    teacher: "Luca Fontaine",
    category: "Art",
    description: "Master composition, lighting and post-processing techniques.",
    address: "Avenue Louise 149, Brussels",
    lat: 50.8355,
    lng: 4.3622,
    date: "2026-03-12",
    time: "14:00",
    duration: 120,
    capacity: 10,
    enrolled: 7,
    basePrice: 45,
    discounts: { student: 15, retired: 25 },
    color: "#f4c9a5",
  },
  {
    id: 3,
    title: "French Cuisine Basics",
    teacher: "Amélie Dubois",
    category: "Cooking",
    description: "Learn authentic French techniques from a professional chef.",
    address: "Place Sainte-Catherine 5, Brussels",
    lat: 50.852,
    lng: 4.348,
    date: "2026-03-15",
    time: "11:00",
    duration: 180,
    capacity: 8,
    enrolled: 8,
    basePrice: 65,
    discounts: { student: 10, retired: 20 },
    color: "#c5b8f0",
  },
];

const categories = ["All", "Wellness", "Art", "Cooking", "Music", "Language", "Tech", "Sport"];

export default function App() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("student"); // "student" | "teacher"
  const [classes, setClasses] = useState(initialClasses);
  const [selected, setSelected] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [profileType, setProfileType] = useState("standard"); // standard | student | retired
  const [successMsg, setSuccessMsg] = useState("");
  const [newClass, setNewClass] = useState({
    title: "", teacher: "", category: "Wellness", description: "",
    address: "", lat: "", lng: "", date: "", time: "", duration: 60,
    capacity: 10, basePrice: 30,
    discounts: { student: 20, retired: 30 }, color: "#a8d8b9",
  });
  const [addressInput, setAddressInput] = useState("");

  const d = dark;

  const bg = d ? "#0f1117" : "#f9f7f4";
  const surface = d ? "#1a1d27" : "#ffffff";
  const surfaceAlt = d ? "#22263a" : "#f2f0ed";
  const border = d ? "#2e3348" : "#e8e4de";
  const text = d ? "#eeeaf0" : "#1a1625";
  const muted = d ? "#7a7f9a" : "#8a8590";
  const accent = "#7c5cbf";
  const accentLight = d ? "#9d7de0" : "#7c5cbf";
  const green = "#3fba84";
  const amber = "#f59e0b";

  const filteredClasses = classes.filter(
    (c) => filterCategory === "All" || c.category === filterCategory
  );

  const getDiscountedPrice = (cls) => {
    if (profileType === "student") return (cls.basePrice * (1 - cls.discounts.student / 100)).toFixed(2);
    if (profileType === "retired") return (cls.basePrice * (1 - cls.discounts.retired / 100)).toFixed(2);
    return cls.basePrice.toFixed(2);
  };

  const getDiscountLabel = (cls) => {
    if (profileType === "student") return `${cls.discounts.student}% student discount`;
    if (profileType === "retired") return `${cls.discounts.retired}% senior discount`;
    return null;
  };

  const handleBook = (cls) => {
    if (cls.enrolled >= cls.capacity) return;
    setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, enrolled: c.enrolled + 1 } : c));
    setBookingModal(null);
    setSelected(null);
    setSuccessMsg(`You're booked into "${cls.title}"!`);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const geocodeAddress = async (addr) => {
    // Since we have no network, simulate with Brussels coords + offset
    const base = { lat: 50.85 + (Math.random() - 0.5) * 0.03, lng: 4.35 + (Math.random() - 0.5) * 0.04 };
    return base;
  };

  const handleCreateClass = async () => {
    const coords = await geocodeAddress(newClass.address);
    const cls = {
      ...newClass,
      id: Date.now(),
      lat: coords.lat,
      lng: coords.lng,
      enrolled: 0,
      duration: Number(newClass.duration),
      capacity: Number(newClass.capacity),
      basePrice: Number(newClass.basePrice),
      discounts: {
        student: Number(newClass.discounts.student),
        retired: Number(newClass.discounts.retired),
      },
    };
    setClasses(prev => [...prev, cls]);
    setCreateModal(false);
    setSuccessMsg(`Class "${cls.title}" created successfully!`);
    setTimeout(() => setSuccessMsg(""), 3500);
    setNewClass({
      title: "", teacher: "", category: "Wellness", description: "",
      address: "", lat: "", lng: "", date: "", time: "", duration: 60,
      capacity: 10, basePrice: 30,
      discounts: { student: 20, retired: 30 }, color: "#a8d8b9",
    });
  };

  const mapUrl = (lat, lng) =>
    `https://maps.apple.com/?ll=${lat},${lng}&z=15`;

  const googleMapUrl = (lat, lng) =>
    `https://www.google.com/maps?q=${lat},${lng}&z=15`;

  const colorOptions = ["#a8d8b9", "#f4c9a5", "#c5b8f0", "#f9c5d1", "#b8d8f4", "#f4e6a5", "#f0b8b8"];

  return (
    <div style={{
      minHeight: "100vh", background: bg, color: text,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      transition: "background 0.3s, color 0.3s",
    }}>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 3px; }
        input, select, textarea { font-family: inherit; }
        .cls-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(124,92,191,0.15) !important; }
        .cls-card { transition: transform 0.2s, box-shadow 0.2s; }
        .toggle-thumb { transition: transform 0.25s cubic-bezier(.4,0,.2,1); }
        .btn-primary { transition: background 0.15s, transform 0.1s; }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .modal-bg { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .modal-box { animation: slideUp 0.25s cubic-bezier(.4,0,.2,1); }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .cat-pill { transition: background 0.15s, color 0.15s; cursor: pointer; }
        .cat-pill:hover { opacity: 0.85; }
        .map-link { transition: background 0.15s; }
        .map-link:hover { filter: brightness(0.95); }
        .success-banner { animation: slideDown 0.3s ease, fadeOut 0.5s ease 3s forwards; }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes fadeOut { to { opacity: 0; pointer-events: none; } }
      `}</style>

      {/* HEADER */}
      <header style={{
        background: surface, borderBottom: `1px solid ${border}`,
        padding: "0 28px", height: 64, display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
        boxShadow: d ? "0 2px 20px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}, #e06b9a)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🎓</div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, letterSpacing: 0.3 }}>
            Classe
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* View Toggle */}
          <div style={{
            display: "flex", background: surfaceAlt, borderRadius: 10, padding: 3,
            border: `1px solid ${border}`,
          }}>
            {["student", "teacher"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: view === v ? accent : "transparent",
                color: view === v ? "#fff" : muted,
                fontWeight: 600, fontSize: 13, transition: "all 0.15s",
              }}>
                {v === "student" ? "📚 Student" : "🎤 Teacher"}
              </button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <div
            onClick={() => setDark(!d)}
            style={{
              width: 52, height: 28, borderRadius: 14,
              background: d ? accent : "#d0cdd8",
              cursor: "pointer", position: "relative",
              display: "flex", alignItems: "center", padding: "0 4px",
            }}
          >
            <div className="toggle-thumb" style={{
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              transform: d ? "translateX(24px)" : "translateX(0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11,
            }}>
              {d ? "🌙" : "☀️"}
            </div>
          </div>
        </div>
      </header>

      {/* SUCCESS BANNER */}
      {successMsg && (
        <div className="success-banner" style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          background: green, color: "#fff", padding: "12px 24px", borderRadius: 10,
          fontWeight: 600, zIndex: 999, boxShadow: "0 4px 20px rgba(63,186,132,0.4)",
          fontSize: 14,
        }}>
          ✅ {successMsg}
        </div>
      )}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* STUDENT VIEW */}
        {view === "student" && (
          <>
            {/* Hero */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 600,
                lineHeight: 1.1, marginBottom: 12,
              }}>
                Discover & Book<br />
                <em style={{ color: accentLight }}>exceptional classes</em>
              </h1>
              <p style={{ color: muted, fontSize: 16, maxWidth: 480 }}>
                Learn from passionate teachers across Brussels and beyond.
              </p>
            </div>

            {/* Profile type + Filters */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 12,
              alignItems: "center", marginBottom: 24,
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {categories.map(cat => (
                  <button key={cat} className="cat-pill" onClick={() => setFilterCategory(cat)} style={{
                    padding: "6px 14px", borderRadius: 20, border: `1px solid ${border}`,
                    background: filterCategory === cat ? accent : surfaceAlt,
                    color: filterCategory === cat ? "#fff" : text,
                    fontWeight: 500, fontSize: 13,
                  }}>
                    {cat}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: muted }}>I am a:</span>
                <select value={profileType} onChange={e => setProfileType(e.target.value)} style={{
                  padding: "6px 12px", borderRadius: 8, border: `1px solid ${border}`,
                  background: surfaceAlt, color: text, fontSize: 13, cursor: "pointer",
                }}>
                  <option value="standard">Regular</option>
                  <option value="student">Student</option>
                  <option value="retired">Senior / Retired</option>
                </select>
              </div>
            </div>

            {/* Class Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}>
              {filteredClasses.map(cls => {
                const full = cls.enrolled >= cls.capacity;
                const discLabel = getDiscountLabel(cls);
                return (
                  <div key={cls.id} className="cls-card" onClick={() => setSelected(cls)} style={{
                    background: surface, border: `1px solid ${border}`, borderRadius: 16,
                    overflow: "hidden", cursor: "pointer",
                    boxShadow: d ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.07)",
                  }}>
                    <div style={{
                      height: 8, background: `linear-gradient(90deg, ${cls.color}, ${cls.color}88)`,
                    }} />
                    <div style={{ padding: "20px 22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: 1,
                          color: accentLight, textTransform: "uppercase",
                          background: `${accentLight}18`, padding: "3px 8px", borderRadius: 5,
                        }}>
                          {cls.category}
                        </span>
                        {full && (
                          <span style={{ fontSize: 11, color: "#e05050", fontWeight: 700, background: "#e0505018", padding: "3px 8px", borderRadius: 5 }}>
                            FULL
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 19, fontWeight: 600, marginBottom: 4, lineHeight: 1.25 }}>{cls.title}</h3>
                      <p style={{ fontSize: 13, color: muted, marginBottom: 12 }}>with {cls.teacher}</p>
                      <p style={{ fontSize: 14, color: muted, lineHeight: 1.5, marginBottom: 14 }}>{cls.description}</p>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 12, color: muted }}>
                          📅 {new Date(cls.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {cls.time}
                        </span>
                        <span style={{ fontSize: 12, color: muted }}>⏱ {cls.duration}min</span>
                        <span style={{ fontSize: 12, color: muted }}>
                          👥 {cls.enrolled}/{cls.capacity}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 20, fontWeight: 700, color: accentLight }}>
                            €{getDiscountedPrice(cls)}
                          </span>
                          {discLabel && (
                            <span style={{
                              marginLeft: 8, fontSize: 11, color: green, fontWeight: 700,
                              background: `${green}18`, padding: "2px 7px", borderRadius: 5,
                            }}>
                              {discLabel}
                            </span>
                          )}
                          {profileType !== "standard" && (
                            <div style={{ fontSize: 11, color: muted, textDecoration: "line-through" }}>
                              €{cls.basePrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <button className="btn-primary" onClick={e => { e.stopPropagation(); if (!full) setBookingModal(cls); }} style={{
                          padding: "9px 18px", borderRadius: 9, border: "none", cursor: full ? "not-allowed" : "pointer",
                          background: full ? border : accent, color: full ? muted : "#fff",
                          fontWeight: 600, fontSize: 13,
                        }}>
                          {full ? "Full" : "Book now"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TEACHER VIEW */}
        {view === "teacher" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
              <div>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600, lineHeight: 1.1, marginBottom: 8,
                }}>
                  Manage your <em style={{ color: accentLight }}>classes</em>
                </h1>
                <p style={{ color: muted, fontSize: 15 }}>Create, organise, and track your sessions.</p>
              </div>
              <button className="btn-primary" onClick={() => setCreateModal(true)} style={{
                padding: "12px 22px", borderRadius: 12, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${accent}, #e06b9a)`,
                color: "#fff", fontWeight: 700, fontSize: 14,
                boxShadow: "0 4px 16px rgba(124,92,191,0.35)",
              }}>
                + New Class
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Total Classes", value: classes.length, icon: "📋" },
                { label: "Total Students", value: classes.reduce((a, c) => a + c.enrolled, 0), icon: "👥" },
                { label: "Avg. Fill Rate", value: Math.round(classes.reduce((a, c) => a + c.enrolled / c.capacity, 0) / classes.length * 100) + "%", icon: "📊" },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: surface, border: `1px solid ${border}`, borderRadius: 14,
                  padding: "18px 20px",
                  boxShadow: d ? "0 2px 10px rgba(0,0,0,0.2)" : "0 2px 10px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: accentLight }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: muted }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Classes Table */}
            <div style={{
              background: surface, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden",
              boxShadow: d ? "0 4px 20px rgba(0,0,0,0.25)" : "0 4px 20px rgba(0,0,0,0.06)",
            }}>
              {classes.map((cls, i) => (
                <div key={cls.id} style={{
                  display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
                  padding: "18px 24px",
                  borderBottom: i < classes.length - 1 ? `1px solid ${border}` : "none",
                  background: i % 2 === 0 ? "transparent" : `${surfaceAlt}50`,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cls.color, flexShrink: 0 }} />
                  <div style={{ flex: "1 1 180px" }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{cls.title}</div>
                    <div style={{ fontSize: 12, color: muted }}>{cls.category} · {cls.date} {cls.time}</div>
                  </div>
                  <div style={{ fontSize: 13, color: muted, flex: "1 1 140px" }}>📍 {cls.address.slice(0, 30)}…</div>
                  <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 80, height: 6, borderRadius: 3,
                      background: border, overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${(cls.enrolled / cls.capacity) * 100}%`,
                        height: "100%", background: cls.enrolled >= cls.capacity ? "#e05050" : green,
                        borderRadius: 3,
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: muted }}>{cls.enrolled}/{cls.capacity}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: accentLight, flex: "0 0 60px", textAlign: "right" }}>
                    €{cls.basePrice}
                  </div>
                  <div style={{ fontSize: 12, color: muted, flex: "0 0 140px" }}>
                    🎓 -{cls.discounts.student}% · 👴 -{cls.discounts.retired}%
                  </div>
                  <button onClick={() => setSelected(cls)} style={{
                    padding: "6px 14px", borderRadius: 8, border: `1px solid ${border}`,
                    background: "transparent", color: text, cursor: "pointer", fontSize: 12, fontWeight: 500,
                  }}>
                    View details
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* CLASS DETAIL MODAL */}
      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{
            background: surface, borderRadius: 20, maxWidth: 540, width: "100%",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
            border: `1px solid ${border}`,
          }}>
            <div style={{ height: 10, background: `linear-gradient(90deg, ${selected.color}, ${accent})`, borderRadius: "20px 20px 0 0" }} />
            <div style={{ padding: "28px 28px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 1, color: accentLight,
                  textTransform: "uppercase", background: `${accentLight}18`, padding: "3px 9px", borderRadius: 5,
                }}>
                  {selected.category}
                </span>
                <button onClick={() => setSelected(null)} style={{
                  background: surfaceAlt, border: "none", cursor: "pointer", color: muted,
                  width: 30, height: 30, borderRadius: 8, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, marginBottom: 4 }}>
                {selected.title}
              </h2>
              <p style={{ color: muted, marginBottom: 16 }}>with <strong style={{ color: text }}>{selected.teacher}</strong></p>
              <p style={{ lineHeight: 1.7, color: muted, marginBottom: 20 }}>{selected.description}</p>

              <div style={{
                background: surfaceAlt, borderRadius: 12, padding: "16px 18px",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20,
              }}>
                {[
                  ["📅 Date", `${new Date(selected.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`],
                  ["🕐 Time", `${selected.time} · ${selected.duration} min`],
                  ["👥 Spots", `${selected.enrolled}/${selected.capacity} enrolled`],
                  ["🎓 Student", `-${selected.discounts.student}%`],
                  ["👴 Senior", `-${selected.discounts.retired}%`],
                  ["💶 Base price", `€${selected.basePrice}`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 12, color: muted, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Address + Map Links */}
              <div style={{
                background: surfaceAlt, borderRadius: 12, padding: "16px 18px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, color: muted, marginBottom: 6 }}>📍 Location</div>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>{selected.address}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <a className="map-link" href={googleMapUrl(selected.lat, selected.lng)} target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, padding: "9px 14px", borderRadius: 9,
                    background: "#4285F4", color: "#fff", textDecoration: "none",
                    fontSize: 13, fontWeight: 600, textAlign: "center", display: "block",
                  }}>
                    🗺 Google Maps
                  </a>
                  <a className="map-link" href={mapUrl(selected.lat, selected.lng)} target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, padding: "9px 14px", borderRadius: 9,
                    background: d ? "#1c1c1e" : "#000", color: "#fff", textDecoration: "none",
                    fontSize: 13, fontWeight: 600, textAlign: "center", display: "block",
                    border: `1px solid ${border}`,
                  }}>
                    🍎 Apple Maps
                  </a>
                </div>
                <div style={{
                  marginTop: 10, fontSize: 11, color: muted, fontFamily: "monospace",
                  background: `${accentLight}12`, padding: "4px 8px", borderRadius: 5, display: "inline-block",
                }}>
                  {selected.lat.toFixed(4)}°N, {selected.lng.toFixed(4)}°E
                </div>
              </div>

              {view === "student" && (
                <button className="btn-primary" onClick={() => { setBookingModal(selected); setSelected(null); }}
                  disabled={selected.enrolled >= selected.capacity}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 12, border: "none",
                    cursor: selected.enrolled >= selected.capacity ? "not-allowed" : "pointer",
                    background: selected.enrolled >= selected.capacity
                      ? border
                      : `linear-gradient(135deg, ${accent}, #e06b9a)`,
                    color: selected.enrolled >= selected.capacity ? muted : "#fff",
                    fontWeight: 700, fontSize: 16,
                    boxShadow: selected.enrolled >= selected.capacity ? "none" : "0 4px 18px rgba(124,92,191,0.4)",
                  }}>
                  {selected.enrolled >= selected.capacity ? "Class is full" : `Book for €${getDiscountedPrice(selected)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOOKING CONFIRMATION MODAL */}
      {bookingModal && (
        <div className="modal-bg" onClick={() => setBookingModal(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{
            background: surface, borderRadius: 20, maxWidth: 400, width: "100%", padding: "32px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.4)", border: `1px solid ${border}`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Confirm Booking</h2>
            <p style={{ color: muted, marginBottom: 20, lineHeight: 1.6 }}>
              You're about to book <strong style={{ color: text }}>{bookingModal.title}</strong> on{" "}
              {new Date(bookingModal.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} at {bookingModal.time}.
            </p>
            <div style={{
              background: surfaceAlt, borderRadius: 12, padding: "14px 18px", marginBottom: 22,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ color: muted, fontSize: 14 }}>Total to pay</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: accentLight }}>€{getDiscountedPrice(bookingModal)}</span>
                {getDiscountLabel(bookingModal) && (
                  <div style={{ fontSize: 11, color: green }}>{getDiscountLabel(bookingModal)}</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setBookingModal(null)} style={{
                flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${border}`,
                background: "transparent", color: text, cursor: "pointer", fontWeight: 600,
              }}>Cancel</button>
              <button className="btn-primary" onClick={() => handleBook(bookingModal)} style={{
                flex: 2, padding: "12px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${accent}, #e06b9a)`,
                color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15,
                boxShadow: "0 4px 16px rgba(124,92,191,0.4)",
              }}>Confirm & Book</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {createModal && (
        <div className="modal-bg" onClick={() => setCreateModal(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          overflowY: "auto",
        }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{
            background: surface, borderRadius: 20, maxWidth: 560, width: "100%",
            maxHeight: "92vh", overflowY: "auto",
            boxShadow: "0 24px 80px rgba(0,0,0,0.4)", border: `1px solid ${border}`,
          }}>
            <div style={{
              padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `1px solid ${border}`, paddingBottom: 20, marginBottom: 4,
            }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600 }}>
                Create a New Class
              </h2>
              <button onClick={() => setCreateModal(false)} style={{
                background: surfaceAlt, border: "none", cursor: "pointer", color: muted,
                width: 32, height: 32, borderRadius: 8, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
            </div>

            <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Basic Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldGroup label="Class Title" style={{ gridColumn: "1/-1" }}>
                  <Input dark={d} border={border} surfaceAlt={surfaceAlt} text={text}
                    value={newClass.title} onChange={v => setNewClass(p => ({ ...p, title: v }))} placeholder="e.g. Morning Yoga Flow" />
                </FieldGroup>
                <FieldGroup label="Teacher Name">
                  <Input dark={d} border={border} surfaceAlt={surfaceAlt} text={text}
                    value={newClass.teacher} onChange={v => setNewClass(p => ({ ...p, teacher: v }))} placeholder="Your name" />
                </FieldGroup>
                <FieldGroup label="Category">
                  <select value={newClass.category} onChange={e => setNewClass(p => ({ ...p, category: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${border}`, background: surfaceAlt, color: text, fontSize: 14 }}>
                    {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </FieldGroup>
              </div>

              <FieldGroup label="Description">
                <textarea value={newClass.description} onChange={e => setNewClass(p => ({ ...p, description: e.target.value }))}
                  placeholder="What will students learn?" rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${border}`, background: surfaceAlt, color: text, fontSize: 14, resize: "vertical" }} />
              </FieldGroup>

              {/* Location */}
              <div style={{ background: surfaceAlt, borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: accentLight, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  📍 Location
                </div>
                <FieldGroup label="Street Address">
                  <Input dark={d} border={border} surfaceAlt={`${border}50`} text={text}
                    value={newClass.address} onChange={v => setNewClass(p => ({ ...p, address: v }))} placeholder="e.g. Rue de la Loi 42, Brussels" />
                </FieldGroup>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <FieldGroup label="Latitude (optional)">
                    <Input dark={d} border={border} surfaceAlt={`${border}50`} text={text}
                      value={newClass.lat} onChange={v => setNewClass(p => ({ ...p, lat: v }))} placeholder="50.8503" />
                  </FieldGroup>
                  <FieldGroup label="Longitude (optional)">
                    <Input dark={d} border={border} surfaceAlt={`${border}50`} text={text}
                      value={newClass.lng} onChange={v => setNewClass(p => ({ ...p, lng: v }))} placeholder="4.3517" />
                  </FieldGroup>
                </div>
                <p style={{ fontSize: 11, color: muted, marginTop: 6 }}>
                  💡 GPS coordinates will be auto-resolved from the address when published.
                </p>
              </div>

              {/* Date/Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <FieldGroup label="Date">
                  <Input dark={d} border={border} surfaceAlt={surfaceAlt} text={text}
                    type="date" value={newClass.date} onChange={v => setNewClass(p => ({ ...p, date: v }))} />
                </FieldGroup>
                <FieldGroup label="Time">
                  <Input dark={d} border={border} surfaceAlt={surfaceAlt} text={text}
                    type="time" value={newClass.time} onChange={v => setNewClass(p => ({ ...p, time: v }))} />
                </FieldGroup>
                <FieldGroup label="Duration (min)">
                  <Input dark={d} border={border} surfaceAlt={surfaceAlt} text={text}
                    type="number" value={newClass.duration} onChange={v => setNewClass(p => ({ ...p, duration: v }))} />
                </FieldGroup>
              </div>

              {/* Capacity + Price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FieldGroup label="Max Capacity">
                  <Input dark={d} border={border} surfaceAlt={surfaceAlt} text={text}
                    type="number" value={newClass.capacity} onChange={v => setNewClass(p => ({ ...p, capacity: v }))} />
                </FieldGroup>
                <FieldGroup label="Base Price (€)">
                  <Input dark={d} border={border} surfaceAlt={surfaceAlt} text={text}
                    type="number" value={newClass.basePrice} onChange={v => setNewClass(p => ({ ...p, basePrice: v }))} />
                </FieldGroup>
              </div>

              {/* Discounts */}
              <div style={{ background: surfaceAlt, borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: green, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  🏷️ Discounts
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FieldGroup label="Student discount (%)">
                    <Input dark={d} border={border} surfaceAlt={`${border}50`} text={text}
                      type="number" min="0" max="100"
                      value={newClass.discounts.student}
                      onChange={v => setNewClass(p => ({ ...p, discounts: { ...p.discounts, student: v } }))} />
                  </FieldGroup>
                  <FieldGroup label="Senior / Retired (%)">
                    <Input dark={d} border={border} surfaceAlt={`${border}50`} text={text}
                      type="number" min="0" max="100"
                      value={newClass.discounts.retired}
                      onChange={v => setNewClass(p => ({ ...p, discounts: { ...p.discounts, retired: v } }))} />
                  </FieldGroup>
                </div>
                {newClass.basePrice && (
                  <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12, color: muted }}>
                    <span>🎓 Students pay: <strong style={{ color: green }}>€{(newClass.basePrice * (1 - newClass.discounts.student / 100)).toFixed(2)}</strong></span>
                    <span>👴 Seniors pay: <strong style={{ color: green }}>€{(newClass.basePrice * (1 - newClass.discounts.retired / 100)).toFixed(2)}</strong></span>
                  </div>
                )}
              </div>

              {/* Color */}
              <FieldGroup label="Class Colour">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {colorOptions.map(c => (
                    <button key={c} onClick={() => setNewClass(p => ({ ...p, color: c }))} style={{
                      width: 28, height: 28, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                      outline: newClass.color === c ? `3px solid ${accent}` : "none",
                      outlineOffset: 2,
                    }} />
                  ))}
                </div>
              </FieldGroup>

              <button className="btn-primary" onClick={handleCreateClass}
                disabled={!newClass.title || !newClass.teacher || !newClass.address || !newClass.date}
                style={{
                  padding: "14px", borderRadius: 12, border: "none",
                  background: (!newClass.title || !newClass.teacher || !newClass.address || !newClass.date)
                    ? border : `linear-gradient(135deg, ${accent}, #e06b9a)`,
                  color: (!newClass.title || !newClass.teacher || !newClass.address || !newClass.date) ? muted : "#fff",
                  fontWeight: 700, fontSize: 15, cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(124,92,191,0.35)",
                }}>
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldGroup({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#8a8590", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", border, surfaceAlt, text, dark, min, max }) {
  return (
    <input type={type} value={value} min={min} max={max}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 12px", borderRadius: 9,
        border: `1px solid ${border}`, background: surfaceAlt,
        color: text, fontSize: 14, outline: "none",
      }}
    />
  );
}
