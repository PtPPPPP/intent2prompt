import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "隐私政策 | Intent2Prompt",
};

export default function PrivacyPage() {
  return (
    <>
      <LegalPage title="隐私政策" updatedAt="2026-10-13">
        <p>本政策说明 Intent2Prompt（下称“本服务”）处理哪些信息、如何处理以及您的控制方式。运营主体：【待补充：运营主体名称】。</p>

        <h2>1. 我们收集的信息</h2>
        <ul>
          <li><strong>意图输入与指令</strong>：规则模式不调用第三方模型。启用 DeepSeek 增强时，生成的指令会发送至该服务；主动点击优化时，仅发送选中的指令、反馈与保护上下文（含原任务目标和受保护内容）。其余任务包版本不会随优化请求发送。</li>
          <li><strong>匿名客户端标识</strong>：浏览器本地生成的随机 UUID，仅用于限流与防滥用。服务端仅保存加盐后的 SHA-256 哈希，不保存原始标识，也无法据此还原您的身份。</li>
          <li><strong>反馈信息</strong>：您主动提交的“有帮助/没帮助”及可选的一句话说明，与对应生成请求的编号关联。</li>
          <li><strong>运行日志</strong>：请求编号、时间、耗时、状态码等技术字段，用于排查问题。日志不记录您的输入原文。</li>
          <li><strong>本地数据</strong>：已保存的任务包、版本、编辑稿、反馈和采用状态仅保存在浏览器本地（localStorage）。主动优化所选内容时，该内容按上文发送至模型；历史不会整体上传。清除浏览器数据、删除记录或点击“清空历史”可删除本地记录。</li>
        </ul>

        <h2>2. 我们不做什么</h2>
        <ul>
          <li>不要求注册，不收集手机号、邮箱等真实身份信息。</li>
          <li>不将您的输入用于训练模型，也不对外出售任何数据。</li>
          <li>不主动将本地历史数据上传到服务器。</li>
        </ul>

        <h2>3. 第三方处理</h2>
        <p>可选模型增强及反馈优化使用 DeepSeek API。该服务商按自身政策处理发送的内容；规则生成、手动编辑、比较及本地保存无需调用模型。请勿在输入中填写个人隐私或敏感信息。</p>

        <h2>4. 数据保留</h2>
        <p>技术日志按内部排障需要短期保留；反馈信息在内测期间保留用于改进服务；匿名标识哈希随限流存储保留。您提交的反馈如需删除，可通过下述联系方式申请。</p>

        <h2>5. 您的控制</h2>
        <ul>
          <li>随时在浏览器中清除 localStorage 删除本地历史与匿名标识。</li>
          <li>对数据处理有任何疑问或请求，联系【待补充：联系邮箱】。</li>
        </ul>

        <h2>6. 政策更新</h2>
        <p>数据处理方式发生重大变化时，我们将在本页面更新并修改“更新日期”。</p>
      </LegalPage>
      <SiteFooter />
    </>
  );
}
