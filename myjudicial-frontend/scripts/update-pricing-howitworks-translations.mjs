import fs from 'fs';
import path from 'path';

const messagesDir = path.resolve('messages');

const EN_PRICING = {
  meta: {
    title: "Transparent Pricing | MyJudicial",
    description: "Upfront legal fees, zero surprise invoices, and 100% escrow protection for legal consultations across Rwanda."
  },
  hero: {
    badge: "Zero Hidden Fees · Escrow Protected",
    title: "Transparent Legal Fees. Total Peace of Mind.",
    subtitle: "Fixed consultation rates set by certified advocates upfront. Zero surprise invoices, with 100% of your funds protected in secure Mobile Money escrow until your consultation is completed."
  },
  pillars: {
    badge: "Clear & Predictable",
    title: "How Legal Pricing Works on MyJudicial",
    subtitle: "Traditional legal hiring is plagued by opaque hourly billing and surprise retainers. MyJudicial brings complete financial clarity.",
    advocateRates: {
      title: "Advocate-Set Fixed Rates",
      desc: "Each certified advocate defines their own transparent consultation fees based on experience and specialty. You see the exact total before confirming."
    },
    transparentPlatformFee: {
      title: "All-Inclusive Platform Support",
      desc: "A modest fee covers HD encrypted video rooms, instant SMS reminders, calendar sync, and regulated escrow custody. No extra checkout fees."
    },
    noRetainers: {
      title: "Zero Opaque Retainers",
      desc: "Pay per consultation or agreed scope. You never have to deposit large open-ended retainers without understanding where every Franc goes."
    }
  },
  escrowPipeline: {
    badge: "100% Escrow Protection",
    title: "How the Escrow Guarantee Works",
    subtitle: "Your payment is protected at every single moment of the booking lifecycle.",
    step1: {
      step: "01",
      title: "Book & Fund Escrow",
      desc: "Select a slot and pay via MTN MoMo, Airtel Money, or Card. Funds are securely locked in MyJudicial Escrow."
    },
    step2: {
      step: "02",
      title: "Advocate Confirmation",
      desc: "The certified advocate accepts and prepares for your consultation session with your case context."
    },
    step3: {
      step: "03",
      title: "Session Completed",
      desc: "Meet your lawyer via secure video, direct phone call, or in-person at their Kigali office."
    },
    step4: {
      step: "04",
      title: "Payout or 100% Refund",
      desc: "Funds are released to the advocate only after the session. If the advocate cancels or no-shows, you get an automatic full refund."
    },
    guaranteeBadge: "Money-Back Guarantee",
    guaranteeText: "If your advocate fails to attend or cancels the consultation, your payment is refunded 100% back to your Mobile Money account immediately."
  },
  benchmarks: {
    badge: "Market Benchmarks",
    title: "Typical Legal Consultation Rates in Rwanda",
    subtitle: "Representative pricing ranges observed across verified advocates on MyJudicial.",
    item1: {
      title: "Initial Legal Advice",
      duration: "30 – 45 Minutes",
      range: "20,000 – 45,000 RWF",
      desc: "Ideal for preliminary legal assessment, rights clarification, and identifying legal options.",
      feature1: "Video, Phone, or In-person",
      feature2: "Direct Q&A with advocate",
      feature3: "Actionable next steps summary"
    },
    item2: {
      title: "In-Depth Consultation & Strategy",
      duration: "60 Minutes",
      range: "50,000 – 100,000 RWF",
      desc: "Comprehensive analysis of contentious matters, disputes, employment issues, or property transactions.",
      feature1: "Pre-session file review",
      feature2: "Detailed legal risk evaluation",
      feature3: "Written follow-up recommendations"
    },
    item3: {
      title: "Document & Contract Review",
      duration: "Flat Service",
      range: "60,000 – 150,000 RWF",
      desc: "Thorough clause-by-clause legal review of commercial leases, employment contracts, or sales agreements.",
      feature1: "Line-by-line risk highlighting",
      feature2: "Compliance with Rwanda laws",
      feature3: "30-min debrief call included"
    }
  },
  comparison: {
    badge: "Why MyJudicial",
    title: "Traditional Legal Hiring vs. MyJudicial",
    subtitle: "See the difference transparent pricing and modern technology make for your legal matters.",
    traditionalHeader: "Traditional Law Practice",
    myjudicialHeader: "MyJudicial Marketplace",
    row1: {
      feature: "Fee Predictability",
      traditional: "Unpredictable hourly billing with open-ended clock running",
      myjudicial: "Upfront fixed fees agreed before booking"
    },
    row2: {
      feature: "Upfront Retainers",
      traditional: "Heavy advance retainer deposits required with no guarantees",
      myjudicial: "Pay strictly per consultation or agreed milestone"
    },
    row3: {
      feature: "Payment & Receipts",
      traditional: "Opaque cash transactions or difficult wire transfers",
      myjudicial: "Instant MTN MoMo & Airtel Money with digital receipts"
    },
    row4: {
      feature: "Cancellation Protection",
      traditional: "No recourse or delayed refunds if lawyer misses appointment",
      myjudicial: "100% automated refund guarantee held in escrow"
    },
    row5: {
      feature: "Credential Verification",
      traditional: "Client must manually verify Bar credentials and track record",
      myjudicial: "Every advocate pre-vetted with Rwanda Bar Association"
    }
  },
  faqs: {
    badge: "Got Questions?",
    title: "Pricing & Payment FAQs",
    subtitle: "Clear answers to common questions about fees, payments, and our escrow guarantee.",
    q1: "Are there any hidden fees added during checkout?",
    a1: "No. The total price you see on the advocate's profile and booking screen is the exact and final amount debited from your Mobile Money or card.",
    q2: "What happens if the advocate doesn't show up?",
    a2: "Because your payment is held in MyJudicial Escrow rather than paid directly to the lawyer, our system issues an automatic 100% refund back to your MoMo or card account if the consultation does not take place.",
    q3: "Can an advocate demand more money during the consultation?",
    a3: "Never for the booked session. The agreed fee covers the entire duration and scope booked. If you subsequently decide to hire the advocate for ongoing courtroom litigation or broader work, they will issue a formal separate quotation.",
    q4: "Which payment methods are accepted in Rwanda?",
    a4: "We accept MTN Mobile Money, Airtel Money, and international Visa/Mastercard payments. All payments are processed over encrypted channels."
  },
  cta: {
    title: "Experience transparent legal support today",
    subtitle: "Browse verified advocates, compare clear rates, and book your consultation in minutes.",
    button: "Find a Lawyer Now",
    secondary: "How It Works"
  }
};

