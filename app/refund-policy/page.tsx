"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefundPolicyPage() {
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
            {lang === 'zh' ? '退款政策' : 'Refund Policy'}
          </h1>
          <p className="mt-2 text-sm text-sage-muted">
            {lang === 'zh' ? '最近更新日期：2026年7月' : 'Last Updated: July 2026'}
          </p>
        </div>

        {lang === 'zh' ? (
          <div className="space-y-6 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. 退款总则</h2>
              <p>
                感谢您选择 觉察。我们深知购买一款工具需要信任，因此我们希望为您提供安心的购买体验。由于我们提供的是数字服务（软件即服务，SaaS），一经使用，产生的 AI 计算成本将无法收回，但我们依然为您提供了合理的退款保障。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. 48小时全额退款保证</h2>
              <p>
                如果您在首次购买墨水包后感到不满意，您可以在<strong className="font-semibold text-sage-dark">购买后的 48 小时内</strong>且未使用墨水的情况下申请全额退款，我们将不问任何理由（No Questions Asked）为您办理退款。
              </p>
              <p className="mt-2 text-sage-muted">
                请注意，此政策仅适用于您的首次购买。后续的复购订单由于属于消耗品补充，一般不适用此条款。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. 异常情况退款</h2>
              <p>
                在极少数情况下（如服务长时间不可用、重复扣款错误等），请提供相关截图和支付凭证联系我们，我们将为您按比例或全额退款。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. 无法退款的情况</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sage-muted">
                <li>超过首次购买 48 小时后提出的退款申请；</li>
                <li>一旦您开始消耗墨水包内的任何额度，由于大模型算力成本已经实际产生，该订单即不可退款；</li>
                <li>违反了《服务条款》而导致账户被封禁的情况。</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. 如何申请退款</h2>
              <p>
                请使用您注册 觉察 的邮箱，发送邮件至 <strong>support@hermeticbox.com</strong>，并在邮件主题中标明“退款申请”。请在邮件正文中提供您的购买凭证和订单号。我们将在 3-5 个工作日内处理您的请求。退款将原路返回您的支付账户。
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-6 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. General Principles</h2>
              <p>
                Thank you for choosing Juecha. We understand that purchasing a tool requires trust, and we want to provide you with a worry-free buying experience. Since we offer a digital service (Software as a Service, SaaS), the AI computation costs incurred upon usage cannot be recovered. However, we still provide a reasonable refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. 48-Hour Money-Back Guarantee</h2>
              <p>
                If you are not satisfied after your first Ink pack purchase, you can request a full refund <strong className="font-semibold text-sage-dark">within 48 hours of purchase</strong> as long as no Ink has been consumed. We will process the refund for you, no questions asked.
              </p>
              <p className="mt-2 text-sage-muted">
                Please note that this policy applies only to your first-time purchase. Subsequent repurchase orders are considered consumable top-ups and are generally not eligible under this clause.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Exceptions & Special Cases</h2>
              <p>
                In rare cases (such as prolonged service unavailability or duplicate billing errors), please contact us with relevant screenshots and payment proofs. We will issue a prorated or full refund depending on the situation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Non-Refundable Situations</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sage-muted">
                <li>Refund requests submitted more than 48 hours after the initial purchase;</li>
                <li>Once any Ink credits from a pack have been consumed, the entire order becomes non-refundable, as AI compute costs have already been incurred;</li>
                <li>Cases where your account has been suspended or banned due to violations of our Terms of Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. How to Request a Refund</h2>
              <p>
                Please use the email address associated with your Juecha account to send an email to <strong>support@hermeticbox.com</strong>, with "Refund Request" in the subject line. Please include your purchase receipt and order number in the body of the email. We will process your request within 3-5 business days. The refund will be credited back to your original payment method.
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
