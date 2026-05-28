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
    // 1. 【核心修复】这里是正确的 CP 广告主 API 链接（去掉了多余的 .click）
    const cpUrl = `https://m.bolo2vas102.click/c/pin/request?msisdn=${msisdn}&token=51bd5411badf480c8c1e3a5b8d3d653b`;
    const cpResponse = await axios.get(cpUrl);

    // 在 Vercel 后台打印一下，方便对账
    console.log(">>> CP 广告主返回结果:", cpResponse.data);

    // 2. 无论成功还是失败，原封不动存进数据库（给你的大屏看）
    await supabase.from('leads').insert([
      {
        click_id: click_id || 'test_click',
        msisdn: msisdn,
        carrier: 'Etisalat',
        txid: cpResponse.data.txid || null,
        status: cpResponse.data.stateCode === 0 ? 'pending' : 'failed',
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
    // 4. 网络超时/崩溃兜底：如果广告主服务器又挂了，记入日志和大屏
    console.error(">>> [服务器内部严重错误]:", error.message);

    try {
      await supabase.from('leads').insert([
        {
          click_id: click_id || 'test_click',
          msisdn: msisdn,
          carrier: 'Etisalat',
          txid: null,
          status: 'failed',
          cp_response: `API_CRASH: ${error.message}`
        }
      ]);
    } catch (dbErr) {
      console.error(">>> 写入数据库也失败了:", dbErr.message);
    }

    return res.status(500).json({ success: false, message: 'Server Connection Error' });
  }
}