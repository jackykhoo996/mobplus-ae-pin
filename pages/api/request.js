import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    const { msisdn, click_id } = req.body;
    
    try {
        const cpUrl = `https://m.bolo2vas102.click/c/pin/297170/4033?msisdn=${msisdn}&token=51bd5411badf480c8c1e3a5b8d3d653b`;
        const cpResponse = await axios.get(cpUrl);
        
        // 关键追踪 1：把 CP 广告主的真实回复打印在 Vercel 日志里
        console.log(">>> CP 广告主返回结果:", cpResponse.data);
        
        if (cpResponse.data.stateCode === 0) {
            const txid = cpResponse.data.txid;
            
            const { error: dbError } = await supabase.from('leads').insert([
                { click_id: click_id || 'test_click', msisdn: msisdn, txid: txid, carrier: 'Etisalat', status: 'pending' }
            ]);

            if (dbError) {
                // 关键追踪 2：如果数据库出错，打印在日志里，并传给前端
                console.log(">>> 数据库报错信息:", dbError);
                return res.status(400).json({ success: false, error: '数据库写入失败 - ' + dbError.message });
            }

            res.status(200).json({ success: true, txid: txid });
        } else {
            // 如果 CP 拒绝，直接告诉前端 CP 的状态码
            res.status(400).json({ success: false, error: `CP拒绝了该号码 (状态码: ${cpResponse.data.stateCode})` });
        }
    } catch (error) {
        console.log(">>> 服务器崩溃报错:", error.message);
        res.status(500).json({ success: false, error: '服务器内部错误' });
    }
}