const FR_PRICING = {
  meta: {
    title: "Tarification Transparente | MyJudicial",
    description: "Honoraires d'avocats transparents, zéro frais cachés et 100% de protection sous séquestre pour vos consultations juridiques au Rwanda."
  },
  hero: {
    badge: "Zéro Frais Cachés · Protégé sous Séquestre",
    title: "Honoraires Juridiques Clairs. Sérénité Totale.",
    subtitle: "Tarifs de consultation fixés à l'avance par des avocats certifiés. Aucune facture surprise, avec 100% de vos fonds sécurisés sous séquestre Mobile Money jusqu'à la fin de la séance."
  },
  pillars: {
    badge: "Clarté & Prévisibilité",
    title: "Comment fonctionne la tarification sur MyJudicial",
    subtitle: "Le recours traditionnel aux avocats souffre d'une facturation horaire opaque et de provisions imprévues. MyJudicial apporte une clarté financière totale.",
    advocateRates: {
      title: "Tarifs Fixes Définis par l'Avocat",
      desc: "Chaque avocat certifié définit ses honoraires de consultation en fonction de son expérience et de sa spécialité. Vous connaissez le montant exact avant de réserver."
    },
    transparentPlatformFee: {
      title: "Support Plateforme Tout-en-Un",
      desc: "Des frais réduits couvrent la salle vidéo HD chiffrée, les rappels SMS instantanés, la gestion d'agenda et la garde sous séquestre réglementée. Aucun frais supplémentaire lors du paiement."
    },
    noRetainers: {
      title: "Fin des Provisions Floues",
      desc: "Payez à la consultation ou selon les étapes convenues. Vous n'avez jamais à verser de lourdes avances imprécises sans savoir où va chaque Franc."
    }
  },
  escrowPipeline: {
    badge: "100% Protection sous Séquestre",
    title: "Comment fonctionne la Garantie de Séquestre",
    subtitle: "Votre paiement est protégé à chaque étape du cycle de réservation.",
    step1: {
      step: "01",
      title: "Réservation & Dépôt sous Séquestre",
      desc: "Sélectionnez un créneau et payez via MTN MoMo, Airtel Money ou Carte. Les fonds sont verrouillés en toute sécurité dans le séquestre MyJudicial."
    },
    step2: {
      step: "02",
      title: "Confirmation de l'Avocat",
      desc: "L'avocat certifié valide le rendez-vous et prépare votre séance de consultation à partir du contexte de votre dossier."
    },
    step3: {
      step: "03",
      title: "Consultation Réalisée",
      desc: "Échangez avec votre avocat par vidéo sécurisée, appel téléphonique direct ou en personne dans son cabinet à Kigali."
    },
    step4: {
      step: "04",
      title: "Paiement ou Remboursement à 100%",
      desc: "Les fonds ne sont versés à l'avocat qu'après la séance. En cas d'annulation ou d'absence de l'avocat, vous recevez un remboursement intégral immédiat."
    },
    guaranteeBadge: "Garantie Remboursement",
    guaranteeText: "Si votre avocat ne se présente pas ou annule la consultation, votre paiement est remboursé à 100% sur votre compte Mobile Money instantanément."
  },
  benchmarks: {
    badge: "Repères Tarifaires",
    title: "Tarifs Habituels de Consultation au Rwanda",
    subtitle: "Fourchettes de prix constatées auprès des avocats vérifiés sur la plateforme MyJudicial.",
    item1: {
      title: "Conseil Juridique Initial",
      duration: "30 – 45 Minutes",
      range: "20 000 – 45 000 RWF",
      desc: "Idéal pour une première évaluation juridique, la clarification de vos droits et l'orientation stratégique.",
      feature1: "Vidéo, Téléphone ou Cabinet",
      feature2: "Échange direct avec l'avocat",
      feature3: "Synthèse des prochaines étapes"
    },
    item2: {
      title: "Consultation Approfondie & Stratégie",
      duration: "60 Minutes",
      range: "50 000 – 100 000 RWF",
      desc: "Analyse complète des litiges, conflits fonciers, litiges de travail ou transactions commerciales complexes.",
      feature1: "Examen des pièces avant la séance",
      feature2: "Évaluation détaillée des risques juridiques",
      feature3: "Recommandations écrites de suivi"
    },
    item3: {
      title: "Revue de Contrat & Documents",
      duration: "Prestation Forfaitaire",
      range: "60 000 – 150 000 RWF",
      desc: "Relecture juridique approfondie de baux commerciaux, contrats de travail ou conventions de vente.",
      feature1: "Identification clause par clause des risques",
      feature2: "Conformité au droit rwandais",
      feature3: "Appel de synthèse de 30 min inclus"
    }
  },
  comparison: {
    badge: "Pourquoi MyJudicial",
    title: "Cabinet Traditionnel vs. MyJudicial",
    subtitle: "Découvrez la différence d'une tarification transparente et d'une technologie moderne pour vos démarches juridiques.",
    traditionalHeader: "Cabinet d'Avocats Traditionnel",
    myjudicialHeader: "Plateforme MyJudicial",
    row1: {
      feature: "Prévisibilité des Honoraires",
      traditional: "Facturation horaire imprévisible avec compteur ouvert",
      myjudicial: "Honoraires fixes convenus avant la réservation"
    },
    row2: {
      feature: "Provisions Initiales",
      traditional: "Lourdes avances exigées sans garantie de résultat ou délai",
      myjudicial: "Paiement strict à la consultation ou à l'étape convenue"
    },
    row3: {
      feature: "Paiement & Reçus",
      traditional: "Paiements en espèces opaques ou virements bancaires lents",
      myjudicial: "Paiement instantané MTN MoMo & Airtel Money avec reçu numérique"
    },
    row4: {
      feature: "Protection en Cas d'Annulation",
      traditional: "Aucun recours ou remboursement difficile si l'avocat est absent",
      myjudicial: "Garantie de remboursement automatique à 100% sous séquestre"
    },
    row5: {
      feature: "Vérification des Qualifications",
      traditional: "Le client doit vérifier lui-même l'inscription au Barreau",
      myjudicial: "Chaque avocat est pré-vérifié auprès du Barreau du Rwanda"
    }
  },
  faqs: {
    badge: "Questions Fréquentes",
    title: "FAQ Tarification & Paiement",
    subtitle: "Des réponses claires à vos questions sur les honoraires, les paiements et notre garantie sous séquestre.",
    q1: "Y a-t-il des frais cachés ajoutés lors du paiement ?",
    a1: "Non. Le montant total affiché sur le profil de l'avocat et lors de la confirmation est le montant exact débité de votre compte Mobile Money ou carte.",
    q2: "Que se passe-t-il si l'avocat ne se présente pas ?",
    a2: "Votre paiement étant conservé dans le séquestre MyJudicial plutôt que remis à l'avocat, notre système déclenche un remboursement automatique à 100% si le rendez-vous n'est pas honoré.",
    q3: "Un avocat peut-il demander un supplément pendant la consultation ?",
    a3: "Jamais pour la séance réservée. Le tarif convenu couvre l'intégralité du temps et du périmètre réservé. Si vous souhaitez ensuite engager l'avocat pour une procédure en justice, un devis officiel distinct sera établi.",
    q4: "Quels sont les modes de paiement acceptés au Rwanda ?",
    a4: "Nous acceptons MTN Mobile Money, Airtel Money ainsi que les cartes Visa/Mastercard internationales. Toutes les transactions sont sécurisées et chiffrées."
  },
  cta: {
    title: "Bénéficiez d'une assistance juridique transparente dès aujourd'hui",
    subtitle: "Consultez les profils vérifiés, comparez les tarifs et réservez votre consultation en quelques minutes.",
    button: "Trouver un Avocat",
    secondary: "Comment ça marche"
  }
};

