"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-sage-dark relative z-10">
      <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-sm border border-sage-light/40 space-y-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-sage-dark">隐私政策</h1>
          <p className="mt-2 text-sm text-sage-muted">最近更新日期：2026年7月</p>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. 核心承诺</h2>
            <p>
              Lumiwell 是一款情绪记录辅助工具。我们深知您在这里记录的内容包含极为私密的情感和心理状态。我们承诺：**您的数据归您所有，我们绝不会出售您的任何个人数据。**
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 我们收集哪些信息</h2>
            <p>为了提供日记解析与智能对话服务，我们会收集以下信息：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sage-muted">
              <li><strong>账号信息</strong>：您的邮箱地址（用于登录和找回数据）。</li>
              <li><strong>内容数据</strong>：您输入的聊天内容、日记底稿及生成的结构化数据（如情绪、洞察）。</li>
              <li><strong>系统数据</strong>：为了保证服务稳定，可能会收集基础设备信息和错误日志。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 敏感信息的处理</h2>
            <p>
              由于您可能输入包含心理状态、情绪挣扎等高度敏感的个人信息，我们在处理这些数据时会使用业内标准的加密传输。数据在送往大语言模型处理时，我们承诺模型提供方仅进行处理，**绝不用于训练其公共模型**。
            </p>
            <p className="mt-2 text-red-600/80 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
              特别提醒：我们不是医疗机构，无法提供心理诊断或危机干预。若您有严重的心理危机或自我伤害倾向，请立即寻求专业医疗机构或拨打危机援助热线。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 您的数据权利 (GDPR 响应)</h2>
            <p>您对自己的数据拥有绝对的控制权。您可以在用户设置中随时行使以下权利：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sage-muted">
              <li><strong>访问与导出</strong>：一键下载您产生的所有聊天与日记记录。</li>
              <li><strong>彻底删除</strong>：注销账号将永久、不可逆地清除您在数据库中的所有关联数据。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 联系我们</h2>
            <p>
              如果您对本隐私政策有任何疑问或希望行使您的数据权利，请通过您的注册邮箱与我们联系：support@lumiwell.com。
            </p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-sage-light/40 flex justify-center">
          <button 
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-sage-50 text-sage-dark/80 hover:text-sage-dark hover:bg-sage-100/50 rounded-full font-medium transition-all text-sm border border-sage-100"
          >
            我已阅读并知晓
          </button>
        </div>
      </div>
    </div>
  );
}
