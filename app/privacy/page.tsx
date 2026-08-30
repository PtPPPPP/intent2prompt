import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "隐私政策 | Intent2Prompt",
};

export default function PrivacyPage() {
  return (
    <>
      <LegalPage title="隐私政策" updatedAt="2026-08-31">
        <p>本政策说明 Intent2Prompt（下称"本服务"）处理哪些信息、如何处理以及您的控制方式。运营主体：【待补充：运营主体名称】。</p>

        <h2>1. 我们收集的信息</h2>
        <ul>
          <li><strong>意图输入</strong>：您输入的中文意图文本，用于生成结果。生成时该文本会作为模型提示词发送至第三方大模型服务（当前为 DeepSeek）进行处理。</li>
          <li><strong>匿名客户端标识</strong>：浏览器本地生成的随机 UUID，仅用于限流与防滥用。服务端仅保存加盐后的 SHA-256 哈希，不保存原始标识，也无法据此还原您的身份。</li>
          <li><strong>反馈信息</strong>：您主动提交的"有帮助/没帮助"及可选的一句话说明，与对应生成请求的编号关联。</li>
          <li><strong>运行日志</strong>：请求编号、时间、耗时、状态码等技术字段，用于排查问题。日志不记录您的输入原文。</li>
          <li><strong>本地数据</strong>：生成历史仅保存在您浏览器本地（localStorage），不会上传；清除浏览器数据或点击"清空历史"即可删除。</li>
        </ul>

        <h2>2. 我们不做什么</h2>
        <ul>
          <li>不要求注册，不收集手机号、邮箱等真实身份信息。</li>
          <li>不将您的输入用于训练模型，也不对外出售任何数据。</li>
          <li>不主动将本地历史数据上传到服务器。</li>
        </ul>

        <h2>3. 第三方处理</h2>
        <p>生成功能依赖第三方大模型 API。该服务商将按其自身的隐私政策在提供服务所必需的范围内处理请求内容。请勿在输入中填写个人隐私或敏感信息（生成页对此亦有提示）。</p>

        <h2>4. 数据保留</h2>
        <p>技术日志按内部排障需要短期保留；反馈信息在内测期间保留用于改进服务；匿名标识哈希随限流存储保留。您提交的反馈如需删除，可通过下述联系方式申请。</p>

        <h2>5. 您的控制</h2>
        <ul>
          <li>随时在浏览器中清除 localStorage 删除本地历史与匿名标识。</li>
          <li>对数据处理有任何疑问或请求，联系【待补充：联系邮箱】。</li>
        </ul>

        <h2>6. 政策更新</h2>
        <p>数据处理方式发生重大变化时，我们将在本页面更新并修改"更新日期"。</p>
      </LegalPage>
      <SiteFooter />
    </>
  );
}