const RW_PRICING = {
  meta: {
    title: "Ibiciro Bisobanutse | MyJudicial",
    description: "Ibiciro bisobanutse by'abavoka, nta mafaranga yihishe, hamwe n'ubwirinzi bwuzuye bw'ubwishyu mu Rwanda."
  },
  hero: {
    badge: "Nta Mafaranga Yihishe · Ubwishyu Burinzwe",
    title: "Ibiciro By'Amategeko Bisobanutse. Umutekano Wuzuye.",
    subtitle: "Ibiciro by'inama z'amategeko bishyirwaho n'abavoka babyigiye mbere yo gufata gahunda. Nta fagitire itunguranye, kandi amafaranga yawe arinzwe 100% kuri Mobile Money kugeza inama irangiye neza."
  },
  pillars: {
    badge: "Kuri Buri Wese & Birasobanutse",
    title: "Uburyo Ibiciro Bikora Kuri MyJudicial",
    subtitle: "Gushaka umwavoka mu buryo bwa kera byarangwaga n'ibiciro bitazwi ndetse n'ingwate zitunguranye. MyJudicial izana umucyo usesuye mu mikorere y'amafaranga.",
    advocateRates: {
      title: "Ibiciro Byashyizweho n'Umwavoka",
      desc: "Buri mwavoka wemewe agena ibiciro bye by'inama ashingiye ku bunararibonye bwe. Ubona igiteranyo cyose mbere yo kwemeza gahunda."
    },
    transparentPlatformFee: {
      title: "Inkunga Yuzuye y'Urubuga",
      desc: "Amafaranga makeya akubiyemo icyumba cy'amashusho y'umutekano (Video HD), ubutumwa bugufi (SMS) bwo kwibutsa, ndetse n'ubwirinzi bw'ubwishyu. Nta mafaranga y'inyongera atunguranye."
    },
    noRetainers: {
      title: "Nta Ngwate Zidasobanutse",
      desc: "Ishyura kuri buri nama cyangwa umurimo wemeranyijweho. Ntabwo usabwa kubitsa ingwate nini utazi aho buri Faranga rizajya."
    }
  },
  escrowPipeline: {
    badge: "100% Ubwirinzi Bw'Ubwishyu",
    title: "Uburyo Ubwirinzi Bw'Ubwishyu Bukora",
    subtitle: "Amafaranga yawe arinzwe muri buri ntambwe yo gufata gahunda.",
    step1: {
      step: "01",
      title: "Fata Gahunda & Ishyura",
      desc: "Hitamo isaha ikunogeye wishyure ukoresheje MTN MoMo, Airtel Money, cyangwa Ikarita. Amafaranga ahita arindirwa mu mutekano kuri MyJudicial."
    },
    step2: {
      step: "02",
      title: "Kwemezwa n'Umwavoka",
      desc: "Umwavoka wemewe yakira gahunda kandi ategura ibijyanye n'ikibazo cyawe mbere y'inama."
    },
    step3: {
      step: "03",
      title: "Inama Irakorwa",
      desc: "Vugana n'umwavoka wawe ukoresheje amashusho y'umutekano, guhamagara kuri telefoni, cyangwa imbonankubone ku biro bye i Kigali."
    },
    step4: {
      step: "04",
      title: "Kurekura Amafaranga cyangwa Gusubizwa 100%",
      desc: "Amafaranga ahabwa umwavoka ari uko inama irangiye neza. Umwavoka nadasohoza inama cyangwa ntiyitabire, uhita usubizwa amafaranga yawe yose ako kanya."
    },
    guaranteeBadge: "Gusubizwa Amafaranga Birizewe",
    guaranteeText: "Umwavoka wawe ntiyitabira cyangwa akisubiraho ku nama, amafaranga yawe ahita asubizwa 100% kuri Mobile Money yawe ako kanya."
  },
  benchmarks: {
    badge: "Ibiciro Bikunze Gukoreshwa",
    title: "Ibiciro Bisanzwe by'Inama z'Amategeko mu Rwanda",
    subtitle: "Ugereranyije ibiciro bikunze kugaragara ku bavoka bemejwe bari kuri MyJudicial.",
    item1: {
      title: "Inama ya Mbere y'Amategeko",
      duration: "Iminota 30 – 45",
      range: "20,000 – 45,000 RWF",
      desc: "Ikwiriye ku gusobanukirwa uburenganzira bwawe, gusuzuma ikibazo, no kumenya inzira zemewe n'amategeko wakurikiza.",
      feature1: "Amashusho, Telefoni, cyangwa ku Biro",
      feature2: "Kubaza umwavoka imbonankubone",
      feature3: "Incamake y'intambwe zikurikiraho"
    },
    item2: {
      title: "Inama Yimbitse & Gahunda y'Ikibazo",
      duration: "Iminota 60",
      range: "50,000 – 100,000 RWF",
      desc: "Gusesengura byimbitse amakimbirane, ibibazo by'amasambu n'imitungo, akazi, cyangwa amasezerano y'ubucuruzi akomeye.",
      feature1: "Gusuzuma inyandiko mbere y'inama",
      feature2: "Gusesengura ingaruka z'amategeko",
      feature3: "Inyandiko y'inama z'umwavoka ikurikira"
    },
    item3: {
      title: "Gusuzuma Inyandiko n'Amasezerano",
      duration: "Serivisi ku Giciro Kizwi",
      range: "60,000 – 150,000 RWF",
      desc: "Gusoma no gusesengura ingingo ku yindi ku masezerano y'ubukode, amasezerano y'akazi, cyangwa kugura n'ikodesha.",
      feature1: "Kugaragaza ingingo ziteje impungenge",
      feature2: "Guhuza n'amategeko y'u Rwanda",
      feature3: "Inama y'iminota 30 yo kubisobanura"
    }
  },
  comparison: {
    badge: "Impamvu MyJudicial",
    title: "Uburyo Bwa Kera vs. MyJudicial",
    subtitle: "Reba itandukaniro ry'ibiciro bisobanutse n'ikoranabuhanga rigezweho mu gukemura ibibazo byawe by'amategeko.",
    traditionalHeader: "Uburyo Bwa Kera Bw'Abavoka",
    myjudicialHeader: "Urubuga rwa MyJudicial",
    row1: {
      feature: "Kumenya Igiciro Mbere",
      traditional: "Kubara amafaranga ku masaha bitazwi iherezo ryayo",
      myjudicial: "Igiciro kizwi kandi cyemeranyijweho mbere yo kwemeza"
    },
    row2: {
      feature: "Ingwate za Mbere",
      traditional: "Gusabwa amafaranga menshi y'ingwate nta cyizere cy'igihe bizafatira",
      myjudicial: "Kwishyura gusa inama uhawe cyangwa umurimo urangiye"
    },
    row3: {
      feature: "Ubwishyu & Inyemezabwishyu",
      traditional: "Amafaranga mu ntoki adafitiwe inyemezabwishyu zizewe",
      myjudicial: "Kwishyura ako kanya kuri MTN MoMo & Airtel Money ufite inyemezabwishyu"
    },
    row4: {
      feature: "Kurengerwa Iyo Inama Itabaye",
      traditional: "Kutishyurwa cyangwa gutinda gusubizwa amafaranga iyo umwavoka ataje",
      myjudicial: "Gusubizwa 100% by'amafaranga byikora binyuze mu burinzi bw'ubwishyu"
    },
    row5: {
      feature: "Gusuzuma Ibyangombwa by'Umwavoka",
      traditional: "Umuturage yishakishiriza niba umwavoka abarizwa mu Rugaga rw'Abavoka",
      myjudicial: "Buri mwavoka asuzumwa mbere n'Urugaga rw'Abavoka mu Rwanda"
    }
  },
  faqs: {
    badge: "Ufite Ibibazo?",
    title: "Ibibazo Bikunze Kubazwa ku Biciro n'Ubwishyu",
    subtitle: "Ibisubizo bisobanutse ku bijyanye n'amafaranga, ubwishyu, n'ubwirinzi bwacu.",
    q1: "Ese hari andi mafaranga yihishe yongerwaho mu kwishyura?",
    a1: "Oya. Igiciro ubona ku mwirondoro w'umwavoka no ku rupapuro rw'ubwishyu ni cyo gusa kigabanywa kuri Mobile Money yawe cyangwa ikarita.",
    q2: "Bigenda bite iyo umwavoka atitabiriye inama?",
    a2: "Kubera ko amafaranga yawe arindirwa muri MyJudicial aho guhita ahabwa umwavoka, urubuga ruhita ruyagusubiza 100% ako kanya iyo inama itabaye.",
    q3: "Ese umwavoka ashobora gusaba andi mafaranga mu gihe cy'inama?",
    a3: "Ntibyemewe na gato ku nama yafashwe. Amafaranga yishyuwe akubiyemo igihe cyose n'ikibazo byemeranyijweho. Niba mwifuza gukomeza ku zindi nzego z'urubanza mu nkiko, azaguha inyandiko nshya y'igiciro cyabyo.",
    q4: "Ni ubuhe buryo bw'ubwishyu bwemewe mu Rwanda?",
    a4: "Twakira MTN Mobile Money, Airtel Money, hamwe n'amakarita mpuzamahanga ya Visa na Mastercard. Ubwishyu bwose burinzwe kandi bufite umutekano usesuye."
  },
  cta: {
    title: "Tangira kubona ubufasha bw'amategeko busobanutse uyu munsi",
    subtitle: "Rondera abavoka bemejwe, gereranya ibiciro bisobanutse, kandi ufate gahunda mu minota mike.",
    button: "Shaka Umwavoka Ubu",
    secondary: "Uburyo Bigenda"
  }
};

