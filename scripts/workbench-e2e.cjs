// 本地页面真实生成（规则模式）；优化端点由浏览器路由 mock。禁止连接付费模型。
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const root = process.env.E2E_ARTIFACT_DIR || "test-artifacts";
const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error("E2E 必须使用本地测试服务");

(async () => {
  await fs.mkdir(root, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const report = [], failures = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, permissions: ["clipboard-read", "clipboard-write"], acceptDownloads: true });
      const page = await context.newPage();
      await page.route("**/api/optimize", async (route) => {
        if (route.request().method() === "GET") return route.fulfill({ json: { available: true, message: "本地 E2E mock，无真实模型调用", requestId: "mock-capability" } });
        const data = route.request().postDataJSON();
        if (data.feedback.includes("模拟失败")) return route.fulfill({ status: 502, json: { error: "upstream", message: "模型服务返回异常，原稿和输入已保留，请重试。", requestId: "mock-error" } });
        await route.fulfill({ json: { content: data.content + "\n验收补充：报告实际执行的测试命令和结果，未执行项明确标注。", source: { kind: "model", provider: "local-e2e-mock", model: "e2e-local-mock" }, warnings: ["待核查：此结果仅来自 E2E mock。"], requestId: "mock-success" } });
      });
      page.on("pageerror", (error) => failures.push(error.message));
      await page.goto(base);
      await page.getByLabel("你想让 AI 帮你做什么？").fill("让 Codex 修复登录超时，禁止新增依赖，数据库版本待补充");
      await page.getByRole("button", { name: "生成任务指令", exact: true }).click();
      const editor = page.getByRole("textbox", { name: "编辑所选指令" });
      await editor.waitFor();
      const original = await editor.inputValue();
      assert(original.includes("禁止新增依赖"));
      assert(await page.getByRole("button", { name: "按反馈优化一次", exact: true }).isEnabled());
      // 最多三个澄清问题，补充后再次生成保留答案。
      const questions = page.locator("section").filter({ has: page.getByRole("heading", { name: "补充信息", exact: true }) }).locator("input");
      assert(await questions.count() <= 3);
      if (await questions.count()) {
        await questions.first().fill("保持现有网页应用");
        await page.getByRole("button", { name: "按默认假设重新生成", exact: true }).click();
        await page.waitForFunction(() => document.querySelector('[aria-label="编辑所选指令"]')?.value.includes("保持现有网页应用"));
      }
      const baseContent = await editor.inputValue();
      assert.equal(await page.getByRole("heading", { name: "项目任务包", exact: true }).count(), 1);
      await editor.fill(baseContent + "\n编辑补充：说明复现步骤。");
      await page.getByRole("button", { name: "保留编辑为新版本" }).click();
      const feedback = page.getByRole("textbox", { name: "优化反馈" });
      await feedback.fill("模拟失败，验证保留输入");
      await page.getByRole("button", { name: "按反馈优化一次", exact: true }).click();
      await page.getByText(/模型服务返回异常/).waitFor();
      assert((await editor.inputValue()).includes("编辑补充"));
      assert.equal(await feedback.inputValue(), "模拟失败，验证保留输入");
      await feedback.fill("补充验收标准，保留约束");
      await page.getByRole("button", { name: "按反馈优化一次", exact: true }).click();
      await page.getByText(/新版本已保留，尚未采用/).waitFor();
      assert((await editor.inputValue()).includes("验收补充"));
      const recommended = page.locator("section").filter({ has: page.getByRole("heading", { name: "项目任务包", exact: true }) }).locator("pre").first();
      assert(!(await recommended.innerText()).includes("验收补充"));
      await page.getByText(/版本与比较（/).click();
      assert((await page.getByLabel("查看版本").locator("option").count()) === 3);
      assert((await page.getByText(/改动摘要：/).innerText()).includes("新增/改写"));
      await page.getByRole("button", { name: "采用当前查看版本" }).click();
      try { await recommended.filter({ hasText: "验收补充" }).waitFor({ timeout: 5000 }); }
      catch (error) {
        await page.screenshot({ path: path.join(root, "adoption-failure.png"), fullPage: true });
        console.log(JSON.stringify({ selected: await page.getByLabel("查看版本").inputValue(), options: await page.getByLabel("查看版本").innerText(), status: await page.getByRole("status").allTextContents(), recommended: await recommended.innerText() }));
        throw error;
      }
      assert((await recommended.innerText()).includes("验收补充"));
      await page.getByRole("button", { name: "复制推荐指令", exact: true }).click();
      assert((await page.evaluate(() => navigator.clipboard.readText())).includes("验收补充"));
      await page.getByRole("button", { name: "复制整个任务包", exact: true }).click();
      assert((await page.evaluate(() => navigator.clipboard.readText())).includes("AGENT.md"));
      await page.getByRole("button", { name: "保存工作台到本地" }).click();
      await page.getByText(/工作台已保存到此浏览器/).waitFor();
      const before = await page.evaluate(() => JSON.parse(localStorage.getItem("intent2prompt-history-v2")));
      await page.reload(); await editor.waitFor();
      const after = await page.evaluate(() => JSON.parse(localStorage.getItem("intent2prompt-history-v2")));
      assert.deepEqual(after, before);
      assert((await recommended.innerText()).includes("验收补充"));
      for (const [label, filename] of [["导出 Markdown", `package-${viewport.width}.md`], ["导出工作台 Markdown", `workspace-${viewport.width}.md`]]) {
        const wait = page.waitForEvent("download"); await page.getByRole("button", { name: label, exact: true }).click();
        const download = await wait; const file = path.join(root, filename); await download.saveAs(file);
        const markdown = await fs.readFile(file, "utf8"); assert(markdown.includes("验收补充"));
        if (label.includes("工作台")) { assert(markdown.includes("父版本")); assert(markdown.includes("e2e-local-mock")); }
      }
      await page.getByText(/版本与比较（/).click();
      await page.getByText("结构检查（当前编辑内容）", { exact: true }).click();
      assert(await page.getByText(/仅检测文字线索/).isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole("heading", { name: "编辑与优化工作台" }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(root, `workbench-${viewport.width}.png`) });
      // 删除保存的记录，刷新后不再恢复任务。
      while (await page.getByRole("button", { name: "删除此记录", exact: true }).count()) {
        const deletes = page.getByRole("button", { name: "删除此记录", exact: true });
        const count = await deletes.count(); await deletes.first().click();
        await page.waitForFunction((previous) => [...document.querySelectorAll("button")].filter((b) => b.textContent === "删除此记录").length < previous, count);
      }
      await page.reload(); assert(await page.getByText(/点击生成后/).isVisible());
      report.push({ viewport, workflow: "生成/澄清/编辑/失败保留/重试优化/比较/采用/复制/保存/刷新/导出/删除", status: "passed", model: "rule generation; browser optimization API mock only" });
      await context.close();
    }
    // 无模型与损坏/不可用存储用独立浏览器上下文验证。
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await context.newPage();
    await page.route("**/api/optimize", (route) => route.request().method() === "GET" ? route.fulfill({ json: { available: false, message: "模型优化不可用（测试 mock 配置）", requestId: "mock-capability" } }) : route.abort());
    await page.goto(base); await page.getByRole("button", { name: "生成任务指令", exact: true }).click();
    await page.getByRole("textbox", { name: "编辑所选指令" }).waitFor();
    assert(await page.getByRole("button", { name: "按反馈优化一次", exact: true }).isDisabled());
    await page.getByRole("textbox", { name: "编辑所选指令" }).fill("目标：写说明；背景：待补充；输出 Markdown；不得编造；验收：核对来源");
    await page.getByRole("button", { name: "保留编辑为新版本" }).click();
    assert(await page.getByText(/已保留编辑版本/).isVisible());
    await page.evaluate(() => localStorage.setItem("intent2prompt-history-v2", "{broken")); await page.reload();
    assert(await page.getByText(/本地记录损坏/).isVisible());
    await context.close();
    const unavailable = await browser.newContext(), blocked = await unavailable.newPage();
    await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked-storage"); } }));
    await blocked.goto(base); assert(await blocked.getByText(/浏览器本地存储不可用/).isVisible());
    await unavailable.close();
    report.push({ workflow: "无模型编辑 / 损坏记录提示 / 不可用存储提示", status: "passed" });
    assert.deepEqual(failures, []);
    await fs.writeFile(path.join(root, "e2e-report.json"), JSON.stringify({ report, pageErrors: failures }, null, 2));
    console.log(JSON.stringify({ report, pageErrors: failures }, null, 2));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
