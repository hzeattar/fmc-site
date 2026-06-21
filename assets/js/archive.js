/* =========================================================
   FMC — Historical Archive (interactive year switcher)
   Data covers 2015–2024. Renders summary, KPIs, themes,
   key publications and milestone for the selected year.
   Reacts to fmc:langchange and falls back to English.
   ========================================================= */
(function () {
  var DATA = {
    en: {
      "2024": {
        title: "2024 — Resilience under stress and the rise of digital‑asset oversight",
        summary: "A year defined by elevated geopolitical risk, a maturing crypto perimeter, and the first full cycle of operational resilience reporting under the FMC's revised supervisory handbook. The Commission expanded its remit to cover stablecoin issuance and tightened expectations on retail conduct, while continuing to return funds to harmed investors at record pace.",
        stats: [
          { label: "Authorised firms", value: "3,142" },
          { label: "Penalties imposed", value: "£48.0m" },
          { label: "Restitution returned", value: "£31.7m" },
          { label: "Whistleblower reports", value: "1,964" }
        ],
        themes: [
          { title: "Operational resilience", body: "Major banks, payment institutions and trading venues completed their second self‑assessments against the FMC's Important Business Services framework. The Commission published thematic findings on third‑party concentration risk and required 18 firms to remediate impact tolerances." },
          { title: "Digital assets perimeter", body: "Following Treasury designation, the FMC began authorising fiat‑referenced stablecoin issuers and qualifying crypto custodians. A transitional regime, FMC‑PS24/3, set out client‑money safeguarding rules adapted for on‑chain settlement." },
          { title: "Consumer Duty Year One Review", body: "Twelve months after entry into force, the Commission reviewed firm outcomes, finding measurable improvements in product governance and price‑and‑value testing for retail investment products. Three firms were referred to Enforcement for systemic Duty failings." },
          { title: "Authorisation pipeline", body: "Median time from complete application to determination fell to 4.6 months. The FMC closed a backlog of 412 applications inherited from the prior cycle and rejected 7.3% on prudential grounds." }
        ],
        publications: [
          { date: "Jan 2024", title: "Business Plan 2024–2027 and fee rates" },
          { date: "Apr 2024", title: "Cryptoasset Financial Promotions: post‑implementation report" },
          { date: "Jul 2024", title: "Operational Resilience: cross‑market lessons learned" },
          { date: "Oct 2024", title: "Annual Enforcement Statistics" },
          { date: "Dec 2024", title: "Consumer Duty Year One Review" }
        ],
        milestone: "First authorisation of a fiat‑referenced stablecoin issuer under the new digital‑assets regime."
      },
      "2023": {
        title: "2023 — Consumer Duty enters into force",
        summary: "The flagship Consumer Duty came into force in July 2023, raising the standard of care that firms must give retail customers. Inflation‑driven cost‑of‑living pressures shaped the FMC's supervisory agenda, with intensified focus on savings rates, vulnerable customers, and unregulated financial influencers.",
        stats: [
          { label: "Authorised firms", value: "3,089" },
          { label: "Penalties imposed", value: "£42.5m" },
          { label: "Restitution returned", value: "£27.9m" },
          { label: "Whistleblower reports", value: "1,712" }
        ],
        themes: [
          { title: "Consumer Duty implementation", body: "Firms completed their first board attestations against the four Duty outcomes — products & services, price & value, consumer understanding, and consumer support. The FMC published 14 sectoral letters explaining its supervisory expectations in retail banking, insurance, asset management, and payment services." },
          { title: "Cost‑of‑living response", body: "A targeted review of forbearance practices covered 67 lenders. The Commission required improvements at 22 firms and saw a 31% increase in proactive customer support compared with 2022." },
          { title: "Influencers and financial promotions", body: "New rules required all financial promotions communicated by social media to be approved by an authorised firm. The Commission opened 287 cases against unauthorised promoters and removed over 10,000 illegal adverts in cooperation with platform operators." },
          { title: "Retirement income market", body: "A thematic review of decumulation outcomes found that a quarter of self‑directed drawdown customers were taking unsustainable withdrawals. Industry guidance was revised in Q4." }
        ],
        publications: [
          { date: "Feb 2023", title: "Business Plan 2023–2026" },
          { date: "Jul 2023", title: "Consumer Duty: final implementation guidance" },
          { date: "Sep 2023", title: "Borrowers in financial difficulty: thematic review" },
          { date: "Nov 2023", title: "Financial Promotions: data dashboard" },
          { date: "Dec 2023", title: "Annual Enforcement Statistics" }
        ],
        milestone: "Entry into force of the Consumer Duty for new and existing products on 31 July 2023."
      },
      "2022": {
        title: "2022 — Volatility, sanctions and a new supervisory rulebook",
        summary: "Russia's invasion of Ukraine triggered unprecedented coordinated sanctions and tested the resilience of UK financial firms. The FMC consulted on what would become the Consumer Duty, ran the first cross‑market liquidity stress test of liability‑driven investment (LDI) funds, and modernised its enforcement procedures.",
        stats: [
          { label: "Authorised firms", value: "3,015" },
          { label: "Penalties imposed", value: "£38.2m" },
          { label: "Restitution returned", value: "£24.6m" },
          { label: "Whistleblower reports", value: "1,503" }
        ],
        themes: [
          { title: "Sanctions and financial crime", body: "The FMC coordinated with HM Treasury and the National Crime Agency to ensure firms could implement designated‑person screening within agreed timeframes. Supervisory visits to 41 firms uncovered control gaps that were remediated by year‑end." },
          { title: "LDI and gilt market stress", body: "Following the September gilt episode, the Commission ran a coordinated stress test with the Bank of England and required pension scheme advisers to hold higher operational liquidity buffers." },
          { title: "Consumer Duty consultation", body: "Final policy statement PS22/9 was published in July and set the implementation timetable. The FMC launched a dedicated implementation portal that received over 8,400 firm queries during the year." },
          { title: "Enforcement modernisation", body: "A new Decision Procedures Manual was published, shortening typical case duration by 22% and introducing standing settlement panels for routine outcomes." }
        ],
        publications: [
          { date: "Mar 2022", title: "Sanctions guidance for authorised firms" },
          { date: "Jul 2022", title: "PS22/9: A new Consumer Duty" },
          { date: "Oct 2022", title: "LDI cross‑market stress test report" },
          { date: "Nov 2022", title: "Decision Procedures Manual (revised)" }
        ],
        milestone: "Final Consumer Duty rules published, with implementation set for 2023."
      },
      "2021": {
        title: "2021 — Recovery, retail boom and stronger conduct expectations",
        summary: "Markets rebounded as pandemic restrictions eased, and a retail‑investing surge brought new firms and new risks. The FMC rolled out the new investor compensation thresholds, opened a strengthened authorisations gateway, and began a multi‑year programme to cleanse the public register of dormant permissions.",
        stats: [
          { label: "Authorised firms", value: "2,948" },
          { label: "Penalties imposed", value: "£35.4m" },
          { label: "Restitution returned", value: "£21.3m" },
          { label: "Whistleblower reports", value: "1,388" }
        ],
        themes: [
          { title: "Retail investing surge", body: "The Commission took early action against 32 firms whose marketing of high‑risk investments to inexperienced consumers fell below standard. New disclosure requirements for high‑risk investments were consulted on in November." },
          { title: "Stronger authorisations gateway", body: "All applicants were now required to evidence wind‑down planning, governance, and viable distribution from day one. Refusal rates rose from 4.1% to 6.8%, while overall determination time fell." },
          { title: "Register clean‑up", body: "A 24‑month programme began to remove permissions from firms that had not used them. Over 2,000 entries were updated and 600 firms were referred for cancellation." },
          { title: "Climate disclosures", body: "Premium‑listed firms and the largest asset managers reported for the first full year against TCFD‑aligned standards." }
        ],
        publications: [
          { date: "Apr 2021", title: "Strong and simple framework discussion paper" },
          { date: "Jun 2021", title: "Authorisations gateway: stronger expectations" },
          { date: "Nov 2021", title: "High‑risk investments consultation" },
          { date: "Dec 2021", title: "TCFD‑aligned disclosures: implementation review" }
        ],
        milestone: "Launch of the multi‑year programme to cleanse dormant permissions from the public register."
      },
      "2020": {
        title: "2020 — A pandemic response without precedent",
        summary: "The FMC moved within days to support firms, customers and markets through Covid‑19. Operational reliefs, payment‑deferral guidance and a fast‑tracked programme of customer support measures were introduced while preserving market integrity. Enforcement work continued remotely for the first time at full scale.",
        stats: [
          { label: "Authorised firms", value: "2,886" },
          { label: "Penalties imposed", value: "£29.1m" },
          { label: "Restitution returned", value: "£17.8m" },
          { label: "Whistleblower reports", value: "1,196" }
        ],
        themes: [
          { title: "Covid‑19 customer support", body: "The Commission published rapid guidance on payment deferrals, mortgage forbearance and credit reporting. Over £62 billion of customer balances were supported through deferral programmes." },
          { title: "Operational continuity", body: "All authorised firms confirmed business continuity arrangements; thematic data was collected from 920 firms. Two clearing houses successfully invoked their split‑site protocols." },
          { title: "Market abuse surveillance", body: "Increased volumes prompted a refresh of the FMC's market data lake; daily order records ingested rose to 7.2 billion." },
          { title: "Brexit implementation", body: "The Temporary Permissions Regime came into force on 1 January 2021; throughout 2020, the FMC processed 1,438 firms onto the regime." }
        ],
        publications: [
          { date: "Mar 2020", title: "Covid‑19: expectations for firms" },
          { date: "Jun 2020", title: "Payment deferrals: extension and tapering" },
          { date: "Oct 2020", title: "Operational continuity in resolution" },
          { date: "Dec 2020", title: "Brexit Temporary Permissions Regime: readiness" }
        ],
        milestone: "Pandemic‑era customer support measures protected over £62 billion of borrower balances."
      },
      "2019": {
        title: "2019 — Brexit readiness and the rise of digital scams",
        summary: "Preparations for the United Kingdom's withdrawal from the European Union dominated the supervisory agenda. At the same time, online investment fraud rose sharply, prompting the FMC to launch its national 'ScamSmart' campaign and to deepen partnerships with online platforms.",
        stats: [
          { label: "Authorised firms", value: "2,801" },
          { label: "Penalties imposed", value: "£32.7m" },
          { label: "Restitution returned", value: "£15.4m" },
          { label: "Whistleblower reports", value: "1,041" }
        ],
        themes: [
          { title: "Brexit readiness", body: "The Temporary Permissions Regime was finalised and a parallel onshoring programme transposed over 1,500 pages of EU rules into the UK statute book in coordination with HM Treasury." },
          { title: "ScamSmart campaign", body: "A national awareness campaign reached 78% of UK adults; the consumer warning list grew to over 1,200 unauthorised firms." },
          { title: "SM&CR extension", body: "The Senior Managers and Certification Regime was extended to all solo‑regulated firms in December, raising governance and accountability standards across the sector." },
          { title: "LIBOR transition", body: "Industry milestones for ceasing new GBP LIBOR‑linked lending were set; firm‑by‑firm transition plans were collected." }
        ],
        publications: [
          { date: "Mar 2019", title: "Brexit: a guide for authorised firms" },
          { date: "Jul 2019", title: "ScamSmart impact report" },
          { date: "Dec 2019", title: "SM&CR: extension to all firms" }
        ],
        milestone: "Senior Managers and Certification Regime extended to every solo‑regulated firm."
      },
      "2018": {
        title: "2018 — Open finance, MiFID II in practice and a tougher conduct stance",
        summary: "The first full year of MiFID II disclosures reshaped how investment costs and best execution were reported. The Commission embedded its Open Finance roadmap, brought a record number of skilled persons reviews, and strengthened its rulebook on platform competition.",
        stats: [
          { label: "Authorised firms", value: "2,742" },
          { label: "Penalties imposed", value: "£28.4m" },
          { label: "Restitution returned", value: "£12.6m" },
          { label: "Whistleblower reports", value: "927" }
        ],
        themes: [
          { title: "MiFID II in practice", body: "Cost and charges disclosures were standardised; the FMC reviewed 41 firms and required corrective action at 12 of them." },
          { title: "Open Finance", body: "The Commission published its long‑term vision for consumer‑permissioned data sharing across savings, investments, mortgages and pensions." },
          { title: "Asset management market study", body: "Final remedies, including box‑profit transparency and stronger value assessments, came into force." },
          { title: "Cyber resilience", body: "The first cross‑sector cyber stress exercise involved 24 systemic firms and three financial market infrastructures." }
        ],
        publications: [
          { date: "Mar 2018", title: "Asset Management Market Study: final remedies" },
          { date: "Jun 2018", title: "Approach to consumers" },
          { date: "Nov 2018", title: "Open Finance: discussion paper" },
          { date: "Dec 2018", title: "Cyber stress exercise: lessons learned" }
        ],
        milestone: "Final remedies of the Asset Management Market Study took effect, including standalone value assessments."
      },
      "2017": {
        title: "2017 — Mission, Approach Documents and supervisory transparency",
        summary: "The FMC published its Mission and a series of Approach Documents that set out, for the first time, a coherent public framework for how it makes decisions on authorisation, supervision, enforcement and consumer protection. The year also saw final preparation for MiFID II, GDPR and the Senior Managers Regime.",
        stats: [
          { label: "Authorised firms", value: "2,684" },
          { label: "Penalties imposed", value: "£25.8m" },
          { label: "Restitution returned", value: "£10.9m" },
          { label: "Whistleblower reports", value: "868" }
        ],
        themes: [
          { title: "Mission and Approach Documents", body: "Five Approach Documents — to authorisation, supervision, enforcement, consumers and competition — were published for consultation, then finalised in 2018." },
          { title: "Asset Management Market Study", body: "Interim findings concluded that competition was not working effectively, particularly for retail investors. Proposed remedies were consulted on." },
          { title: "MiFID II go‑live", body: "Implementation across 1,800+ in‑scope firms; reporting infrastructure was readiness‑tested in October and November." },
          { title: "GDPR readiness", body: "The Commission worked with the Information Commissioner's Office to provide joint guidance for financial firms." }
        ],
        publications: [
          { date: "Apr 2017", title: "Our Mission" },
          { date: "Sep 2017", title: "Asset Management Market Study: interim report" },
          { date: "Nov 2017", title: "MiFID II: final implementation pack" }
        ],
        milestone: "Publication of the FMC Mission and the first set of Approach Documents."
      },
      "2016": {
        title: "2016 — Pension freedoms in steady state and a sharper firm gateway",
        summary: "Two years on from pension freedoms, the FMC focused on outcomes for those entering retirement and on raising the bar for new firms entering the regulated perimeter. A landmark ruling on payment‑protection insurance redress timetables also shaped the year.",
        stats: [
          { label: "Authorised firms", value: "2,612" },
          { label: "Penalties imposed", value: "£22.9m" },
          { label: "Restitution returned", value: "£9.1m" },
          { label: "Whistleblower reports", value: "812" }
        ],
        themes: [
          { title: "Retirement outcomes review", body: "Initial findings showed that nearly half of consumers were going into drawdown without taking advice. The Commission consulted on default investment pathways." },
          { title: "Authorisation gateway", body: "Stricter expectations on prudential resources and wind‑down planning were introduced; 4.1% of applications were refused, up from 2.8% the prior year." },
          { title: "PPI deadline", body: "A final complaints deadline for payment‑protection insurance was confirmed for August 2019, accompanied by a two‑year national consumer campaign." },
          { title: "Innovation Hub expansion", body: "The regulatory sandbox accepted its second cohort, including blockchain‑based settlement and biometric onboarding firms." }
        ],
        publications: [
          { date: "Apr 2016", title: "Retirement outcomes review: terms of reference" },
          { date: "Aug 2016", title: "PPI: final deadline policy statement" },
          { date: "Nov 2016", title: "Regulatory sandbox: cohort 2 update" }
        ],
        milestone: "Confirmation of the PPI complaints deadline and accompanying public awareness campaign."
      },
      "2015": {
        title: "2015 — Foundation year: pension freedoms, sandbox launch and conduct standards",
        summary: "The FMC entered its mandate amid the most significant change to UK pensions in a generation. Within twelve months it had supervised the first wave of pension‑freedoms business, launched the world's first regulatory sandbox for innovation, and codified the conduct standards expected of senior managers in banking.",
        stats: [
          { label: "Authorised firms", value: "2,557" },
          { label: "Penalties imposed", value: "£19.6m" },
          { label: "Restitution returned", value: "£7.4m" },
          { label: "Whistleblower reports", value: "763" }
        ],
        themes: [
          { title: "Pension freedoms", body: "From April 2015, savers could access their defined‑contribution pots flexibly. The FMC operationalised Pension Wise, set rules on risk warnings, and ran early supervisory visits to 28 providers." },
          { title: "Regulatory sandbox", body: "The world's first regulatory sandbox accepted its first cohort of 24 firms, enabling them to test new propositions in a controlled environment with real consumers." },
          { title: "Senior Managers Regime — banking", body: "The Senior Managers and Certification Regime was implemented for deposit‑takers and PRA‑designated investment firms, replacing the Approved Persons Regime for those sectors." },
          { title: "Consumer Credit transition", body: "The Commission completed the transition of consumer credit firms from the OFT to its own perimeter, authorising over 39,000 firms." }
        ],
        publications: [
          { date: "Mar 2015", title: "Pension freedoms: rules for retail providers" },
          { date: "Nov 2015", title: "Regulatory sandbox: design proposals" },
          { date: "Dec 2015", title: "Senior Managers Regime — banking: final rules" }
        ],
        milestone: "Launch of the world's first regulatory sandbox for financial innovation."
      }
    },

    ar: {
      "2024": {
        title: "2024 — الصمود تحت الضغط وصعود الرقابة على الأصول الرقمية",
        summary: "عام تشكّل ملامحه ارتفاعُ المخاطر الجيوسياسية، ونضوجُ نطاق العملات المشفّرة، واكتمالُ أوّل دورة كاملة لتقارير الصمود التشغيلي وفق دليل الإشراف المُحدَّث للهيئة. وقد وسّعت المفوضية اختصاصها ليشمل إصدار العملات المستقرّة، وشدّدت توقّعاتها بشأن سلوك التجزئة، مع مواصلة إعادة الأموال إلى المستثمرين المتضرّرين بوتيرة قياسية.",
        stats: [
          { label: "الشركات المرخّصة", value: "3,142" },
          { label: "الغرامات المفروضة", value: "48.0 مليون £" },
          { label: "المبالغ المُعادة", value: "31.7 مليون £" },
          { label: "بلاغات المُخبرين", value: "1,964" }
        ],
        themes: [
          { title: "الصمود التشغيلي", body: "أكملت كبرى البنوك ومؤسسات المدفوعات وأماكن التداول التقييم الذاتي الثاني وفق إطار الخدمات التجارية الجوهرية. ونشرت الهيئة نتائج موضوعية حول مخاطر تركّز الطرف الثالث، وألزمت 18 شركة بمعالجة حدود الأثر." },
          { title: "نطاق الأصول الرقمية", body: "بعد تخصيص وزارة الخزانة، بدأت الهيئة في ترخيص مُصدري العملات المستقرّة المُسنَدة إلى عملة تقليدية ومقدّمي حفظ الأصول الرقمية المؤهَّلين. وحدّد النظام الانتقالي FMC‑PS24/3 قواعد حماية أموال العملاء بما يتلاءم مع التسوية على السلسلة." },
          { title: "مراجعة السنة الأولى لواجب المستهلك", body: "بعد اثني عشر شهراً من سريان المفعول، راجعت المفوضية نتائج الشركات ووجدت تحسّنات قابلة للقياس في حوكمة المنتج واختبار السعر مقابل القيمة لمنتجات الاستثمار للأفراد. وأُحيلت ثلاث شركات إلى الإنفاذ بسبب إخفاقات منهجية." },
          { title: "خط أنابيب الترخيص", body: "انخفض الزمن الوسيط من تقديم الطلب الكامل إلى البتّ فيه إلى 4.6 أشهر. وأنهت الهيئة تراكُم 412 طلباً مَوْروثاً، ورفضت 7.3% منها لأسباب احترازية." }
        ],
        publications: [
          { date: "يناير 2024", title: "خطة العمل 2024–2027 ورسوم الإشراف" },
          { date: "أبريل 2024", title: "الإعلانات المالية للأصول المشفّرة: تقرير ما بعد التطبيق" },
          { date: "يوليو 2024", title: "الصمود التشغيلي: دروس من السوق الشاملة" },
          { date: "أكتوبر 2024", title: "إحصاءات الإنفاذ السنوية" },
          { date: "ديسمبر 2024", title: "مراجعة السنة الأولى لواجب المستهلك" }
        ],
        milestone: "أوّل ترخيص لمُصدر عملة مستقرّة مُسنَدة إلى عملة تقليدية ضمن النظام الجديد للأصول الرقمية."
      },
      "2023": {
        title: "2023 — دخول واجب المستهلك حيّز النفاذ",
        summary: "دخل واجب المستهلك الرئيسي حيّز النفاذ في يوليو 2023، رافعاً معيار العناية الذي يجب أن تُقدّمه الشركات لعملاء التجزئة. وقد شكّلت ضغوط تكلفة المعيشة المدفوعة بالتضخّم أجندة الإشراف، مع تركيز مكثّف على معدّلات الادّخار، والعملاء الضِعاف، والمؤثّرين الماليين غير المرخّصين.",
        stats: [
          { label: "الشركات المرخّصة", value: "3,089" },
          { label: "الغرامات المفروضة", value: "42.5 مليون £" },
          { label: "المبالغ المُعادة", value: "27.9 مليون £" },
          { label: "بلاغات المُخبرين", value: "1,712" }
        ],
        themes: [
          { title: "تطبيق واجب المستهلك", body: "أكملت الشركات أوّل إقرارات لمجالس إداراتها مقابل المخرجات الأربعة للواجب — المنتجات والخدمات، السعر والقيمة، فهم المستهلك، ودعم المستهلك. ونشرت الهيئة 14 رسالة قطاعية تشرح توقّعاتها الإشرافية." },
          { title: "الاستجابة لتكلفة المعيشة", body: "غطّت مراجعة مستهدفة لممارسات الإمهال 67 مُقرضاً. وأَلزمت المفوضية 22 شركة بإجراء تحسينات، وشهدت زيادة بنسبة 31% في الدعم الاستباقي للعملاء مقارنةً بعام 2022." },
          { title: "المؤثّرون والإعلانات المالية", body: "اشترطت قواعد جديدة أن تكون جميع الإعلانات المالية المنشورة عبر وسائل التواصل الاجتماعي معتمدةً من شركة مرخّصة. وفتحت الهيئة 287 قضية ضد مروّجين غير مرخّصين، وأزالت أكثر من 10,000 إعلان غير قانوني." },
          { title: "سوق دخل التقاعد", body: "كشفت مراجعة موضوعية لمخرجات السحب أنّ ربع عملاء السحب الذاتي كانوا يجرون عمليات سحب غير مستدامة. ونُقّح التوجيه الصناعي في الربع الأخير." }
        ],
        publications: [
          { date: "فبراير 2023", title: "خطة العمل 2023–2026" },
          { date: "يوليو 2023", title: "واجب المستهلك: الإرشاد التطبيقي النهائي" },
          { date: "سبتمبر 2023", title: "المقترضون في ضائقة مالية: مراجعة موضوعية" },
          { date: "نوفمبر 2023", title: "الإعلانات المالية: لوحة بيانات" },
          { date: "ديسمبر 2023", title: "إحصاءات الإنفاذ السنوية" }
        ],
        milestone: "دخول واجب المستهلك حيّز النفاذ على المنتجات الجديدة والقائمة في 31 يوليو 2023."
      },
      "2022": {
        title: "2022 — التقلّبات والعقوبات وكتاب قواعد إشرافي جديد",
        summary: "أدّى الغزو الروسي لأوكرانيا إلى عقوبات منسّقة غير مسبوقة اختبرت صمود الشركات المالية في المملكة المتحدة. وأصدرت الهيئة استشارة بشأن ما سيصبح واجب المستهلك، وأجرت أوّل اختبار ضغط للسيولة عبر السوق لصناديق الاستثمار المُقاد بالخصوم (LDI)، وحدّثت إجراءات الإنفاذ.",
        stats: [
          { label: "الشركات المرخّصة", value: "3,015" },
          { label: "الغرامات المفروضة", value: "38.2 مليون £" },
          { label: "المبالغ المُعادة", value: "24.6 مليون £" },
          { label: "بلاغات المُخبرين", value: "1,503" }
        ],
        themes: [
          { title: "العقوبات والجرائم المالية", body: "نسّقت الهيئة مع وزارة الخزانة ووكالة الجرائم الوطنية لضمان قدرة الشركات على تطبيق فحص الأشخاص المُحدَّدين ضمن المهلة المتّفق عليها. وكشفت زيارات إشرافية لـ 41 شركة عن ثغرات تحكّم تمّت معالجتها قبل نهاية العام." },
          { title: "ضغط سوق LDI والسندات الحكومية", body: "في أعقاب أحداث سبتمبر، أجرت المفوضية اختبار ضغط منسّقاً مع بنك إنجلترا، وألزمت مستشاري برامج التقاعد بالاحتفاظ باحتياطيات سيولة تشغيلية أعلى." },
          { title: "استشارة واجب المستهلك", body: "نُشرت بيان السياسة النهائي PS22/9 في يوليو وحدّد الجدول الزمني للتطبيق. وأطلقت الهيئة بوّابة تطبيق مخصّصة استقبلت أكثر من 8,400 استفسار من الشركات." },
          { title: "تحديث الإنفاذ", body: "نُشر دليل جديد لإجراءات القرار، خفّض المدّة النموذجية للقضايا بنسبة 22% وأَدخل لجاناً دائمة للتسوية في النتائج الروتينية." }
        ],
        publications: [
          { date: "مارس 2022", title: "إرشادات العقوبات للشركات المرخّصة" },
          { date: "يوليو 2022", title: "PS22/9: واجب جديد للمستهلك" },
          { date: "أكتوبر 2022", title: "تقرير اختبار الضغط عبر السوق لـ LDI" },
          { date: "نوفمبر 2022", title: "دليل إجراءات القرار (مُنقَّح)" }
        ],
        milestone: "نشر القواعد النهائية لواجب المستهلك، مع تطبيقها في 2023."
      },
      "2021": {
        title: "2021 — التعافي وازدهار التجزئة وتشديد توقّعات السلوك",
        summary: "تعافت الأسواق مع تخفيف قيود الجائحة، وجلب اندفاعُ استثمار التجزئة شركاتٍ جديدة ومخاطرَ جديدة. وطبّقت الهيئة الحدود الجديدة لتعويض المستثمرين، وفتحت بوّابة ترخيص مُعزَّزة، وبدأت برنامجاً متعدّد السنوات لتنقية السجلّ العام من التراخيص الخاملة.",
        stats: [
          { label: "الشركات المرخّصة", value: "2,948" },
          { label: "الغرامات المفروضة", value: "35.4 مليون £" },
          { label: "المبالغ المُعادة", value: "21.3 مليون £" },
          { label: "بلاغات المُخبرين", value: "1,388" }
        ],
        themes: [
          { title: "اندفاع استثمار التجزئة", body: "اتّخذت المفوضية إجراءً مبكّراً ضد 32 شركة كان تسويقها لاستثمارات عالية المخاطر للمستهلكين عديمي الخبرة دون المعيار. وجرت استشارة على متطلّبات إفصاح جديدة في نوفمبر." },
          { title: "بوّابة ترخيص أقوى", body: "بات يُطلَب من جميع المتقدّمين إثبات تخطيط للحلّ، وحوكمة، وتوزيع قابل للتطبيق منذ اليوم الأول. وارتفعت معدلات الرفض من 4.1% إلى 6.8%." },
          { title: "تنقية السجلّ", body: "بدأ برنامج لمدة 24 شهراً لإزالة التراخيص من الشركات التي لم تستخدمها. وتحدّث أكثر من 2,000 إدخال، وأُحيلت 600 شركة للإلغاء." },
          { title: "إفصاحات المناخ", body: "أبلغت الشركات المدرجة من الفئة الممتازة وأكبر مديري الأصول لأوّل عام كامل وفق معايير TCFD." }
        ],
        publications: [
          { date: "أبريل 2021", title: "ورقة نقاش: إطار قوي وبسيط" },
          { date: "يونيو 2021", title: "بوّابة الترخيص: توقّعات أقوى" },
          { date: "نوفمبر 2021", title: "استشارة الاستثمارات عالية المخاطر" },
          { date: "ديسمبر 2021", title: "إفصاحات TCFD: مراجعة التطبيق" }
        ],
        milestone: "إطلاق برنامج تنقية التراخيص الخاملة من السجلّ العام."
      },
      "2020": {
        title: "2020 — استجابة لجائحة بلا سابقة",
        summary: "تحرّكت الهيئة في أيّام لدعم الشركات والعملاء والأسواق خلال جائحة كوفيد‑19. أُدخلت تخفيفات تشغيلية، وإرشادات تأجيل المدفوعات، وبرنامج مُعجَّل لإجراءات دعم العملاء، مع الحفاظ على نزاهة السوق. واستمرّ عمل الإنفاذ عن بُعد على نطاق كامل لأوّل مرّة.",
        stats: [
          { label: "الشركات المرخّصة", value: "2,886" },
          { label: "الغرامات المفروضة", value: "29.1 مليون £" },
          { label: "المبالغ المُعادة", value: "17.8 مليون £" },
          { label: "بلاغات المُخبرين", value: "1,196" }
        ],
        themes: [
          { title: "دعم العملاء أثناء كوفيد‑19", body: "نشرت المفوضية إرشادات سريعة بشأن تأجيل المدفوعات، والإمهال في الرهون العقارية، والإبلاغ الائتماني. ودُعمت أرصدة عملاء تتجاوز 62 مليار جنيه عبر برامج التأجيل." },
          { title: "الاستمرارية التشغيلية", body: "أكّدت جميع الشركات المرخّصة ترتيبات الاستمرارية، وجُمعت بيانات موضوعية من 920 شركة. واستدعت غُرفتان للمقاصة بنجاح بروتوكولات المواقع المُجزَّأة." },
          { title: "مراقبة إساءة استخدام السوق", body: "حفّز ارتفاع الأحجام تجديد بحيرة بيانات السوق لدى الهيئة؛ ووصلت سجلات الأوامر اليومية المُستوعَبة إلى 7.2 مليار." },
          { title: "تطبيق بريكست", body: "دخل نظام التصاريح المؤقّت حيّز التنفيذ في 1 يناير 2021؛ وعالجت الهيئة طوال 2020 إدخال 1,438 شركة إلى النظام." }
        ],
        publications: [
          { date: "مارس 2020", title: "كوفيد‑19: التوقّعات من الشركات" },
          { date: "يونيو 2020", title: "تأجيل المدفوعات: التمديد والتدرّج" },
          { date: "أكتوبر 2020", title: "الاستمرارية التشغيلية في الحلّ" },
          { date: "ديسمبر 2020", title: "نظام التصاريح المؤقّت لبريكست: الجاهزية" }
        ],
        milestone: "إجراءات الدعم في زمن الجائحة حمت أرصدة مقترضين تتجاوز 62 مليار جنيه."
      },
      "2019": {
        title: "2019 — جاهزية بريكست وتنامي الاحتيال الرقمي",
        summary: "هيمنت التحضيرات لخروج المملكة المتحدة من الاتحاد الأوروبي على أجندة الإشراف. في الوقت نفسه، ارتفع احتيال الاستثمار عبر الإنترنت بشكل حادّ، ممّا دفع الهيئة لإطلاق حملة 'ScamSmart' الوطنية وتعميق الشراكات مع المنصّات الإلكترونية.",
        stats: [
          { label: "الشركات المرخّصة", value: "2,801" },
          { label: "الغرامات المفروضة", value: "32.7 مليون £" },
          { label: "المبالغ المُعادة", value: "15.4 مليون £" },
          { label: "بلاغات المُخبرين", value: "1,041" }
        ],
        themes: [
          { title: "جاهزية بريكست", body: "أُنجِز نظام التصاريح المؤقّت، ونقل برنامج موازٍ أكثر من 1,500 صفحة من قواعد الاتحاد الأوروبي إلى تشريعات المملكة المتحدة بالتنسيق مع وزارة الخزانة." },
          { title: "حملة ScamSmart", body: "بلغت حملة توعية وطنية 78% من البالغين في المملكة المتحدة؛ ونمت قائمة تحذير المستهلك إلى أكثر من 1,200 شركة غير مرخّصة." },
          { title: "توسعة SM&CR", body: "وُسّع نظام كبار المديرين والاعتماد ليشمل جميع الشركات منفردة الإشراف في ديسمبر، رافعاً معايير الحوكمة والمساءلة." },
          { title: "الانتقال من LIBOR", body: "حُدّدت محطّات صناعية لوقف القروض الجديدة المرتبطة بـ LIBOR للجنيه الإسترليني؛ وجُمعت خطط انتقال شركة بشركة." }
        ],
        publications: [
          { date: "مارس 2019", title: "بريكست: دليل للشركات المرخّصة" },
          { date: "يوليو 2019", title: "تقرير أثر ScamSmart" },
          { date: "ديسمبر 2019", title: "SM&CR: التوسعة لجميع الشركات" }
        ],
        milestone: "توسعة نظام كبار المديرين والاعتماد ليشمل كل شركة منفردة الإشراف."
      },
      "2018": {
        title: "2018 — التمويل المفتوح، تطبيق MiFID II، وموقف سلوكي أكثر صرامة",
        summary: "أعاد العامُ الكامل الأوّل من إفصاحات MiFID II صياغةَ كيفية الإبلاغ عن تكاليف الاستثمار وأفضل تنفيذ. وقد رسّخت المفوضية خارطة طريق التمويل المفتوح، وأَجرت رقماً قياسياً من مراجعات الأشخاص المهَرة، وعزّزت كتاب القواعد بشأن منافسة المنصّات.",
        stats: [
          { label: "الشركات المرخّصة", value: "2,742" },
          { label: "الغرامات المفروضة", value: "28.4 مليون £" },
          { label: "المبالغ المُعادة", value: "12.6 مليون £" },
          { label: "بلاغات المُخبرين", value: "927" }
        ],
        themes: [
          { title: "تطبيق MiFID II", body: "وُحِّدت إفصاحات التكاليف والرسوم؛ وراجعت الهيئة 41 شركة وألزمت 12 منها باتّخاذ إجراءات تصحيحية." },
          { title: "التمويل المفتوح", body: "نشرت المفوضية رؤيتها طويلة الأمد لمشاركة البيانات بإذن المستهلك عبر المدّخرات والاستثمارات والرهون والمعاشات." },
          { title: "دراسة سوق إدارة الأصول", body: "دخلت العلاجات النهائية حيّز النفاذ، بما في ذلك شفافية أرباح الصندوق وتقييمات قيمة أقوى." },
          { title: "الصمود السيبراني", body: "شارك في أوّل تمرين ضغط سيبراني عبر القطاعات 24 شركة منهجية وثلاث بُنى تحتية للسوق المالية." }
        ],
        publications: [
          { date: "مارس 2018", title: "دراسة سوق إدارة الأصول: العلاجات النهائية" },
          { date: "يونيو 2018", title: "النهج تجاه المستهلكين" },
          { date: "نوفمبر 2018", title: "التمويل المفتوح: ورقة نقاش" },
          { date: "ديسمبر 2018", title: "تمرين الضغط السيبراني: الدروس المستفادة" }
        ],
        milestone: "دخول العلاجات النهائية لدراسة سوق إدارة الأصول حيّز النفاذ، بما يشمل تقييمات قيمة مستقلّة."
      },
      "2017": {
        title: "2017 — الرسالة، وثائق النهج، وشفافية الإشراف",
        summary: "نشرت الهيئة رسالتها وسلسلةَ وثائق النهج التي وضعت لأوّل مرّة إطاراً عامّاً متماسكاً لكيفية اتّخاذها قرارات الترخيص والإشراف والإنفاذ وحماية المستهلك. وشهد العام أيضاً التحضير النهائي لـ MiFID II وGDPR ونظام كبار المديرين.",
        stats: [
          { label: "الشركات المرخّصة", value: "2,684" },
          { label: "الغرامات المفروضة", value: "25.8 مليون £" },
          { label: "المبالغ المُعادة", value: "10.9 مليون £" },
          { label: "بلاغات المُخبرين", value: "868" }
        ],
        themes: [
          { title: "الرسالة ووثائق النهج", body: "نُشرت خمس وثائق نهج — الترخيص، الإشراف، الإنفاذ، المستهلكون، والمنافسة — للاستشارة، ثم اعتُمدت في 2018." },
          { title: "دراسة سوق إدارة الأصول", body: "خلصت النتائج المرحلية إلى أنّ المنافسة لم تكن تعمل بفعالية، خاصةً للمستثمرين الأفراد. وجرت استشارة على العلاجات المقترحة." },
          { title: "الانطلاق التشغيلي لـ MiFID II", body: "تطبيق عبر أكثر من 1,800 شركة ضمن النطاق؛ واختُبرت جاهزية البنية التحتية للإبلاغ في أكتوبر ونوفمبر." },
          { title: "الجاهزية لـ GDPR", body: "عملت المفوضية مع مكتب مفوّض المعلومات لتقديم إرشاد مشترك للشركات المالية." }
        ],
        publications: [
          { date: "أبريل 2017", title: "رسالتنا" },
          { date: "سبتمبر 2017", title: "دراسة سوق إدارة الأصول: التقرير المرحلي" },
          { date: "نوفمبر 2017", title: "MiFID II: حزمة التطبيق النهائية" }
        ],
        milestone: "نشر رسالة الهيئة وأوّل مجموعة من وثائق النهج."
      },
      "2016": {
        title: "2016 — حرّيات التقاعد في حالة استقرار وبوّابة شركات أكثر صرامة",
        summary: "بعد عامين من حرّيات التقاعد، ركّزت الهيئة على المخرجات لأولئك الذين يدخلون التقاعد، وعلى رفع المعيار للشركات الجديدة الداخلة إلى نطاق التنظيم. وشكّل أيضاً قرار بارز بشأن جداول تعويض تأمين حماية المدفوعات معالم العام.",
        stats: [
          { label: "الشركات المرخّصة", value: "2,612" },
          { label: "الغرامات المفروضة", value: "22.9 مليون £" },
          { label: "المبالغ المُعادة", value: "9.1 مليون £" },
          { label: "بلاغات المُخبرين", value: "812" }
        ],
        themes: [
          { title: "مراجعة مخرجات التقاعد", body: "أظهرت النتائج الأولية أنّ نحو نصف المستهلكين كانوا يدخلون السحب دون أخذ مشورة. واستشارت المفوضية بشأن مسارات استثمار افتراضية." },
          { title: "بوّابة الترخيص", body: "أُدخلت توقّعات أكثر صرامة بشأن الموارد الاحترازية وتخطيط الحلّ؛ ورُفض 4.1% من الطلبات، صعوداً من 2.8% في العام السابق." },
          { title: "موعد PPI النهائي", body: "أُكِّد موعد نهائي للشكاوى المتعلقة بتأمين حماية المدفوعات في أغسطس 2019، مصحوباً بحملة وطنية لمدة عامين للمستهلكين." },
          { title: "توسعة مركز الابتكار", body: "قبلت بيئة الاختبار التنظيمية مجموعتها الثانية، شملت شركات تسوية قائمة على بلوكتشين وتأهيل بيومتري." }
        ],
        publications: [
          { date: "أبريل 2016", title: "مراجعة مخرجات التقاعد: الشروط المرجعية" },
          { date: "أغسطس 2016", title: "PPI: بيان السياسة النهائي" },
          { date: "نوفمبر 2016", title: "بيئة الاختبار التنظيمية: تحديث المجموعة 2" }
        ],
        milestone: "تأكيد الموعد النهائي لشكاوى PPI وحملة التوعية المصاحبة."
      },
      "2015": {
        title: "2015 — عام التأسيس: حرّيات التقاعد، إطلاق بيئة الاختبار، ومعايير السلوك",
        summary: "دخلت الهيئة نطاق صلاحيّاتها وسط أهمّ تغيير لمعاشات التقاعد البريطانية في جيل. وفي غضون اثني عشر شهراً، أشرفت على الموجة الأولى من أعمال حرّيات التقاعد، وأطلقت أوّل بيئة اختبار تنظيمية في العالم للابتكار، وقَنّنت معايير السلوك المتوقّعة من كبار المديرين في الصناعة المصرفية.",
        stats: [
          { label: "الشركات المرخّصة", value: "2,557" },
          { label: "الغرامات المفروضة", value: "19.6 مليون £" },
          { label: "المبالغ المُعادة", value: "7.4 مليون £" },
          { label: "بلاغات المُخبرين", value: "763" }
        ],
        themes: [
          { title: "حرّيات التقاعد", body: "اعتباراً من أبريل 2015، تمكّن المدّخرون من الوصول إلى محافظ المساهمة المحدّدة بمرونة. وشغّلت الهيئة Pension Wise، ووضعت قواعد لتحذيرات المخاطر، وأَجرت زيارات إشرافية مبكّرة لـ 28 مزوّداً." },
          { title: "بيئة الاختبار التنظيمية", body: "قبلت أوّل بيئة اختبار تنظيمية في العالم مجموعتها الأولى المؤلّفة من 24 شركة، ممكِّنةً إيّاها من اختبار عروض جديدة في بيئة محكومة مع مستهلكين فعليّين." },
          { title: "نظام كبار المديرين — المصرفية", body: "طُبِّق نظام كبار المديرين والاعتماد على البنوك وشركات الاستثمار المُسمَّاة من PRA، مستبدلاً نظام الأشخاص المعتمدين لتلك القطاعات." },
          { title: "انتقال الائتمان الاستهلاكي", body: "أنجزت المفوضية انتقال شركات الائتمان الاستهلاكي من OFT إلى نطاقها، مرخّصةً أكثر من 39,000 شركة." }
        ],
        publications: [
          { date: "مارس 2015", title: "حرّيات التقاعد: قواعد لمزوّدي التجزئة" },
          { date: "نوفمبر 2015", title: "بيئة الاختبار التنظيمية: مقترحات التصميم" },
          { date: "ديسمبر 2015", title: "نظام كبار المديرين — المصرفية: القواعد النهائية" }
        ],
        milestone: "إطلاق أوّل بيئة اختبار تنظيمية في العالم للابتكار المالي."
      }
    }
  };

  // Shared label keys used by the panel; rendered through window.FMC_I18N.t when available
  function L(key, fallback) {
    if (window.FMC_I18N && typeof window.FMC_I18N.t === "function") {
      var v = window.FMC_I18N.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  function getLang() {
    if (window.FMC_I18N && window.FMC_I18N.lang) return window.FMC_I18N.lang;
    return (document.documentElement.lang || "en").slice(0, 2);
  }

  function pickYearData(year) {
    var lang = getLang();
    var pack = DATA[lang] || DATA.en;
    return pack[year] || DATA.en[year];
  }

  function renderYear(year) {
    var panel = document.getElementById("archivePanel");
    if (!panel) return;
    var d = pickYearData(year);
    if (!d) {
      panel.innerHTML = '<div class="archive-empty">' + L("rp.arc.placeholder", "Select a year above to open that year's archive.") + '</div>';
      return;
    }

    var stats = (d.stats || []).map(function (s) {
      return '<div class="arc-stat"><div class="arc-stat-v">' + s.value + '</div><div class="arc-stat-l">' + s.label + '</div></div>';
    }).join("");

    var themes = (d.themes || []).map(function (t) {
      return '<article class="arc-theme"><h4>' + t.title + '</h4><p>' + t.body + '</p></article>';
    }).join("");

    var pubs = (d.publications || []).map(function (p) {
      return '<li><span class="arc-pub-date">' + p.date + '</span><span class="arc-pub-title">' + p.title + '</span></li>';
    }).join("");

    var html =
      '<div class="arc-card" data-year="' + year + '">' +
        '<header class="arc-head">' +
          '<div class="arc-year-big">' + year + '</div>' +
          '<div class="arc-head-text">' +
            '<div class="arc-eyebrow">' + L("rp.arc.eyebrow", "Year in review") + '</div>' +
            '<h3 class="arc-title">' + d.title + '</h3>' +
          '</div>' +
        '</header>' +
        '<p class="arc-summary">' + d.summary + '</p>' +
        '<div class="arc-stats" aria-label="' + L("rp.arc.kpis", "Key indicators") + '">' + stats + '</div>' +
        '<h4 class="arc-section-h">' + L("rp.arc.themes", "Supervisory themes") + '</h4>' +
        '<div class="arc-themes">' + themes + '</div>' +
        '<h4 class="arc-section-h">' + L("rp.arc.publications", "Selected publications") + '</h4>' +
        '<ul class="arc-pubs">' + pubs + '</ul>' +
        '<div class="arc-milestone"><span class="arc-milestone-tag">' + L("rp.arc.milestone", "Milestone of the year") + '</span><span>' + d.milestone + '</span></div>' +
      '</div>';

    // Smooth crossfade
    panel.classList.remove("is-open");
    panel.innerHTML = html;
    // next tick so transition catches new content
    requestAnimationFrame(function () { panel.classList.add("is-open"); });
  }

  function setActive(btn) {
    var btns = document.querySelectorAll(".archive-year");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove("is-active");
      btns[i].setAttribute("aria-selected", "false");
    }
    btn.classList.add("is-active");
    btn.setAttribute("aria-selected", "true");
  }

  function init() {
    var years = document.getElementById("archiveYears");
    if (!years) return;
    years.addEventListener("click", function (e) {
      var btn = e.target.closest(".archive-year");
      if (!btn) return;
      setActive(btn);
      renderYear(btn.getAttribute("data-year"));
    });

    // Default: open the latest year automatically
    var first = years.querySelector(".archive-year");
    if (first) {
      setActive(first);
      renderYear(first.getAttribute("data-year"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Re-render on language change to refresh content
  document.addEventListener("fmc:langchange", function () {
    var active = document.querySelector(".archive-year.is-active");
    if (active) renderYear(active.getAttribute("data-year"));
  });
})();
