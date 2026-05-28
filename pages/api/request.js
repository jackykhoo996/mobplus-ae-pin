import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { msisdn, click_id } = req.body;

  try {
    // 1. 呼叫 CP 广告主的 PIN Request 接口获取验证码
    // 注意：这里用的是你之前发我的完整官方请求 URL
    const cpUrl = `https://m.bolo2vas102.click.click/c/pin/request?msisdn=${msisdn}&token=51bd5411badf480c8c1e3a5b8d3d653b`;
    const cpResponse = await axios.get(cpUrl);

    // 在 Vercel 后台打印一下，方便对账
    console.log(">>> CP 广告主返回结果:", cpResponse.data);

    // 2. 【核心修改】无论成功（stateCode === 0）还是失败（stateCode === 1），原封不动存进数据库
    await supabase.from('leads').insert([
      {
        click_id: click_id || 'test_click',
        msisdn: msisdn,
        carrier: 'Etisalat',
        txid: cpResponse.data.txid || null,
        // 如果返回状态码是 0 就标为 pending，否则标为 failed
        status: cpResponse.data.stateCode === 0 ? 'pending' : 'failed',
        // 把广告主的真实回复（msg）存入你刚刚在 Supabase 建的 cp_response 字段
        cp_response: cpResponse.data.msg || 'No Message'
      }
    ]);

    // 3. 根据广告主的返回，决定给前端落地页返回什么
    if (cpResponse.data.stateCode === 0) {
      // 成功，把 txid 传回前端好去调用第二步校验
      return res.status(200).json({ success: true, txid: cpResponse.data.txid });
    } else {
      // 失败（如废号、频繁请求、风控拦截），返回失败状态
      return res.status(200).json({ success: false, message: cpResponse.data.msg });
    }

  } catch (error) {
    // 4. 玄学风控或网络超时兜底：如果直接请求失败，也要在你的大屏上记一笔，方便查账
    console.error(">>> [服务器内部严重错误]:", error.message);

    try {
      await supabase.from('leads').insert([
        {
          click_id: click_id || 'test_click',
          msisdn: msisdn,
          carrier: 'Etisalat',
          txid: null,
          status: 'failed',
          cp_response: `API_CRASH: ${error.message}` // 记录崩溃原因
        }
      ]);
    } catch (dbErr) {
      console.error(">>> 写入数据库也失败了:", dbErr.message);
    }

    return res.status(500).json({ success: false, message: 'Server Connection Error' });
  }
}