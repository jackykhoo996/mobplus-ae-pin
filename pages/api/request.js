import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// 连接你的 Supabase 数据库
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    // 接收从 index.js (前端页面) 传过来的手机号和 Voluum 的 click_id
    const { msisdn, click_id } = req.body;
    
    try {
        // 1. 呼叫 CP 的 PIN Request API，带上你的专属 Token
        const cpUrl = `https://m.bolo2vas102.click/c/pin/297170/4033?msisdn=${msisdn}&token=51bd5411badf480c8c1e3a5b8d3d653b`;
        const cpResponse = await axios.get(cpUrl);
        
        // 2. CP 官方文档说明：stateCode 为 0 代表成功 [cite: 15]
        if (cpResponse.data.stateCode === 0) {
            const txid = cpResponse.data.txid; // 获取交易号 [cite: 17]
            
            // 3. 将数据记录到 Supabase (防止漏单，方便后续查账)
            await supabase.from('leads').insert([
                { click_id: click_id || 'test_click', msisdn: msisdn, txid: txid, carrier: 'Etisalat', status: 'pending' }
            ]);

            // 4. 告诉前端页面：成功啦，请进入输入 PIN 码的界面！
            res.status(200).json({ success: true, txid: txid });
        } else {
            res.status(400).json({ success: false, error: 'CP Request Failed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
}