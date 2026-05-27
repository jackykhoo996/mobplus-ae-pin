import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    const { txid, pin, click_id } = req.body;
    
    // 在日志里记录前端传过来的测试数据，方便对账
    console.log(`>>> [正在校验] 收到前端请求 -> txid: ${txid}, 用户输入的PIN: ${pin}`);
    
    try {
        const verifyUrl = `https://m.bolo2vas102.click/c/pin/verify?txid=${txid}&pin=${pin}&token=51bd5411badf480c8c1e3a5b8d3d653b`;
        const cpResponse = await axios.get(verifyUrl);

        // 🔥 核心：把 PDF 文档里广告主返回的每一个字，原封不动打印到 Vercel 的 Message 栏里！
        console.log(">>> [CP 广告主 Verify 响应结果]:", cpResponse.data);

        if (cpResponse.data.stateCode === 0) {
            console.log(`>>> 🎉 校验成功！准备更新数据库并回传 Voluum -> txid: ${txid}`);
            
            // 更新数据库
            await supabase.from('leads').update({ status: 'success' }).eq('txid', txid);

            // 给 Voluum 发送隐藏回传
            if (click_id && click_id !== 'test_click') {
                const postbackUrl = `http://citcycle-sative.com/postback?cid=${click_id}&payout=3.5`;
                console.log(`>>> [发送 Postback] 正在请求 Voluum: ${postbackUrl}`);
                await axios.get(postbackUrl);
            }

            res.status(200).json({ success: true });
        } else {
            // 🔥 广告主拒绝了，把 PDF 文档里的状态码和错误信息包装好
            console.log(`>>> ❌ 广告主拒绝了该验证码。状态码: ${cpResponse.data.stateCode}, 提示: ${cpResponse.data.msg}`);
            
            res.status(400).json({ 
                success: false, 
                error: `CP_VERIFY_FAILED`,
                cpStateCode: cpResponse.data.stateCode,
                cpMsg: cpResponse.data.msg 
            });
        }
    } catch (error) {
        console.log(">>> 🔥 [服务器严重崩溃] Verify 接口报错:", error.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
}