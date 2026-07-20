"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-sage-dark relative z-10">
      <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-sm border border-sage-light/40 space-y-8 relative">
        
        {/* Language Switcher */}
        <div className="absolute top-8 right-8 flex bg-sage-light/50 rounded-full p-1 border border-sage-100">
          <button 
            onClick={() => setLang('zh')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === 'zh' ? 'bg-white shadow-sm text-sage-dark' : 'text-sage-muted hover:text-sage-dark'}`}
          >
            中文
          </button>
          <button 
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === 'en' ? 'bg-white shadow-sm text-sage-dark' : 'text-sage-muted hover:text-sage-dark'}`}
          >
            EN
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-sage-dark">
            {lang === 'zh' ? '隐私政策' : 'Privacy Policy'}
          </h1>
          <p className="mt-2 text-sm text-sage-muted">
            {lang === 'zh' ? '最近更新日期：2026年7月' : 'Last Updated: July 2026'}
          </p>
        </div>

        {lang === 'zh' ? (
          <div className="space-y-6 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. 核心承诺</h2>
              <p>
                觉察 是一款情绪记录辅助工具。我们深知您在这里记录的内容包含极为私密的情感和心理状态。我们承诺：<strong className="font-semibold text-sage-dark">您的数据归您所有，我们绝不会出售您的任何个人数据。</strong>
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
                由于您可能输入包含心理状态、情绪挣扎等高度敏感的个人信息，我们在处理这些数据时会使用业内标准的加密传输。数据在送往大语言模型处理时，我们承诺<strong className="font-semibold text-sage-dark">仅挑选并使用那些符合高隐私标准、并在其官方条款中明确承诺不将 API 数据用于模型训练的服务商</strong>。
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
                如果您对本隐私政策有任何疑问或希望行使您的数据权利，请通过您的注册邮箱与我们联系：support@hermeticbox.com。
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-6 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Our Core Commitment</h2>
              <p>
                Juecha is an emotional journaling tool. We deeply understand that the content you record here contains highly private emotional and psychological states. We promise: <strong className="font-semibold text-sage-dark">Your data belongs to you, and we will never sell any of your personal data.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <p>To provide diary analysis and intelligent conversation services, we collect the following information:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sage-muted">
                <li><strong>Account Information</strong>: Your email address (used for login and data recovery).</li>
                <li><strong>Content Data</strong>: The chat content you input, diary drafts, and generated structured data (such as emotions and insights).</li>
                <li><strong>System Data</strong>: To ensure service stability, we may collect basic device information and error logs.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Processing of Sensitive Information</h2>
              <p>
                Because you may input highly sensitive personal information containing psychological states and emotional struggles, we use industry-standard encryption when handling this data. When data is sent to Large Language Models for processing, we pledge to <strong className="font-semibold text-sage-dark">only use service providers that meet high privacy standards and explicitly commit in their terms not to use API data for model training</strong>.
              </p>
              <p className="mt-2 text-red-600/80 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                Special Notice: We are not a medical institution and cannot provide psychological diagnosis or crisis intervention. If you are experiencing a severe psychological crisis or self-harm tendencies, please seek professional medical help or call a crisis hotline immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Your Data Rights (GDPR Compliance)</h2>
              <p>You have absolute control over your own data. You can exercise the following rights at any time in user settings:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sage-muted">
                <li><strong>Access and Export</strong>: One-click download of all your chat and diary records.</li>
                <li><strong>Complete Deletion</strong>: Deleting your account will permanently and irreversibly erase all your associated data from our database.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us via your registered email at: support@hermeticbox.com.
              </p>
            </section>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-sage-light/40 flex justify-center">
          <button 
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-sage-50 text-sage-dark/80 hover:text-sage-dark hover:bg-sage-100/50 rounded-full font-medium transition-all text-sm border border-sage-100"
          >
            {lang === 'zh' ? '返回' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  );
}