const EN_HOW_IT_WORKS = {
  meta: {
    title: "How It Works | MyJudicial",
    description: "Learn how to find, consult, and hire verified legal experts on MyJudicial in four simple steps."
  },
  hero: {
    badge: "Verified Advocates · Escrow Protection · Clear Outcomes",
    title: "How MyJudicial Connects You with Trusted Legal Counsel",
    subtitle: "From your initial legal question to verified resolution. Learn how Rwanda Bar Association accreditation, modern digital booking, and secure Mobile Money escrow work together."
  },
  tabs: {
    clients: "For Citizens & Businesses",
    advocates: "For Certified Advocates"
  },
  clientJourney: {
    badge: "Step-by-step Client Experience",
    title: "How to Consult with an Advocate",
    subtitle: "Four simple stages to access high quality, certified legal assistance anywhere in Rwanda.",
    step1: {
      tag: "Step 01",
      title: "Search or AI Legal Triage",
      desc: "Browse our directory by practice area and location, or describe your situation in plain Kinyarwanda, English, or French to our AI Assistant to identify matching specialists instantly."
    },
    step2: {
      tag: "Step 02",
      title: "Compare Verified Credentials & Rates",
      desc: "Inspect Rwanda Bar Association Roll registration, verified courtroom experience, peer ratings, and upfront consultation fees with zero hidden surprises."
    },
    step3: {
      tag: "Step 03",
      title: "Book with Escrow Protection",
      desc: "Select a calendar slot that fits your schedule. Pay securely via MTN Mobile Money, Airtel Money, or Card. Funds remain locked safely in escrow until the session is completed."
    },
    step4: {
      tag: "Step 04",
      title: "Meet & Resolve via Chosen Modality",
      desc: "Join an encrypted in-browser video call, receive a direct phone call, or meet face-to-face at their registered law chambers. After the session, leave an authentic review."
    }
  },
  advocateJourney: {
    badge: "For Legal Professionals",
    title: "How Advocates Practice on MyJudicial",
    subtitle: "Grow your legal practice with digital tools, guaranteed escrow payouts, and zero payment chasing.",
    step1: {
      tag: "Step 01",
      title: "Apply with Bar Credentials",
      desc: "Register with your official Rwanda Bar Association Roll number, law firm credentials, and national ID for professional accreditation."
    },
    step2: {
      tag: "Step 02",
      title: "Compliance & Vetting Check",
      desc: "Our legal compliance team validates your Bar certificate, active status, and disciplinary standing before activating your verified badge."
    },
    step3: {
      tag: "Step 03",
      title: "Configure Services & Calendar",
      desc: "Set your own consultation fees, define your working hours, and choose which delivery modes you offer (Video, Phone, or In-Person at your chambers)."
    },
    step4: {
      tag: "Step 04",
      title: "Conduct Sessions & Guaranteed Payouts",
      desc: "Consult with verified clients across Rwanda. Once consultations conclude, funds are deposited directly to your Mobile Money or bank account."
    }
  },
  modalities: {
    badge: "Flexible Consultation Modes",
    title: "Three Ways to Meet Your Advocate",
    subtitle: "Choose the consultation style that best matches your legal matter and location in Rwanda.",
    video: {
      title: "Encrypted Video Consultation",
      desc: "Directly in your browser with no app downloads required. Includes document screen-sharing and encrypted audio-video.",
      feature1: "End-to-end encrypted session",
      feature2: "Document & evidence screen sharing",
      feature3: "Join from any smartphone or PC"
    },
    phone: {
      title: "Direct Phone Consultation",
      desc: "For immediate advice or situations with low internet bandwidth. The advocate calls your verified phone number on schedule.",
      feature1: "Works on all telecom networks (MTN / Airtel)",
      feature2: "Ideal for urgent advice or remote areas",
      feature3: "No internet connection required for the call"
    },
    inPerson: {
      title: "In-Person Chambers Meeting",
      desc: "Meet your advocate face-to-face at their officially registered law office or chambers in Kigali or across Rwanda.",
      feature1: "Chambers location provided upon booking",
      feature2: "Physical review of original legal files",
      feature3: "Formal legal representation prep"
    }
  },
  trustFramework: {
    badge: "Accreditation & Trust",
    title: "The MyJudicial Trust Guarantee",
    subtitle: "Built in accordance with Rwanda Bar Association standards and legal ethics.",
    item1: {
      title: "100% Bar-Vetted Advocates",
      desc: "Every single advocate is cross-checked against the official Rwanda Bar Association Roll before taking any consultations."
    },
    item2: {
      title: "Regulated Escrow Safeguards",
      desc: "Your money never goes directly to an unverified third party. Funds stay locked until the consultation is completed satisfactorily."
    },
    item3: {
      title: "Authentic Client Ratings",
      desc: "Only clients who have paid for and completed a consultation can leave a review. Zero fake or incentivized reviews."
    }
  },
  cta: {
    title: "Ready to get trusted legal assistance?",
    subtitle: "Connect with an accredited Rwanda Bar Association advocate in minutes.",
    findLawyer: "Find a Lawyer Now",
    joinAsAdvocate: "Join as an Advocate"
  }
};

