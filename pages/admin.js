import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    // 👈 就是这行！告诉 Vercel 我们用到 error 了，不让它报错
    if (error) console.error("读取数据库失败:", error); 
    
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const renderStatusBadge = (status) => {
    let color, bgColor, borderColor;
    if (status === 'success') {
      color = '#2ecc71'; bgColor = 'rgba(46, 204, 113, 0.1)'; borderColor = '#2ecc71';
    } else if (status === 'pending') {
      color = '#ffd700'; bgColor = 'rgba(255, 215, 0, 0.1)'; borderColor = '#ffd700';
    } else {
      color = '#e74c3c'; bgColor = 'rgba(231, 76, 60, 0.1)'; borderColor = '#e74c3c';
    }

    return (
      <span style={{
        color: color,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ backgroundColor: '#0f0f11', minHeight: '100vh', color: '#e0e0e0', padding: '40px', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', margin: 0 }}>🛡️ TRAFFIC MONITOR</h1>
          <button 
            onClick={fetchLeads} 
            style={{ backgroundColor: '#2d2d30', color: '#fff', border: '1px solid #444', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Refreshing...' : 'REFRESH DATA'}
          </button>
        </div>

        <div style={{ backgroundColor: '#18181b', borderRadius: '10px', border: '1px solid #27272a', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>Time</th>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>Phone (MSISDN)</th>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>TXID (CP Ref)</th>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>CP Response</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #27272a', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='#202024'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                  <td style={{ padding: '15px 20px', fontSize: '14px', color: '#888' }}>
                    {new Date(lead.created_at).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                    {lead.msisdn}
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: '13px', color: '#a1a1aa', fontFamily: 'monospace' }}>
                    {lead.txid || '-'}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    {renderStatusBadge(lead.status)}
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: '13px', color: '#ff9800' }}>
                    {lead.cp_response || 'Success'}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>No records found in Supabase.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>