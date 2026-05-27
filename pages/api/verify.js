import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// 连接你的 Supabase 数据库
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    // 接收前端传过来的 交易号(txid)、用户输入的验证码(pin) 和 click_id
    const { txid, pin, click_id } = req.body;
    
    try {
        // 1. 呼叫 CP 的 PIN Verify API
        const verifyUrl = `https://m.bolo2vas102.click/c/pin/verify?txid=${txid}&pin=${pin}&token=51bd5411badf480c8c1e3a5b8d3d653b`;
        const cpResponse = await axios.get(verifyUrl);

        // 2. CP 官方文档说明：stateCode 为 0 代表验证成功并扣费 [cite: 37]
        if (cpResponse.data.stateCode === 0) {
            
            // 3. 交易成功！在数据库里把这条记录的状态更新为 success
            await supabase.from('leads').update({ status: 'success' }).eq('txid', txid);

            // 4. 重头戏：给 Voluum 发送隐藏回传，告诉它这单赚了 $3.5！
            if (click_id && click_id !== 'test_click') {
                const postbackUrl = `http://citcycle-sative.com/postback?cid=${click_id}&payout=3.5`;
                await axios.get(postbackUrl);
            }

            // 5. 告诉前端页面：全部搞定，给用户显示抽奖成功的界面！
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, error: 'Invalid PIN' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
}