const FR_HOW_IT_WORKS = {
  meta: {
    title: "Comment ça Marche | MyJudicial",
    description: "Découvrez comment trouver, consulter et engager des avocats certifiés sur MyJudicial en quatre étapes simples."
  },
  hero: {
    badge: "Avocats Certifiés · Séquestre Sécurisé · Résultats Clairs",
    title: "Comment MyJudicial vous connecte aux meilleurs avocats",
    subtitle: "De votre première question juridique jusqu'à sa résolution. Découvrez comment l'accréditation du Barreau du Rwanda, la réservation numérique et le séquestre Mobile Money s'articulent."
  },
  tabs: {
    clients: "Pour les Citoyens & Entreprises",
    advocates: "Pour les Avocats Certifiés"
  },
  clientJourney: {
    badge: "Parcours Client Étape par Étape",
    title: "Comment consulter un avocat",
    subtitle: "Quatre étapes simples pour accéder à un accompagnement juridique certifié partout au Rwanda.",
    step1: {
      tag: "Étape 01",
      title: "Recherche ou Triage Juridique par l'IA",
      desc: "Parcourez notre annuaire par domaine et localisation, ou décrivez votre litige en kinyarwanda, anglais ou français à notre Assistant IA pour être orienté immédiatement."
    },
    step2: {
      tag: "Étape 02",
      title: "Comparez les Titres & Honoraires",
      desc: "Consultez l'inscription au Tableau du Barreau du Rwanda, l'expérience en prétoire, les avis vérifiés et les honoraires forfaitaires sans frais cachés."
    },
    step3: {
      tag: "Étape 03",
      title: "Réservez avec Protection sous Séquestre",
      desc: "Choisissez un créneau d'agenda adapté à vos disponibilités. Payez en toute sécurité via MTN MoMo, Airtel Money ou Carte. Les fonds restent sous séquestre jusqu'à la fin de la séance."
    },
    step4: {
      tag: "Étape 04",
      title: "Consultez selon le Mode Choisi",
      desc: "Participez à une visioconférence chiffrée, recevez un appel téléphonique direct ou rencontrez l'avocat en son cabinet. Partagez ensuite votre retour d'expérience."
    }
  },
  advocateJourney: {
    badge: "Pour les Professionnels du Droit",
    title: "Comment exercer sur MyJudicial",
    subtitle: "Développez votre clientèle grâce à des outils numériques modernes, des paiements garantis sous séquestre et sans relance d'impayés.",
    step1: {
      tag: "Étape 01",
      title: "Candidature avec Justificatifs du Barreau",
      desc: "Inscrivez-vous avec votre numéro au Tableau du Barreau du Rwanda, les coordonnées de votre cabinet et votre pièce d'identité nationale."
    },
    step2: {
      tag: "Étape 02",
      title: "Contrôle de Conformité & Validation",
      desc: "Notre équipe juridique contrôle votre certificat d'exercice et votre statut auprès du Conseil de l'Ordre avant d'activer votre badge vérifié."
    },
    step3: {
      tag: "Étape 03",
      title: "Paramétrez vos Services & Agenda",
      desc: "Fixez librement vos honoraires de consultation, définissez vos plages de disponibilité et choisissez vos modes d'exercice (Vidéo, Téléphone ou Cabinet)."
    },
    step4: {
      tag: "Étape 04",
      title: "Réalisez vos Consultations & Encaissez",
      desc: "Consultez des clients qualifiés. Dès la fin de la consultation, vos honoraires sont débloqués directement sur votre compte Mobile Money ou bancaire."
    }
  },
  modalities: {
    badge: "Modes de Consultation Flexibles",
    title: "Trois Façons d'Échanger avec votre Avocat",
    subtitle: "Choisissez le format de consultation le mieux adapté à votre situation et à votre localisation au Rwanda.",
    video: {
      title: "Consultation Vidéo Chiffrée",
      desc: "Directement depuis votre navigateur web sans aucun téléchargement d'application. Comprend le partage de documents et un flux vidéo haute sécurité.",
      feature1: "Session chiffrée de bout en bout",
      feature2: "Partage d'écran et de pièces du dossier",
      feature3: "Accessible sur smartphone ou ordinateur"
    },
    phone: {
      title: "Consultation Téléphonique Directe",
      desc: "Idéal pour un conseil rapide ou dans les zones à faible connectivité internet. L'avocat compose directement votre numéro vérifié à l'heure convenue.",
      feature1: "Fonctionne sur tous les réseaux (MTN / Airtel)",
      feature2: "Parfait pour les urgences ou zones rurales",
      feature3: "Aucune connexion internet requise pour l'appel"
    },
    inPerson: {
      title: "Rendez-vous en Cabinet",
      desc: "Rencontrez votre avocat en personne dans son cabinet officiellement enregistré à Kigali ou en province.",
      feature1: "Adresse exacte du cabinet transmise à la réservation",
      feature2: "Examen physique des dossiers et actes originaux",
      feature3: "Préparation d'une représentation en justice"
    }
  },
  trustFramework: {
    badge: "Accréditation & Confiance",
    title: "La Garantie de Confiance MyJudicial",
    subtitle: "Établie en stricte conformité avec les règles déontologiques du Barreau du Rwanda.",
    item1: {
      title: "100% d'Avocats Contrôlés au Barreau",
      desc: "Chaque avocat fait l'objet d'un recoupement avec le Tableau officiel de l'Ordre des Avocats du Rwanda avant toute prise de rendez-vous."
    },
    item2: {
      title: "Garantie de Séquestre Réglementée",
      desc: "Votre argent n'est jamais transféré directement à un tiers sans validation. Les fonds restent verrouillés jusqu'à la bonne tenue de la consultation."
    },
    item3: {
      title: "Avis Clients Authentiques",
      desc: "Seuls les clients ayant effectivement réservé et effectué une consultation peuvent publier un avis. Zéro faux avis."
    }
  },
  cta: {
    title: "Prêt à obtenir une assistance juridique de confiance ?",
    subtitle: "Mettez-vous en relation avec un avocat membre du Barreau du Rwanda en quelques clics.",
    findLawyer: "Trouver un Avocat",
    joinAsAdvocate: "Rejoindre comme Avocat"
  }
};

