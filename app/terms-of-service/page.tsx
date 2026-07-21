"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-sage-dark relative z-10">
      <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-sm border border-sage-light/40 space-y-8 relative">
        
        {/* Language Switcher */}
        <div className="flex justify-center sm:absolute sm:top-8 sm:right-8 mb-6 sm:mb-0 bg-sage-light/50 rounded-full p-1 border border-sage-100 w-fit mx-auto sm:mx-0">
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
            {lang === 'zh' ? '服务条款' : 'Terms of Service'}
          </h1>
          <p className="mt-2 text-sm text-sage-muted">
            {lang === 'zh' ? '最近更新日期：2026年7月' : 'Last Updated: July 2026'}
          </p>
        </div>

        {lang === 'zh' ? (
          <div className="space-y-6 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. 接受条款</h2>
              <p>
                欢迎使用 觉察（“本服务”）。通过访问或使用本服务，即表示您同意受这些条款和条件的约束。如果您不同意本条款的任何部分，则您不得访问本服务。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. 我们的服务性质</h2>
              <p>
                觉察 提供基于人工智能的情绪引导和日记辅助功能。<strong className="font-semibold text-sage-dark">请注意：我们不提供专业的医疗建议、心理诊断或危机干预。</strong> 本服务不能替代专业的医疗或心理治疗。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. 账户和安全性</h2>
              <p>
                您需要通过邮箱等方式注册账户才能使用我们的完整服务。您必须保证提供的信息准确完整，并对您的账户安全负全部责任。我们不会对因您未能保护账户而导致的任何损失负责。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. 支付与按需购买</h2>
              <p>
                觉察 采取“按需购买”（Pay-as-you-go）的模式，不设置强制订阅，也没有自动续费的压力。所有的支付处理由安全的第三方 Merchant of Record (MoR) 平台完成。您可以根据自己的觉察需求，随时补充墨水。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">5. 免责声明</h2>
              <p>
                在适用法律允许的最大范围内，觉察 对因使用或无法使用本服务而产生的任何直接、间接、偶然、特殊、后果性或惩罚性损害不承担责任。服务按“现状”提供，不包含任何明示或暗示的担保。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. 联系我们</h2>
              <p>
                如对本服务条款有任何疑问，请联系：support@hermeticbox.com。
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-6 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                Welcome to Juecha ("the Service"). By accessing or using the Service, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Nature of Our Services</h2>
              <p>
                Juecha provides AI-based emotional guidance and journaling assistance. <strong className="font-semibold text-sage-dark">Please note: We do not provide professional medical advice, psychological diagnosis, or crisis intervention.</strong> This Service is not a substitute for professional medical or psychological treatment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Accounts and Security</h2>
              <p>
                You must register for an account (e.g., via email) to use our full services. You must guarantee that the information you provide is accurate and complete, and you are entirely responsible for maintaining the security of your account. We will not be liable for any loss or damage arising from your failure to protect your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Payments and Pay-as-you-go</h2>
              <p>
                Juecha operates on a "Pay-as-you-go" model with no mandatory subscriptions and no auto-renewal pressure. All payment processing is handled by a secure third-party Merchant of Record (MoR) platform. You can top up your Ink balance at any time according to your journaling needs.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Disclaimer</h2>
              <p>
                To the maximum extent permitted by applicable law, Juecha shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. The Service is provided on an "AS IS" and "AS AVAILABLE" basis, without any express or implied warranties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at: support@hermeticbox.com.
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