const RW_HOW_IT_WORKS = {
  meta: {
    title: "Uburyo Bigenda | MyJudicial",
    description: "Menya uko ushaka, ugisha inama, kandi ukorana n'abavoka b'inzobere bemejwe kuri MyJudicial mu ntambwe enye zoroshye."
  },
  hero: {
    badge: "Abavoka Bemejwe · Ubwishyu Burinzwe · Ibisubizo Bisobanutse",
    title: "Uko MyJudicial Iguhuza n'Abavoka Wizewe mu Rwanda",
    subtitle: "Kuva ku kibazo cyawe cya mbere cy'amategeko kugeza gikemutse. Menya uburyo kwemezwa n'Urugaga rw'Abavoka, gufata gahunda mu buryo bw'ikoranabuhanga, n'ubwirinzi bwa Mobile Money bikorana."
  },
  tabs: {
    clients: "Ku Baturage & Ubucuruzi",
    advocates: "Ku Bavoka Bemejwe"
  },
  clientJourney: {
    badge: "Urugendo rw'Umukiriya Intambwe ku Yindi",
    title: "Uburyo Wagisha Inama Umwavoka",
    subtitle: "Intambwe enye zoroshye zo kubona ubufasha bw'amategeko bwizewe aho waba uri hose mu Rwanda.",
    step1: {
      tag: "Intambwe 01",
      title: "Shakisha cyangwa Ukoreshe AI y'Amategeko",
      desc: "Rondera urutonde rw'abavoka ukurikije urwego rw'amategeko n'akarere, cyangwa usobanurire Umufasha wa AI ikibazo mu Kinyarwanda, Icyongereza, cyangwa Igifaransa aguhuze n'umuhanga ako kanya."
    },
    step2: {
      tag: "Intambwe 02",
      title: "Gereranya Ibyangombwa n'Ibiciro",
      desc: "Suzuma nimero yo mu Rugaga rw'Abavoka mu Rwanda, uburambe mu manza, ibitekerezo by'abandi bakiriya, n'ibiciro bisobanutse bitarimo amananiza."
    },
    step3: {
      tag: "Intambwe 03",
      title: "Fata Gahunda n'Ubwirinzi bw'Amafaranga",
      desc: "Hitamo igihe kigunogeye. Ishyura mu mutekano ukoresheje MTN MoMo, Airtel Money, cyangwa Ikarita. Amafaranga aguma arinzwe kugeza inama irangiye neza."
    },
    step4: {
      tag: "Intambwe 04",
      title: "Gisha Inama mu Buryo Wihitiyemo",
      desc: "Koresha amashusho arinzwe, hamagarwa kuri telefoni yawe, cyangwa uhure n'umwavoka imbonankubone ku biro bye. Inama irangiye, tanga igitekerezo cyawe cy'ukuri."
    }
  },
  advocateJourney: {
    badge: "Ku Banyamwuga b'Amategeko",
    title: "Uko Abavoka Bakorera Kuri MyJudicial",
    subtitle: "Zamura umwuga wawe w'amategeko ukoresheje ikoranabuhanga rigezweho, kubona ubwishyu bwizewe, no kwirinda guhora wishyuza abakiriya."
  },
  modalities: {
    badge: "Uburyo Bw'Inama Butandukanye",
    title: "Uburyo Butatu bwo Guhura n'Umwavoka",
    subtitle: "Hitamo uburyo buhuye neza n'ubwoko bw'ikibazo cyawe n'aho uherereye mu Rwanda.",
    video: {
      title: "Inama y'Amashusho Arinzwe",
      desc: "Kuri interineti yawe utiriwe ukuramo porogaramu nshya. Ushobora kwerekana inyandiko n'ibimenyetso mu mutekano usesuye.",
      feature1: "Inama ifite umutekano usesuye",
      feature2: "Kwerekana inyandiko n'ibimenyetso",
      feature3: "Kwinjira kuri telefoni cyangwa mudasobwa"
    },
    phone: {
      title: "Inama yo Guhamagara Kuri Telefoni",
      desc: "Ikwiriye inama zihuse cyangwa aho interineti idafite imbaraga. Umwavoka aguhamagara ku murongo wawe ku gihe mwemeranyijweho.",
      feature1: "Ikora ku mirongo yose (MTN / Airtel)",
      feature2: "Ikwiriye ibibazo byihutirwa",
      feature3: "Ntibisaba interineti yo guhamagara"
    },
    inPerson: {
      title: "Guhura Imbonankubone ku Biro",
      desc: "Hura n'umwavoka wawe imbonankubone ku biro bye byemewe i Kigali cyangwa mu Ntara.",
      feature1: "Aderesi y'ibiro ihabwa umukiriya amaze kwishyura",
      feature2: "Gusuzuma inyandiko z'umwimerere",
      feature3: "Gutegura guhagararirwa mu nkiko"
    }
  },
  trustFramework: {
    badge: "Ubwizerane & Ibisabwa",
    title: "Isezerano ry'Umutekano rya MyJudicial",
    subtitle: "Byubatse bishingiye ku mahame agenga Urugaga rw'Abavoka mu Rwanda n'indangagaciro z'umwuga.",
    item1: {
      title: "100% By'Abavoka Bagenzuwe mu Rugaga",
      desc: "Buri mwavoka abanza kugenzurwa ku rutonde rwemewe rw'Urugaga rw'Abavoka mu Rwanda mbere y'uko ahabwa gahunda n'umukiriya."
    },
    item2: {
      title: "Ubwirinzi bw'Ubwishyu Bwemewe",
      desc: "Amafaranga yawe ntajya mu ntoki z'umuntu utazwi. Aguma arinzwe kugeza igihe inama ibereye kandi ikagenda neza."
    },
    item3: {
      title: "Ibitekerezo Nyakuri by'Abakiriya",
      desc: "Abakiriya bishyuye kandi bagisha inama gusa ni bo bemerewe gutanga igitekerezo. Nta bitekerezo by'amahimbano."
    }
  },
  cta: {
    title: "Witeguye kubona ubufasha bw'amategeko bwizewe?",
    subtitle: "Ihuze n'umwavoka wemewe n'Urugaga rw'Abavoka mu Rwanda mu minota mike.",
    findLawyer: "Shaka Umwavoka Ubu",
    joinAsAdvocate: "Iyandikishe nk'Umwavoka"
  }
};

// Also complete advocateJourney in RW to ensure perfect parity
RW_HOW_IT_WORKS.advocateJourney.step1 = {
  tag: "Intambwe 01",
  title: "Gusaba Ukoresheje Ibyangombwa by'Urugaga",
  desc: "Iyandikishe ukoresheje nimero yawe yo mu Rugaga rw'Abavoka mu Rwanda, ibiranga ibiro byawe, n'indangamuntu yawe."
};
RW_HOW_IT_WORKS.advocateJourney.step2 = {
  tag: "Intambwe 02",
  title: "Gusuzuma no Kwemeza Ibyangombwa",
  desc: "Itsinda ryacu ry'amategeko risuzuma icyangombwa cyawe n'uko uhagaze mu Rugaga mbere yo kuguha ikimenyetso cy'umwavoka wemewe."
};
RW_HOW_IT_WORKS.advocateJourney.step3 = {
  tag: "Intambwe 03",
  title: "Gushyiraho Ibiciro na Gahunda yawe",
  desc: "Igenere ibiciro by'inama, igihe ubonetse, n'uburyo wemera (Amashusho, Telefoni, cyangwa ku Biro byawe)."
};
RW_HOW_IT_WORKS.advocateJourney.step4 = {
  tag: "Intambwe 04",
  title: "Gukora Inama no Kubona Ubwishyu Bwizewe",
  desc: "Gisha inama abakiriya bagenzuwe. Inama irangiye, amafaranga ahita yoherezwa kuri Mobile Money yawe cyangwa kuri konti ya banki."
};

function updateFile(fileName, pricingData, howItWorksData) {
  const filePath = path.join(messagesDir, fileName);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  content.pricingPage = pricingData;
  content.howItWorksPage = howItWorksData;
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
  console.log(`Updated ${fileName} successfully.`);
}

updateFile('en.json', EN_PRICING, EN_HOW_IT_WORKS);
updateFile('fr.json', FR_PRICING, FR_HOW_IT_WORKS);
updateFile('rw.json', RW_PRICING, RW_HOW_IT_WORKS);
